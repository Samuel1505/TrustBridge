#!/bin/bash

# Deployment script that reads from .env and passes parameters to Hardhat Ignition
# Usage: ./scripts/deploy-with-params.sh [network]
# Network defaults will be used if env vars are not set

set -e

# Network-specific defaults
get_network_default() {
    local network=$1
    local key=$2
    
    case "$network" in
        celoSepolia|celo-sepolia)
            case "$key" in
                SELF_PROTOCOL_VERIFIER) echo "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74" ;;
                CUSD_ADDRESS) echo "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b" ;;
            esac
            ;;
        alfajores)
            case "$key" in
                SELF_PROTOCOL_VERIFIER) echo "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74" ;;
                CUSD_ADDRESS) echo "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" ;;
            esac
            ;;
    esac
}

# Load environment variables if .env exists
if [ -f .env ]; then
    source .env
fi

# Determine network
NETWORK=${1:-""}
NETWORK_FLAG=""
if [ -n "$NETWORK" ]; then
    NETWORK_FLAG="--network $NETWORK"
    # Use network defaults if env vars not set
    if [ -z "$SELF_PROTOCOL_VERIFIER" ]; then
        SELF_PROTOCOL_VERIFIER=$(get_network_default "$NETWORK" "SELF_PROTOCOL_VERIFIER")
        echo "⚠️  Using network default for SELF_PROTOCOL_VERIFIER: $SELF_PROTOCOL_VERIFIER"
    fi
    if [ -z "$CUSD_ADDRESS" ]; then
        CUSD_ADDRESS=$(get_network_default "$NETWORK" "CUSD_ADDRESS")
        echo "⚠️  Using network default for CUSD_ADDRESS: $CUSD_ADDRESS"
    fi
fi

# Validate required variables
if [ -z "$SELF_PROTOCOL_VERIFIER" ] || [ -z "$CUSD_ADDRESS" ] || [ -z "$FEE_COLLECTOR" ]; then
    echo "Error: Missing required environment variables"
    echo "Required: FEE_COLLECTOR (and optionally SELF_PROTOCOL_VERIFIER, CUSD_ADDRESS)"
    if [ -n "$NETWORK" ]; then
        echo "Network defaults available for: celoSepolia, alfajores"
    fi
    exit 1
fi

# Convert registration fee to wei (18 decimals)
REGISTRATION_FEE_WEI=$(node -e "const {parseEther} = require('viem'); console.log(parseEther('${REGISTRATION_FEE:-1}').toString())")

# Build parameters JSON
# Note: registrationFee should be passed as a string (not a number) to preserve precision
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
echo "   Registration Fee: ${REGISTRATION_FEE:-1} cUSD ($REGISTRATION_FEE_WEI wei)"
if [ -n "$NETWORK" ]; then
    echo "   Network: $NETWORK"
fi
echo ""

# Deploy
npx hardhat ignition deploy ignition/modules/TrustBridge.ts $NETWORK_FLAG --parameters "$PARAMS"

