import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";
import { NETWORK_CONFIG } from "../../config/networks.js";

/**
 * Main deployment module for TrustBridge
 * Deploys NGORegistry first, then DonationRouter
 * 
 * Parameters should be passed via CLI using the deployment script:
 * npm run deploy:celo-sepolia:params
 * 
 * Or manually:
 * npx hardhat ignition deploy ignition/modules/TrustBridge.ts \
 *   --parameters '{"TrustBridgeModule":{"selfProtocolVerifier":"0x...","cUSD":"0x...","feeCollector":"0x...","registrationFee":"10000000000000000000"}}'
 */
export default buildModule("TrustBridgeModule", (m) => {
  // Get network-specific defaults (for Celo Sepolia)
  // These are used as fallbacks if parameters are not provided
  const celoSepoliaDefaults = NETWORK_CONFIG.celoSepolia;
  
  // Get parameters from CLI or use network defaults
  // Note: Parameters are typically provided via the deployment script
  const selfProtocolVerifier = m.getParameter(
    "selfProtocolVerifier",
    celoSepoliaDefaults.selfProtocolVerifier // Default: Self Protocol IVH on Celo Sepolia
  );
  const cUSD = m.getParameter(
    "cUSD",
    celoSepoliaDefaults.cUSD // Default: cUSD on Celo Sepolia
  );
  const feeCollector = m.getParameter(
    "feeCollector",
    "0x0000000000000000000000000000000000000000" // Fee collector must be provided
  );
  // Get registrationFee parameter
  // When passed via CLI, Hardhat Ignition may wrap it in an object
  const registrationFeeParamRaw = m.getParameter(
    "registrationFee",
    parseEther("10").toString() // Default: 10 cUSD in wei
  );
  
  // Extract the actual value - handle Parameter objects from Hardhat Ignition
  let registrationFee: bigint;
  
  // Check if it's a Parameter object (has .value property)
  if (registrationFeeParamRaw && typeof registrationFeeParamRaw === "object" && "value" in registrationFeeParamRaw) {
    const paramValue = (registrationFeeParamRaw as any).value;
    registrationFee = typeof paramValue === "bigint" ? paramValue : BigInt(String(paramValue));
  } else if (typeof registrationFeeParamRaw === "bigint") {
    registrationFee = registrationFeeParamRaw;
  } else if (typeof registrationFeeParamRaw === "string") {
    registrationFee = BigInt(registrationFeeParamRaw);
  } else if (typeof registrationFeeParamRaw === "number") {
    registrationFee = BigInt(registrationFeeParamRaw);
  } else {
    // Last resort: try to convert whatever we got
    // This handles edge cases where the parameter might be wrapped differently
    const str = String(registrationFeeParamRaw);
    if (str === "[object Object]") {
      // If it's an object we can't stringify, use default
      registrationFee = parseEther("10");
    } else {
      registrationFee = BigInt(str);
    }
  }

  // Deploy NGORegistry first
  const ngoRegistry = m.contract("NGORegistry", [
    selfProtocolVerifier,
    cUSD,
    feeCollector,
    registrationFee,
  ]);

  // Deploy DonationRouter with reference to NGORegistry
  const donationRouter = m.contract("DonationRouter", [
    cUSD,
    ngoRegistry,
  ]);

  return { ngoRegistry, donationRouter };
});

