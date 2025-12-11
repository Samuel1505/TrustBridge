'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle, AlertCircle, Loader2, Smartphone, Monitor, Wallet, QrCode } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { countries, SelfQRcodeWrapper, SelfAppBuilder, getUniversalLink } from '@selfxyz/qrcode';
import { NGORegistryContract } from '../abi';
import { useRouter } from 'next/navigation';
import { useDonorVerification } from '../hooks/useDonorVerification';

interface DonorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Connect Wallet',
    description: 'Connect your Celo wallet to get started',
    icon: Wallet,
  },
  {
    id: 2,
    title: 'Self Protocol Verification',
    description: 'Verify your identity using Self Protocol',
    icon: QrCode,
  },
];

export default function DonorVerificationModal({ isOpen, onClose, onVerified }: DonorVerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationStep, setVerificationStep] = useState<'intro' | 'qrcode' | 'mobile'>('intro');
  const [errorMessage, setErrorMessage] = useState('');
  const [selfApp, setSelfApp] = useState<any | null>(null);
  const [universalLink, setUniversalLink] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'desktop' | 'mobile'>('desktop');
  
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const router = useRouter();
  const { isNgoRegistered, isDonorVerified, isChecking, markDonorVerified } = useDonorVerification();

  // Check if user is already verified as donor
  useEffect(() => {
    if (isOpen && isConnected && isDonorVerified) {
      console.log('✅ User is already verified as donor');
      onVerified();
      onClose();
    }
  }, [isOpen, isConnected, isDonorVerified, onVerified, onClose]);

  // Check if user is registered as NGO - prevent verification
  useEffect(() => {
    if (isOpen && isConnected && !isChecking && isNgoRegistered) {
      setErrorMessage('You are registered as an NGO. NGOs cannot verify as donors. You can only be either an NGO or a donor, not both.');
    }
  }, [isOpen, isConnected, isChecking, isNgoRegistered]);

  // Initialize Self App when wallet is connected and on step 2
  useEffect(() => {
    if (!isOpen || !address || currentStep !== 2) return;

    console.log('🔍 Initializing Self App for donor verification...');
    console.log('🔍 Address:', address);
    console.log('🔍 Contract address:', NGORegistryContract.address);

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'attestify',
        endpoint: NGORegistryContract.address,
        logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
        userId: address,
        endpointType: 'staging_celo',
        userIdType: 'hex',
        userDefinedData: `TrustBridge donor verification for ${address}`,
        disclosures: {
          minimumAge: 18,
          excludedCountries: [
            countries.CUBA,
            countries.IRAN,
            countries.NORTH_KOREA,
            countries.RUSSIA,
          ],
          nationality: true,
        },
      }).build();

      console.log('✅ Self App built successfully:', app);
      setSelfApp(app);

      const link = getUniversalLink(app);
      console.log('✅ Universal link generated:', link);
      setUniversalLink(link);
    } catch (error: unknown) {
      console.error('❌ Failed to initialize Self App:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize verification');
    }
  }, [isOpen, address, currentStep]);

  // Handle successful verification
  const handleSuccessfulVerification = async (proofData?: unknown) => {
    console.log('✅ Identity verified by Self Protocol!');
    console.log('Proof data received:', proofData);
    
    // Mark donor as verified
    markDonorVerified(proofData);
    
    // Move to success step
    setCurrentStep(3);
    
    // Call onVerified callback and redirect after a delay
    setTimeout(() => {
      onVerified();
      router.push('/');
    }, 2000);
  };

  // Handle verification error
  const handleVerificationError = (data?: { error_code?: string; reason?: string; status?: string }) => {
    console.error('❌ Verification failed:', data);
    
    let errorMsg = 'Verification failed. Please try again.';
    
    if (data) {
      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data.reason) {
        errorMsg = data.reason;
      } else if (data.error_code) {
        errorMsg = `Error: ${data.error_code}`;
      } else if (data.status) {
        errorMsg = `Verification failed with status: ${data.status}`;
      } else if (data.message) {
        errorMsg = data.message;
      }
    }
    
    setErrorMessage(errorMsg);
    setVerificationStep('intro');
  };

  const handleConnectWallet = () => {
    open();
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Start verification flow
  const handleStartVerification = (method: 'desktop' | 'mobile') => {
    if (!address) {
      open();
      return;
    }

    if (!selfApp) {
      setErrorMessage('Self App not initialized. Please try again.');
      return;
    }

    // Check if user is NGO
    if (isNgoRegistered) {
      setErrorMessage('You are registered as an NGO. NGOs cannot verify as donors.');
      return;
    }

    setVerificationMethod(method);
    
    if (method === 'desktop') {
      setVerificationStep('qrcode');
    } else {
      setVerificationStep('mobile');
    }
  };

  // Open Self App on mobile
  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, '_blank');
  };

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setVerificationStep('intro');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Donor Verification</h2>
                <p className="text-sm text-white/80 mt-1">Verify your identity to browse and donate</p>
              </div>
              {currentStep === 1 && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between mt-6">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-white text-emerald-600'
                            : isActive
                            ? 'bg-white text-emerald-600 ring-4 ring-white/50'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isActive ? 'text-white font-semibold' : 'text-white/60'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {stepNumber < steps.length && (
                      <div
                        className={`h-1 flex-1 mx-2 -mt-6 ${
                          isCompleted ? 'bg-white' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'intro' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Why verify?</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Access verified NGOs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Make secure donations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Track your donations</span>
                    </li>
                  </ul>
                </div>

                {!isConnected ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Please connect your wallet first
                    </p>
                    <button
                      onClick={open}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm text-emerald-800">
                        ✅ Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStartVerification('desktop')}
                        disabled={!selfApp}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        <Monitor className="h-5 w-5" />
                        <div className="text-left">
                          <div>Verify on Desktop</div>
                          <div className="text-xs opacity-90">Scan QR code</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleStartVerification('mobile')}
                        disabled={!selfApp || !universalLink}
                        className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        <Smartphone className="h-5 w-5" />
                        <div className="text-left">
                          <div>Verify on Mobile</div>
                          <div className="text-xs opacity-90">Open Self app</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* QR Code Step */}
            {step === 'qrcode' && selfApp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Scan with Self App
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Use your phone's Self app to scan this QR code
                  </p>
                  
                  <div className="flex justify-center bg-white rounded-xl p-4">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleSuccessfulVerification}
                      onError={handleVerificationError}
                      size={280}
                      darkMode={false}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep('intro')}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Mobile Step */}
            {step === 'mobile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <div className="h-16 w-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Open Self App
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Complete verification directly in your Self mobile app
                  </p>

                  <button
                    onClick={openSelfApp}
                    disabled={!universalLink}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    Open Self App
                  </button>
                </div>

                <button
                  onClick={() => setStep('intro')}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Successful!</h3>
                <p className="text-sm text-gray-600">Redirecting to browse NGOs...</p>
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mt-4" />
              </motion.div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
                  <p className="text-sm text-gray-600">{errorMessage}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('intro');
                      setErrorMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}






