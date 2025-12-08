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
  // Contract address for reference (included in userDefinedData)
  const contractAddress = NGORegistryContract.address.toLowerCase();
  
  // Backend endpoint URL - this is where Self Protocol's relayers will POST verification requests
  // According to Self Protocol backend integration docs, endpoint should be your backend API URL
  // For staging/testing, use Self Protocol's public endpoint:
  // https://staging-api.self.xyz/api/verify
  // Or set up your own backend using SelfBackendVerifier
  const backendEndpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'https://staging-api.self.xyz/api/verify';
  
  // Scope must match what's configured in your backend SelfBackendVerifier
  // This scope is used by Self Protocol to identify which verification config to use
  const scope = process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustbridge';
  
  console.log('🔍 Self Protocol Config:', {
    endpoint: backendEndpoint,
    scope,
    contractAddress,
    endpointType: 'staging_celo',
    note: 'Endpoint should be backend API URL, scope must match backend SelfBackendVerifier config',
  });
  
  const config: any = {
    version: 2,
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
    scope: scope, // Must match backend SelfBackendVerifier scope
    endpoint: backendEndpoint, // Backend API endpoint URL (not contract address)
    logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
    userId,
    endpointType: 'staging_celo' as const, // Correct type for Celo Sepolia
    userIdType: 'hex' as const, // EVM address type
    userDefinedData: `TrustBridge NGO registration for ${userId} - Contract: ${contractAddress}`,
    disclosures: {
      // Required verifications for NGO registration
      // NOTE: These MUST match your backend SelfBackendVerifier config
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
