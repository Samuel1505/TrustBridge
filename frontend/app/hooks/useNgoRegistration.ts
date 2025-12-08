import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, erc20Abi } from 'viem';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as `0x${string}`;
const REGISTRATION_FEE = parseEther('1');

/**
 * Hook for NGO registration with Self Protocol verification
 * 
 * This hook handles:
 * 1. Checking if user is already registered
 * 2. Processing Self Protocol verification result
 * 3. Approving cUSD for registration fee
 * 4. Calling registerNGO() on the contract
 */
export function useNgoRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>();
  const [registrationHash, setRegistrationHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // Wait for approval transaction
  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalSuccess 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });
  
  // Wait for registration transaction
  const { 
    isLoading: isRegistrationConfirming, 
    isSuccess: isRegistrationSuccess 
  } = useWaitForTransactionReceipt({
    hash: registrationHash,
  });
  
  // Track approval hash from writeContract
  useEffect(() => {
    if (hash && isApproving) {
      setApprovalHash(hash);
    } else if (hash && isRegistering) {
      setRegistrationHash(hash);
    }
  }, [hash, isApproving, isRegistering]);

  // Check if user is already registered
  const { data: ngoData, refetch: refetchNgo } = useReadContract({
    address: NGORegistryContract.address as `0x${string}`,
    abi: NGORegistryContract.abi,
    functionName: 'ngoByWallet',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const isRegistered = ngoData ? (ngoData as any).isActive === true : false;

  // Check cUSD allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && isConnected ? [address, NGORegistryContract.address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const needsApproval = allowance ? allowance < REGISTRATION_FEE : true;

  /**
   * Approve cUSD for registration fee
   */
  const approveCUSD = async () => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setIsApproving(true);
    setError(null);
    setApprovalHash(undefined);

    try {
      writeContract({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [NGORegistryContract.address as `0x${string}`, REGISTRATION_FEE],
      });
      // Hash will be set via useEffect when writeContract returns it
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve cUSD');
      setIsLoading(false);
      setIsApproving(false);
    }
  };
  
  // Reset loading state when approval is successful
  useEffect(() => {
    if (isApprovalSuccess) {
      console.log('✅ cUSD approval confirmed!');
      setIsLoading(false);
      setIsApproving(false);
      // Refetch allowance to update needsApproval
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  /**
   * Register NGO with Self Protocol verification data
   */
  const registerNGO = async (
    selfProtocolResult: any,
    ipfsProfile: string
  ) => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    if (isRegistered) {
      throw new Error('You are already registered as an NGO');
    }

    setIsLoading(true);
    setIsRegistering(true);
    setError(null);
    setRegistrationHash(undefined);

    try {
      // Process Self Protocol result
      const processedData = processSelfProtocolResult(selfProtocolResult);
      if (!processedData) {
        throw new Error('Failed to process Self Protocol verification result');
      }

      // Validate the data
      if (processedData.age < 18) {
        throw new Error('Founder must be 18 or older');
      }

      if (!ipfsProfile || ipfsProfile.length === 0) {
        throw new Error('IPFS profile is required');
      }

      // Call registerNGO on the contract
      // The contract will verify the signature on-chain
      writeContract({
        address: NGORegistryContract.address as `0x${string}`,
        abi: NGORegistryContract.abi,
        functionName: 'registerNGO',
        args: [
          processedData.did,
          processedData.vcProofHash,
          processedData.vcSignature,
          processedData.age,
          processedData.country,
          ipfsProfile,
          processedData.expiryDate,
        ],
      });
      // Hash will be set via useEffect when writeContract returns it
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register NGO');
      setIsLoading(false);
      setIsRegistering(false);
    }
  };

  // Refetch NGO data after successful registration
  useEffect(() => {
    if (isRegistrationSuccess) {
      refetchNgo();
      setIsLoading(false);
      setIsRegistering(false);
    }
  }, [isRegistrationSuccess, refetchNgo]);

  return {
    registerNGO,
    approveCUSD,
    isRegistered,
    needsApproval,
    isLoading: isLoading || isPending || isApprovalConfirming || isRegistrationConfirming,
    isApprovalSuccess,
    isRegistrationSuccess,
    error,
    approvalHash,
    registrationHash,
  };
}

