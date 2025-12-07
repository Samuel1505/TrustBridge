import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DonationRouterModule", (m) => {
  // Get parameters from config or use defaults
  const cUSD = m.getParameter("cUSD", "0x0000000000000000000000000000000000000000");
  const registry = m.getParameter("registry", "0x0000000000000000000000000000000000000000");

  const donationRouter = m.contract("DonationRouter", [cUSD, registry]);

  return { donationRouter };
});

