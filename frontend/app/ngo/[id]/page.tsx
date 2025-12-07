'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CheckCircle2, Calendar, Users, DollarSign, ExternalLink, Mail, Globe, Heart } from 'lucide-react';
import Link from 'next/link';
import { mockNGOs } from '../../data/mockNGOs';
import DonationModal from '../../components/DonationModal';
import { useParams } from 'next/navigation';

const countryFlags: Record<string, string> = {
  KE: '🇰🇪',
  NG: '🇳🇬',
  GH: '🇬🇭',
  ZA: '🇿🇦',
  UG: '🇺🇬',
  TZ: '🇹🇿',
};

export default function NGOProfilePage() {
  const params = useParams();
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const ngo = mockNGOs.find((n) => n.id === params.id);

  if (!ngo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">NGO Not Found</h1>
          <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700">
            Back to Dashboard
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
            <Link
              href="/dashboard"
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <appkit-button />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
            >
              <div className="flex items-start gap-6">
                <img
                  src={ngo.logo}
                  alt={ngo.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{ngo.name}</h1>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-lg">{countryFlags[ngo.countryCode]}</span>
                          {ngo.country}
                        </span>
                      </div>
                    </div>
                    {ngo.verified && (
                      <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-5 h-5" />
                        Verified
                      </div>
                    )}
                  </div>
                  <p className="text-xl text-gray-700 font-medium">{ngo.mission}</p>
                </div>
              </div>
            </motion.div>

            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Gallery</h2>
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden">
                  <img
                    src={ngo.images[selectedImage]}
                    alt={`${ngo.name} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {ngo.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-emerald-600 scale-105'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Organization</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {ngo.description}
              </p>
            </motion.div>

            {/* Recent Donations */}
            {ngo.recentDonations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Donations</h2>
                <div className="space-y-4">
                  {ngo.recentDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-gray-600">
                            {donation.donor}
                          </span>
                          <a
                            href={`https://explorer.celo.org/alfajores/tx/${donation.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        {donation.message && (
                          <p className="text-gray-700 text-sm italic">"{donation.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">
                          ${donation.amount}
                        </p>
                        <p className="text-xs text-gray-500">cUSD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Donate Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-xl p-8 text-white sticky top-8"
            >
              <div className="text-center mb-6">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Support This NGO</h3>
                <p className="text-emerald-100">
                  Your donation goes directly to their wallet
                </p>
              </div>
              <button
                onClick={() => setIsDonationModalOpen(true)}
                className="w-full px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-lg"
              >
                Donate Now
              </button>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Impact Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${ngo.totalDonations.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Raised</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{ngo.donorCount}</p>
                    <p className="text-sm text-gray-600">Donors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(ngo.verificationDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Verified Since</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <a
                  href={`mailto:${ngo.email}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">{ngo.email}</span>
                </a>
                {ngo.website && (
                  <a
                    href={ngo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">{ngo.website}</span>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Wallet Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">Wallet Address</h3>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-mono text-xs text-gray-700 break-all">
                  {ngo.founderAddress}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        ngoName={ngo.name}
        ngoAddress={ngo.founderAddress}
      />
    </div>
  );
}