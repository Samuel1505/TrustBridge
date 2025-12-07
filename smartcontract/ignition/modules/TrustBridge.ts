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
  
  // Ensure registrationFee is converted to BigInt properly
  // m.getParameter returns the value, but we need to handle it as a string first
  let registrationFee: bigint;
  if (typeof registrationFeeParam === "string") {
    registrationFee = BigInt(registrationFeeParam);
  } else if (typeof registrationFeeParam === "bigint") {
    registrationFee = registrationFeeParam;
  } else if (typeof registrationFeeParam === "number") {
    registrationFee = BigInt(registrationFeeParam);
  } else {
    // If it's an object, try to get the value property or convert to string
    const value = (registrationFeeParam as any)?.value ?? registrationFeeParam;
    registrationFee = BigInt(String(value));
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

