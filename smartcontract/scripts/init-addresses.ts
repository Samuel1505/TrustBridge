#!/usr/bin/env node

/**
 * Initialize addresses for deployment
 * This script sets up the default addresses based on the network
 * Usage: npx hardhat run scripts/init-addresses.ts --network <network>
 */

import { config } from "dotenv";
import { getAddress } from "viem";
import hre from "hardhat";
import { NETWORK_CONFIG, type NetworkName } from "../config/networks.js";

// Load environment variables
config();

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🔧 Initializing addresses for network: ${networkName}\n`);

  // Get network-specific defaults
  const networkKey = networkName.toLowerCase().replace(/-/g, "") as NetworkName;
  const networkConfig = NETWORK_CONFIG[networkKey];

  if (!networkConfig) {
    console.log(`⚠️  No default configuration found for network: ${networkName}`);
    console.log(`   Please set addresses manually in your .env file\n`);
    process.exit(0);
  }

  console.log("📋 Network Default Addresses:");
  console.log(`   Self Protocol Verifier: ${networkConfig.selfProtocolVerifier}`);
  console.log(`   cUSD Token: ${networkConfig.cUSD}`);
  console.log(`   Chain ID: ${networkConfig.chainId}\n`);

  // Validate addresses
  try {
    getAddress(networkConfig.selfProtocolVerifier);
    getAddress(networkConfig.cUSD);
    console.log("✅ All addresses are valid\n");
  } catch (error) {
    console.error("❌ Invalid address format:", error);
    process.exit(1);
  }

  // Check if .env file exists and show what to set
  const fs = await import("fs/promises");
  const envPath = ".env";
  const envExists = await fs
    .access(envPath)
    .then(() => true)
    .catch(() => false);

  if (!envExists) {
    console.log("💡 Create a .env file with these values:\n");
    console.log(`SELF_PROTOCOL_VERIFIER=${networkConfig.selfProtocolVerifier}`);
    console.log(`CUSD_ADDRESS=${networkConfig.cUSD}`);
    console.log(`FEE_COLLECTOR=your_fee_collector_address_here`);
    console.log(`REGISTRATION_FEE=10\n`);
  } else {
    console.log("💡 Update your .env file with these values if not already set:\n");
    console.log(`SELF_PROTOCOL_VERIFIER=${networkConfig.selfProtocolVerifier}`);
    console.log(`CUSD_ADDRESS=${networkConfig.cUSD}\n`);
  }

  console.log("📝 These addresses will be used as defaults if not set in .env\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

