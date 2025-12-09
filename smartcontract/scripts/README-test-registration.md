# Registration Test Script

This script helps debug NGO registration failures by testing each step of the registration process and reporting where it fails.

## Usage

### Basic Usage (with defaults)

```bash
npx hardhat run scripts/test-registration.ts --network celoSepolia
```

This will use:
- Default registry address: `0x8AE49C5d7c0718467Eae6492BE15222EA67a589A`
- First available wallet account
- Test data (auto-generated DID, age 25, country "KE", etc.)

### Advanced Usage (with custom parameters)

```bash
npx hardhat run scripts/test-registration.ts --network celoSepolia -- \
  --registry 0x8AE49C5d7c0718467Eae6492BE15222EA67a589A \
  --account 0xYourAccountAddress \
  --did "did:self:test123" \
  --age 25 \
  --country "KE" \
  --ipfs "QmTest123" \
  --vc-proof-hash 0x... \
  --vc-signature 0x...
```

### Using Real Frontend Data

To test with actual data from a failed frontend registration:

1. Get the transaction data from the browser console or transaction receipt
2. Extract the parameters:
   - `founderDID`
   - `vcProofHash`
   - `vcSignature`
   - `founderAge`
   - `founderCountry`
   - `ipfsProfile`
   - `vcExpiryDate`

3. Run the script with these parameters:

```bash
npx hardhat run scripts/test-registration.ts --network celoSepolia -- \
  --account 0xYourAccountAddress \
  --did "did:self:actual-did-from-frontend" \
  --age 25 \
  --country "KE" \
  --ipfs "QmActualIPFSHash" \
  --vc-proof-hash 0xActualVCProofHash \
  --vc-signature 0xActualVCSignature
```

## What the Script Checks

The script performs comprehensive checks before attempting registration:

### Step 1: Pre-Registration Checks

1. **Balance Check** - Verifies you have enough cUSD (default: 1 cUSD)
2. **Allowance Check** - Verifies you've approved cUSD spending for the contract
3. **Registration Status** - Checks if account is already registered
4. **DID Usage** - Verifies the DID hasn't been used before
5. **VC Proof Usage** - Verifies the VC proof hash hasn't been used
6. **Staging Mode** - Shows if signature verification is enabled/disabled
7. **Registration Fee** - Shows the current registration fee
8. **Age Validation** - Verifies founder age >= 18
9. **Country Code Validation** - Verifies country code length >= 2
10. **IPFS Profile Validation** - Verifies IPFS profile is not empty
11. **VC Expiry Date** - Verifies expiry date is in the future

### Step 2: Registration Attempt

If all checks pass, the script attempts the registration and reports:
- Transaction hash
- Success/failure status
- Detailed error messages if it fails
- Registered NGO data if successful

## Common Issues and Solutions

### Insufficient Balance
```
❌ Insufficient balance: 0.5 cUSD (required: 1.0 cUSD)
```
**Solution:** Add more cUSD to your wallet

### Insufficient Allowance
```
❌ Insufficient allowance: 0.0 cUSD (required: 1.0 cUSD)
```
**Solution:** Approve cUSD spending:
```solidity
cUSD.approve(registryAddress, parseEther("1"))
```

### Already Registered
```
❌ Account is already registered as an NGO
```
**Solution:** Use a different account or check if you're already registered

### DID Already Used
```
❌ DID already used by wallet: 0x...
```
**Solution:** Use a different DID (each DID can only register once)

### VC Proof Already Used
```
❌ VC proof hash already used
```
**Solution:** Generate a new VC proof from Self Protocol

### Invalid VC Signature
```
❌ Invalid VC signature
```
**Solution:** 
- Enable staging mode (for testing)
- Or ensure you have a valid signature from Self Protocol

### VC Expired
```
❌ VC expired
```
**Solution:** Ensure `vcExpiryDate` is in the future

## Environment Setup

Make sure you have:

1. **Network configured** in `hardhat.config.ts`
2. **Private key** set in `.env`:
   ```
   CELO_SEPOLIA_PRIVATE_KEY=your_private_key_here
   ```
3. **RPC URL** set in `.env`:
   ```
   CELO_SEPOLIA_RPC_URL=https://celo-sepolia.infura.io/v3/YOUR_KEY
   ```

## Example Output

```
======================================================================
🔍 NGO Registration Test & Debug Script
======================================================================

📋 Test Parameters:
   Registry Address: 0x8AE49C5d7c0718467Eae6492BE15222EA67a589A
   Account Address: 0x1234...
   Founder DID: did:self:test123
   Founder Age: 25
   Founder Country: KE
   IPFS Profile: QmTest123
   VC Proof Hash: 0x...
   VC Signature: Provided

======================================================================
STEP 1: Pre-Registration Checks
======================================================================

✅ Balance check passed: 10.0 cUSD (required: 1.0 cUSD)
✅ Allowance check passed: 1.0 cUSD (required: 1.0 cUSD)
✅ Account is not registered (can proceed)
✅ DID is available
✅ VC proof hash is available
⚠️  Staging mode is ENABLED (signature verification will be skipped)
✅ Registration fee: 1.0 cUSD
✅ Founder age validation passed: 25 >= 18
✅ Country code validation passed: "KE"
✅ IPFS profile validation passed: "QmTest123"
✅ VC expiry date validation passed: 1735689600 > 1704153600

======================================================================
STEP 2: Attempt Registration
======================================================================

🔄 Attempting registration transaction...

✅ Transaction submitted: 0x...
⏳ Waiting for confirmation...

✅ Registration successful!
   Transaction hash: 0x...
   Block number: 12345678

📋 Registered NGO Data:
   Founder DID: did:self:test123
   Founder Age: 25
   Founder Country: KE
   IPFS Profile: QmTest123
   Is Active: true
   Registered At: 2024-01-01T00:00:00.000Z

======================================================================
Test Complete
======================================================================
```

