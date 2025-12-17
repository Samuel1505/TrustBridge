'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, DollarSign, Calendar, Users, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useDonorDonations } from '../../hooks/useDonorDonations';
import { useDonorVerification } from '../../hooks/useDonorVerification';
import DonorVerificationModal from '../../components/DonorVerificationModal';
import { formatEther } from 'ethers';

export default function DonorDashboardPage() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { donations, stats, isLoading, error } = useDonorDonations(address || null);
  const { isDonorVerified, isNgoRegistered, isChecking } = useDonorVerification();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your donor dashboard
          </p>
          <button
            onClick={() => open()}
            className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (isNgoRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">NGO Account Detected</h2>
          <p className="text-gray-600 mb-6">
            You are registered as an NGO. NGOs cannot access the donor dashboard.
          </p>
          <Link
            href="/ngo/dashboard"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Go to NGO Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Donor Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Track your donations and impact
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isDonorVerified && !isChecking && (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify Identity
                </button>
              )}
              {isDonorVerified && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-sm">Verified Donor</span>
                </div>
              )}
              <appkit-button />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Total Donated</h3>
            </div>
            <p className="text-4xl font-bold">
              ${stats.totalDonated.toFixed(2)}
            </p>
            <p className="text-emerald-100 text-sm mt-2">cUSD</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Donations Made</h3>
            </div>
            <p className="text-4xl font-bold">{stats.donationCount}</p>
            <p className="text-blue-100 text-sm mt-2">
              {stats.donationCount > 0 
                ? `Avg: $${(stats.totalDonated / stats.donationCount).toFixed(2)}`
                : 'Total contributions'
              }
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8" />
              <h3 className="text-lg font-semibold">NGOs Supported</h3>
            </div>
            <p className="text-4xl font-bold">{stats.uniqueNGOs}</p>
            <p className="text-purple-100 text-sm mt-2">Unique organizations</p>
          </motion.div>
        </div>

        {/* Donation History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Browse NGOs
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading your donations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-semibold mb-2">Error loading donations</p>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No donations yet</p>
              <p className="text-gray-500 mb-6">Start making a difference by donating to verified NGOs</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Browse NGOs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-start justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {donation.ngoName || `NGO ${donation.ngo.slice(0, 6)}...${donation.ngo.slice(-4)}`}
                      </h3>
                      <Link
                        href={`/ngo/${donation.ngo}`}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                    {donation.message && (
                      <p className="text-gray-700 text-sm italic mb-2">"{donation.message}"</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(donation.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{donation.ngo.slice(0, 6)}...{donation.ngo.slice(-4)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-emerald-600">
                      ${donation.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">cUSD</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <DonorVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerified={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
}

