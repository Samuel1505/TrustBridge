'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VerificationModal from './VerificationModal';
import DonorVerificationModal from './DonorVerificationModal';
import { useNgoRegistration } from '../hooks/useNgoRegistration';
import { useDonorVerification } from '../hooks/useDonorVerification';

export default function Hero() {
  const [isNgoModalOpen, setIsNgoModalOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const router = useRouter();
  
  // Use the registration hook to check if user is registered as NGO
  const { isRegistered, address, isConnected, isLoading } = useNgoRegistration();
  
  // Use the donor verification hook to check if user is verified as donor
  const { isDonorVerified, isChecking: isCheckingDonor } = useDonorVerification();
  
  // Handle "Register as NGO" button - redirect if already registered
  const handleRegisterNGO = () => {
    if (isRegistered) {
      router.push('/ngo/dashboard');
    } else {
      setIsNgoModalOpen(true);
    }
  };
  
  // Handle "Verify as Donor" button - redirect if already verified
  const handleVerifyDonor = () => {
    if (isDonorVerified) {
      // Redirect to browse NGOs page (you may need to create this page)
      router.push('/');
    } else {
      setIsDonorModalOpen(true);
    }
  };
  
  // Don't show button text until we've checked registration status
  const ngoButtonText = isLoading 
    ? 'Checking...' 
    : (isRegistered ? 'Go to Dashboard' : 'Register as NGO');
  
  const donorButtonText = isCheckingDonor
    ? 'Checking...'
    : (isDonorVerified ? 'Browse NGOs' : 'Verify as Donor');

  // Auto-redirect if user becomes registered (e.g., after successful registration)
  useEffect(() => {
    if (isConnected && isRegistered && isNgoModalOpen) {
      console.log('✅ User is now registered, closing modal and redirecting to dashboard');
      setIsNgoModalOpen(false);
      router.push('/ngo/dashboard');
    }
  }, [isConnected, isRegistered, isNgoModalOpen, router]);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Verified Donations
              <span className="block text-emerald-600">on Blockchain</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              TrustBridge connects verified NGOs with donors through transparent, 
              blockchain-powered donations. Every contribution is traceable and secure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {/* Show NGO button only if not verified as donor */}
              {!isDonorVerified && (
                <button 
                  onClick={handleRegisterNGO}
                  disabled={isLoading}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ngoButtonText}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              )}
              
              {/* Show Donor button only if not registered as NGO */}
              {!isRegistered && (
                <button
                  onClick={handleVerifyDonor}
                  disabled={isCheckingDonor}
                  className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {donorButtonText}
                  {!isCheckingDonor && <CheckCircle2 className="w-5 h-5" />}
                </button>
              )}
              
              {/* If user is registered as NGO, show dashboard button */}
              {isRegistered && (
                <button 
                  onClick={() => router.push('/ngo/dashboard')}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 justify-center"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              
              {/* If user is verified as donor, show browse button */}
              {isDonorVerified && !isRegistered && (
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 justify-center"
                >
                  Browse NGOs
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Verified NGOs Only</h3>
                  <p className="text-gray-600 text-sm">
                    All NGOs are verified through Self Protocol identity verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Transparent Donations</h3>
                  <p className="text-gray-600 text-sm">
                    Every donation is recorded on-chain and publicly verifiable
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Low Fees</h3>
                  <p className="text-gray-600 text-sm">
                    Built on Celo for fast, low-cost transactions
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Illustration/Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl p-12 text-center">
              <div className="mb-8">
                <Heart className="w-24 h-24 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Building Trust Through Transparency
                </h2>
                <p className="text-gray-700">
                  Join NGOs and donors creating positive impact with verified, 
                  transparent donations on the blockchain.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">100%</div>
                  <div className="text-sm text-gray-600">Transparent</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">Verified</div>
                  <div className="text-sm text-gray-600">NGOs Only</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <VerificationModal 
        isOpen={isNgoModalOpen} 
        onClose={() => setIsNgoModalOpen(false)} 
      />
      <DonorVerificationModal 
        isOpen={isDonorModalOpen} 
        onClose={() => setIsDonorModalOpen(false)}
        onVerified={() => {
          setIsDonorModalOpen(false);
          router.push('/dashboard');
        }}
      />
    </section>
  );
}
