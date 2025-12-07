#!/bin/bash

# Deployment script that reads from .env and passes parameters to Hardhat Ignition
# Usage: ./scripts/deploy-with-params.sh [network]

set -e

# Load environment variables
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create a .env file with the required variables"
    exit 1
fi

source .env

# Validate required variables
if [ -z "$SELF_PROTOCOL_VERIFIER" ] || [ -z "$CUSD_ADDRESS" ] || [ -z "$FEE_COLLECTOR" ]; then
    echo "Error: Missing required environment variables"
    echo "Required: SELF_PROTOCOL_VERIFIER, CUSD_ADDRESS, FEE_COLLECTOR"
    exit 1
fi

# Convert registration fee to wei (18 decimals)
REGISTRATION_FEE_WEI=$(node -e "const {parseEther} = require('viem'); console.log(parseEther('${REGISTRATION_FEE:-10}').toString())")

# Build parameters JSON
PARAMS=$(cat <<EOF
{
  "TrustBridgeModule": {
    "selfProtocolVerifier": "$SELF_PROTOCOL_VERIFIER",
    "cUSD": "$CUSD_ADDRESS",
    "feeCollector": "$FEE_COLLECTOR",
    "registrationFee": "$REGISTRATION_FEE_WEI"
  }
}
EOF
)

# Determine network
NETWORK=${1:-""}
NETWORK_FLAG=""
if [ -n "$NETWORK" ]; then
    NETWORK_FLAG="--network $NETWORK"
fi

echo "🚀 Deploying TrustBridge..."
echo "📋 Parameters:"
echo "   Self Protocol Verifier: $SELF_PROTOCOL_VERIFIER"
echo "   cUSD Address: $CUSD_ADDRESS"
echo "   Fee Collector: $FEE_COLLECTOR"
echo "   Registration Fee: ${REGISTRATION_FEE:-10} cUSD ($REGISTRATION_FEE_WEI wei)"
if [ -n "$NETWORK" ]; then
    echo "   Network: $NETWORK"
fi
echo ""

# Deploy
npx hardhat ignition deploy ignition/modules/TrustBridge.ts $NETWORK_FLAG --parameters "$PARAMS"

