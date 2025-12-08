# Self Protocol Integration Guide

This guide explains how to set up and use Self Protocol for NGO identity verification in TrustBridge.

## Overview

Self Protocol is used to verify NGO founders' identities using biometric passports or national IDs. The verification process ensures that:
- Founders are 18+ years old
- Founders are from allowed countries (sanctions compliance)
- Each identity can only register once (Sybil resistance)

## Setup

### 1. Get Self Protocol Credentials

**Important:** Even though we verify on-chain, Self Protocol still requires a backend endpoint to generate the initial proof. You have two options:

**Option A: Use Self Protocol's Public Endpoint (Recommended for Testing)**
- For staging/testing: `https://staging-api.self.xyz/api/verify`
- For production: `https://api.self.xyz/api/verify`
- Note: These endpoints may have rate limits or restrictions

**Option B: Set Up Your Own Backend Endpoint**
- Create a simple backend endpoint that uses Self Protocol's backend SDK
- See [Self Protocol Backend Integration](https://docs.self.xyz/backend-integration/basic-integration) for details
- Your endpoint should verify the proof and return the attestation

**To get started:**
1. Visit [Self Protocol Dashboard](https://cloud.self.xyz) or contact Self Protocol team
2. Create an application and get:
   - **Endpoint URL**: Your verification API endpoint (see options above)
   - **Scope**: Your application scope identifier
   - **App Name**: Display name for your app

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_ENDPOINT=https://staging-api.self.xyz/api/verify
NEXT_PUBLIC_SELF_APP_NAME=TrustBridge
NEXT_PUBLIC_SELF_SCOPE=trustbridge
NEXT_PUBLIC_SELF_LOGO=https://your-logo-url.com/logo.png
```

### 3. Backend Verification Setup

The backend verification configuration must match the frontend disclosures:

- **Minimum Age**: 18 (matches contract requirement)
- **Excluded Countries**: CUBA, IRAN, NORTH_KOREA, RUSSIA, SYRIA
- **Requested Attributes**: nationality, age

See the [Self Protocol Backend Integration docs](https://docs.self.xyz/backend-integration/basic-integration) for setup details.

## How It Works

### Frontend Flow

1. **User connects wallet** - Step 1
2. **QR Code Display** - Step 2
   - Self Protocol QR code is displayed
   - User scans with Self Protocol mobile app
   - App verifies identity using biometric passport/ID
3. **Verification Result** - Step 3
   - Self Protocol returns verification proof
   - Frontend processes the proof to extract:
     - DID (Decentralized Identifier)
     - VC Proof Hash
     - VC Signature
     - Age and Country
     - Expiry Date
4. **Registration Fee** - Step 4
   - User pays 10 cUSD registration fee
5. **NGO Registration** - Step 5
   - Contract registration with verified credentials

### Contract Registration

The processed Self Protocol data is used to call `registerNGO()`:

```solidity
registerNGO(
    founderDID,      // From Self Protocol
    vcProofHash,     // Hash of VC proof
    vcSignature,     // Signature from Self Protocol verifier
    founderAge,      // From Self Protocol disclosures
    founderCountry,   // ISO country code from Self Protocol
    ipfsProfile,     // IPFS hash of NGO profile
    vcExpiryDate     // Expiry date from Self Protocol
)
```

## Verification Process

1. User scans QR code with Self Protocol mobile app
2. Self Protocol app verifies passport/ID using biometrics
3. Self Protocol generates a zero-knowledge proof
4. Proof is sent to backend for verification
5. Backend verifies proof and returns attestation
6. Frontend receives verification result with DID and proof data
7. Frontend processes result and prepares for contract registration

## Important Notes

- **Scope Matching**: The `scope` in frontend config must match backend config
- **Disclosure Matching**: Frontend disclosures must exactly match backend verification config
- **Contract Address**: If using contract verification, ensure contract address is lowercase
- **DID Format**: Self Protocol generates DIDs in format `did:self:...`
- **VC Expiry**: VCs expire after 1 year and need renewal

## Testing

For testing, you can use mock passports:
- Visit [Self Protocol Tools](https://tools.self.xyz)
- Generate mock passports for testing
- Use these in the Self Protocol mobile app for testing

## Troubleshooting

### QR Code Not Appearing
- Ensure wallet is connected first
- Check that `NEXT_PUBLIC_SELF_ENDPOINT` is set correctly
- Verify Self Protocol app is initialized properly

### Verification Fails

#### `proof_generation_failed` Error
This error means Self Protocol's backend couldn't generate the proof. Common causes:

1. **Backend Not Configured**: Self Protocol's backend needs to be configured for your contract address and scope
   - Contact Self Protocol team or use their dashboard to register your contract
   - Ensure your contract address is registered with Self Protocol's backend
   - Verify the scope matches between frontend and backend

2. **Disclosures Mismatch**: Frontend disclosures must exactly match backend verification config
   - Check `minimumAge` matches (should be 18)
   - Verify `excludedCountries` list matches
   - Ensure `nationality: true` is set in backend config

3. **Contract Not Registered**: When using contract integration with `endpointType: 'staging_celo'`, the contract address must be registered with Self Protocol
   - The contract address acts as the endpoint identifier
   - Self Protocol backend needs to know about this contract to generate proofs

4. **Network Issues**: Check connectivity to Self Protocol's staging backend
   - Verify you can reach Self Protocol's API
   - Check for CORS or network restrictions

**Solution**: Contact Self Protocol support or check their dashboard to ensure:
- Your contract address (`0xdbb6bcea1e9a701ac2692550a0ae0d18bb48e899`) is registered
- Your scope (`trustbridge`) is configured
- Verification config matches your disclosures

### Other Verification Issues
- Check that disclosures match backend configuration
- Ensure user meets age and country requirements
- Verify Self Protocol endpoint is accessible

### Contract Registration Fails
- Ensure VC proof hash and signature are valid
- Check that DID hasn't been used before
- Verify VC hasn't expired
- Ensure registration fee is approved

## References

- [Self Protocol Docs](https://docs.self.xyz)
- [QRCode SDK Guide](https://docs.self.xyz/frontend-integration/qrcode-sdk)
- [Backend Integration](https://docs.self.xyz/backend-integration/basic-integration)
- [Contract Integration](https://docs.self.xyz/contract-integration/basic-integration)

