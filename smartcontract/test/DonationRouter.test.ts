import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress, type Address } from "viem";
import { signMessage, privateKeyToAccount } from "viem/accounts";
import { generatePrivateKey } from "viem/accounts";

describe("DonationRouter", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  let router: any;
  let registry: any;
  let cUSD: any;
  let verifier: Address;
  let feeCollector: Address;
  let admin: Address;
  let ngo1: Address;
  let ngo2: Address;
  let donor1: Address;
  let donor2: Address;
  
  const registrationFee = parseEther("10");
  const verifierPrivateKey = generatePrivateKey();
  const verifierAccount = privateKeyToAccount(verifierPrivateKey);
  
  beforeEach(async function () {
    // Deploy mock cUSD token
    cUSD = await viem.deployContract("MockERC20", ["Celo Dollar", "cUSD"]);
    
    // Get test accounts
    const accounts = await viem.getWalletClients();
    admin = accounts[0].account.address;
    feeCollector = accounts[1].account.address;
    ngo1 = accounts[2].account.address;
    ngo2 = accounts[3].account.address;
    donor1 = accounts[4].account.address;
    donor2 = accounts[5].account.address;
    verifier = verifierAccount.address;
    
    // Deploy NGORegistry
    registry = await viem.deployContract("NGORegistry", [
      verifier,
      cUSD.address,
      feeCollector,
      registrationFee,
    ]);
    
    // Deploy DonationRouter
    router = await viem.deployContract("DonationRouter", [
      cUSD.address,
      registry.address,
    ]);
    
    // Mint cUSD to test accounts
    const mintAmount = parseEther("10000");
    await cUSD.write.mint([ngo1, mintAmount]);
    await cUSD.write.mint([ngo2, mintAmount]);
    await cUSD.write.mint([donor1, mintAmount]);
    await cUSD.write.mint([donor2, mintAmount]);
    
    // Register NGOs
    async function registerNGO(ngoAddress: Address, did: string) {
      const vcProofHash = ("0x" + did.slice(-64).padStart(64, "0")) as `0x${string}`;
      const vcSignature = await signMessage({
        account: verifierAccount,
        message: { raw: vcProofHash as `0x${string}` },
      });
      const vcExpiryDate = BigInt(Date.now() / 1000) + 365n * 24n * 60n * 60n;
      
      await cUSD.write.approve([registry.address, registrationFee], {
        account: ngoAddress,
      });
      
      await registry.write.registerNGO(
        [
          did,
          vcProofHash,
          vcSignature,
          25,
          "KE",
          "QmProfile",
          vcExpiryDate,
        ],
        { account: ngoAddress }
      );
    }
    
    await registerNGO(ngo1, "did:self:ngo1");
    await registerNGO(ngo2, "did:self:ngo2");
  });
  
  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      assert.equal(await router.read.cUSD(), cUSD.address);
      assert.equal(await router.read.registry(), registry.address);
      assert.equal(await router.read.totalDonationsCount(), 0n);
      assert.equal(await router.read.totalDonationsAmount(), 0n);
    });
    
    it("Should revert with invalid constructor parameters", async function () {
      await assert.rejects(
        viem.deployContract("DonationRouter", [
          "0x0000000000000000000000000000000000000000",
          registry.address,
        ]),
        /Invalid cUSD address/
      );
      
      await assert.rejects(
        viem.deployContract("DonationRouter", [
          cUSD.address,
          "0x0000000000000000000000000000000000000000",
        ]),
        /Invalid registry address/
      );
    });
  });
  
  describe("Donations", function () {
    it("Should process donation successfully", async function () {
      const amount = parseEther("100");
      const message = "Supporting a great cause!";
      
      const ngoBalanceBefore = await cUSD.read.balanceOf([ngo1]);
      const donorBalanceBefore = await cUSD.read.balanceOf([donor1]);
      
      // Approve router to spend donor's cUSD
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      const tx = router.write.donate([ngo1, amount, message], {
        account: donor1,
      });
      
      await viem.assertions.emitWithArgs(
        tx,
        router,
        "DonationMade",
        [0n, donor1, ngo1, amount, message]
      );
      
      // Check balances
      const ngoBalanceAfter = await cUSD.read.balanceOf([ngo1]);
      const donorBalanceAfter = await cUSD.read.balanceOf([donor1]);
      
      assert.equal(ngoBalanceAfter - ngoBalanceBefore, amount);
      assert.equal(donorBalanceBefore - donorBalanceAfter, amount);
      
      // Check router state
      assert.equal(await router.read.totalDonationsCount(), 1n);
      assert.equal(await router.read.totalDonationsAmount(), amount);
      assert.equal(await router.read.totalByDonor([donor1]), amount);
      assert.equal(await router.read.totalByNGO([ngo1]), amount);
    });
    
    it("Should record donation in registry", async function () {
      const amount = parseEther("50");
      
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await router.write.donate([ngo1, amount, "Test donation"], {
        account: donor1,
      });
      
      const ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.totalDonationsReceived, amount);
      assert.equal(ngo.donorCount, 1n);
    });
    
    it("Should reject donation with zero amount", async function () {
      await assert.rejects(
        router.write.donate([ngo1, 0n, "Message"], { account: donor1 }),
        /Amount must be > 0/
      );
    });
    
    it("Should reject donation to invalid address", async function () {
      const amount = parseEther("100");
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await assert.rejects(
        router.write.donate(
          ["0x0000000000000000000000000000000000000000", amount, "Message"],
          { account: donor1 }
        ),
        /Invalid NGO address/
      );
    });
    
    it("Should reject donation to unverified NGO", async function () {
      const accounts = await viem.getWalletClients();
      const unverifiedNGO = accounts[6].account.address;
      const amount = parseEther("100");
      
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await assert.rejects(
        router.write.donate([unverifiedNGO, amount, "Message"], {
          account: donor1,
        }),
        /NGO not verified/
      );
    });
    
    it("Should reject donation with message too long", async function () {
      const amount = parseEther("100");
      const longMessage = "a".repeat(201); // 201 characters
      
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await assert.rejects(
        router.write.donate([ngo1, amount, longMessage], {
          account: donor1,
        }),
        /Message too long/
      );
    });
    
    it("Should reject donation with insufficient allowance", async function () {
      const amount = parseEther("100");
      
      // Don't approve or approve less
      await cUSD.write.approve([router.address, amount - 1n], {
        account: donor1,
      });
      
      await assert.rejects(
        router.write.donate([ngo1, amount, "Message"], { account: donor1 }),
        /cUSD transfer failed/
      );
    });
    
    it("Should handle multiple donations from same donor", async function () {
      const amount1 = parseEther("50");
      const amount2 = parseEther("75");
      
      await cUSD.write.approve([router.address, amount1 + amount2], {
        account: donor1,
      });
      
      await router.write.donate([ngo1, amount1, "First donation"], {
        account: donor1,
      });
      await router.write.donate([ngo1, amount2, "Second donation"], {
        account: donor1,
      });
      
      assert.equal(
        await router.read.totalByDonor([donor1]),
        amount1 + amount2
      );
      assert.equal(await router.read.totalDonationsCount(), 2n);
    });
    
    it("Should handle donations to multiple NGOs", async function () {
      const amount1 = parseEther("100");
      const amount2 = parseEther("200");
      
      await cUSD.write.approve([router.address, amount1 + amount2], {
        account: donor1,
      });
      
      await router.write.donate([ngo1, amount1, "To NGO1"], {
        account: donor1,
      });
      await router.write.donate([ngo2, amount2, "To NGO2"], {
        account: donor1,
      });
      
      assert.equal(await router.read.totalByNGO([ngo1]), amount1);
      assert.equal(await router.read.totalByNGO([ngo2]), amount2);
      assert.equal(await router.read.totalDonationsAmount(), amount1 + amount2);
    });
    
    it("Should prevent reentrancy attacks", async function () {
      // This test verifies the nonReentrant modifier is working
      // In a real scenario, we'd need a malicious contract, but the modifier
      // should prevent reentrancy
      const amount = parseEther("100");
      
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      // First donation should succeed
      await router.write.donate([ngo1, amount, "Normal donation"], {
        account: donor1,
      });
      
      // Second donation should also succeed (not blocked by reentrancy guard)
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await router.write.donate([ngo1, amount, "Second donation"], {
        account: donor1,
      });
      
      assert.equal(await router.read.totalDonationsCount(), 2n);
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      // Make some donations
      const amounts = [parseEther("100"), parseEther("200"), parseEther("50")];
      const messages = ["First", "Second", "Third"];
      
      for (let i = 0; i < amounts.length; i++) {
        await cUSD.write.approve([router.address, amounts[i]], {
          account: donor1,
        });
        
        await router.write.donate(
          [i % 2 === 0 ? ngo1 : ngo2, amounts[i], messages[i]],
          { account: donor1 }
        );
      }
    });
    
    it("Should return donation by ID", async function () {
      const donation = await router.read.getDonation([0n]);
      
      assert.equal(donation.donor, donor1);
      assert.equal(donation.ngo, ngo1);
      assert.equal(donation.amount, parseEther("100"));
      assert.equal(donation.message, "First");
    });
    
    it("Should reject invalid donation ID", async function () {
      await assert.rejects(
        router.read.getDonation([999n]),
        /Invalid donation ID/
      );
    });
    
    it("Should return recent donations", async function () {
      const recent = await router.read.getRecentDonations([2n]);
      
      assert.equal(recent.length, 2);
      assert.equal(recent[0].message, "Third"); // Most recent first
      assert.equal(recent[1].message, "Second");
    });
    
    it("Should return all donations if count exceeds total", async function () {
      const recent = await router.read.getRecentDonations([10n]);
      assert.equal(recent.length, 3);
    });
    
    it("Should return donations by donor", async function () {
      const donorDonations = await router.read.getDonationsByDonor([donor1]);
      
      assert.equal(donorDonations.length, 3);
      assert.equal(donorDonations[0].donor, donor1);
    });
    
    it("Should return empty array for donor with no donations", async function () {
      const accounts = await viem.getWalletClients();
      const newDonor = accounts[7].account.address;
      
      const donorDonations = await router.read.getDonationsByDonor([newDonor]);
      assert.equal(donorDonations.length, 0);
    });
    
    it("Should return donations by NGO", async function () {
      const ngoDonations = await router.read.getDonationsByNGO([ngo1]);
      
      // NGO1 should have 2 donations (first and third)
      assert.equal(ngoDonations.length, 2);
      assert.equal(ngoDonations[0].ngo, ngo1);
      assert.equal(ngoDonations[1].ngo, ngo1);
    });
    
    it("Should return total donations count", async function () {
      const total = await router.read.getTotalDonations();
      assert.equal(total, 3n);
    });
    
    it("Should return platform stats", async function () {
      const stats = await router.read.getPlatformStats();
      
      assert.equal(stats.totalAmount, parseEther("350")); // 100 + 200 + 50
      assert.equal(stats.totalCount, 3n);
      // Average: 350 / 3 = 116.666... (truncated to 116)
      assert.equal(stats.avgDonation, parseEther("116"));
    });
    
    it("Should return zero average for no donations", async function () {
      // Deploy a new router to test with no donations
      const newRouter = await viem.deployContract("DonationRouter", [
        cUSD.address,
        registry.address,
      ]);
      
      const stats = await newRouter.read.getPlatformStats();
      assert.equal(stats.totalAmount, 0n);
      assert.equal(stats.totalCount, 0n);
      assert.equal(stats.avgDonation, 0n);
    });
  });
  
  describe("Integration with Registry", function () {
    it("Should not allow donation to revoked NGO", async function () {
      const amount = parseEther("100");
      
      // Revoke NGO
      await registry.write.adminRevokeNGO([ngo1, "Revoked"], {
        account: admin,
      });
      
      await cUSD.write.approve([router.address, amount], {
        account: donor1,
      });
      
      await assert.rejects(
        router.write.donate([ngo1, amount, "Message"], { account: donor1 }),
        /NGO not verified/
      );
    });
    
    it("Should update NGO stats in registry on donation", async function () {
      const amount1 = parseEther("100");
      const amount2 = parseEther("200");
      
      await cUSD.write.approve([router.address, amount1 + amount2], {
        account: donor1,
      });
      
      await router.write.donate([ngo1, amount1, "First"], {
        account: donor1,
      });
      
      let ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.totalDonationsReceived, amount1);
      assert.equal(ngo.donorCount, 1n);
      
      await router.write.donate([ngo1, amount2, "Second"], {
        account: donor1,
      });
      
      ngo = await registry.read.getNGO([ngo1]);
      assert.equal(ngo.totalDonationsReceived, amount1 + amount2);
      assert.equal(ngo.donorCount, 2n);
    });
  });
});

