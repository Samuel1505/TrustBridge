# TrustBridge Deployment Guide

This guide explains how to deploy the TrustBridge smart contracts to various networks.

## Prerequisites

1. Node.js and npm installed
2. Hardhat installed (`npm install`)
3. Environment variables configured (see below)
4. Sufficient funds in your deployment account for gas fees

## Environment Variables

Create a `.env` file in the `smartcontract` directory with the following variables:

```bash
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here

# TrustBridge Deployment Parameters
# Self Protocol Verifier address (address that will verify VC signatures)
SELF_PROTOCOL_VERIFIER=0x0000000000000000000000000000000000000000

# cUSD Token Address (Celo Dollar ERC20 token)
# For Celo Alfajores testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
# For Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
CUSD_ADDRESS=0x0000000000000000000000000000000000000000

# Fee Collector Address (where registration fees go)
FEE_COLLECTOR=0x0000000000000000000000000000000000000000

# Registration Fee (in cUSD, default: 10)
REGISTRATION_FEE=10
```

## Deployment Steps

### 1. Validate Configuration

Before deploying, validate your environment variables:

```bash
npm run deploy:check
```

This will check that all required parameters are set and valid.

### 2. Deploy to Local Network

Deploy to a local Hardhat network for testing:

```bash
npm run deploy:local
```

Or manually:

```bash
npx hardhat ignition deploy ignition/modules/TrustBridge.ts
```

### 3. Deploy to Sepolia Testnet

Deploy to Sepolia testnet:

```bash
npm run deploy:sepolia
```

Or manually:

```bash
npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network sepolia
```

### 4. Deploy to Other Networks

To deploy to other networks, first add the network configuration to `hardhat.config.ts`, then run:

```bash
npx hardhat ignition deploy ignition/modules/TrustBridge.ts --network <network-name>
```

## Deployment Parameters

The deployment requires the following parameters (set via environment variables):

- **SELF_PROTOCOL_VERIFIER**: Address of the Self Protocol verifier that will sign VC proofs
- **CUSD_ADDRESS**: Address of the cUSD ERC20 token contract
- **FEE_COLLECTOR**: Address that will receive registration fees
- **REGISTRATION_FEE**: Registration fee in cUSD (default: 10)

These parameters are passed to the deployment module via environment variables and used during contract construction.

## Deployment Order

The contracts are deployed in the following order:

1. **NGORegistry** - Deployed first with the required parameters
2. **DonationRouter** - Deployed second, using the NGORegistry address

This order is handled automatically by the `TrustBridge.ts` ignition module.

## Verifying Deployment

After deployment, Hardhat Ignition will display the deployed contract addresses. You can also check the deployment artifacts in the `ignition/deployments/` directory.

## Post-Deployment

After successful deployment:

1. Save the contract addresses for your frontend/backend integration
2. Verify the contracts on block explorers (if applicable)
3. Update your application configuration with the new contract addresses
4. Test the deployed contracts with a test transaction

## Troubleshooting

### "Invalid address format" error
- Ensure all addresses in your `.env` file are valid Ethereum addresses (0x followed by 40 hex characters)

### "Missing environment variable" error
- Check that all required environment variables are set in your `.env` file
- Ensure the `.env` file is in the `smartcontract` directory

### Deployment fails with "insufficient funds"
- Ensure your deployment account has sufficient ETH/cUSD for gas fees
- Check the network RPC URL is correct

### Contracts already deployed
- Hardhat Ignition tracks deployments. If you need to redeploy, you may need to reset the deployment state or use a different deployment ID

## Network-Specific Notes

### Sepolia Testnet
- Get testnet ETH from a faucet
- Use testnet cUSD if deploying on Celo testnet
- RPC URL can be from Infura, Alchemy, or public RPC endpoints

### Celo Networks
- For Celo Alfajores (testnet), use cUSD address: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- For Celo Mainnet, use cUSD address: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Add Celo network configuration to `hardhat.config.ts` if deploying to Celo

## Security Notes

- **Never commit your `.env` file** - it contains private keys
- Use separate accounts for testnet and mainnet deployments
- Verify all addresses before deploying to mainnet
- Consider using a multisig wallet for mainnet deployments

