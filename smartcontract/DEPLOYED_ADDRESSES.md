# TrustBridge Deployed Contract Addresses

## Celo Sepolia Testnet

**Chain ID:** 11155712  
**Explorer:** https://sepolia.celoscan.io

### Contracts

- **NGORegistry:** `0x8AE49C5d7c0718467Eae6492BE15222EA67a589A`
  - ✅ Verified on Sourcify: https://sourcify.dev/server/repo-ui/11142220/0x8AE49C5d7c0718467Eae6492BE15222EA67a589A
  - 🔍 CeloScan: https://sepolia.celoscan.io/address/0x8AE49C5d7c0718467Eae6492BE15222EA67a589A
  - ✨ **Latest deployment** with `verifySelfProof` function and `stagingMode` for testing

- **DonationRouter:** `0x991F9bd25201504c3988454B32fA9Fa1a8535fBC`
  - ✅ Verified on Sourcify: https://sourcify.dev/server/repo-ui/11142220/0x991F9bd25201504c3988454B32fA9Fa1a8535fBC
  - 🔍 CeloScan: https://sepolia.celoscan.io/address/0x991F9bd25201504c3988454B32fA9Fa1a8535fBC

### Deployment Parameters

- **Self Protocol Verifier:** `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- **cUSD Token:** `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`
- **Fee Collector:** `0x34C775FB2fe2b8383B5659B3f7Fc1E721Ca04A3a`
- **Registration Fee:** 1 cUSD (reduced from 10 cUSD for testnet)
- **Staging Mode:** `true` (signature verification disabled for testing with mock passport)

### Deployment Date

**Latest Deployment:** December 2024 (with `verifySelfProof` function and `stagingMode` enabled)  
**Previous Deployment:** December 2024 (with `verifySelfProof` function)  
**Initial Deployment:** December 7, 2024

### Verification Status

✅ **Both contracts have been verified on Sourcify!**

The contracts were verified using Hardhat's verification plugin. To verify on CeloScan (if you have an API key), add `CELOSCAN_API_KEY` to your `.env` file and run:

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

