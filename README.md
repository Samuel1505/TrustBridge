# TrustBridge

A decentralized platform for verified NGO donations on the Celo blockchain, powered by Self Protocol for identity verification.

## 🌟 Features

- **Identity Verification**: NGOs are verified using Self Protocol biometric passport verification
- **Transparent Donations**: All donations are recorded on-chain with full transparency
- **Direct Transfers**: Donations go directly to NGO wallets in cUSD
- **Sybil Resistance**: Each identity can only register once, preventing duplicate registrations
- **Sanctions Compliance**: Built-in checks for excluded countries and age verification

## 🏗️ Architecture

### Smart Contracts

- **NGORegistry**: Manages NGO registration and verification using Self Protocol
- **DonationRouter**: Handles donation routing and tracking

### Frontend

- **Next.js 14**: React framework with App Router
- **Wagmi + Reown AppKit**: Web3 wallet integration
- **Self Protocol SDK**: Identity verification integration
- **Ethers.js**: Blockchain interactions

## 📋 Prerequisites

- Node.js 18+ and npm
- A Celo wallet (Valora, MetaMask, etc.)
- For NGO registration: Biometric passport or national ID

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TrustBridge
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install smart contract dependencies
cd ../smartcontract
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL=https://sepolia-forno.celo.org
```

### 4. Run the Development Server

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📝 Smart Contract Deployment

See [smartcontract/README.md](./smartcontract/README.md) for deployment instructions.

### Deployed Contracts (Celo Sepolia)

- **NGORegistry**: `0x8AE49C5d7c0718467Eae6492BE15222EA67a589A`
- **DonationRouter**: `0x991F9bd25201504c3988454B32fA9Fa1a8535fBC`

See [smartcontract/DEPLOYED_ADDRESSES.md](./smartcontract/DEPLOYED_ADDRESSES.md) for full details.

## 🔐 Self Protocol Setup

TrustBridge uses Self Protocol for identity verification. See [frontend/SELF_PROTOCOL_SETUP.md](./frontend/SELF_PROTOCOL_SETUP.md) for setup instructions.

**Important**: The scope `trustbridge` must be registered with Self Protocol's backend for verification to work.

## 🧪 Testing

### Smart Contracts

```bash
cd smartcontract
npx hardhat test
```

### Frontend

```bash
cd frontend
npm run dev
```

## 📚 Documentation

- [Smart Contract README](./smartcontract/README.md)
- [Self Protocol Setup](./frontend/SELF_PROTOCOL_SETUP.md)
- [Self Protocol Troubleshooting](./frontend/SELF_PROTOCOL_TROUBLESHOOTING.md)
- [Deployed Addresses](./smartcontract/DEPLOYED_ADDRESSES.md)

## 🛠️ Tech Stack

- **Blockchain**: Celo (Sepolia testnet)
- **Smart Contracts**: Solidity ^0.8.20, Hardhat
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Web3**: Wagmi, Reown AppKit, Ethers.js
- **Identity**: Self Protocol

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
