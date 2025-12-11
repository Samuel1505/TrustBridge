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
    address: "0x4D47d268F5BdBd8926efa86C5205185550b9178d"
}

export const DonationRouterContract = {
    abi: donationRouterAbi,
    address: "0x875CbF85A375a573645a475Fe9daD9678FA24625"
}