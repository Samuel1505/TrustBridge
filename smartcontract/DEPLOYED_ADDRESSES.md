# TrustBridge Deployed Contract Addresses

## Celo Sepolia Testnet

**Chain ID:** 11155712  
**Explorer:** https://sepolia.celoscan.io

### Contracts

- **NGORegistry:** `0xA49d0Fb2966B8D54Bd7Ec182dC93979763A58128`
- **DonationRouter:** `0x0a563f6Ca5fDa6410165E75f7b50b5b942573e87`

### Deployment Parameters

- **Self Protocol Verifier:** `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- **cUSD Token:** `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`
- **Fee Collector:** `0x34C775FB2fe2b8383B5659B3f7Fc1E721Ca04A3a`
- **Registration Fee:** 10 cUSD

### Deployment Date

December 7, 2024

### Verification

To verify the contracts on CeloScan, use:

```bash
# Verify NGORegistry
npx hardhat verify --network celoSepolia 0xA49d0Fb2966B8D54Bd7Ec182dC93979763A58128 \
  "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74" \
  "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b" \
  "0x34C775FB2fe2b8383B5659B3f7Fc1E721Ca04A3a" \
  "10000000000000000000"

# Verify DonationRouter
npx hardhat verify --network celoSepolia 0x0a563f6Ca5fDa6410165E75f7b50b5b942573e87 \
  "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b" \
  "0xA49d0Fb2966B8D54Bd7Ec182dC93979763A58128"
```

