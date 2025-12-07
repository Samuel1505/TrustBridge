import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * Main deployment module for TrustBridge
 * Deploys NGORegistry first, then DonationRouter
 * 
 * Parameters can be passed via CLI:
 * npx hardhat ignition deploy ignition/modules/TrustBridge.ts \
 *   --parameters '{"TrustBridgeModule":{"selfProtocolVerifier":"0x...","cUSD":"0x...","feeCollector":"0x...","registrationFee":"10000000000000000000"}}'
 */
export default buildModule("TrustBridgeModule", (m) => {
  // Get parameters from CLI or use defaults
  // Note: registrationFee should be in wei (e.g., "10000000000000000000" for 10 cUSD)
  const selfProtocolVerifier = m.getParameter(
    "selfProtocolVerifier",
    "0x0000000000000000000000000000000000000000"
  );
  const cUSD = m.getParameter("cUSD", "0x0000000000000000000000000000000000000000");
  const feeCollector = m.getParameter(
    "feeCollector",
    "0x0000000000000000000000000000000000000000"
  );
  const registrationFeeParam = m.getParameter(
    "registrationFee",
    parseEther("10").toString() // Default: 10 cUSD in wei
  );
  
  // Convert registrationFee to BigInt
  // Handle different parameter formats that might come from CLI
  const registrationFeeStr = String(registrationFeeParam);
  const registrationFee = BigInt(registrationFeeStr);

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

