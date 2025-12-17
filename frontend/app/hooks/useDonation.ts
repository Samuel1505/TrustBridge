import { useState } from 'react';
import { BrowserProvider, Contract, parseUnits, formatEther } from 'ethers';
import { DonationRouterContract } from '../abi';

// cUSD address on Celo Sepolia
const CUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';

// ERC20 ABI for approve
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export function useDonation() {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);

  const checkBalance = async (address: string): Promise<bigint> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    const provider = new BrowserProvider(window.ethereum as any);
    const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
    return await cUSDContract.balanceOf(address);
  };

  const checkAllowance = async (owner: string, spender: string): Promise<bigint> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    const provider = new BrowserProvider(window.ethereum as any);
    const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, provider);
    return await cUSDContract.allowance(owner, spender);
  };

  const approve = async (amount: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    setIsApproving(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const cUSDContract = new Contract(CUSD_ADDRESS, ERC20_ABI, signer);
      const amountWei = parseUnits(amount, 18);

      const tx = await cUSDContract.approve(DonationRouterContract.address, amountWei);
      setApprovalHash(tx.hash);
      
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to approve cUSD';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsApproving(false);
    }
  };

  const donate = async (ngoAddress: string, amount: string, message: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    setIsDonating(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check balance
      const balance = await checkBalance(address);
      const amountWei = parseUnits(amount, 18);
      if (balance < amountWei) {
        throw new Error(`Insufficient balance. You have ${formatEther(balance)} cUSD, but need ${amount} cUSD`);
      }

      // Check allowance
      const allowance = await checkAllowance(address, DonationRouterContract.address);
      if (allowance < amountWei) {
        throw new Error('Insufficient allowance. Please approve cUSD first.');
      }

      // Make donation
      const donationRouterContract = new Contract(
        DonationRouterContract.address,
        DonationRouterContract.abi,
        signer
      );

      const tx = await donationRouterContract.donate(ngoAddress, amountWei, message);
      setTxHash(tx.hash);
      
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to make donation';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsDonating(false);
    }
  };

  return {
    donate,
    approve,
    checkBalance,
    checkAllowance,
    isLoading: isLoading || isApproving || isDonating,
    isApproving,
    isDonating,
    error,
    txHash,
    approvalHash,
  };
}

