'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, Upload, DollarSign, UserCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useSelfProtocol } from '../hooks/useSelfProtocol';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { useNgoRegistration } from '../hooks/useNgoRegistration';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    description: 'Scan QR code with Self Protocol app to verify your identity',
    icon: QrCode,
  },
  {
    id: 3,
    title: 'Approve Registration Fee',
    description: 'Approve 10 cUSD registration fee to prevent spam',
    icon: DollarSign,
  },
  {
    id: 4,
    title: 'Register NGO',
    description: 'Complete registration with your verified identity',
    icon: UserCircle,
  },
];

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [ipfsProfile, setIpfsProfile] = useState('');
  
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { open } = useAppKit();
  const { verify, reset, isVerifying, result: verificationResult } = useSelfProtocol();
  const { 
    registerNGO, 
    approveCUSD, 
    isRegistered, 
    needsApproval, 
    isLoading: isRegistering, 
    isSuccess: registrationSuccess,
    error: registrationError 
  } = useNgoRegistration();

  // Check if user is already registered - skip verification if so
  useEffect(() => {
    if (isConnected && isRegistered && isOpen) {
      // User is already registered, show message and close
      setCurrentStep(steps.length);
    }
  }, [isConnected, isRegistered, isOpen]);

  // Auto-advance to next step on successful verification
  useEffect(() => {
    if (verificationResult?.success && currentStep === 2) {
      setTimeout(() => {
        handleNextStep();
      }, 1000);
    }
  }, [verificationResult, currentStep]);

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

  const handleStartVerification = () => {
    try {
      verify();
    } catch (error: any) {
      console.error('Failed to start verification:', error);
    }
  };

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

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
              className={`bg-white rounded-3xl shadow-2xl w-full max-h-[95vh] overflow-hidden flex flex-col ${
                currentStep === 2 ? 'max-w-3xl' : 'max-w-2xl'
              }`}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Verify Your Identity</h2>
                    <p className="text-emerald-100 mt-1">
                      Step {currentStep} of {steps.length}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: index < currentStep ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {currentStepData.title}
                    </h3>
                    <p className="text-gray-600 mb-8">
                      {currentStepData.description}
                    </p>

                    {/* Step-specific content */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        {!isConnected ? (
                          <>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                              <div className="flex items-start gap-3">
                                <Wallet className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    Connect Your Celo Wallet
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-4">
                                    You'll need a Celo wallet to register your NGO and receive donations. We support MetaMask, Valora, and other popular wallets.
                                  </p>
                                  <button
                                    onClick={handleConnectWallet}
                                    className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Wallet className="w-5 h-5" />
                                    Connect Wallet
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Wallet Connected!</h4>
                                <p className="text-sm text-gray-600">You can now proceed to the next step.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        {!isConnected ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <Wallet className="w-6 h-6 text-yellow-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Please Connect Wallet First</h4>
                                <p className="text-sm text-gray-600">You need to connect your wallet before verifying your identity.</p>
                              </div>
                            </div>
                          </div>
                        ) : verificationResult?.success ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Verification Successful!</h4>
                                <p className="text-sm text-gray-600">Your identity has been verified. Proceeding to next step...</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center mb-6">
                                <QrCode className="w-16 h-16 text-blue-600" />
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Verify Your Identity with Self Protocol
                              </h4>
                              <p className="text-sm text-gray-600 mb-6">
                                Click the button below to open Self Protocol verification in a popup window. 
                                You'll need to verify your identity using your biometric passport or national ID.
                              </p>
                              <button
                                onClick={handleStartVerification}
                                disabled={isVerifying}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isVerifying ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                  </>
                                ) : (
                                  <>
                                    <QrCode className="w-5 h-5" />
                                    Start Verification
                                  </>
                                )}
                              </button>
                              {verificationResult && !verificationResult.success && (
                                <div className="mt-6 w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <h5 className="font-semibold text-red-900 mb-2">Verification Failed</h5>
                                  <p className="text-sm text-red-700 mb-3">
                                    {verificationResult.error || 'Verification failed. Please try again.'}
                                  </p>
                                  <button
                                    onClick={() => {
                                      reset();
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Try Again
                                  </button>
                                </div>
                              )}
                              {isVerifying && (
                                <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    A popup window should open. If it doesn't, please allow popups for this site.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        {isRegistered ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Already Registered!</h4>
                                <p className="text-sm text-gray-600">You are already registered as an NGO. No need to verify again.</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                              <DollarSign className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Registration Fee: 10 cUSD
                                </h4>
                                <p className="text-sm text-gray-600 mb-4">
                                  This small fee helps prevent spam and fake registrations. It's a one-time payment.
                                </p>
                                <div className="bg-white rounded-lg p-4 mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Amount</span>
                                    <span className="font-semibold text-gray-900">10 cUSD</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Network Fee</span>
                                    <span className="font-semibold text-gray-900">~0.001 CELO</span>
                                  </div>
                                </div>
                                {needsApproval ? (
                                  <button
                                    onClick={approveCUSD}
                                    disabled={isRegistering}
                                    className="w-full px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {isRegistering ? (
                                      <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Approving...
                                      </>
                                    ) : (
                                      'Approve cUSD'
                                    )}
                                  </button>
                                ) : (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-green-700">✓ cUSD approved. You can proceed to registration.</p>
                                  </div>
                                )}
                                {registrationError && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{registrationError}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        {isRegistered ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Registration Complete!</h4>
                                <p className="text-sm text-gray-600">You are already registered as an NGO.</p>
                              </div>
                            </div>
                          </div>
                        ) : registrationSuccess ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Registration Successful!</h4>
                                <p className="text-sm text-gray-600">Your NGO has been registered on TrustBridge.</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                              <UserCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-4">
                                  Register Your NGO
                                </h4>
                                <p className="text-sm text-gray-600 mb-4">
                                  Enter your IPFS profile hash (or use a placeholder for now)
                                </p>
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    placeholder="IPFS Profile Hash (e.g., QmXxxx...)"
                                    value={ipfsProfile}
                                    onChange={(e) => setIpfsProfile(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <button
                                    onClick={() => {
                                      if (verificationResult?.success && verificationResult.data?.processed) {
                                        registerNGO(verificationResult.data, ipfsProfile || 'QmPlaceholder');
                                      }
                                    }}
                                    disabled={isRegistering || !verificationResult?.success || !ipfsProfile}
                                    className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {isRegistering ? (
                                      <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Registering...
                                      </>
                                    ) : (
                                      'Register NGO'
                                    )}
                                  </button>
                                </div>
                                {registrationError && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{registrationError}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={currentStep === steps.length ? onClose : handleNextStep}
                    disabled={currentStep === 1 && !isConnected}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {currentStep === steps.length ? 'Complete Registration' : 'Continue'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}