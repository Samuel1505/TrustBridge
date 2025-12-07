/**
 * Network-specific configuration for TrustBridge deployments
 * Contains addresses for different networks
 */

export const NETWORK_CONFIG = {
  // Celo Sepolia Testnet
  celoSepolia: {
    name: "celo-sepolia",
    chainId: 11155712,
    selfProtocolVerifier: "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74", // Self Protocol IVH on Celo Sepolia
    cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", // cUSD on Celo Sepolia (Alfajores address, verify for Sepolia)
    rpcUrl: "https://celo-sepolia.infura.io/v3/YOUR_INFURA_KEY", // Update with your RPC URL
  },
  
  // Celo Mainnet
  celo: {
    name: "celo",
    chainId: 42220,
    selfProtocolVerifier: "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74", // Verify mainnet address
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    rpcUrl: "https://forno.celo.org",
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIG;

