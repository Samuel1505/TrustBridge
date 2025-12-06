import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress, type Address, keccak256, stringToBytes } from "viem";

describe("NGORegistry", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  let registry: any;
  let cUSD: any;
  let verifier: Address;
  let verifierWallet: any;
  let feeCollector: Address;
  let admin: Address;
  let ngo1: Address;
  let ngo2: Address;
  let donor1: Address;
  let donor2: Address;
  
  const registrationFee = parseEther("10");
  
  beforeEach(async function () {
    // Deploy mock cUSD token
    cUSD = await viem.deployContract("MockERC20", ["Celo Dollar", "cUSD"]);
    
    // Get test accounts - use one as verifier
    const accounts = await viem.getWalletClients();
    admin = accounts[0].account.address;
    feeCollector = accounts[1].account.address;
    ngo1 = accounts[2].account.address;
    ngo2 = accounts[3].account.address;
    donor1 = accounts[4].account.address;
    donor2 = accounts[5].account.address;
    verifier = accounts[6].account.address;
    verifierWallet = accounts[6];
    
    // Deploy NGORegistry
    registry = await viem.deployContract("NGORegistry", [
      verifier,
      cUSD.address,
      feeCollector,
      registrationFee,
    ]);
    
    // Mint cUSD to test accounts
    const mintAmount = parseEther("10000");
    await cUSD.write.mint([ngo1, mintAmount]);
    await cUSD.write.mint([ngo2, mintAmount]);
    await cUSD.write.mint([donor1, mintAmount]);
    await cUSD.write.mint([donor2, mintAmount]);
  });
  
  function createVCProofHash(seed: string): `0x${string}` {
    return keccak256(stringToBytes(`vc-proof-${seed}`));
  }
  
  async function createVCSignature(vcProofHash: `0x${string}`): Promise<`0x${string}`> {
    // Use the verifier wallet to sign the message
    return await verifierWallet.signMessage({
      message: { raw: vcProofHash },
    });
  }
  
  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      assert.equal(getAddress(await registry.read.selfProtocolVerifier()), getAddress(verifier));
      assert.equal(getAddress(await registry.read.cUSD()), getAddress(cUSD.address));
      assert.equal(getAddress(await registry.read.feeCollector()), getAddress(feeCollector));
      assert.equal(await registry.read.registrationFee(), registrationFee);
      assert.equal(getAddress(await registry.read.admin()), getAddress(admin));
    });
    
    it("Should revert with invalid constructor parameters", async function () {
      await assert.rejects(
        viem.deployContract("NGORegistry", [
          "0x0000000000000000000000000000000000000000",
          cUSD.address,
          feeCollector,
          registrationFee,
        ]),
        /Invalid verifier/
      );
    });
  });
  
  describe("NGO Registration", function () {
    const founderDID = "did:self:123456";
    const founderAge = 25;
    const founderCountry = "KE";
    const ipfsProfile = "QmTest123";
    const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n; // 1 year from now
    
    it("Should register an NGO successfully", async function () {
      const vcProofHash = createVCProofHash("test1");
      const vcSignature = await createVCSignature(vcProofHash);
      
      // Approve registration fee
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      const tx = registry.write.registerNGO(
        [
          founderDID,
          vcProofHash,
          vcSignature,
          founderAge,
          founderCountry,
          ipfsProfile,
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      // Execute transaction and get the actual event timestamp from logs
      const hash = await tx;
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Get events from the receipt
      const events = await publicClient.getContractEvents({
        address: registry.address,
        abi: registry.abi,
        eventName: "NGORegistered",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      
      // Verify the event was emitted with correct values
      assert.equal(events.length, 1);
      assert.equal(getAddress(events[0].args.ngoWallet as Address), getAddress(ngo1));
      assert.equal(events[0].args.founderDID, founderDID);
      assert.equal(events[0].args.country, founderCountry);
      
      const ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.founderDID, founderDID);
      assert.equal(ngo.founderAge, founderAge);
      assert.equal(ngo.founderCountry, founderCountry);
      assert.equal(ngo.ngoWallet, ngo1);
      assert.equal(ngo.ipfsProfile, ipfsProfile);
      assert.equal(ngo.isActive, true);
      assert.equal(await registry.read.isVerified([ngo1]), true);
    });
    
    it("Should transfer registration fee to fee collector", async function () {
      const vcProofHash = createVCProofHash("test2");
      const vcSignature = await createVCSignature(vcProofHash);
      
      const feeCollectorBalanceBefore = await cUSD.read.balanceOf([feeCollector]);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          founderDID,
          vcProofHash,
          vcSignature,
          founderAge,
          founderCountry,
          ipfsProfile,
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      const feeCollectorBalanceAfter = await cUSD.read.balanceOf([feeCollector]);
      assert.equal(
        feeCollectorBalanceAfter - feeCollectorBalanceBefore,
        registrationFee
      );
    });
    
    it("Should prevent duplicate registration", async function () {
      const vcProofHash = createVCProofHash("test3");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          founderDID,
          vcProofHash,
          vcSignature,
          founderAge,
          founderCountry,
          ipfsProfile,
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      // Try to register again
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            "did:self:789",
            createVCProofHash("test4"),
            vcSignature,
            founderAge,
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo1 }
        ),
        /Already registered/
      );
    });
    
    it("Should prevent DID reuse", async function () {
      const vcProofHash1 = createVCProofHash("test5");
      const vcSignature1 = await createVCSignature(vcProofHash1);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          founderDID,
          vcProofHash1,
          vcSignature1,
          founderAge,
          founderCountry,
          ipfsProfile,
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      // Try to use same DID with different wallet
      const vcProofHash2 = createVCProofHash("test6");
      const vcSignature2 = await createVCSignature(vcProofHash2);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo2,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            founderDID,
            vcProofHash2,
            vcSignature2,
            founderAge,
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo2 }
        ),
        /DID already used/
      );
    });
    
    it("Should prevent VC proof reuse", async function () {
      const vcProofHash = createVCProofHash("test7");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          founderDID,
          vcProofHash,
          vcSignature,
          founderAge,
          founderCountry,
          ipfsProfile,
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      // Try to use same VC proof
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo2,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            "did:self:999",
            vcProofHash,
            vcSignature,
            founderAge,
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo2 }
        ),
        /VC already used/
      );
    });
    
    it("Should reject registration with invalid VC signature", async function () {
      const vcProofHash = createVCProofHash("test8");
      const invalidSignature = "0x" + "0".repeat(130) as `0x${string}`;
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            founderDID,
            vcProofHash,
            invalidSignature,
            founderAge,
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo1 }
        ),
        /ECDSAInvalidSignature/
      );
    });
    
    it("Should reject registration with founder age < 18", async function () {
      const vcProofHash = createVCProofHash("test9");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            founderDID,
            vcProofHash,
            vcSignature,
            17, // Under 18
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo1 }
        ),
        /Founder must be 18\+/
      );
    });
    
    it("Should reject registration with expired VC", async function () {
      const vcProofHash = createVCProofHash("test10");
      const vcSignature = await createVCSignature(vcProofHash);
      const expiredDate = BigInt(Math.floor(Date.now() / 1000)) - 86400n; // Yesterday
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            founderDID,
            vcProofHash,
            vcSignature,
            founderAge,
            founderCountry,
            ipfsProfile,
            expiredDate,
          ],
          { account: ngo1 }
        ),
        /VC expired/
      );
    });
    
    it("Should reject registration with insufficient fee payment", async function () {
      const vcProofHash = createVCProofHash("test11");
      const vcSignature = await createVCSignature(vcProofHash);
      
      // Approve less than required
      await cUSD.write.approve([registry.address, registrationFee - 1n], {
        account: ngo1,
      });
      
      await assert.rejects(
        registry.write.registerNGO(
          [
            founderDID,
            vcProofHash,
            vcSignature,
            founderAge,
            founderCountry,
            ipfsProfile,
            vcExpiryDate,
          ],
          { account: ngo1 }
        ),
        /ERC20InsufficientAllowance/
      );
    });
  });
  
  describe("Profile Management", function () {
    const founderDID = "did:self:profile";
    const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    
    beforeEach(async function () {
      const vcProofHash = createVCProofHash("profile");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          founderDID,
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmOldProfile",
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
    });
    
    it("Should update NGO profile", async function () {
      const newProfile = "QmNewProfile";
      
      await viem.assertions.emitWithArgs(
        registry.write.updateProfile([newProfile], { account: ngo1 }),
        registry,
        "NGOProfileUpdated",
        [getAddress(ngo1), newProfile]
      );
      
      const ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.ipfsProfile, newProfile);
    });
    
    it("Should reject profile update from non-verified NGO", async function () {
      await assert.rejects(
        registry.write.updateProfile(["QmTest"], { account: ngo2 }),
        /Not verified NGO/
      );
    });
  });
  
  describe("Donation Recording", function () {
    const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    
    beforeEach(async function () {
      const vcProofHash = createVCProofHash("donation");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          "did:self:donation",
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmProfile",
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
    });
    
    it("Should record donation successfully", async function () {
      const amount = parseEther("100");
      
      await viem.assertions.emitWithArgs(
        registry.write.recordDonation([ngo1, donor1, amount]),
        registry,
        "DonationRecorded",
        [getAddress(ngo1), getAddress(donor1), amount]
      );
      
      const ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.totalDonationsReceived, amount);
      assert.equal(ngo.donorCount, 1n);
    });
    
    it("Should reject donation to inactive NGO", async function () {
      // Revoke NGO
      await registry.write.adminRevokeNGO([ngo1, "Test revocation"], {
        account: admin,
      });
      
      await assert.rejects(
        registry.write.recordDonation([ngo1, donor1, parseEther("100")]),
        /NGO not active/
      );
    });
  });
  
  describe("Challenging NGOs", function () {
    const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    
    beforeEach(async function () {
      const vcProofHash = createVCProofHash("test3");
      const vcSignature = await createVCSignature(vcProofHash);
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          "did:self:challenge",
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmProfile",
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
    });
    
    it("Should allow challenging an NGO", async function () {
      const reason = "This is a valid challenge reason with enough length";
      
      // NGOChallenged event has 4 params: ngo, challenger, reason, challengeCount
      await viem.assertions.emitWithArgs(
        registry.write.challengeNGO([ngo1, reason], { account: donor1 }),
        registry,
        "NGOChallenged",
        [getAddress(ngo1), getAddress(donor1), reason, 1n]
      );
      
      assert.equal(await registry.read.challengeCount([ngo1]), 1n);
      assert.equal(await registry.read.hasChallenger([ngo1, donor1]), true);
    });
    
    it("Should prevent self-challenge", async function () {
      await assert.rejects(
        registry.write.challengeNGO([ngo1, "Self challenge"], { account: ngo1 }),
        /Cannot challenge self/
      );
    });
    
    it("Should prevent duplicate challenges from same challenger", async function () {
      const reason = "This is a valid challenge reason with enough length";
      
      await registry.write.challengeNGO([ngo1, reason], { account: donor1 });
      
      await assert.rejects(
        registry.write.challengeNGO([ngo1, reason], { account: donor1 }),
        /Already challenged/
      );
    });
    
    it("Should reject challenge with short reason", async function () {
      await assert.rejects(
        registry.write.challengeNGO([ngo1, "Short"], { account: donor1 }),
        /Reason too short/
      );
    });
    
    it("Should revoke NGO after threshold challenges", async function () {
      const reason = "This is a valid challenge reason with enough length";
      const accounts = await viem.getWalletClients();
      
      // Challenge 5 times (threshold)
      for (let i = 0; i < 5; i++) {
        const challenger = accounts[6 + i].account.address;
        await registry.write.challengeNGO([ngo1, reason], {
          account: challenger,
        });
      }
      
      const ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.isActive, false);
      assert.equal(await registry.read.isVerified([ngo1]), false);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow admin to revoke NGO", async function () {
      const vcProofHash = createVCProofHash("admin");
      const vcSignature = await createVCSignature(vcProofHash);
      const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngo1,
      });
      
      await registry.write.registerNGO(
        [
          "did:self:admin",
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmProfile",
          vcExpiryDate,
        ],
        { account: ngo1 }
      );
      
      const reason = "Admin revocation";
      await viem.assertions.emitWithArgs(
        registry.write.adminRevokeNGO([ngo1, reason], { account: admin }),
        registry,
        "NGORevoked",
        [getAddress(ngo1), reason]
      );
      
      assert.equal(await registry.read.isVerified([ngo1]), false);
    });
    
    it("Should prevent non-admin from revoking", async function () {
      await assert.rejects(
        registry.write.adminRevokeNGO([ngo1, "Test"], { account: donor1 }),
        /Only admin/
      );
    });
    
    it("Should allow admin to update registration fee", async function () {
      const newFee = parseEther("20");
      
      await viem.assertions.emitWithArgs(
        registry.write.updateRegistrationFee([newFee], { account: admin }),
        registry,
        "RegistrationFeeUpdated",
        [registrationFee, newFee]
      );
      
      assert.equal(await registry.read.registrationFee(), newFee);
    });
    
    it("Should allow admin to update fee collector", async function () {
      const accounts = await viem.getWalletClients();
      const newCollector = accounts[6].account.address;
      
      await viem.assertions.emitWithArgs(
        registry.write.updateFeeCollector([newCollector], { account: admin }),
        registry,
        "FeeCollectorUpdated",
        [getAddress(feeCollector), getAddress(newCollector)]
      );
      
      assert.equal(getAddress(await registry.read.feeCollector()), getAddress(newCollector));
    });
    
    it("Should allow admin to update verifier", async function () {
      const accounts = await viem.getWalletClients();
      const newVerifier = accounts[7].account.address;
      
      await viem.assertions.emitWithArgs(
        registry.write.updateSelfProtocolVerifier([newVerifier], {
          account: admin,
        }),
        registry,
        "SelfProtocolVerifierUpdated",
        [getAddress(verifier), getAddress(newVerifier)]
      );
      
      assert.equal(getAddress(await registry.read.selfProtocolVerifier()), getAddress(newVerifier));
    });
    
    it("Should allow admin to transfer admin role", async function () {
      const accounts = await viem.getWalletClients();
      const newAdmin = accounts[8].account.address;
      
      await registry.write.transferAdmin([newAdmin], { account: admin });
      
      assert.equal(getAddress(await registry.read.admin()), getAddress(newAdmin));
      
      // Old admin should not be able to perform admin actions
      await assert.rejects(
        registry.write.updateRegistrationFee([parseEther("30")], {
          account: admin,
        }),
        /Only admin/
      );
    });
  });
  
  describe("View Functions", function () {
    const vcExpiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    
    beforeEach(async function () {
      // Register multiple NGOs
      for (let i = 0; i < 3; i++) {
        const accounts = await viem.getWalletClients();
        const ngo = accounts[2 + i].account.address;
        const vcProofHash = createVCProofHash(`view-${i}`);
        const vcSignature = await createVCSignature(vcProofHash);
        
        await cUSD.write.approve([registry.address, registrationFee], {
          account: ngo,
        });
        
        await registry.write.registerNGO(
          [
            `did:self:${i}`,
            vcProofHash,
            vcSignature,
            25,
            i < 2 ? "KE" : "NG",
            `QmProfile${i}`,
            vcExpiryDate,
          ],
          { account: ngo }
        );
      }
    });
    
    it("Should return all verified NGOs", async function () {
      const verified = await registry.read.getAllVerifiedNGOs();
      assert.equal(verified.length, 3);
    });
    
    it("Should return NGOs by country", async function () {
      const kenyaNGOs = await registry.read.getNGOsByCountry(["KE"]);
      assert.equal(kenyaNGOs.length, 2);
      
      const nigeriaNGOs = await registry.read.getNGOsByCountry(["NG"]);
      assert.equal(nigeriaNGOs.length, 1);
    });
    
    it("Should return total verified NGOs count", async function () {
      const count = await registry.read.getTotalVerifiedNGOs();
      assert.equal(count, 3n);
    });
    
    it("Should check VC expiration", async function () {
      // Get current block timestamp to ensure expiry is in the future
      const currentBlock = await publicClient.getBlock({ blockNumber: await publicClient.getBlockNumber() });
      const currentTimestamp = currentBlock.timestamp;
      const futureExpiryDate = currentTimestamp + 365n * 24n * 60n * 60n; // 1 year in the future
      
      const vcProofHash = createVCProofHash("expired");
      const vcSignature = await createVCSignature(vcProofHash);
      const accounts = await viem.getWalletClients();
      const expiredNGO = accounts[9].account.address;
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: expiredNGO,
      });
      
      await registry.write.registerNGO(
        [
          "did:self:expired",
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmExpired",
          futureExpiryDate,
        ],
        { account: expiredNGO }
      );
      
      // Should not be expired initially
      assert.equal(await registry.read.isVCExpired([expiredNGO]), false);
      assert.equal(await registry.read.isVerified([expiredNGO]), true);
      
      // Verify the expiry date is set correctly
      const ngo = await registry.read.getNGO([expiredNGO]);
      assert.equal(ngo.vcExpiryDate, futureExpiryDate);
    });
  });
});

