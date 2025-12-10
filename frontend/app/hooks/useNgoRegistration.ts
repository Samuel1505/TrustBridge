import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, erc20Abi, decodeErrorResult, simulateContract } from 'viem';
import { BrowserProvider } from 'ethers';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { decodeContractError, getErrorMessage } from '../utils/errorDecoder';

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
  const publicClient = usePublicClient();
  
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
    isSuccess: isRegistrationSuccess,
    isError: isRegistrationError,
    error: registrationError
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

  // Check cUSD balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address && isConnected ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const hasEnoughBalance = balance ? balance >= REGISTRATION_FEE : false;

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

    // Check balance before attempting registration
    if (!hasEnoughBalance) {
      throw new Error('Insufficient cUSD balance. You need at least 1 cUSD to register.');
    }

    // Check allowance
    if (needsApproval) {
      throw new Error('Please approve cUSD spending first. You need to approve 1 cUSD for the registration fee.');
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

      // Log the data being sent for debugging
      console.log('📤 Calling registerNGO with data:', {
        did: processedData.did,
        vcProofHash: processedData.vcProofHash,
        vcSignature: processedData.vcSignature,
        age: processedData.age,
        country: processedData.country,
        ipfsProfile,
        expiryDate: processedData.expiryDate.toString(),
      });

      // Simulate the contract call first to get the actual revert reason
      if (publicClient && address) {
        try {
          console.log('🔍 Simulating contract call to check for errors...');
          await simulateContract(publicClient, {
            account: address,
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
          console.log('✅ Simulation passed - transaction should succeed');
        } catch (simError: any) {
          console.error('❌ Simulation failed:', simError);
          // Try to decode the error
          let errorMsg = 'Transaction will fail';
          try {
            const errorData = simError.data || simError.cause?.data;
            if (errorData) {
              const decoded = decodeErrorResult({
                abi: NGORegistryContract.abi,
                data: errorData,
              });
              console.log('Decoded simulation error:', decoded);
              errorMsg = `Transaction will fail: ${decoded.errorName}`;
              
              // Map to user-friendly messages
              if (decoded.errorName === 'ERC20InsufficientAllowance') {
                errorMsg = 'Insufficient cUSD allowance. Please approve cUSD spending first.';
              } else if (decoded.errorName === 'ERC20InsufficientBalance') {
                errorMsg = 'Insufficient cUSD balance. You need at least 1 cUSD to register.';
              } else if (decoded.errorName === 'ECDSAInvalidSignature') {
                errorMsg = 'Invalid VC signature. This should not happen in staging mode.';
              }
            } else if (simError.message) {
              errorMsg = simError.message;
            }
          } catch (e) {
            console.log('Could not decode simulation error:', e);
            errorMsg = simError.message || 'Transaction simulation failed';
          }
          throw new Error(errorMsg);
        }
      }

      // Call registerNGO on the contract
      // The contract will verify the signature on-chain (or skip in staging mode)
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
      console.error('Error details:', {
        message: err.message,
        cause: err.cause,
        data: err.data,
        shortMessage: err.shortMessage,
      });
      
      // Try to decode error if it has data
      let errorMsg = err.message || 'Failed to register NGO';
      try {
        if (err.data) {
          const decoded = decodeErrorResult({
            abi: NGORegistryContract.abi,
            data: err.data,
          });
          console.log('Decoded error from catch:', decoded);
          errorMsg = `Contract error: ${decoded.errorName}`;
        }
      } catch (e) {
        // Ignore decode errors
      }
      
      setError(errorMsg);
      setIsLoading(false);
      setIsRegistering(false);
    }
  };

  // Handle registration transaction errors
  useEffect(() => {
    if (isRegistrationError && registrationError) {
      console.error('Registration transaction error:', registrationError);
      console.error('Full error object:', JSON.stringify(registrationError, null, 2));
      
      let errorMessage = 'Transaction failed';
      
      // Try to decode the error if it has data
      const decodeError = async () => {
        try {
          const errorData = (registrationError as any)?.data || (registrationError as any)?.cause?.data;
          if (errorData) {
            console.log('Attempting to decode error data with viem:', errorData);
            try {
              const decoded = decodeErrorResult({
                abi: NGORegistryContract.abi,
                data: errorData,
              });
              console.log('Decoded error (viem):', decoded);
              errorMessage = getErrorMessage(decoded.errorName);
              return errorMessage;
            } catch (viemError) {
              console.log('Viem decode failed, trying ethers.js fallback:', viemError);
              
              // Fallback to ethers.js for better error decoding
              if (typeof window !== 'undefined' && window.ethereum) {
                try {
                  const provider = new BrowserProvider(window.ethereum);
                  const decoded = await decodeContractError(
                    registrationError,
                    NGORegistryContract.address,
                    provider
                  );
                  if (decoded) {
                    console.log('Decoded error (ethers):', decoded);
                    errorMessage = getErrorMessage(decoded.errorName);
                    return errorMessage;
                  }
                } catch (ethersError) {
                  console.log('Ethers decode also failed:', ethersError);
                }
              }
            }
          }
        } catch (e) {
          console.log('Error decoding failed:', e);
        }
        
        // Parse error message to provide helpful feedback
        const errorString = registrationError.message || String(registrationError);
        if (errorString.includes('insufficient') || errorString.includes('balance')) {
          return 'Insufficient cUSD balance. You need at least 1 cUSD to register.';
        } else if (errorString.includes('allowance') || errorString.includes('approve') || errorString.includes('ERC20InsufficientAllowance')) {
          return 'Insufficient cUSD allowance. Please approve cUSD spending first.';
        } else if (errorString.includes('Registration fee payment failed')) {
          return 'Registration fee payment failed. Please ensure you have at least 1 cUSD and have approved the spending.';
        } else if (errorString.includes('Already registered')) {
          return 'You are already registered as an NGO.';
        } else if (errorString.includes('DID already used')) {
          return 'This identity has already been used to register an NGO.';
        } else if (errorString.includes('VC already used')) {
          return 'This verification credential has already been used.';
        } else if (errorString.includes('VC expired')) {
          return 'Your verification credential has expired. Please verify again.';
        } else if (errorString.includes('Invalid VC signature') || errorString.includes('ECDSAInvalidSignature')) {
          return 'Invalid verification signature. This should not happen in staging mode. Please check contract staging mode setting.';
        } else {
          return `Transaction failed: ${errorString}. Check console for details.`;
        }
      };
      
      decodeError().then((msg) => {
        setError(msg || errorMessage);
        setIsLoading(false);
        setIsRegistering(false);
      });
    }
  }, [isRegistrationError, registrationError]);

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
    hasEnoughBalance,
    balance,
    isLoading: isLoading || isPending || isApprovalConfirming || isRegistrationConfirming,
    isApprovalSuccess,
    isRegistrationSuccess,
    error,
    approvalHash,
    registrationHash,
  };
}

