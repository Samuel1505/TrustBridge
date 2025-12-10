import NGORegistry from "./NGORegistry.json";
import DonationRouter from "./DonationRouter.json";

// Extract ABI from Hardhat artifact (it has an 'abi' property)
const ngoRegistryAbi = Array.isArray(NGORegistry) ? NGORegistry : (NGORegistry.abi || NGORegistry);
const donationRouterAbi = Array.isArray(DonationRouter) ? DonationRouter : (DonationRouter.abi || DonationRouter);

export const NGORegistryContract = {
    abi: ngoRegistryAbi,
    address: "0x4D47d268F5BdBd8926efa86C5205185550b9178d"
}

export const DonationRouterContract = {
    abi: donationRouterAbi,
    address: "0x875CbF85A375a573645a475Fe9daD9678FA24625"
}