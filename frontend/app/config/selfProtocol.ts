import { SelfAppBuilder } from '@selfxyz/qrcode';
import { countries } from '@selfxyz/qrcode';
import type { SelfApp } from '@selfxyz/qrcode';

/**
 * Self Protocol Configuration for TrustBridge
 * 
 * This configuration is used for NGO identity verification.
 * The disclosures must match the backend verification configuration.
 * 
 * Reference: https://docs.self.xyz/frontend-integration/qrcode-sdk
 */

export interface SelfProtocolConfig {
  appName: string;
  scope: string;
  endpoint: string;
  logoBase64?: string;
}

/**
 * Get Self Protocol configuration from environment variables
 */
export function getSelfProtocolConfig(): SelfProtocolConfig {
  return {
    appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
    scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustbridge',
    endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || '',
    logoBase64: process.env.NEXT_PUBLIC_SELF_LOGO,
  };
}

/**
 * Create a SelfApp instance for NGO verification
 * 
 * @param userId - The user's Ethereum address (hex format)
 * @param userDefinedData - Optional data to pass to Self Protocol
 * @returns SelfApp instance
 */
export function createSelfApp(
  userId: string,
  userDefinedData?: string
): SelfApp {
  const config = getSelfProtocolConfig();

  if (!config.endpoint) {
    throw new Error('NEXT_PUBLIC_SELF_ENDPOINT environment variable is required');
  }

  const app = new SelfAppBuilder({
    version: 2,
    appName: config.appName,
    scope: config.scope,
    endpoint: config.endpoint,
    logoBase64: config.logoBase64 || 'https://i.postimg.cc/mrmVf9hm/self.png',
    userId,
    endpointType: 'staging_celo', // Use 'mainnet_celo' for production
    userIdType: 'hex', // 'hex' for EVM address
    userDefinedData: userDefinedData || 'TrustBridge NGO Registration',
    disclosures: {
      // Minimum age requirement (must be 18+ per contract)
      minimumAge: 18,
      
      // Excluded countries (sanctions compliance)
      excludedCountries: [
        countries.CUBA,
        countries.IRAN,
        countries.NORTH_KOREA,
        countries.RUSSIA,
        countries.SYRIA,
      ],
      
      // Request nationality and age verification
      nationality: true,
      gender: false, // Not required for NGO registration
    },
  }).build();

  return app;
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
  };
  error?: string;
}

