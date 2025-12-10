import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { NGORegistryContract } from '../abi';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { decodeContractError, getErrorMessage } from '../utils/errorDecoder';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';
const REGISTRATION_FEE = parseUnits('1', 18); // 1 cUSD

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export function useNgoRegistration() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  
  const [ngoData, setNgoData] = useState<any>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalSuccess, setIsApprovalSuccess] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string | undefined>();
  const [registrationHash, setRegistrationHash] = useState<string | undefined>();

  // Initialize provider and wallet
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);
          
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0].address);
            setIsConnected(true);
            setSigner(await provider.getSigner());
          } else {
            setAddress(null);
            setIsConnected(false);
            setSigner(null);
          }

          window.ethereum.on('accountsChanged', async (accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
              setIsConnected(true);
              setSigner(await provider.getSigner());
            } else {
              setAddress(null);
              setIsConnected(false);
              setSigner(null);
            }
            setNgoData(null);
            setAllowance(null);
            setBalance(null);
          });

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

  // Check if user is registered - simple check
  useEffect(() => {
    const checkRegistration = async () => {
      if (!address || !provider) {
        setNgoData(null);
        return;
      }

      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 11155711n) {
          setNgoData(null);
          return;
        }

        const contract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );
        
        const isVerified = await contract.isVerified(address);
        if (isVerified) {
          const data = await contract.ngoByWallet(address);
          setNgoData(data);
        } else {
          setNgoData(null);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        setNgoData(null);
      }
    };

    checkRegistration();
  }, [address, provider]);

  // Check allowance
  useEffect(() => {
    const checkAllowance = async () => {
      if (!address || !provider) return;

      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 11155711n) return;

        const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const allowanceValue = await cUSDContract.allowance(address, NGORegistryContract.address);
        setAllowance(allowanceValue);
        
        if (allowanceValue >= REGISTRATION_FEE) {
          setIsApprovalSuccess(true);
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
        setAllowance(null);
      }
    };

    checkAllowance();
  }, [address, provider]);

  // Check balance
  useEffect(() => {
    const checkBalance = async () => {
      if (!address || !provider) return;

      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 11155711n) return;

        const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const balanceValue = await cUSDContract.balanceOf(address);
        setBalance(balanceValue);
      } catch (error) {
        console.error('Error checking balance:', error);
        setBalance(null);
      }
    };

    checkBalance();
  }, [address, provider]);

  const isRegistered = ngoData && ngoData.isActive === true;
  const needsApproval = allowance === null || allowance < REGISTRATION_FEE;
  const hasEnoughBalance = balance !== null && balance !== undefined ? balance >= REGISTRATION_FEE : undefined;

  // Approve cUSD
  const approveCUSD = async () => {
    if (!address || !signer) throw new Error('Wallet not connected');

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
      const allowanceValue = await cUSDContract.allowance(address, NGORegistryContract.address);
      setAllowance(allowanceValue);
    } catch (err: any) {
      console.error('Approval error:', err);
      const decodedError = await decodeContractError(err, NGORegistryContract.address, provider);
      setError(getErrorMessage(decodedError?.errorName || err.message));
    } finally {
      setIsLoading(false);
      setIsApproving(false);
    }
  };
  
  // Register NGO
  const registerNGO = async (selfProtocolResult: any, ipfsProfile: string) => {
    if (!address || !signer) throw new Error('Wallet not connected');
    if (isRegistered) throw new Error('You are already registered');
    if (hasEnoughBalance === false) throw new Error('Insufficient cUSD balance');
    if (needsApproval) throw new Error('Please approve cUSD first');

    setIsLoading(true);
    setIsRegistering(true);
    setError(null);
    setIsRegistrationSuccess(false);

    try {
      const processedData = processSelfProtocolResult(selfProtocolResult);
      if (!processedData) throw new Error('Failed to process verification result');
      if (processedData.age < 18) throw new Error('Founder must be 18 or older');
      if (!ipfsProfile || ipfsProfile.length === 0) throw new Error('IPFS profile is required');

      const contract = new Contract(
        NGORegistryContract.address,
        NGORegistryContract.abi,
        signer
      );

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
  };
}
