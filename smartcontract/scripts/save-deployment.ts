#!/usr/bin/env node

/**
 * Save deployment addresses to a JSON file
 * Usage: node scripts/save-deployment.ts <network> <ngoRegistry> <donationRouter>
 */

import { promises as fs } from "fs";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("Usage: node scripts/save-deployment.ts <network> <ngoRegistry> <donationRouter>");
    process.exit(1);
  }

  const [network, ngoRegistry, donationRouter] = args;

  const deploymentInfo = {
    network,
    deployedAt: new Date().toISOString(),
    contracts: {
      ngoRegistry,
      donationRouter,
    },
    // Add network-specific info
    networkInfo: {
      celoSepolia: {
        chainId: 11155712,
        explorer: "https://sepolia.celoscan.io",
      },
    }[network] || {},
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(process.cwd(), "deployments");
  await fs.mkdir(deploymentsDir, { recursive: true });

  // Save to file
  const filename = `${network}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  await fs.writeFile(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n✅ Deployment addresses saved to: ${filepath}\n`);
  console.log("📋 Deployment Info:");
  console.log(`   Network: ${network}`);
  console.log(`   NGORegistry: ${ngoRegistry}`);
  console.log(`   DonationRouter: ${donationRouter}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

