import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
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
      url: configVariable("CELO_SEPOLIA_RPC_URL", "https://celo-sepolia.infura.io/v3/YOUR_INFURA_KEY"),
      accounts: [configVariable("CELO_SEPOLIA_PRIVATE_KEY")],
    },
    alfajores: {
      type: "http",
      chainType: "l1",
      url: configVariable("ALFAJORES_RPC_URL", "https://alfajores-forno.celo-testnet.org"),
      accounts: [configVariable("ALFAJORES_PRIVATE_KEY")],
    },
  },
});
