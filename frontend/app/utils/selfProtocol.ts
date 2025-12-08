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
 * Extract data from Self Protocol verification result for direct contract integration
 * 
 * The Self Protocol SDK provides a proof/attestation that contains:
 * - The proof data (used to create vcProofHash)
 * - The signature from Self Protocol IVH contract (vcSignature)
 * - User attributes (age, country, DID)
 * 
 * This function extracts all required data to call registerNGO() directly.
 */
export function processSelfProtocolResult(result: any): SelfProtocolData | null {
  try {
    console.log('Processing Self Protocol result:', result);
    console.log('Full result structure:', JSON.stringify(result, null, 2));
    
    // Handle case where result is undefined or null (common with mock passport in staging)
    if (!result || result === undefined || result === null) {
      console.warn('⚠️ Self Protocol result is undefined - this is common with mock passport in staging mode');
      console.warn('⚠️ Generating mock proof data for testing purposes');
      console.warn('⚠️ IMPORTANT: The contract will reject registration because signature verification will fail');
      console.warn('⚠️ For testing, you may need to modify the contract to skip signature verification in staging');
      
      // Generate mock data for testing with mock passport
      // Note: This will NOT work with the current contract because signature verification will fail
      const mockDid = `did:self:mock:${Date.now()}`;
      const mockProofString = JSON.stringify({ did: mockDid, timestamp: Date.now(), mock: true });
      const mockVcProofHash = keccak256(stringToBytes(mockProofString));
      
      // For staging/mock mode, we'll use a placeholder signature
      // WARNING: This will cause contract registration to fail because the signature is invalid
      // The contract's _verifyVCSignature will return false
      const mockSignature = '0x' + '0'.repeat(130); // Placeholder signature (will fail verification)
      
      return {
        did: mockDid,
        vcProofHash: mockVcProofHash,
        vcSignature: mockSignature as `0x${string}`,
        age: 25, // Default age for testing
        country: 'US', // Default country for testing
        expiryDate: BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n, // 1 year from now
      };
    }
    
    // Extract DID - Self Protocol provides this in the proof
    const did = result?.did 
      || result?.data?.did 
      || result?.proof?.did
      || result?.attestation?.did
      || result?.userId
      || result?.data?.userId
      || `did:self:${result?.userId || result?.data?.userId || 'unknown'}`;
    
    // Extract age and country from disclosures or proof
    const disclosures = result?.disclosures 
      || result?.data?.disclosures 
      || result?.proof?.disclosures
      || result?.attestation?.disclosures
      || {};
    
    // Age can be in disclosures or calculated from birthDate
    let age = disclosures?.age 
      || disclosures?.calculatedAge
      || 18; // Default fallback
    
    // If we have birthDate, calculate age
    if (disclosures?.birthDate && !age) {
      const birthYear = new Date(disclosures.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }
    
    // Country from nationality or country field
    const country = disclosures?.nationality 
      || disclosures?.country
      || disclosures?.countryCode
      || 'US';
    
    // Get the proof/attestation data
    const proof = result?.proof 
      || result?.data?.proof 
      || result?.attestation
      || result?.data?.attestation
      || result;
    
    // Create VC proof hash from the proof
    // Hash the entire proof object (excluding signature)
    const proofForHash = { ...proof };
    delete proofForHash.signature;
    delete proofForHash.sig;
    const proofString = JSON.stringify(proofForHash);
    const vcProofHash = keccak256(stringToBytes(proofString));
    
    // Extract signature from the proof
    // Self Protocol IVH contract signs the proof hash
    // The signature should be in the proof object
    let signature = proof?.signature 
      || proof?.sig
      || result?.signature
      || result?.data?.signature
      || result?.attestation?.signature;
    
    // If no signature found (common with mock passport in staging), use placeholder
    if (!signature || signature === '0x') {
      console.warn('⚠️ No signature found in Self Protocol result - using placeholder for staging/mock mode');
      console.warn('⚠️ This is expected when using mock passport in staging');
      signature = '0x' + '0'.repeat(130); // Placeholder signature for testing
    }
    
    // Ensure signature is properly formatted
    let vcSignature = signature;
    if (typeof vcSignature === 'string' && !vcSignature.startsWith('0x')) {
      vcSignature = `0x${vcSignature}`;
    }
    
    // Extract expiry date from proof or calculate (typically 1 year from verification)
    let expiryDate: bigint;
    if (proof?.expiryDate || proof?.expiresAt) {
      const expiry = proof.expiryDate || proof.expiresAt;
      expiryDate = typeof expiry === 'number' 
        ? BigInt(expiry) 
        : BigInt(Math.floor(new Date(expiry).getTime() / 1000));
    } else {
      // Default: 1 year from now
      expiryDate = BigInt(Math.floor(Date.now() / 1000)) + 365n * 24n * 60n * 60n;
    }
    
    return {
      did,
      vcProofHash,
      vcSignature: vcSignature as `0x${string}`,
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

