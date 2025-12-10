import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseUnits, formatEther } from 'ethers';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { decodeContractError, getErrorMessage } from '../utils/errorDecoder';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';
const REGISTRATION_FEE = parseUnits('1', 18); // 1 cUSD

// Celo Sepolia RPC URL
const RPC_URL = process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://sepolia-forno.celo.org';

// ERC20 ABI for balance and allowance checks
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

/**
 * Hook for NGO registration with Self Protocol verification using ethers.js
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
  const [approvalHash, setApprovalHash] = useState<string | undefined>();
  const [registrationHash, setRegistrationHash] = useState<string | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  
  const [ngoData, setNgoData] = useState<any>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isApprovalSuccess, setIsApprovalSuccess] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [isRegistrationError, setIsRegistrationError] = useState(false);
  const [registrationError, setRegistrationError] = useState<any>(null);
  const [stagingMode, setStagingMode] = useState<boolean | null>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationCheckAttempts, setRegistrationCheckAttempts] = useState(0);

  // Initialize provider and get wallet address
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);
          
          // Get accounts
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0].address);
            setIsConnected(true);
            const signer = await provider.getSigner();
            setSigner(signer);
          } else {
            setAddress(null);
            setIsConnected(false);
            setSigner(null);
          }

          // Listen for account changes
          window.ethereum.on('accountsChanged', async (accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
              setIsConnected(true);
              const signer = await provider.getSigner();
              setSigner(signer);
            } else {
              setAddress(null);
              setIsConnected(false);
              setSigner(null);
            }
            // Reset state on account change
            setNgoData(null);
            setAllowance(null);
            setBalance(null);
          });

          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      }
    };

    initProvider();
  }, []);

  // Check registration status using the simpler isVerified function
  useEffect(() => {
    const checkRegistration = async (retryCount = 0) => {
      if (!address || !provider) {
        setNgoData(null);
        setIsCheckingRegistration(false);
        return;
      }

      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      try {
        setIsCheckingRegistration(true);
        
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n; // Celo Sepolia
        if (network.chainId !== expectedChainId) {
          console.warn(`Wrong network. Expected ${expectedChainId}, got ${network.chainId}`);
          setNgoData(null);
          setIsCheckingRegistration(false);
          return;
        }

        const contract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );
        
        // Use the simpler isVerified function instead of fetching full struct
        const isVerified = await contract.isVerified(address);
        console.log('🔍 isVerified result:', isVerified, 'for address:', address);
        
        // Also fetch full data if verified (for dashboard display)
        if (isVerified) {
          const data = await contract.ngoByWallet(address);
          console.log('📊 Full NGO data:', data);
          setNgoData(data);
          localStorage.setItem(`ngo_registered_${address.toLowerCase()}`, 'true');
          console.log('✅ User is verified as NGO (cached)');
        } else {
          // Even if isVerified is false, check ngoByWallet to see if there's data
          // (might be registered but expired)
          const data = await contract.ngoByWallet(address);
          console.log('📊 NGO data (not verified):', data);
          if (data && data.isActive === true) {
            // User is registered but VC might be expired
            setNgoData(data);
            localStorage.setItem(`ngo_registered_${address.toLowerCase()}`, 'true');
            console.log('⚠️ User is registered but VC might be expired');
          } else {
            setNgoData(null);
            localStorage.setItem(`ngo_registered_${address.toLowerCase()}`, 'false');
            console.log('ℹ️ User is not registered as NGO');
          }
        }
        
        setIsCheckingRegistration(false);
        setRegistrationCheckAttempts(0);
      } catch (error: any) {
        // Check if we have cached registration status
        const cached = localStorage.getItem(`ngo_registered_${address.toLowerCase()}`);
        const wasRegistered = cached === 'true';
        
        // Only log non-RPC errors to avoid console spam
        if (error?.code !== 'CALL_EXCEPTION' && error?.code !== 'NETWORK_ERROR') {
          console.error('Error checking registration:', error);
        }
        
        // Retry logic for RPC errors
        if ((error?.code === 'CALL_EXCEPTION' || error?.code === 'NETWORK_ERROR') && retryCount < maxRetries) {
          console.log(`⚠️ RPC error checking registration, retrying... (${retryCount + 1}/${maxRetries})`);
          setRegistrationCheckAttempts(retryCount + 1);
          
          // Retry after delay
          setTimeout(() => {
            checkRegistration(retryCount + 1);
          }, retryDelay);
        } else {
          // Max retries reached or non-RPC error
          if (retryCount >= maxRetries) {
            console.log('⚠️ Max retries reached for checking registration');
          }
          
          // If we have cached registration status and previous data, preserve it
          if (wasRegistered && ngoData) {
            console.log('📦 Preserving cached registration state after RPC failure');
            // Keep ngoData as is
          } else if (!wasRegistered || !ngoData) {
            // Only reset if we're sure user is not registered
            setNgoData(null);
          }
          
          setIsCheckingRegistration(false);
        }
      }
    };

    checkRegistration();
  }, [address, provider]);

  // Fetch allowance
  useEffect(() => {
    const fetchAllowance = async () => {
      if (!address || !provider) return;

      try {
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n; // Celo Sepolia
        if (network.chainId !== expectedChainId) {
          setAllowance(null);
          return;
        }

        const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const allowanceValue = await cUSDContract.allowance(address, NGORegistryContract.address);
        setAllowance(allowanceValue);
      } catch (error: any) {
        // Only log non-RPC errors to avoid console spam
        if (error?.code !== 'CALL_EXCEPTION' && error?.code !== 'NETWORK_ERROR') {
          console.error('Error fetching allowance:', error);
        }
        setAllowance(null);
      }
    };

    fetchAllowance();
  }, [address, provider, approvalHash]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !provider) return;

      try {
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n; // Celo Sepolia
        if (network.chainId !== expectedChainId) {
          setBalance(null);
          return;
        }

        const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const balanceValue = await cUSDContract.balanceOf(address);
        setBalance(balanceValue);
      } catch (error: any) {
        // Only log non-RPC errors to avoid console spam
        if (error?.code !== 'CALL_EXCEPTION' && error?.code !== 'NETWORK_ERROR') {
          console.error('Error fetching balance:', error);
        }
        setBalance(null);
      }
    };

    fetchBalance();
  }, [address, provider]);

  // Fetch staging mode status
  useEffect(() => {
    if (!provider) return;

    const fetchStagingMode = async () => {
      try {
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n; // Celo Sepolia
        if (network.chainId !== expectedChainId) {
          setStagingMode(null);
          return;
        }

        const contract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );
        const mode = await contract.stagingMode();
        setStagingMode(mode);
        console.log('📊 Staging mode status:', mode ? '✅ ENABLED' : '❌ DISABLED');
      } catch (error: any) {
        // Only log non-RPC errors to avoid console spam
        if (error?.code !== 'CALL_EXCEPTION' && error?.code !== 'NETWORK_ERROR') {
          console.error('Error fetching staging mode:', error);
        }
        setStagingMode(null);
      }
    };

    fetchStagingMode();
  }, [provider]);

  // Check if user is registered - use cached status as fallback while checking
  const cachedRegistered = address ? localStorage.getItem(`ngo_registered_${address.toLowerCase()}`) === 'true' : false;
  const isRegistered = (ngoData && ngoData.isActive === true) || 
                       (cachedRegistered && isCheckingRegistration && !ngoData);
  const needsApproval = allowance ? allowance < REGISTRATION_FEE : true;
  const hasEnoughBalance = balance !== undefined ? balance >= REGISTRATION_FEE : undefined;

  /**
   * Approve cUSD for registration fee
   */
  const approveCUSD = async () => {
    if (!address || !isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setIsApproving(true);
    setError(null);
    setIsApprovalSuccess(false);

    try {
      const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, signer);
      const tx = await cUSDContract.approve(NGORegistryContract.address, REGISTRATION_FEE);
      setApprovalHash(tx.hash);
      
      // Wait for transaction
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setIsApprovalSuccess(true);
        // Refresh allowance
        const newAllowance = await cUSDContract.allowance(address, NGORegistryContract.address);
        setAllowance(newAllowance);
      } else {
        throw new Error('Approval transaction failed');
      }
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve cUSD');
      throw err;
    } finally {
      setIsLoading(false);
      setIsApproving(false);
    }
  };

  /**
   * Register NGO with Self Protocol verification
   */
  const registerNGO = async (verificationData: any, ipfsProfile: string) => {
    if (!address || !isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    if (!hasEnoughBalance) {
      throw new Error('Insufficient cUSD balance. You need at least 1 cUSD to register.');
    }

    if (needsApproval) {
      throw new Error('Please approve cUSD spending first.');
    }

    setIsLoading(true);
    setIsRegistering(true);
    setError(null);
    setRegistrationError(null);
    setIsRegistrationError(false);
    setIsRegistrationSuccess(false);

    try {
      // Process Self Protocol result
      const processedData = processSelfProtocolResult(verificationData);

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

      // Create contract instance
      const contract = new Contract(
        NGORegistryContract.address,
        NGORegistryContract.abi,
        signer
      );

      // Simulate the contract call first to get the actual revert reason
      // Note: In ethers v6, use staticCall, but we'll skip simulation for now and rely on transaction errors
      // try {
      //   console.log('🔍 Simulating contract call to check for errors...');
      //   await contract.registerNGO.staticCall(
      //     processedData.did,
      //     processedData.vcProofHash,
      //     processedData.vcSignature,
      //     processedData.age,
      //     processedData.country,
      //     ipfsProfile,
      //     processedData.expiryDate,
      //   );
      //   console.log('✅ Simulation passed - transaction should succeed');
      // } catch (simError: any) {
      //   console.error('❌ Simulation failed:', simError);
      //   // Try to decode the error
      //   let errorMsg = 'Transaction will fail';
      //   try {
      //     if (simError.data) {
      //       const decoded = await decodeContractError(
      //         simError,
      //         NGORegistryContract.address,
      //         provider
      //       );
      //       if (decoded) {
      //         console.log('Decoded simulation error:', decoded);
      //         errorMsg = getErrorMessage(decoded.errorName);
      //       } else {
      //         errorMsg = simError.message || 'Transaction simulation failed';
      //       }
      //     } else {
      //       errorMsg = simError.message || 'Transaction simulation failed';
      //     }
      //   } catch (e) {
      //     console.log('Could not decode simulation error:', e);
      //     errorMsg = simError.message || 'Transaction simulation failed';
      //   }
      //   throw new Error(errorMsg);
      // }

      // Call registerNGO on the contract
      const tx = await contract.registerNGO(
        processedData.did,
        processedData.vcProofHash,
        processedData.vcSignature,
        processedData.age,
        processedData.country,
        ipfsProfile,
        processedData.expiryDate,
      );
      
      setRegistrationHash(tx.hash);
      
      // Wait for transaction
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setIsRegistrationSuccess(true);
        // Refresh NGO data
        const data = await contract.ngoByWallet(address);
        setNgoData(data);
      } else {
        throw new Error('Registration transaction failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error details:', {
        message: err.message,
        data: err.data,
        reason: err.reason,
      });
      
      // Try to decode error if it has data
      let errorMsg = err.message || 'Failed to register NGO';
      try {
        if (err.data && provider) {
          const decoded = await decodeContractError(
            err,
            NGORegistryContract.address,
            provider
          );
          if (decoded) {
            console.log('Decoded error from catch:', decoded);
            errorMsg = getErrorMessage(decoded.errorName);
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
      
      setError(errorMsg);
      setRegistrationError(err);
      setIsRegistrationError(true);
      setIsLoading(false);
      setIsRegistering(false);
      throw err;
    } finally {
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
          const errorData = registrationError?.data;
          if (errorData && provider) {
            console.log('Attempting to decode error data with ethers:', errorData);
            try {
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
              console.log('Ethers decode failed:', ethersError);
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
  }, [isRegistrationError, registrationError, provider]);

  // Refetch NGO data after successful registration
  useEffect(() => {
    if (isRegistrationSuccess && address && provider) {
      const refetchNgo = async () => {
        try {
          const network = await provider.getNetwork();
          const expectedChainId = 11155711n; // Celo Sepolia
          if (network.chainId !== expectedChainId) {
            console.warn('Wrong network for refetch');
            return;
          }

          const contract = new Contract(
            NGORegistryContract.address,
            NGORegistryContract.abi,
            provider
          );
          const data = await contract.ngoByWallet(address);
          setNgoData(data);
          console.log('✅ Refetched NGO data after registration:', data?.isActive ? 'Registered' : 'Not registered');
        } catch (error: any) {
          console.error('Error refetching NGO data:', error);
          // Don't reset on error - keep the success state
        }
      };
      // Add a small delay to ensure the transaction is fully processed
      setTimeout(() => {
        refetchNgo();
      }, 2000);
    }
  }, [isRegistrationSuccess, address, provider]);

  return {
    registerNGO,
    approveCUSD,
    isRegistered,
    needsApproval,
    hasEnoughBalance,
    balance: balance ? BigInt(balance.toString()) : undefined,
    isLoading: isLoading || isApproving || isRegistering,
    isApprovalSuccess,
    isRegistrationSuccess,
    error,
    approvalHash,
    registrationHash,
    address,
    isConnected,
    stagingMode,
  };
}
