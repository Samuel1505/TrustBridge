# Self Protocol Troubleshooting Guide

## Current Configuration

- **Contract Address**: `0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899` (lowercase)
- **Scope**: `trustbridge`
- **Endpoint Type**: `staging_celo`
- **Disclosures**: minimumAge: 18, excludedCountries: [CUBA, IRAN, NORTH_KOREA, RUSSIA, SYRIA], nationality: true

## Why `proof_generation_failed` Occurs

The error `proof_generation_failed` means Self Protocol's backend cannot generate a proof because:

1. **No Backend Configuration**: Self Protocol's backend doesn't have a verification config registered for:
   - Contract address: `0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899`
   - Scope: `trustbridge`
   - Endpoint type: `staging_celo`

2. **Scope Not Registered**: The scope `trustbridge` is not registered with Self Protocol's backend for this contract address

## Solutions

### Option 1: Register with Self Protocol (Recommended for Testing)

Contact Self Protocol support to register:
- **Contract Address**: `0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899`
- **Scope**: `trustbridge`
- **Verification Config**:
  - minimumAge: 18
  - excludedCountries: CUBA, IRAN, NORTH_KOREA, RUSSIA, SYRIA
  - nationality: true
  - ofac: false

**Contact**: Self Protocol team or use their dashboard at https://cloud.self.xyz

### Option 2: Set Up Your Own Backend

Create a backend API endpoint using `SelfBackendVerifier`:

1. **Install dependencies**:
   ```bash
   npm install @selfxyz/core
   ```

2. **Create backend endpoint** (`/api/verify`):
   ```typescript
   import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core'
   import express from 'express'

   const app = express()
   app.use(express.json())

   const verifier = new SelfBackendVerifier(
     'trustbridge', // scope - must match frontend
     'https://your-api.com/api/verify', // your endpoint URL
     true, // mockPassport (true = staging, false = mainnet)
     AllIds, // allowed attestation IDs
     new DefaultConfigStore({
       minimumAge: 18,
       excludedCountries: ['CUBA', 'IRAN', 'NORTH_KOREA', 'RUSSIA', 'SYRIA'],
       ofac: false,
     }),
     'hex' // userIdentifierType
   )

   app.post('/api/verify', async (req, res) => {
     const { attestationId, proof, publicSignals, userContextData } = req.body
     
     try {
       const result = await verifier.verify(
         attestationId,
         proof,
         publicSignals,
         userContextData
       )

       if (result.isValidDetails.isValid && result.isValidDetails.isMinimumAgeValid) {
         return res.status(200).json({
           status: 'success',
           result: true,
         })
       } else {
         return res.status(200).json({
           status: 'error',
           result: false,
           reason: 'Verification failed',
         })
       }
     } catch (error) {
       return res.status(200).json({
         status: 'error',
         result: false,
         reason: error instanceof Error ? error.message : 'Unknown error',
       })
     }
   })

   app.listen(3000, () => {
     console.log('Server listening on http://localhost:3000')
   })
   ```

3. **Update frontend config**:
   - Set `NEXT_PUBLIC_SELF_ENDPOINT` to your backend URL
   - Example: `NEXT_PUBLIC_SELF_ENDPOINT=https://your-api.com/api/verify`

4. **Make endpoint publicly accessible**:
   - Deploy your backend (Vercel, Railway, etc.)
   - Or use ngrok for local testing: `ngrok http 3000`

### Option 3: Use a Different Scope

If Self Protocol has a pre-configured scope for testing, you can use that:

1. Update `NEXT_PUBLIC_SELF_SCOPE` in `.env.local` to match an existing scope
2. Ensure disclosures match that scope's configuration

## Environment Variables Checklist

Create `frontend/.env.local`:

```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_ENDPOINT=0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899  # Contract address (for staging_celo)
# OR if using custom backend:
# NEXT_PUBLIC_SELF_ENDPOINT=https://your-api.com/api/verify

NEXT_PUBLIC_SELF_APP_NAME=TrustBridge
NEXT_PUBLIC_SELF_SCOPE=trustbridge
```

## Verification Checklist

- [ ] Contract address is lowercase: `0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899`
- [ ] Scope matches backend configuration: `trustbridge`
- [ ] Disclosures match backend config (minimumAge: 18, excludedCountries, nationality: true)
- [ ] Contract has `verifySelfProof` function (✅ added)
- [ ] Backend endpoint is accessible (if using custom backend)
- [ ] Scope is registered with Self Protocol (if using public endpoint)

## Debug Steps

1. **Check browser console** for Self Protocol config logs
2. **Verify contract address** in logs matches deployed address
3. **Check scope** matches what's configured in backend
4. **Verify disclosures** match backend configuration exactly
5. **Test with mock passport** from https://tools.self.xyz

## Next Steps

1. Contact Self Protocol support to register your contract + scope
2. OR set up your own backend endpoint
3. Test verification flow again






