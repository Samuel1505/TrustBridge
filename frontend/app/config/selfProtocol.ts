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
  // Contract address MUST be lowercase for staging_celo endpoint type
  // For contract integration with endpointType: 'staging_celo', the endpoint should be the contract address
  // Self Protocol uses this to route to the correct backend verification config
  const contractAddress = NGORegistryContract.address.toLowerCase();
  
  // Scope must match what's configured in Self Protocol's backend
  // This scope is used by Self Protocol to identify which verification config to use
  // Using 'attestify' scope which is already registered with Self Protocol (matches working Attestify implementation)
  const scope = process.env.NEXT_PUBLIC_SELF_SCOPE || 'attestify';
  
  // For contract integration, endpoint is the contract address
  // Self Protocol's backend will use this contract address + scope to find the verification config
  // If you have a custom backend endpoint, you can override with NEXT_PUBLIC_SELF_ENDPOINT
  const endpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT || contractAddress;
  
  console.log('🔍 Self Protocol Config:', {
    endpoint,
    scope,
    contractAddress,
    endpointType: 'staging_celo',
    usingCustomEndpoint: !!process.env.NEXT_PUBLIC_SELF_ENDPOINT,
    note: 'For contract integration, endpoint is contract address. Scope must match backend config.',
  });
  
  const config: any = {
    version: 2,
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
    scope: scope, // Must match backend configuration
    endpoint: endpoint, // Contract address (lowercase) for staging_celo contract integration
    logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
    userId,
    endpointType: 'staging_celo' as const, // Correct type for Celo Sepolia
    userIdType: 'hex' as const, // EVM address type
    userDefinedData: `TrustBridge NGO registration for ${userId}`,
    disclosures: {
      // Required verifications for NGO registration
      // NOTE: These MUST match your backend verification config
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
