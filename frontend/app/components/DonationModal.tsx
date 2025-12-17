'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Send, Copy, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { useDonation } from '../hooks/useDonation';
import { formatEther } from 'ethers';
import { DonationRouterContract } from '../abi';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ngoName: string;
  ngoAddress: string;
}

export default function DonationModal({ isOpen, onClose, ngoName, ngoAddress }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState(false);
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const router = useRouter();
  const { 
    donate, 
    approve, 
    checkBalance, 
    checkAllowance, 
    isLoading, 
    isApproving, 
    isDonating, 
    error, 
    txHash,
    approvalHash 
  } = useDonation();

  // Check balance and allowance when amount changes
  useEffect(() => {
    const updateBalanceAndAllowance = async () => {
      if (!isConnected || !address || !amount || parseFloat(amount) <= 0) {
        setBalance('0');
        setNeedsApproval(false);
        return;
      }

      try {
        const bal = await checkBalance(address);
        setBalance(formatEther(bal));

        const allowance = await checkAllowance(address, DonationRouterContract.address);
        const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
        setNeedsApproval(allowance < amountWei);
      } catch (err) {
        console.error('Error checking balance/allowance:', err);
      }
    };

    updateBalanceAndAllowance();
  }, [isConnected, address, amount, checkBalance, checkAllowance]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(ngoAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    try {
      await approve(amount);
      setNeedsApproval(false);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      const hash = await donate(ngoAddress, amount, message || '');
      router.push(`/donation/success?tx=${hash}&amount=${amount}&ngo=${encodeURIComponent(ngoName)}`);
      onClose();
    } catch (err) {
      console.error('Donation failed:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white rounded-t-3xl">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Send className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Make a Donation</h2>
                    <p className="text-emerald-100 mt-1">to {ngoName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {!isConnected ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Wallet className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Connect Your Wallet
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          You need to connect your Celo wallet to make a donation.
                        </p>
                        <button
                          onClick={() => open()}
                          className="w-full px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Donation Amount (cUSD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                              setAmount(value);
                            }
                          }}
                          placeholder="0.00"
                          className="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                          cUSD
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {[10, 25, 50, 100].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setAmount(preset.toString())}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 font-medium rounded-lg transition-colors"
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message of support..."
                        rows={3}
                        maxLength={200}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {message.length}/200 characters
                      </p>
                    </div>

                    {/* NGO Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Recipient Address
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-700 truncate">
                          {ngoAddress}
                        </div>
                        <button
                          onClick={handleCopyAddress}
                          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Transaction Summary */}
                    {amount && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Transaction Summary
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Donation Amount</span>
                            <span className="font-semibold text-gray-900">
                              {amount} cUSD
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Network Fee</span>
                            <span className="font-semibold text-gray-900">
                              ~0.001 CELO
                            </span>
                          </div>
                          <div className="border-t border-emerald-300 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900">Total</span>
                              <span className="font-bold text-emerald-600 text-lg">
                                {amount} cUSD
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Balance Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Your Balance</span>
                        <span className="font-semibold text-gray-900">{parseFloat(balance).toFixed(2)} cUSD</span>
                      </div>
                      {amount && parseFloat(amount) > 0 && parseFloat(balance) < parseFloat(amount) && (
                        <p className="text-xs text-red-600 mt-1">Insufficient balance</p>
                      )}
                    </div>

                    {/* Approval Step */}
                    {needsApproval && !approvalHash && (
                      <button
                        onClick={handleApprove}
                        disabled={isApproving || !amount || parseFloat(amount) <= 0}
                        className="w-full px-8 py-4 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Approve cUSD
                          </>
                        )}
                      </button>
                    )}

                    {/* Donate Button */}
                    <button
                      onClick={handleDonate}
                      disabled={!amount || parseFloat(amount) <= 0 || needsApproval || isLoading}
                      className="w-full px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isDonating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Donation
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}