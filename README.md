# TrustBridge

**Donate with Trust, Give with Transparency**

TrustBridge is a decentralized donation platform built on the Celo blockchain that connects donors with verified NGOs. Every NGO founder undergoes biometric identity verification through Self Protocol, ensuring one passport equals one NGO and preventing fraud.

## Overview

TrustBridge addresses the critical trust gap in charitable giving by:
- **Identity Verification**: All NGO founders are verified using Self Protocol's biometric passport/ID verification
- **Blockchain Transparency**: All donations are recorded on-chain using Celo blockchain
- **Direct Donations**: Donors send cUSD directly to verified NGOs with no intermediaries
- **Sybil Resistance**: One verified identity can only register one NGO
- **Community Governance**: NGOs can be challenged and revoked by the community

## Key Features

### For Donors
- Browse verified NGOs with transparent profiles
- Filter NGOs by country and category
- Make direct donations using cUSD (Celo Dollar)
- Track donation history
- View NGO statistics and impact

### For NGOs
- Register with biometric identity verification
- Create and update organization profiles (stored on IPFS)
- Receive donations directly to your wallet
- Track donation statistics and donor count
- Manage verification status and renewal

### Security & Trust
- **Self Protocol Integration**: Biometric verification using passports/national IDs
- **On-chain Verification**: VC (Verifiable Credential) signatures verified on-chain
- **Age Verification**: Founders must be 18+ years old
- **Sanctions Compliance**: Automatic exclusion of restricted countries
- **Community Challenges**: NGOs can be challenged and revoked if they receive 5+ challenges
- **Admin Oversight**: Admin can revoke NGOs for violations

## Architecture

### Smart Contracts

The platform consists of two main smart contracts deployed on Celo Sepolia testnet:

#### 1. NGORegistry (`NGORegistry.sol`)
The core registry contract that manages NGO registration and verification.

**Key Functions:**
- `registerNGO()`: Register a new NGO with Self Protocol verification data
- `updateProfile()`: Update NGO IPFS profile
- `recordDonation()`: Record donation statistics
- `challengeNGO()`: Community members can challenge NGOs
- `adminRevokeNGO()`: Admin can revoke NGOs
- `isVerified()`: Check if an NGO is verified and active
- `getAllVerifiedNGOs()`: Get list of all active NGOs
- `getNGOsByCountry()`: Filter NGOs by country

**Key Features:**
- Stores NGO data including founder DID, VC proof hash, age, country
- Tracks donation statistics (total received, donor count)
- Enforces VC expiry dates (annual renewal required)
- Prevents DID and VC proof reuse
- Registration fee (1 cUSD on testnet) to prevent spam
- Staging mode for testing with mock passports

**State Variables:**
- `ngoByWallet`: Maps wallet address to NGO struct
- `walletByDID`: Prevents DID reuse
- `usedVCProofs`: Prevents VC proof reuse
- `verifiedNGOs`: Array of all registered NGO addresses
- `challengeCount`: Tracks challenges per NGO
- `CHALLENGE_THRESHOLD`: 5 challenges trigger revocation

#### 2. DonationRouter (`DonationRouter.sol`)
Handles donation processing and tracking.

**Key Functions:**
- `donate()`: Process a donation to a verified NGO
- `getDonation()`: Get donation details by ID
- `getRecentDonations()`: Get recent donations
- `getDonationsByDonor()`: Get all donations from a donor
- `getDonationsByNGO()`: Get all donations to an NGO
- `getPlatformStats()`: Get platform-wide statistics

**Key Features:**
- Validates NGO is verified before accepting donations
- Records donation with donor, NGO, amount, message, timestamp
- Tracks totals per donor and per NGO
- Emits events for all donations
- Non-reentrant protection

### Frontend

Built with Next.js 16, React 19, and TypeScript, featuring a modern, responsive UI.

**Key Components:**
- **Hero**: Landing page with call-to-action buttons
- **Features**: Platform feature showcase
- **HowItWorks**: Step-by-step guide
- **NGOCard**: Display card for each NGO
- **DonationModal**: Modal for making donations
- **VerificationModal**: Self Protocol verification flow for NGOs
- **DonorVerificationModal**: Optional verification for donors
- **FilterSidebar**: Filter NGOs by country and category
- **NGODashboard**: Dashboard for registered NGOs

**Key Pages:**
- `/`: Homepage with featured NGOs
- `/ngo/[id]`: Individual NGO profile page
- `/ngo/dashboard`: NGO dashboard (requires registration)
- `/dashboard`: General donor dashboard
- `/donation/success`: Donation success page
- `/profile/create`: Create donor profile

**Hooks:**
- `useNgoRegistration`: Handles NGO registration flow with Self Protocol
- `useSelfProtocol`: Manages Self Protocol verification

**Configuration:**
- Wagmi for wallet connections (supports multiple wallet providers)
- Reown AppKit for wallet UI
- Self Protocol SDK for identity verification
- Contract ABIs and addresses in `/app/abi`

## Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **Hardhat**: ^3.0.17 (Development framework)
- **OpenZeppelin Contracts**: ^5.4.0 (Security libraries)
- **Viem**: ^2.41.2 (Ethereum library)
- **TypeScript**: ~5.8.0

### Frontend
- **Next.js**: 16.0.7 (React framework)
- **React**: 19.2.0
- **TypeScript**: ^5
- **Wagmi**: ^3.1.0 (React Hooks for Ethereum)
- **Viem**: ^2.41.2 (Ethereum library)
- **Reown AppKit**: ^1.8.14 (Wallet connection UI)
- **Self Protocol**: ^1.1.0-beta.7 (Identity verification)
- **Framer Motion**: ^12.23.25 (Animations)
- **Tailwind CSS**: ^4 (Styling)
- **Lucide React**: ^0.556.0 (Icons)

### Blockchain
- **Network**: Celo Sepolia Testnet (Chain ID: 11155712)
- **Token**: cUSD (Celo Dollar)
- **Explorer**: https://sepolia.celoscan.io

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Celo wallet (MetaMask, Valora, etc.) with testnet funds
- Self Protocol account and credentials (for identity verification)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TrustBridge
```

### 2. Smart Contract Setup

```bash
cd smartcontract
npm install
```

**Configure Environment Variables:**

Create a `.env` file in the `smartcontract` directory:

```env
CELO_SEPOLIA_RPC_URL=https://rpc.ankr.com/celo_sepolia
CELO_SEPOLIA_PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_optional
```

**Compile Contracts:**

```bash
npm run compile
```

**Run Tests:**

```bash
npm test
```

**Deploy Contracts:**

```bash
# Deploy to local Hardhat network
npm run deploy:local

# Deploy to Celo Sepolia
npm run deploy:celo-sepolia
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Configure Environment Variables:**

Create a `.env.local` file in the `frontend` directory:

```env
# Wallet Connection (Reown/WalletConnect)
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id

# Self Protocol Configuration
NEXT_PUBLIC_SELF_ENDPOINT=https://staging-api.self.xyz/api/verify
NEXT_PUBLIC_SELF_APP_NAME=TrustBridge
NEXT_PUBLIC_SELF_SCOPE=trustbridge
NEXT_PUBLIC_SELF_LOGO=https://your-logo-url.com/logo.png
```

**Get WalletConnect Project ID:**
1. Visit https://cloud.reown.com
2. Create a new project
3. Copy the Project ID to your `.env.local`

**Get Self Protocol Credentials:**
1. Visit https://cloud.self.xyz or contact Self Protocol team
2. Create an application
3. Get your endpoint URL, scope, and app name
4. See `frontend/SELF_PROTOCOL_SETUP.md` for detailed setup

**Update Contract Addresses:**

Update contract addresses in `frontend/app/abi/index.tsx` if you deployed new contracts:

```typescript
export const NGORegistryContract = {
    abi: NGORegistry,
    address: "0xYourNGORegistryAddress"
}

export const DonationRouterContract = {
    abi: DonationRouter,
    address: "0xYourDonationRouterAddress"
}
```

**Run Development Server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract Details

### NGORegistry Contract

**Deployed Address (Celo Sepolia):** `0x8AE49C5d7c0718467Eae6492BE15222EA67a589A`

**Constructor Parameters:**
- `_selfProtocolVerifier`: Address of Self Protocol verifier (0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74)
- `_cUSD`: cUSD token address (0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b)
- `_feeCollector`: Address to receive registration fees
- `_registrationFee`: Registration fee in cUSD (1 cUSD on testnet)
- `_stagingMode`: Enable staging mode for testing (true on testnet)

**Registration Flow:**
1. User completes Self Protocol verification (biometric passport/ID scan)
2. Frontend receives verification result with DID, VC proof hash, signature, age, country
3. User approves cUSD for registration fee
4. Frontend calls `registerNGO()` with verification data
5. Contract verifies VC signature (skipped in staging mode)
6. Contract checks age (18+), country restrictions, DID/VC uniqueness
7. Contract collects registration fee
8. NGO is registered and added to verified list

**Verification Requirements:**
- Founder must be 18+ years old
- Founder country must not be in sanctions list
- DID must not be used before
- VC proof hash must not be used before
- VC must not be expired
- Registration fee must be paid

**VC Expiry:**
- VCs expire after 1 year
- NGOs must renew verification before expiry
- Expired NGOs cannot receive donations

### DonationRouter Contract

**Deployed Address (Celo Sepolia):** `0x991F9bd25201504c3988454B32fA9Fa1a8535fBC`

**Constructor Parameters:**
- `_cUSD`: cUSD token address
- `_registry`: NGORegistry contract address

**Donation Flow:**
1. Donor connects wallet
2. Donor selects NGO and enters amount
3. Donor approves cUSD (if needed)
4. Frontend calls `donate()` with NGO address, amount, and message
5. Contract verifies NGO is active and not expired
6. Contract transfers cUSD from donor to NGO
7. Contract records donation and updates statistics
8. Contract calls `registry.recordDonation()` to update NGO stats

## Frontend Features

### User Flows

**NGO Registration:**
1. Click "Register as NGO" on homepage
2. Connect wallet
3. Complete Self Protocol verification (scan QR code with Self Protocol app)
4. Verify passport/ID with biometrics
5. Approve cUSD for registration fee
6. Submit registration
7. Access NGO dashboard

**Making a Donation:**
1. Browse NGOs on homepage
2. Click on an NGO card
3. Click "Donate" button
4. Enter donation amount and optional message
5. Approve cUSD (if needed)
6. Confirm donation
7. View success page with transaction hash

**NGO Dashboard:**
- View registration status and expiry date
- Track total donations received
- View donor count
- Access public profile
- Update IPFS profile
- Renew verification if expired

### Self Protocol Integration

The frontend integrates with Self Protocol for identity verification:

1. **QR Code Display**: Shows QR code for Self Protocol mobile app
2. **Verification Flow**: User scans QR code and verifies identity
3. **Result Processing**: Extracts DID, VC proof hash, signature, age, country
4. **Contract Registration**: Uses processed data to register NGO

See `frontend/SELF_PROTOCOL_SETUP.md` for detailed integration guide.

## Testing

### Smart Contract Tests

```bash
cd smartcontract
npm test
```

Tests cover:
- NGO registration with valid/invalid data
- VC signature verification
- Registration fee collection
- DID and VC proof uniqueness
- Age and country validation
- Donation recording
- Community challenges
- Admin functions

### Frontend Testing

Manual testing recommended:
1. Test wallet connection
2. Test NGO registration flow
3. Test donation flow
4. Test NGO dashboard
5. Test filtering and search

## Deployment

### Smart Contracts

**Deploy to Celo Sepolia:**

```bash
cd smartcontract
npm run deploy:celo-sepolia
```

**Verify Contracts:**

```bash
npx hardhat verify --network celoSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Frontend

**Build for Production:**

```bash
cd frontend
npm run build
```

**Deploy to Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Contract Addresses

### Celo Sepolia Testnet

**NGORegistry:**
- Address: `0x8AE49C5d7c0718467Eae6492BE15222EA67a589A`
- Explorer: https://sepolia.celoscan.io/address/0x8AE49C5d7c0718467Eae6492BE15222EA67a589A
- Verified: Sourcify

**DonationRouter:**
- Address: `0x991F9bd25201504c3988454B32fA9Fa1a8535fBC`
- Explorer: https://sepolia.celoscan.io/address/0x991F9bd25201504c3988454B32fA9Fa1a8535fBC
- Verified: Sourcify

**Deployment Parameters:**
- Self Protocol Verifier: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- cUSD Token: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`
- Fee Collector: `0x34C775FB2fe2b8383B5659B3f7Fc1E721Ca04A3a`
- Registration Fee: 1 cUSD
- Staging Mode: `true`

See `smartcontract/DEPLOYED_ADDRESSES.md` for more details.

## Security Features

- **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
- **Signature Verification**: VC signatures verified on-chain
- **Input Validation**: All inputs validated before processing
- **Access Control**: Admin-only functions protected
- **Sybil Resistance**: One DID = One NGO
- **VC Reuse Prevention**: VC proofs can only be used once
- **Expiry Checks**: VCs must be valid and not expired
- **OpenZeppelin**: Uses battle-tested security libraries

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity style guide for smart contracts
- Use TypeScript for all frontend code
- Write tests for new features
- Update documentation as needed
- Follow existing code style and patterns

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Celo Foundation**: For the Celo blockchain infrastructure
- **Self Protocol**: For identity verification technology
- **OpenZeppelin**: For security libraries
- **Reown (WalletConnect)**: For wallet connection infrastructure

## Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check documentation in `smartcontract/README.md` and `frontend/SELF_PROTOCOL_SETUP.md`

## Future Roadmap

- [ ] Multi-token support (beyond cUSD)
- [ ] IPFS profile builder UI
- [ ] Donor verification badges
- [ ] Impact reporting system
- [ ] Mobile app
- [ ] Governance token
- [ ] Staking mechanism
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support

---

**Built for transparent and trustworthy charitable giving**
