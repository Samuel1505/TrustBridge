/**
 * Error decoder utility using ethers.js for better error handling
 * This provides a fallback when wagmi/viem can't decode contract errors
 */

import { Contract } from 'ethers';
import { NGORegistryContract } from '../abi';

/**
 * Decode contract error using ethers.js
 * This is more reliable than viem for some RPC providers
 */
export async function decodeContractError(
  error: any,
  contractAddress: string,
  provider: any
): Promise<{ errorName: string; errorMessage: string } | null> {
  try {
    // Check if error has data
    const errorData = error?.data || error?.cause?.data || error?.error?.data;
    if (!errorData) {
      return null;
    }

    // Create ethers contract instance
    const contract = new Contract(
      contractAddress,
      NGORegistryContract.abi,
      provider
    );

    // Try to parse the error
    try {
      // Get the error selector (first 4 bytes)
      const errorSelector = errorData.slice(0, 10); // 0x + 4 bytes = 10 chars
      
      // Try to find the error in the ABI
      const errorFragment = contract.interface.getError(errorSelector);
      if (errorFragment) {
        const decoded = contract.interface.parseError(errorData);
        if (!decoded) {
          return {
            errorName: 'UnknownError',
            errorMessage: 'Unknown contract error',
          };
        }
        return {
          errorName: decoded.name,
          errorMessage: decoded.args?.toString() || decoded.name,
        };
      }
    } catch (parseError) {
      // If parsing fails, try to decode as a require/revert message
      try {
        // Some errors are just revert strings
        const reason = contract.interface.parseError(errorData);
        if (!reason) {
          return {
            errorName: 'UnknownError',
            errorMessage: 'Unknown contract error',
          };
        }
        return {
          errorName: reason.name,
          errorMessage: reason.args?.toString() || reason.name,
        };
      } catch (e) {
        // Could not decode
        return null;
      }
    }
  } catch (err) {
    console.error('Error decoding with ethers:', err);
    return null;
  }

  return null;
}

/**
 * Get user-friendly error message from contract error
 */
export function getErrorMessage(errorName: string): string {
  const errorMessages: Record<string, string> = {
    'ERC20InsufficientAllowance': 'Insufficient cUSD allowance. Please approve cUSD spending first.',
    'ERC20InsufficientBalance': 'Insufficient cUSD balance. You need at least 1 cUSD to register.',
    'ECDSAInvalidSignature': 'Invalid VC signature. This should not happen in staging mode.',
    'Already registered': 'You are already registered as an NGO.',
    'DID already used': 'This identity has already been used to register an NGO.',
    'VC already used': 'This verification credential has already been used.',
    'VC expired': 'Your verification credential has expired. Please verify again.',
    'Registration fee payment failed': 'Registration fee payment failed. Please ensure you have at least 1 cUSD and have approved the spending.',
    'Invalid VC signature': 'Invalid verification signature. Please verify your identity again.',
    'Founder must be 18+': 'Founder must be 18 or older.',
    'Invalid DID': 'Invalid DID provided.',
    'Invalid profile': 'Invalid IPFS profile provided.',
    'Invalid country code': 'Invalid country code provided.',
  };

  return errorMessages[errorName] || `Contract error: ${errorName}`;
}

