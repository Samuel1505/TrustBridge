#!/usr/bin/env node

/**
 * Reset Hardhat Ignition deployment state
 * This clears the deployment artifacts for a specific network
 * Usage: npx hardhat run scripts/reset-deployment.ts --network <network>
 */

import { config } from "dotenv";
import hre from "hardhat";
import { promises as fs } from "fs";
import path from "path";

config();

async function main() {
  const networkName = hre.network.name;
  
  // Get chainId from network config or environment
  let chainId: string;
  try {
    if (hre.network.config?.chainId) {
      chainId = hre.network.config.chainId.toString();
    } else {
      // Try to get from network provider
      const network = await hre.network.provider.getNetwork();
      chainId = network.chainId.toString();
    }
  } catch (error) {
    // Fallback: use known chain IDs
    const knownChainIds: Record<string, string> = {
      celoSepolia: "11155712",
      alfajores: "44787",
      celo: "42220",
      sepolia: "11155111",
    };
    chainId = knownChainIds[networkName] || "11155712"; // Default to Celo Sepolia
    console.log(`⚠️  Could not get chainId from network, using: ${chainId}`);
  }
  
  console.log(`\n🔄 Resetting deployment state for network: ${networkName} (chainId: ${chainId})\n`);

  const deploymentsDir = path.join(process.cwd(), "ignition", "deployments", `chain-${chainId}`);
  
  try {
    // Check if deployment directory exists
    await fs.access(deploymentsDir);
    
    console.log(`📁 Found deployment state at: ${deploymentsDir}`);
    console.log("🗑️  Removing deployment state...\n");
    
    // Remove the deployment directory
    await fs.rm(deploymentsDir, { recursive: true, force: true });
    
    console.log("✅ Deployment state cleared successfully!");
    console.log("   You can now deploy fresh contracts.\n");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("ℹ️  No deployment state found. Nothing to reset.\n");
    } else {
      console.error("❌ Error resetting deployment state:", error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

