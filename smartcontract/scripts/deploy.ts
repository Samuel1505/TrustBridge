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
import { NETWORK_CONFIG, type NetworkName } from "../config/networks.js";

// Load environment variables
config();

/**
 * Get network-specific default addresses
 */
function getNetworkDefaults(networkName: string) {
  const networkKey = networkName.toLowerCase().replace(/-/g, "") as NetworkName;
  const networkConfig = NETWORK_CONFIG[networkKey];
  
  if (networkConfig) {
    return {
      selfProtocolVerifier: networkConfig.selfProtocolVerifier,
      cUSD: networkConfig.cUSD,
    };
  }
  
  return {
    selfProtocolVerifier: undefined,
    cUSD: undefined,
  };
}

async function main() {
  console.log("\n🚀 TrustBridge Deployment Helper\n");
  console.log("=" .repeat(50));

  // Get network name
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  console.log(`\n🌐 Network: ${networkName}\n`);

  // Get network-specific defaults
  const networkDefaults = getNetworkDefaults(networkName);
  
  // Get deployment parameters from environment variables, with network defaults as fallback
  const selfProtocolVerifier = 
    process.env.SELF_PROTOCOL_VERIFIER || 
    networkDefaults.selfProtocolVerifier;
  const cUSDAddress = 
    process.env.CUSD_ADDRESS || 
    networkDefaults.cUSD;
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
    if (networkDefaults.selfProtocolVerifier) {
      console.log(`\n   Network defaults for ${networkName}:`);
      console.log(`   SELF_PROTOCOL_VERIFIER: ${networkDefaults.selfProtocolVerifier}`);
      console.log(`   CUSD_ADDRESS: ${networkDefaults.cUSD}`);
    }
    console.log("   See DEPLOYMENT.md for reference\n");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ All parameters are valid!");
  
  // Show which values are being used (env vs defaults)
  console.log("\n📝 Deployment Configuration:");
  if (networkDefaults.selfProtocolVerifier && !process.env.SELF_PROTOCOL_VERIFIER) {
    console.log(`   ⚠️  Using network default for SELF_PROTOCOL_VERIFIER`);
  }
  if (networkDefaults.cUSD && !process.env.CUSD_ADDRESS) {
    console.log(`   ⚠️  Using network default for CUSD_ADDRESS`);
  }
  
  console.log("\n📝 To deploy, run:");
  console.log("   npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network <network>");
  console.log("\n   Example for Celo Sepolia:");
  console.log("   npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network celoSepolia");
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

