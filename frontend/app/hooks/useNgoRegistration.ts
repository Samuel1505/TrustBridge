import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, erc20Abi } from 'viem';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as `0x${string}`;
const REGISTRATION_FEE = parseEther('10');

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
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

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
  const { data: allowance } = useReadContract({
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
    setError(null);

    try {
      writeContract({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [NGORegistryContract.address as `0x${string}`, REGISTRATION_FEE],
      });
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve cUSD');
      setIsLoading(false);
    }
  };

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
    setError(null);

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
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register NGO');
      setIsLoading(false);
    }
  };

  // Refetch NGO data after successful registration
  useEffect(() => {
    if (isSuccess) {
      refetchNgo();
      setIsLoading(false);
    }
  }, [isSuccess, refetchNgo]);

  return {
    registerNGO,
    approveCUSD,
    isRegistered,
    needsApproval,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

