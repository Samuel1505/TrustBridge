'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink, Share2, Twitter, Facebook, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get('tx') || '';
  const amount = searchParams.get('amount') || '0';
  const ngoName = searchParams.get('ngo') || 'NGO';
  const [copied, setCopied] = useState(false);

  const explorerUrl = `https://explorer.celo.org/alfajores/tx/${txHash}`;
  const shareText = `I just donated $${amount} cUSD to ${ngoName} on TrustBridge! 🌍💚`;

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent('https://trustbridge.app');
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-16 h-16" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold mb-3"
            >
              Donation Successful!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-emerald-100"
            >
              Thank you for supporting {ngoName}
            </motion.p>
          </div>

          {/* Transaction Details */}
          <div className="p-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount</span>
                  <span className="text-2xl font-bold text-emerald-600">${amount} cUSD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-semibold text-gray-900">{ngoName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmed
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Transaction Hash */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Transaction Hash</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white rounded-xl p-4 mb-4">
                <p className="font-mono text-sm text-gray-700 break-all">{txHash}</p>
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                View on Celo Explorer
                <ExternalLink className="w-5 h-5" />
              </a>
            </motion.div>

            {/* Share Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">Share Your Impact</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Inspire others to make a difference by sharing your donation!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex-1 px-6 py-3 bg-[#1DA1F2] text-white font-semibold rounded-xl hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-2"
                >
                  <Twitter className="w-5 h-5" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex-1 px-6 py-3 bg-[#1877F2] text-white font-semibold rounded-xl hover:bg-[#166fe5] transition-colors flex items-center justify-center gap-2"
                >
                  <Facebook className="w-5 h-5" />
                  Facebook
                </button>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="/dashboard" className="flex-1">
                <button className="w-full px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  Donate to Another NGO
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/" className="flex-1">
                <button className="w-full px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-emerald-600 hover:text-emerald-600 transition-all">
                  Back to Home
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Additional Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-gray-600"
        >
          <p className="text-lg">
            Your donation is making a real difference. Thank you for your generosity! 💚
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}