/**
 * Script to enable staging mode on deployed NGORegistry contract
 * This allows registration with mock passport by skipping signature verification
 * 
 * Usage:
 *   npx hardhat run scripts/enable-staging-mode.ts --network celoSepolia
 */

import hre from "hardhat";
import { network } from "hardhat";
import { getAddress } from "viem";

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🔧 Enabling staging mode on ${networkName}...\n`);

  // Get contract address from environment or use deployed address
  const contractAddress = process.env.NGOREGISTRY_ADDRESS || "0x8AE49C5d7c0718467Eae6492BE15222EA67a589A";

  console.log(`📋 Contract Address: ${contractAddress}`);
  console.log(`📋 Network: ${networkName}\n`);

  // Connect to network
  const { viem } = await network.connect();
  
  // Load ABI from frontend (same as test script)
  const fs = await import("fs/promises");
  const path = await import("path");
  const abiPath = path.join(process.cwd(), "..", "frontend", "app", "abi", "NGORegistry.json");
  const ngoRegistryAbiFile = JSON.parse(await fs.readFile(abiPath, "utf-8"));
  const ngoRegistryAbi = Array.isArray(ngoRegistryAbiFile) ? ngoRegistryAbiFile : ngoRegistryAbiFile.abi || ngoRegistryAbiFile;

  // Create contract instance
  const ngoRegistry = {
    address: contractAddress as `0x${string}`,
    abi: ngoRegistryAbi,
    read: {
      stagingMode: async () => {
        const publicClient = await viem.getPublicClient();
        return publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ngoRegistryAbi,
          functionName: "stagingMode",
        });
      },
    },
    write: {
      updateStagingMode: async (args: [boolean], options: { account: any }) => {
        const walletClient = await viem.getWalletClient({ account: options.account });
        return walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ngoRegistryAbi,
          functionName: "updateStagingMode",
          args,
          account: options.account,
        });
      },
    },
  };

  // Check if staging mode function exists
  try {
    // Try to read current staging mode (will fail if function doesn't exist)
    const currentMode = await ngoRegistry.read.stagingMode();
    console.log(`📊 Current staging mode: ${currentMode}`);

    if (currentMode === true) {
      console.log("✅ Staging mode is already enabled!");
      return;
    }

    // Enable staging mode
    console.log("🔄 Enabling staging mode...");
    const accounts = await viem.getWalletClients();
    const account = accounts[0];
    
    const hash = await ngoRegistry.write.updateStagingMode([true], {
      account: account.account,
    });

    console.log(`📤 Transaction hash: ${hash}`);
    console.log("⏳ Waiting for confirmation...");

    const publicClient = await viem.getPublicClient();
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Staging mode enabled successfully!");
    console.log("\n⚠️  Note: Signature verification is now disabled for testing.");
    console.log("   Set stagingMode to false for production.\n");
  } catch (error: any) {
    if (error.message?.includes("stagingMode") || error.message?.includes("updateStagingMode")) {
      console.error("❌ Error: Contract doesn't have staging mode functionality");
      console.error("   The deployed contract needs to be redeployed with the new code.");
      console.error("   Run: ./scripts/deploy-with-params.sh celoSepolia");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



