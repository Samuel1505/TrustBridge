import NGORegistry from "./NGORegistry.json";
import DonationRouter from "./DonationRouter.json";

// Extract ABI from Hardhat artifact (it has an 'abi' property)
// Type assertion to handle JSON imports
const ngoRegistryAbi = Array.isArray(NGORegistry) 
  ? NGORegistry 
  : ((NGORegistry as any).abi || NGORegistry);
  
// DonationRouter.json is an array (ABI), not an object
const donationRouterAbi = Array.isArray(DonationRouter) 
  ? DonationRouter 
  : ((DonationRouter as any)?.abi || DonationRouter);

export const NGORegistryContract = {
    abi: ngoRegistryAbi,
    address: "0x8AE49C5d7c0718467Eae6492BE15222EA67a589A"
}

export const DonationRouterContract = {
    abi: donationRouterAbi,
    address: "0x991F9bd25201504c3988454B32fA9Fa1a8535fBC"
}