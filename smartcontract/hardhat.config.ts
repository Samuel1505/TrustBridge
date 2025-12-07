import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";
import { config } from "dotenv";

// Load environment variables
config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  etherscan: {
    apiKey: {
      celoSepolia: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11155712,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
    ],
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    celoSepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.CELO_SEPOLIA_RPC_URL || configVariable("CELO_SEPOLIA_RPC_URL"),
      accounts: process.env.CELO_SEPOLIA_PRIVATE_KEY 
        ? [process.env.CELO_SEPOLIA_PRIVATE_KEY]
        : [configVariable("CELO_SEPOLIA_PRIVATE_KEY")],
    },
    alfajores: {
      type: "http",
      chainType: "l1",
      url: configVariable("ALFAJORES_RPC_URL"),
      accounts: [configVariable("ALFAJORES_PRIVATE_KEY")],
    },
  },
});
