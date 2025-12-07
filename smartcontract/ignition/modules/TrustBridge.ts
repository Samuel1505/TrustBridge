import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * Main deployment module for TrustBridge
 * Deploys NGORegistry first, then DonationRouter
 */
export default buildModule("TrustBridgeModule", (m) => {
  // Get parameters from config or use defaults
  const selfProtocolVerifier = m.getParameter(
    "selfProtocolVerifier",
    "0x0000000000000000000000000000000000000000"
  );
  const cUSD = m.getParameter("cUSD", "0x0000000000000000000000000000000000000000");
  const feeCollector = m.getParameter(
    "feeCollector",
    "0x0000000000000000000000000000000000000000"
  );
  const registrationFee = m.getParameter(
    "registrationFee",
    parseEther("10").toString()
  );

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

