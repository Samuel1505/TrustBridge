import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { DonationRouterContract, NGORegistryContract } from '../abi';

export interface DonorDonation {
  id: string;
  ngo: string;
  amount: number;
  message: string;
  timestamp: string;
  ngoName?: string;
}

export interface DonorStats {
  totalDonated: number;
  donationCount: number;
  uniqueNGOs: number;
}

export function useDonorDonations(address: string | null) {
  const [donations, setDonations] = useState<DonorDonation[]>([]);
  const [stats, setStats] = useState<DonorStats>({
    totalDonated: 0,
    donationCount: 0,
    uniqueNGOs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setDonations([]);
      setStats({ totalDonated: 0, donationCount: 0, uniqueNGOs: 0 });
      setIsLoading(false);
      return;
    }

    const fetchDonations = async () => {
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

        const donationRouterContract = new Contract(
          DonationRouterContract.address,
          DonationRouterContract.abi,
          provider
        );

        // Fetch donations by donor
        const donorDonations = await donationRouterContract.getDonationsByDonor(address);
        
        // Fetch total donated
        const totalDonated = await donationRouterContract.totalByDonor(address);

        // Fetch NGO names for each donation
        const registryContract = new Contract(
          NGORegistryContract.address,
          NGORegistryContract.abi,
          provider
        );

        // Process donations and fetch NGO names
        const processedDonationsPromises = donorDonations.map(async (donation: any, index: number) => {
          let ngoName: string | undefined;
          try {
            const ngoData = await registryContract.getNGO(donation.ngo);
            // Try to fetch IPFS profile for name
            if (ngoData.ipfsProfile && ngoData.ipfsProfile !== '') {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const ipfsUrl = `https://ipfs.io/ipfs/${ngoData.ipfsProfile}`;
                const response = await fetch(ipfsUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (response.ok) {
                  const profileData = await response.json();
                  ngoName = profileData.name;
                }
              } catch (ipfsError) {
                // Silently fail
              }
            }
            if (!ngoName) {
              ngoName = `NGO ${donation.ngo.slice(0, 6)}...${donation.ngo.slice(-4)}`;
            }
          } catch (err) {
            ngoName = `NGO ${donation.ngo.slice(0, 6)}...${donation.ngo.slice(-4)}`;
          }

          return {
            id: index.toString(),
            ngo: donation.ngo,
            amount: parseFloat(formatEther(donation.amount)),
            message: donation.message,
            timestamp: new Date(Number(donation.timestamp) * 1000).toISOString(),
            ngoName,
          };
        });

        const processedDonations = await Promise.all(processedDonationsPromises);

        // Sort by timestamp (newest first)
        processedDonations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Calculate stats
        const uniqueNGOs = new Set(processedDonations.map(d => d.ngo)).size;

        setDonations(processedDonations);
        setStats({
          totalDonated: parseFloat(formatEther(totalDonated)),
          donationCount: processedDonations.length,
          uniqueNGOs,
        });
      } catch (err: any) {
        console.error('Error fetching donor donations:', err);
        setError(err.message || 'Failed to fetch donations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [address]);

  return { donations, stats, isLoading, error };
}

