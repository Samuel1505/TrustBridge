import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

export default buildModule("NGORegistryModule", (m) => {
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
    parseEther("1").toString()
  );
  const stagingMode = m.getParameter(
    "stagingMode",
    "true" // Enable staging mode by default for testing with mock passport
  );

  const ngoRegistry = m.contract("NGORegistry", [
    selfProtocolVerifier,
    cUSD,
    feeCollector,
    registrationFee,
    stagingMode === "true" || stagingMode === true,
  ]);

  return { ngoRegistry };
});

