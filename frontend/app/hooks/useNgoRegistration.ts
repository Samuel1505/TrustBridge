import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseUnits, formatEther } from 'ethers';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { decodeContractError, getErrorMessage } from '../utils/errorDecoder';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';
const REGISTRATION_FEE = parseUnits('1', 18); // 1 cUSD

// ERC20 ABI for balance and allowance checks
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * Hook for NGO registration with Self Protocol verification using ethers.js
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
            setIsApprovalSuccess(false);
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

  // Check registration status - always check directly from contract
  useEffect(() => {
    const checkRegistration = async () => {
      if (!address || !provider) {
        setNgoData(null);
        return;
      }

      try {
        // Check if we're on the correct network
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n; // Celo Sepolia
        if (network.chainId !== expectedChainId) {
          console.warn(`Wrong network. Expected ${expectedChainId}, got ${network.chainId}`);
          setNgoData(null);
          return;
        }

        const contract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );
        
        // Check if verified
        const isVerified = await contract.isVerified(address);
        
        if (isVerified) {
          // Fetch full data for dashboard
          const data = await contract.ngoByWallet(address);
          setNgoData(data);
        } else {
          // Check if registered but expired
          const data = await contract.ngoByWallet(address);
          if (data && data.isActive === true) {
            setNgoData(data);
          } else {
            setNgoData(null);
          }
        }
      } catch (error: any) {
        console.error('Error checking registration:', error);
        setNgoData(null);
      }
    };

    checkRegistration();
  }, [address, provider]);

  // Fetch allowance - refresh when needed
  const fetchAllowance = useCallback(async () => {
    if (!address || !provider) {
      setAllowance(null);
      return;
    }

    try {
      const network = await provider.getNetwork();
      const expectedChainId = 11155711n;
      if (network.chainId !== expectedChainId) {
        setAllowance(null);
        return;
      }

      const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
      const allowanceValue = await cUSDContract.allowance(address, NGORegistryContract.address);
      setAllowance(allowanceValue);
      
      // If allowance is sufficient, mark approval as successful
      if (allowanceValue >= REGISTRATION_FEE) {
        setIsApprovalSuccess(true);
      }
    } catch (error: any) {
      console.error('Error fetching allowance:', error);
      setAllowance(null);
    }
  }, [address, provider]);

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  // Refresh allowance after approval transaction
  useEffect(() => {
    if (approvalHash) {
      // Wait a bit for the transaction to be mined, then refresh
      const timer = setTimeout(() => {
        fetchAllowance();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [approvalHash, fetchAllowance]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !provider) return;

      try {
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n;
        if (network.chainId !== expectedChainId) {
          setBalance(null);
          return;
        }

        const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const balanceValue = await cUSDContract.balanceOf(address);
        setBalance(balanceValue);
      } catch (error: any) {
        console.error('Error fetching balance:', error);
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
        const network = await provider.getNetwork();
        const expectedChainId = 11155711n;
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
      } catch (error: any) {
        console.error('Error fetching staging mode:', error);
        setStagingMode(null);
      }
    };

    fetchStagingMode();
  }, [provider]);

  const isRegistered = ngoData && ngoData.isActive === true;
  // needsApproval: true if allowance is null (loading) OR allowance is less than fee
  // false if allowance exists and is >= fee
  const needsApproval = allowance === null ? true : allowance < REGISTRATION_FEE;
  const hasEnoughBalance = balance !== null && balance !== undefined ? balance >= REGISTRATION_FEE : undefined;

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
    setApprovalHash(undefined);
    setIsApprovalSuccess(false);

    try {
      const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, signer);
      const tx = await cUSDContract.approve(NGORegistryContract.address, REGISTRATION_FEE);
      setApprovalHash(tx.hash);
      await tx.wait();
      setIsApprovalSuccess(true);
      
      // Refresh allowance
      await fetchAllowance();
    } catch (err: any) {
      console.error('Approval error:', err);
      const decodedError = await decodeContractError(err, NGORegistryContract.address, provider);
      setError(getErrorMessage(decodedError?.errorName || err.message));
      setIsApprovalSuccess(false);
    } finally {
      setIsLoading(false);
      setIsApproving(false);
    }
  };
  
  /**
   * Register NGO with Self Protocol verification data
   */
  const registerNGO = async (
    selfProtocolResult: any,
    ipfsProfile: string
  ) => {
    if (!address || !isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    if (isRegistered) {
      throw new Error('You are already registered as an NGO');
    }

    // Check balance
    if (hasEnoughBalance === false) {
      throw new Error('Insufficient cUSD balance. You need at least 1 cUSD to register.');
    }

    // Check allowance
    if (needsApproval) {
      throw new Error('Please approve cUSD spending first. You need to approve 1 cUSD for the registration fee.');
    }

    setIsLoading(true);
    setIsRegistering(true);
    setError(null);
    setRegistrationError(null);
    setIsRegistrationError(false);
    setIsRegistrationSuccess(false);

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

      // Create contract instance
      const contract = new Contract(
        NGORegistryContract.address,
        NGORegistryContract.abi,
        signer
      );

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
      await tx.wait();
      setIsRegistrationSuccess(true);
      
      // Refresh NGO data
      const data = await contract.ngoByWallet(address);
      setNgoData(data);
    } catch (err: any) {
      console.error('Registration error:', err);
      setRegistrationError(err);
      setIsRegistrationError(true);
      const decodedError = await decodeContractError(err, NGORegistryContract.address, provider);
      setError(getErrorMessage(decodedError?.errorName || err.message));
    } finally {
      setIsLoading(false);
      setIsRegistering(false);
    }
  };

  return {
    registerNGO,
    approveCUSD,
    isRegistered,
    needsApproval,
    hasEnoughBalance: hasEnoughBalance === true,
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
    fetchAllowance, // Expose for manual refresh
  };
}
