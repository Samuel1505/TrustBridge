/**
 * Script to enable staging mode on deployed NGORegistry contract
 * This allows registration with mock passport by skipping signature verification
 * 
 * Usage:
 *   npx hardhat run scripts/enable-staging-mode.ts --network celoSepolia
 */

import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Enabling staging mode on ${network}...\n`);

  // Get contract address from environment or use default
  const contractAddress = process.env.NGOREGISTRY_ADDRESS || "0xdBb6Bcea1e9a701aC2692550A0ae0d18BB48E899";
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.CELO_SEPOLIA_PRIVATE_KEY;

  if (!adminPrivateKey) {
    console.error("❌ Error: ADMIN_PRIVATE_KEY or CELO_SEPOLIA_PRIVATE_KEY not set");
    console.error("   Please set one of these environment variables");
    process.exit(1);
  }

  console.log(`📋 Contract Address: ${contractAddress}`);
  console.log(`📋 Network: ${network}\n`);

  // Get the contract
  const ngoRegistry = await hre.viem.getContractAt(
    "NGORegistry",
    contractAddress as `0x${string}`
  );

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
    const [account] = await hre.viem.getWalletClients();
    
    const hash = await ngoRegistry.write.updateStagingMode([true], {
      account: account.account,
    });

    console.log(`📤 Transaction hash: ${hash}`);
    console.log("⏳ Waiting for confirmation...");

    await hre.viem.waitForTransactionReceipt({ hash });
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



