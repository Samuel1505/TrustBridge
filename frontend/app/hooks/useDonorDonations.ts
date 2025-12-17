import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { DonationRouterContract } from '../abi';

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

        // Process donations
        const processedDonations: DonorDonation[] = donorDonations.map((donation: any, index: number) => ({
          id: index.toString(),
          ngo: donation.ngo,
          amount: parseFloat(formatEther(donation.amount)),
          message: donation.message,
          timestamp: new Date(Number(donation.timestamp) * 1000).toISOString(),
        }));

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

