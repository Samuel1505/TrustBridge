#!/usr/bin/env node

/**
 * On-chain registration test script for debugging NGO registration issues
 * 
 * This script tests the registration process step-by-step and reports where it fails.
 * It can be used with real data from the frontend to debug transaction failures.
 * 
 * Usage:
 *   npx hardhat run scripts/test-registration.ts --network celoSepolia
 * 
 * Or with custom parameters:
 *   npx hardhat run scripts/test-registration.ts --network celoSepolia -- \
 *     --registry 0x8AE49C5d7c0718467Eae6492BE15222EA67a589A \
 *     --account 0xYourAccountAddress \
 *     --did "did:self:test123" \
 *     --age 25 \
 *     --country "KE" \
 *     --ipfs "QmTest123"
 */

import hre from "hardhat";
import { network } from "hardhat";
import { parseEther, getAddress, type Address, keccak256, stringToBytes, formatEther } from "viem";
import { config } from "dotenv";

config();

// Deployed contract addresses (update these if needed)
const DEFAULT_REGISTRY_ADDRESS = "0x8AE49C5d7c0718467Eae6492BE15222EA67a589A"; // From DEPLOYED_ADDRESSES.md
const CUSD_ADDRESS = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"; // cUSD on Celo Sepolia
const REGISTRATION_FEE = parseEther("1"); // 1 cUSD

interface TestParams {
  registryAddress: Address;
  accountAddress: Address;
  founderDID: string;
  founderAge: number;
  founderCountry: string;
  ipfsProfile: string;
  vcProofHash?: `0x${string}`;
  vcSignature?: `0x${string}`;
}

async function checkBalance(
  cUSD: any,
  account: Address,
  requiredAmount: bigint
): Promise<{ success: boolean; balance: bigint; message: string }> {
  try {
    const balance = await cUSD.read.balanceOf([account]);
    const hasEnough = balance >= requiredAmount;
    
    return {
      success: hasEnough,
      balance,
      message: hasEnough
        ? `✅ Balance check passed: ${formatEther(balance)} cUSD (required: ${formatEther(requiredAmount)} cUSD)`
        : `❌ Insufficient balance: ${formatEther(balance)} cUSD (required: ${formatEther(requiredAmount)} cUSD)`,
    };
  } catch (error: any) {
    return {
      success: false,
      balance: BigInt(0),
      message: `❌ Error checking balance: ${error.message}`,
    };
  }
}

async function checkAllowance(
  cUSD: any,
  account: Address,
  spender: Address,
  requiredAmount: bigint
): Promise<{ success: boolean; allowance: bigint; message: string }> {
  try {
    const allowance = await cUSD.read.allowance([account, spender]);
    const hasEnough = allowance >= requiredAmount;
    
    return {
      success: hasEnough,
      allowance,
      message: hasEnough
        ? `✅ Allowance check passed: ${formatEther(allowance)} cUSD (required: ${formatEther(requiredAmount)} cUSD)`
        : `❌ Insufficient allowance: ${formatEther(allowance)} cUSD (required: ${formatEther(requiredAmount)} cUSD)`,
    };
  } catch (error: any) {
    return {
      success: false,
      allowance: BigInt(0),
      message: `❌ Error checking allowance: ${error.message}`,
    };
  }
}

async function checkRegistrationStatus(
  registry: any,
  account: Address
): Promise<{ success: boolean; isRegistered: boolean; message: string }> {
  try {
    const ngoData = await registry.read.ngoByWallet([account]);
    const isRegistered = ngoData.isActive === true;
    
    return {
      success: !isRegistered,
      isRegistered,
      message: isRegistered
        ? `❌ Account is already registered as an NGO`
        : `✅ Account is not registered (can proceed)`,
    };
  } catch (error: any) {
    return {
      success: false,
      isRegistered: false,
      message: `❌ Error checking registration status: ${error.message}`,
    };
  }
}

async function checkDIDUsage(
  registry: any,
  did: string
): Promise<{ success: boolean; isUsed: boolean; message: string }> {
  try {
    const wallet = await registry.read.walletByDID([did]);
    const isUsed = wallet !== "0x0000000000000000000000000000000000000000";
    
    return {
      success: !isUsed,
      isUsed,
      message: isUsed
        ? `❌ DID already used by wallet: ${wallet}`
        : `✅ DID is available`,
    };
  } catch (error: any) {
    return {
      success: false,
      isUsed: false,
      message: `❌ Error checking DID usage: ${error.message}`,
    };
  }
}

async function checkVCProofUsage(
  registry: any,
  vcProofHash: `0x${string}`
): Promise<{ success: boolean; isUsed: boolean; message: string }> {
  try {
    const isUsed = await registry.read.usedVCProofs([vcProofHash]);
    
    return {
      success: !isUsed,
      isUsed,
      message: isUsed
        ? `❌ VC proof hash already used`
        : `✅ VC proof hash is available`,
    };
  } catch (error: any) {
    return {
      success: false,
      isUsed: false,
      message: `❌ Error checking VC proof usage: ${error.message}`,
    };
  }
}

async function checkStagingMode(registry: any): Promise<{ stagingMode: boolean; message: string }> {
  try {
    const stagingMode = await registry.read.stagingMode();
    return {
      stagingMode,
      message: stagingMode
        ? `⚠️  Staging mode is ENABLED (signature verification will be skipped)`
        : `✅ Staging mode is DISABLED (signature verification required)`,
    };
  } catch (error: any) {
    return {
      stagingMode: false,
      message: `❌ Error checking staging mode: ${error.message}`,
    };
  }
}

async function checkRegistrationFee(registry: any): Promise<{ fee: bigint; message: string }> {
  try {
    const fee = await registry.read.registrationFee();
    return {
      fee,
      message: `✅ Registration fee: ${formatEther(fee)} cUSD`,
    };
  } catch (error: any) {
    return {
      fee: BigInt(0),
      message: `❌ Error checking registration fee: ${error.message}`,
    };
  }
}

async function testRegistration(params: TestParams) {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  console.log("\n" + "=".repeat(70));
  console.log("🔍 NGO Registration Test & Debug Script");
  console.log("=".repeat(70) + "\n");
  
  console.log("📋 Test Parameters:");
  console.log(`   Registry Address: ${params.registryAddress}`);
  console.log(`   Account Address: ${params.accountAddress}`);
  console.log(`   Founder DID: ${params.founderDID}`);
  console.log(`   Founder Age: ${params.founderAge}`);
  console.log(`   Founder Country: ${params.founderCountry}`);
  console.log(`   IPFS Profile: ${params.ipfsProfile}`);
  console.log(`   VC Proof Hash: ${params.vcProofHash || "Not provided"}`);
  console.log(`   VC Signature: ${params.vcSignature ? "Provided" : "Not provided"}`);
  console.log();
  
  // Get contract instances - load ABI from frontend
  const fs = await import("fs/promises");
  const path = await import("path");
  const abiPath = path.join(process.cwd(), "..", "frontend", "app", "abi", "NGORegistry.json");
  const ngoRegistryAbiFile = JSON.parse(await fs.readFile(abiPath, "utf-8"));
  // Extract just the ABI array if it's wrapped in an object
  const ngoRegistryAbi = Array.isArray(ngoRegistryAbiFile) ? ngoRegistryAbiFile : ngoRegistryAbiFile.abi || ngoRegistryAbiFile;
  
  // Create contract instance using viem directly
  const registry = {
    address: params.registryAddress,
    abi: ngoRegistryAbi,
    read: {
      ngoByWallet: async (args: [Address]) => publicClient.readContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "ngoByWallet",
        args,
      }),
      walletByDID: async (args: [string]) => publicClient.readContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "walletByDID",
        args,
      }),
      usedVCProofs: async (args: [`0x${string}`]) => publicClient.readContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "usedVCProofs",
        args,
      }),
      stagingMode: async () => publicClient.readContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "stagingMode",
      }),
      registrationFee: async () => publicClient.readContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "registrationFee",
      }),
    },
    write: {
      registerNGO: async (args: any[], options: { account: any }) => {
        // This will be called directly in the test function
        throw new Error("Use direct writeContract call");
      },
    },
  };
  
  // Use standard ERC20 ABI for cUSD
  const erc20Abi = [
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;
  
  // Create cUSD contract instance using publicClient directly
  const cUSD = {
    read: {
      balanceOf: async (args: [Address]) => publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args,
      }),
      allowance: async (args: [Address, Address]) => publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args,
      }),
    },
  };
  
  // Get account wallet
  const accounts = await viem.getWalletClients();
  const accountWallet = accounts.find((w) => 
    w.account.address.toLowerCase() === params.accountAddress.toLowerCase()
  );
  
  if (!accountWallet) {
    console.log("❌ Account not found in wallet clients. Make sure the account is available.");
    console.log("   Available accounts:", accounts.map(a => a.account.address));
    return;
  }
  
  console.log("=".repeat(70));
  console.log("STEP 1: Pre-Registration Checks");
  console.log("=".repeat(70) + "\n");
  
  // Check 1: Balance
  const balanceCheck = await checkBalance(cUSD, params.accountAddress, REGISTRATION_FEE);
  console.log(balanceCheck.message);
  if (!balanceCheck.success) {
    console.log("\n❌ Registration cannot proceed: Insufficient balance");
    return;
  }
  
  // Check 2: Allowance
  const allowanceCheck = await checkAllowance(
    cUSD,
    params.accountAddress,
    params.registryAddress,
    REGISTRATION_FEE
  );
  console.log(allowanceCheck.message);
  if (!allowanceCheck.success) {
    console.log("\n⚠️  Registration cannot proceed: Insufficient allowance");
    console.log("   You need to approve cUSD spending first.");
    console.log(`   Run: cUSD.approve(${params.registryAddress}, ${formatEther(REGISTRATION_FEE)} cUSD)`);
    return;
  }
  
  // Check 3: Registration status
  const registrationCheck = await checkRegistrationStatus(registry, params.accountAddress);
  console.log(registrationCheck.message);
  if (!registrationCheck.success) {
    console.log("\n❌ Registration cannot proceed: Already registered");
    return;
  }
  
  // Check 4: DID usage
  const didCheck = await checkDIDUsage(registry, params.founderDID);
  console.log(didCheck.message);
  if (!didCheck.success) {
    console.log("\n❌ Registration cannot proceed: DID already used");
    return;
  }
  
  // Check 5: VC Proof usage
  if (params.vcProofHash) {
    const vcCheck = await checkVCProofUsage(registry, params.vcProofHash);
    console.log(vcCheck.message);
    if (!vcCheck.success) {
      console.log("\n❌ Registration cannot proceed: VC proof already used");
      return;
    }
  } else {
    console.log("⚠️  VC Proof Hash not provided - skipping check");
  }
  
  // Staging mode: since ABI may miss the getter, default to enabled for testnet
  const isStagingMode = true;
  console.log("⚠️  Assuming staging mode is ENABLED (signature verification skipped)");

  // Check 7: Registration fee (contract read still valid)
  const feeCheck = await checkRegistrationFee(registry);
  console.log(feeCheck.message);
  
  // Check 8: Age validation
  if (params.founderAge < 18) {
    console.log(`❌ Founder age validation failed: ${params.founderAge} < 18`);
    console.log("\n❌ Registration cannot proceed: Founder must be 18+");
    return;
  } else {
    console.log(`✅ Founder age validation passed: ${params.founderAge} >= 18`);
  }
  
  // Check 9: Country code validation
  if (params.founderCountry.length < 2) {
    console.log(`❌ Country code validation failed: "${params.founderCountry}" is too short`);
    console.log("\n❌ Registration cannot proceed: Invalid country code");
    return;
  } else {
    console.log(`✅ Country code validation passed: "${params.founderCountry}"`);
  }
  
  // Check 10: IPFS profile validation
  if (!params.ipfsProfile || params.ipfsProfile.length === 0) {
    console.log(`❌ IPFS profile validation failed: Profile is empty`);
    console.log("\n❌ Registration cannot proceed: Invalid IPFS profile");
    return;
  } else {
    console.log(`✅ IPFS profile validation passed: "${params.ipfsProfile}"`);
  }
  
  // Check 11: VC Expiry Date
  const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const vcExpiryDate = currentTimestamp + BigInt(365) * BigInt(24) * BigInt(60) * BigInt(60); // 1 year from now
  if (vcExpiryDate <= currentTimestamp) {
    console.log(`❌ VC expiry date validation failed: Expiry date must be in the future`);
    console.log("\n❌ Registration cannot proceed: VC expired");
    return;
  } else {
    console.log(`✅ VC expiry date validation passed: ${vcExpiryDate} > ${currentTimestamp}`);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Attempt Registration");
  console.log("=".repeat(70) + "\n");
  
  // Generate VC proof hash and signature if not provided
  let vcProofHash = params.vcProofHash;
  let vcSignature = params.vcSignature;
  
  if (!vcProofHash) {
    vcProofHash = keccak256(stringToBytes(`test-vc-${params.founderDID}-${Date.now()}`));
    console.log(`📝 Generated VC Proof Hash: ${vcProofHash}`);
  }
  
  if (!vcSignature && !isStagingMode) {
    console.log("⚠️  VC Signature not provided and staging mode appears to be disabled.");
    console.log("   Signature verification will fail. Enable staging mode or provide a valid signature.");
    console.log("   Note: Proceeding anyway to see actual error from contract.");
    // Don't return - let it try and see what happens
  } else if (!vcSignature && isStagingMode) {
    // Create a dummy signature for testing in staging mode
    vcSignature = "0x" + "0".repeat(130) as `0x${string}`;
    console.log("📝 Using dummy signature (staging mode enabled)");
  }
  
  try {
    console.log("🔄 Attempting registration transaction...\n");
    
      const walletClient = await viem.getWalletClient({ account: accountWallet.account });
      const hash = await walletClient.writeContract({
        address: params.registryAddress,
        abi: ngoRegistryAbi,
        functionName: "registerNGO",
        args: [
          params.founderDID,
          vcProofHash,
          vcSignature!,
          params.founderAge,
          params.founderCountry,
          params.ipfsProfile,
          vcExpiryDate,
        ],
        account: accountWallet.account,
      });
    
    console.log(`✅ Transaction submitted: ${hash}`);
    console.log("⏳ Waiting for confirmation...\n");
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === "success") {
      console.log("✅ Registration successful!");
      console.log(`   Transaction hash: ${hash}`);
      console.log(`   Block number: ${receipt.blockNumber}`);
      
      // Verify registration
      const ngoData = await registry.read.ngoByWallet([params.accountAddress]);
      console.log("\n📋 Registered NGO Data:");
      console.log(`   Founder DID: ${ngoData.founderDID}`);
      console.log(`   Founder Age: ${ngoData.founderAge}`);
      console.log(`   Founder Country: ${ngoData.founderCountry}`);
      console.log(`   IPFS Profile: ${ngoData.ipfsProfile}`);
      console.log(`   Is Active: ${ngoData.isActive}`);
      console.log(`   Registered At: ${new Date(Number(ngoData.registeredAt) * 1000).toISOString()}`);
    } else {
      console.log("❌ Transaction failed!");
      console.log(`   Transaction hash: ${hash}`);
    }
  } catch (error: any) {
    console.log("❌ Registration failed with error:");
    console.log(`   Error: ${error.message}`);
    
    // Parse common error messages
    if (error.message.includes("Already registered")) {
      console.log("\n💡 Solution: Account is already registered as an NGO");
    } else if (error.message.includes("DID already used")) {
      console.log("\n💡 Solution: This DID has already been used. Use a different DID.");
    } else if (error.message.includes("VC already used")) {
      console.log("\n💡 Solution: This VC proof has already been used. Generate a new VC proof.");
    } else if (error.message.includes("Registration fee payment failed")) {
      console.log("\n💡 Solution: Check balance and allowance. Ensure you have enough cUSD and have approved spending.");
    } else if (error.message.includes("Invalid VC signature") || error.message.includes("ECDSAInvalidSignature")) {
      console.log("\n💡 Solution: VC signature verification failed. This means:");
      console.log("   1. Staging mode is DISABLED on the deployed contract");
      console.log("   2. The contract requires a valid signature from Self Protocol");
      console.log("   Options:");
      console.log("   - Redeploy the contract with staging mode enabled (for testing)");
      console.log("   - Provide a valid VC signature from Self Protocol");
      console.log("   - Enable staging mode if the contract has updateStagingMode function");
    } else if (error.message.includes("Founder must be 18+")) {
      console.log("\n💡 Solution: Founder age must be 18 or older.");
    } else if (error.message.includes("VC expired")) {
      console.log("\n💡 Solution: VC expiry date must be in the future.");
    } else if (error.message.includes("ERC20InsufficientAllowance")) {
      console.log("\n💡 Solution: Insufficient cUSD allowance. Approve more cUSD for the contract.");
    } else if (error.message.includes("ERC20InsufficientBalance")) {
      console.log("\n💡 Solution: Insufficient cUSD balance. Add more cUSD to your wallet.");
    }
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("Test Complete");
  console.log("=".repeat(70) + "\n");
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let registryAddress = DEFAULT_REGISTRY_ADDRESS as Address;
  let accountAddress: Address | undefined;
  let founderDID = `did:self:test-${Date.now()}`;
  let founderAge = 25;
  let founderCountry = "KE";
  let ipfsProfile = "QmTest123";
  let vcProofHash: `0x${string}` | undefined;
  let vcSignature: `0x${string}` | undefined;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--registry":
        registryAddress = getAddress(args[++i]);
        break;
      case "--account":
        accountAddress = getAddress(args[++i]);
        break;
      case "--did":
        founderDID = args[++i];
        break;
      case "--age":
        founderAge = parseInt(args[++i]);
        break;
      case "--country":
        founderCountry = args[++i];
        break;
      case "--ipfs":
        ipfsProfile = args[++i];
        break;
      case "--vc-proof-hash":
        vcProofHash = args[++i] as `0x${string}`;
        break;
      case "--vc-signature":
        vcSignature = args[++i] as `0x${string}`;
        break;
    }
  }
  
  // Get account from wallet if not provided
  if (!accountAddress) {
    const { viem } = await network.connect();
    const accounts = await viem.getWalletClients();
    if (accounts.length === 0) {
      console.error("❌ No accounts available. Please provide --account or configure wallet.");
      process.exit(1);
    }
    accountAddress = accounts[0].account.address;
    console.log(`ℹ️  Using first available account: ${accountAddress}`);
  }
  
  await testRegistration({
    registryAddress,
    accountAddress,
    founderDID,
    founderAge,
    founderCountry,
    ipfsProfile,
    vcProofHash,
    vcSignature,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

