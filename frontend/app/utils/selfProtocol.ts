import { keccak256, stringToBytes } from 'viem';

/**
 * Process Self Protocol verification result for contract registration
 * 
 * The contract requires:
 * - founderDID: string (Self Protocol DID)
 * - vcProofHash: bytes32 (Hash of the VC proof)
 * - vcSignature: bytes (Signature from Self Protocol verifier)
 * - founderAge: uint8
 * - founderCountry: string (ISO country code)
 * - ipfsProfile: string
 * - vcExpiryDate: uint256
 */

export interface SelfProtocolData {
  did: string;
  vcProofHash: `0x${string}`;
  vcSignature: `0x${string}`;
  age: number;
  country: string;
  expiryDate: bigint;
}

/**
 * Extract data from Self Protocol verification result
 * 
 * Note: The actual implementation depends on the Self Protocol API response structure.
 * This is a placeholder that needs to be adapted based on the actual response format.
 */
export function processSelfProtocolResult(result: any): SelfProtocolData | null {
  try {
    // Extract DID from the result
    // The actual structure may vary - adjust based on Self Protocol API response
    const did = result?.did || result?.data?.did || `did:self:${result?.userId || 'unknown'}`;
    
    // Extract age and country from disclosures
    const disclosures = result?.disclosures || result?.data?.disclosures || {};
    const age = disclosures?.age || disclosures?.minimumAge || 18;
    const country = disclosures?.nationality || disclosures?.country || 'US';
    
    // Create VC proof hash from the proof data
    // The proof structure depends on Self Protocol's response format
    const proofData = result?.proof || result?.data?.proof || result?.attestation || '';
    const proofString = typeof proofData === 'string' ? proofData : JSON.stringify(proofData);
    const vcProofHash = keccak256(stringToBytes(proofString));
    
    // Extract signature from the proof
    // This needs to be obtained from Self Protocol's verification response
    // The signature is typically in the proof or attestation object
    const signature = result?.signature || result?.data?.signature || result?.proof?.signature || '0x';
    
    // Calculate expiry date (typically 1 year from verification)
    const expiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    
    return {
      did,
      vcProofHash,
      vcSignature: signature as `0x${string}`,
      age: Math.floor(age),
      country: country.substring(0, 2).toUpperCase(), // ISO 2-letter code
      expiryDate,
    };
  } catch (error) {
    console.error('Failed to process Self Protocol result:', error);
    return null;
  }
}

/**
 * Validate Self Protocol data before contract registration
 */
export function validateSelfProtocolData(data: SelfProtocolData): { valid: boolean; error?: string } {
  if (!data.did || data.did.length === 0) {
    return { valid: false, error: 'DID is required' };
  }
  
  if (!data.vcProofHash || data.vcProofHash.length !== 66) {
    return { valid: false, error: 'Invalid VC proof hash' };
  }
  
  if (!data.vcSignature || data.vcSignature.length < 130) {
    return { valid: false, error: 'Invalid VC signature' };
  }
  
  if (data.age < 18) {
    return { valid: false, error: 'Founder must be 18 or older' };
  }
  
  if (!data.country || data.country.length !== 2) {
    return { valid: false, error: 'Invalid country code' };
  }
  
  if (data.expiryDate <= BigInt(Math.floor(Date.now() / 1000))) {
    return { valid: false, error: 'VC expiry date must be in the future' };
  }
  
  return { valid: true };
}

