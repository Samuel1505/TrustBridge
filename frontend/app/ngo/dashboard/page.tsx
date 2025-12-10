'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppKit } from '@reown/appkit/react';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useNgoRegistration } from '../../hooks/useNgoRegistration';
import { Contract, BrowserProvider } from 'ethers';
import { NGORegistryContract } from '../../abi';

export default function NGODashboardPage() {
  const { address, isConnected, isRegistered } = useNgoRegistration();
  const { open } = useAppKit();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ngo, setNgo] = useState<any>(null);
  const [isLoadingNgo, setIsLoadingNgo] = useState(true);

  // Fetch NGO data from contract using ethers.js
  useEffect(() => {
    const fetchNgoData = async () => {
      if (!address || !isConnected) {
        setIsLoadingNgo(false);
        return;
      }

      try {
        // Get provider from window.ethereum
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(
            NGORegistryContract.address,
            NGORegistryContract.abi,
            provider
          );
          const ngoData = await contract.ngoByWallet(address);
          setNgo(ngoData);
        }
      } catch (error) {
        console.error('Error fetching NGO data:', error);
        setNgo(null);
      } finally {
        setIsLoadingNgo(false);
      }
    };

    fetchNgoData();
  }, [address, isConnected]);

  useEffect(() => {
    if (!isConnected) {
      // Open wallet connection modal
      open();
    } else if (isConnected && !isLoadingNgo) {
      if (!isRegistered) {
        // If not registered, redirect to home after a short delay
        console.log('User is not registered, redirecting to home');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        // User is registered, show dashboard
        setIsLoading(false);
      }
    }
  }, [isConnected, isLoadingNgo, isRegistered, router, open]);

  if (!isConnected || isLoading || isLoadingNgo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your NGO dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return null; // Will redirect
  }

  // Format dates
  const registeredDate = ngo?.registeredAt 
    ? new Date(Number(ngo.registeredAt) * 1000).toLocaleDateString()
    : 'N/A';
  
  const expiryDate = ngo?.vcExpiryDate
    ? new Date(Number(ngo.vcExpiryDate) * 1000).toLocaleDateString()
    : 'N/A';

  const isExpired = ngo?.vcExpiryDate 
    ? Number(ngo.vcExpiryDate) * 1000 < Date.now()
    : false;

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
                <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Manage your organization and track donations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isExpired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Verification Expired
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.ethereum) {
                    window.ethereum.request({ method: 'eth_requestAccounts' });
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Registration Status</h2>
                {isExpired ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${isExpired ? 'text-yellow-600' : 'text-emerald-600'}`}>
                    {isExpired ? 'Verification Expired' : 'Active & Verified'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Registered</span>
                  <span className="font-medium text-gray-900">{registeredDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verification Expires</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {expiryDate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Country</span>
                  <span className="font-medium text-gray-900">{ngo?.founderCountry || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet Address</span>
                  <span className="font-mono text-sm text-gray-600">
                    {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Donations Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
            >
              <h2 className="text-xl font-bold mb-6">Donation Statistics</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-emerald-100">Total Received</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {ngo?.totalDonationsReceived 
                      ? (Number(ngo.totalDonationsReceived) / 1e18).toFixed(2)
                      : '0.00'} cUSD
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-emerald-100">Total Donors</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {ngo?.donorCount?.toString() || '0'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* IPFS Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">IPFS Profile</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">IPFS Hash:</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900 break-all">
                    {ngo?.ipfsProfile || 'Not set'}
                  </code>
                  {ngo?.ipfsProfile && (
                    <a
                      href={`https://ipfs.io/ipfs/${ngo.ipfsProfile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href={`/ngo/${address}`}>
                  <button className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <Building2 className="w-5 h-5" />
                    View Public Profile
                  </button>
                </Link>
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Update Profile
                </button>
                {isExpired && (
                  <button className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-all flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Renew Verification
                  </button>
                )}
              </div>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-blue-900 mb-2">About Your Dashboard</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Track all donations received</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>View your public profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Update your organization details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Renew verification when needed</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}





