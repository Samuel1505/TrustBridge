/**
 * Self Protocol Configuration
 * 
 * Self Protocol provides privacy-preserving identity verification using zero-knowledge proofs.
 * Learn more: https://docs.self.id
 */

import { countries } from '@selfxyz/qrcode';
import { NGORegistryContract } from '../abi';

// Self Protocol Verifier address from deployed contract
// This is the Identity Verification Hub (IVH) contract address on Celo Sepolia
export const SELF_PROTOCOL_VERIFIER = '0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74';

/**
 * Create Self Protocol app configuration
 * 
 * According to Self Protocol docs:
 * - endpoint must be the contract address in lowercase
 * - For contract integration, endpoint should be your SelfVerificationRoot contract
 * - Frontend disclosure config must match contract verification config
 * 
 * @see https://docs.self.xyz/contract-integration/basic-integration
 * @see https://docs.self.xyz/frontend-integration/qrcode-sdk
 */
export function createSelfAppConfig(userId: string) {
  // Contract address MUST be lowercase according to docs
  const contractAddress = NGORegistryContract.address.toLowerCase();
  
  // Self Protocol backend endpoint (required for proof generation)
  // For staging_celo, Self Protocol uses this to generate proofs
  // If not set, Self Protocol may use default staging endpoint
  const backendEndpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT;
  
  console.log('🔍 Self Protocol Config:', {
    contractAddress,
    backendEndpoint: backendEndpoint || 'Using default staging endpoint',
    endpointType: 'staging_celo',
  });
  
  const config: any = {
    version: 2,
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
    scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustbridge',
    endpoint: contractAddress, // Contract address MUST be lowercase for staging_celo
    logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
    userId,
    endpointType: 'staging_celo' as const, // Correct type for Celo Sepolia
    userIdType: 'hex' as const, // EVM address type
    userDefinedData: `TrustBridge NGO registration for ${userId}`,
    disclosures: {
      // Required verifications for NGO registration
      // NOTE: These MUST match your contract's verification config
      minimumAge: 18,
      excludedCountries: [
        countries.CUBA,
        countries.IRAN,
        countries.NORTH_KOREA,
        countries.RUSSIA,
        countries.SYRIA,
      ],
      // Request nationality for country verification
      nationality: true,
    },
  };
  
  // Add backend endpoint if provided (some Self Protocol setups require this)
  if (backendEndpoint) {
    config.backendEndpoint = backendEndpoint;
  }
  
  return config;
}

/**
 * Self Protocol verification result
 */
export interface SelfVerificationResult {
  success: boolean;
  data?: {
    userId: string;
    did?: string;
    age?: number;
    country?: string;
    proof?: any;
    attestation?: any;
    signature?: string;
  };
  error?: string;
}
