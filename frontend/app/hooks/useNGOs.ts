import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { NGORegistryContract, DonationRouterContract } from '../abi';

export interface NGOData {
  address: string;
  founderDID: string;
  founderAge: number;
  founderCountry: string;
  ipfsProfile: string;
  registeredAt: bigint;
  vcExpiryDate: bigint;
  isActive: boolean;
  totalDonationsReceived: bigint;
  donorCount: bigint;
}

export interface NGOWithProfile extends NGOData {
  name?: string;
  mission?: string;
  description?: string;
  email?: string;
  website?: string;
  logo?: string;
  images?: string[];
}

export function useNGOs() {
  const [ngos, setNgos] = useState<NGOWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNGOs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('Wallet not available');
        }

        const provider = new BrowserProvider(window.ethereum as any);
        const network = await provider.getNetwork();
        const expectedChainId = BigInt(11142220); // Celo Sepolia
        
        if (network.chainId !== expectedChainId) {
          throw new Error(`Wrong network. Expected ${expectedChainId}, got ${network.chainId}`);
        }

        const registryContract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );

        // Get all verified NGO addresses
        const ngoAddresses: string[] = await registryContract.getAllVerifiedNGOs();
        
        if (ngoAddresses.length === 0) {
          setNgos([]);
          setIsLoading(false);
          return;
        }

        // Fetch NGO data for each address
        const ngoPromises = ngoAddresses.map(async (address) => {
          try {
            const ngoData: NGOData = await registryContract.getNGO(address);
            
            // Try to fetch IPFS profile data
            let profileData: any = null;
            if (ngoData.ipfsProfile && ngoData.ipfsProfile !== '') {
              try {
                const ipfsUrl = `https://ipfs.io/ipfs/${ngoData.ipfsProfile}`;
                const response = await fetch(ipfsUrl);
                if (response.ok) {
                  profileData = await response.json();
                }
              } catch (ipfsError) {
                console.warn(`Failed to fetch IPFS profile for ${address}:`, ipfsError);
              }
            }

            return {
              ...ngoData,
              address,
              name: profileData?.name || `NGO ${address.slice(0, 6)}...${address.slice(-4)}`,
              mission: profileData?.mission || '',
              description: profileData?.description || '',
              email: profileData?.email || '',
              website: profileData?.website || '',
              logo: profileData?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || address)}&background=10b981&color=fff&size=400`,
              images: profileData?.images || [],
            } as NGOWithProfile;
          } catch (err) {
            console.error(`Error fetching NGO data for ${address}:`, err);
            return null;
          }
        });

        const ngoResults = await Promise.all(ngoPromises);
        const validNGOs = ngoResults.filter((ngo): ngo is NGOWithProfile => ngo !== null);
        
        setNgos(validNGOs);
      } catch (err: any) {
        console.error('Error fetching NGOs:', err);
        setError(err.message || 'Failed to fetch NGOs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNGOs();
  }, []);

  return { ngos, isLoading, error };
}

export function useNGO(address: string | null) {
  const [ngo, setNgo] = useState<NGOWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setNgo(null);
      setIsLoading(false);
      return;
    }

    const fetchNGO = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('Wallet not available');
        }

        const provider = new BrowserProvider(window.ethereum as any);
        const network = await provider.getNetwork();
        const expectedChainId = BigInt(11142220); // Celo Sepolia
        
        if (network.chainId !== expectedChainId) {
          throw new Error(`Wrong network. Expected ${expectedChainId}, got ${network.chainId}`);
        }

        const registryContract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );

        // Check if NGO is verified
        const isVerified = await registryContract.isVerified(address);
        if (!isVerified) {
          setNgo(null);
          setIsLoading(false);
          return;
        }

        // Fetch NGO data
        const ngoData: NGOData = await registryContract.getNGO(address);
        
        // Try to fetch IPFS profile data
        let profileData: any = null;
        if (ngoData.ipfsProfile && ngoData.ipfsProfile !== '') {
          try {
            const ipfsUrl = `https://ipfs.io/ipfs/${ngoData.ipfsProfile}`;
            const response = await fetch(ipfsUrl);
            if (response.ok) {
              profileData = await response.json();
            }
          } catch (ipfsError) {
            console.warn(`Failed to fetch IPFS profile:`, ipfsError);
          }
        }

        // Note: Recent donations would be fetched from events or a separate hook
        // For now, we'll leave it empty as fetching requires event indexing
        const recentDonations: any[] = [];

        setNgo({
          ...ngoData,
          address,
          name: profileData?.name || `NGO ${address.slice(0, 6)}...${address.slice(-4)}`,
          mission: profileData?.mission || '',
          description: profileData?.description || '',
          email: profileData?.email || '',
          website: profileData?.website || '',
          logo: profileData?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || address)}&background=10b981&color=fff&size=400`,
          images: profileData?.images || [],
        } as NGOWithProfile);
      } catch (err: any) {
        console.error('Error fetching NGO:', err);
        setError(err.message || 'Failed to fetch NGO');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNGO();
  }, [address]);

  return { ngo, isLoading, error };
}

