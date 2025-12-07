#!/usr/bin/env node

/**
 * Deployment helper script for TrustBridge
 * 
 * This script validates environment variables and provides deployment information.
 * Actual deployment is done via: npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network <network>
 * 
 * Usage:
 *   node scripts/deploy.ts
 *   or
 *   npx hardhat run scripts/deploy.ts
 */

import { config } from "dotenv";
import { getAddress, parseEther } from "viem";
import hre from "hardhat";

// Load environment variables
config();

async function main() {
  console.log("\n🚀 TrustBridge Deployment Helper\n");
  console.log("=" .repeat(50));

  // Get deployment parameters from environment variables
  const selfProtocolVerifier = process.env.SELF_PROTOCOL_VERIFIER;
  const cUSDAddress = process.env.CUSD_ADDRESS;
  const feeCollector = process.env.FEE_COLLECTOR;
  const registrationFee = process.env.REGISTRATION_FEE || "10"; // Default 10 cUSD

  console.log("\n📋 Checking deployment parameters...\n");

  // Validate required parameters
  const errors: string[] = [];
  
  if (!selfProtocolVerifier) {
    errors.push("❌ SELF_PROTOCOL_VERIFIER is missing");
  } else {
    try {
      getAddress(selfProtocolVerifier);
      console.log(`✅ SELF_PROTOCOL_VERIFIER: ${selfProtocolVerifier}`);
    } catch {
      errors.push("❌ SELF_PROTOCOL_VERIFIER is not a valid address");
    }
  }

  if (!cUSDAddress) {
    errors.push("❌ CUSD_ADDRESS is missing");
  } else {
    try {
      getAddress(cUSDAddress);
      console.log(`✅ CUSD_ADDRESS: ${cUSDAddress}`);
    } catch {
      errors.push("❌ CUSD_ADDRESS is not a valid address");
    }
  }

  if (!feeCollector) {
    errors.push("❌ FEE_COLLECTOR is missing");
  } else {
    try {
      getAddress(feeCollector);
      console.log(`✅ FEE_COLLECTOR: ${feeCollector}`);
    } catch {
      errors.push("❌ FEE_COLLECTOR is not a valid address");
    }
  }

  try {
    const registrationFeeWei = parseEther(registrationFee);
    console.log(`✅ REGISTRATION_FEE: ${registrationFee} cUSD (${registrationFeeWei} wei)`);
  } catch {
    errors.push("❌ REGISTRATION_FEE is not a valid number");
  }

  if (errors.length > 0) {
    console.log("\n❌ Validation errors found:\n");
    errors.forEach((error) => console.log(`   ${error}`));
    console.log("\n💡 Please set the required environment variables in your .env file");
    console.log("   See .env.example for reference\n");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ All parameters are valid!");
  console.log("\n📝 To deploy, run:");
  console.log("   npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network <network>");
  console.log("\n   Example for Sepolia:");
  console.log("   npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network sepolia");
  console.log("\n   Example for local hardhat:");
  console.log("   npx hardhat ignition deploy ignition/modules/TrustBridge.ts\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

