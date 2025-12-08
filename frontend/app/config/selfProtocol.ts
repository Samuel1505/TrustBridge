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
 */
export function createSelfAppConfig(userId: string) {
  return {
    version: 2,
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
    scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustbridge',
    endpoint: NGORegistryContract.address, // Contract address for staging_celo
    logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
    userId,
    endpointType: 'staging_celo' as const, // Correct type for Celo Sepolia
    userIdType: 'hex' as const, // EVM address type
    userDefinedData: `TrustBridge NGO registration for ${userId}`,
    disclosures: {
      // Required verifications for NGO registration
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
