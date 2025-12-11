import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { NGORegistryContract } from '../abi';
import { Contract } from 'ethers';

// Storage key for donor verification status
const DONOR_VERIFICATION_KEY = 'trustbridge_donor_verified';

export function useDonorVerification() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isDonorVerified, setIsDonorVerified] = useState<boolean>(false);
  const [isNgoRegistered, setIsNgoRegistered] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);

  // Initialize provider and wallet
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const ethereum = window.ethereum as any;
          const provider = new BrowserProvider(ethereum);
          setProvider(provider);
          
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0].address);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }

          ethereum.on('accountsChanged', async (accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
              setIsConnected(true);
            } else {
              setAddress(null);
              setIsConnected(false);
            }
          });

          ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      }
    };

    initProvider();
  }, []);

  // Check if user is registered as NGO
  useEffect(() => {
    const checkNgoStatus = async () => {
      if (!address || !provider) {
        setIsNgoRegistered(false);
        setIsChecking(false);
        return;
      }

      try {
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(11142220)) {
          setIsNgoRegistered(false);
          setIsChecking(false);
          return;
        }

        const contract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );
        
        const isVerified = await contract.isVerified(address);
        setIsNgoRegistered(isVerified);
      } catch (error) {
        console.error('Error checking NGO status:', error);
        setIsNgoRegistered(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkNgoStatus();
  }, [address, provider]);

  // Check donor verification status from localStorage
  useEffect(() => {
    if (!address) {
      setIsDonorVerified(false);
      return;
    }

    try {
      const stored = localStorage.getItem(DONOR_VERIFICATION_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if verification is for current address and not expired (if expiry is stored)
        if (data.address === address.toLowerCase()) {
          setIsDonorVerified(true);
        } else {
          setIsDonorVerified(false);
        }
      } else {
        setIsDonorVerified(false);
      }
    } catch (error) {
      console.error('Error reading donor verification status:', error);
      setIsDonorVerified(false);
    }
  }, [address]);

  // Mark donor as verified
  const markDonorVerified = (proofData?: any) => {
    if (!address) return;
    
    try {
      const data = {
        address: address.toLowerCase(),
        verifiedAt: Date.now(),
        proofData: proofData || null,
      };
      localStorage.setItem(DONOR_VERIFICATION_KEY, JSON.stringify(data));
      setIsDonorVerified(true);
    } catch (error) {
      console.error('Error saving donor verification status:', error);
    }
  };

  // Clear donor verification (if needed)
  const clearDonorVerification = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DONOR_VERIFICATION_KEY);
      setIsDonorVerified(false);
    }
  };

  return {
    address,
    isConnected,
    isDonorVerified,
    isNgoRegistered,
    isChecking,
    markDonorVerified,
    clearDonorVerification,
  };
}

