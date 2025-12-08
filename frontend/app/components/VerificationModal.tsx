'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, DollarSign, UserCircle, CheckCircle2, ArrowRight, Loader2, Shield, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { SelfQRcodeWrapper, SelfAppBuilder, getUniversalLink } from '@selfxyz/qrcode';
import { createSelfAppConfig } from '../config/selfProtocol';
import { processSelfProtocolResult } from '../utils/selfProtocol';
import { useNgoRegistration } from '../hooks/useNgoRegistration';
import { NGORegistryContract } from '../abi';

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
    description: 'Verify your identity using Self Protocol',
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
  const [verificationStep, setVerificationStep] = useState<'intro' | 'qrcode' | 'mobile'>('intro');
  const [selfApp, setSelfApp] = useState<any | null>(null);
  const [universalLink, setUniversalLink] = useState('');
  const [ipfsProfile, setIpfsProfile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationProofData, setVerificationProofData] = useState<any | null>(null);
  
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { open } = useAppKit();
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
      setCurrentStep(steps.length);
    }
  }, [isConnected, isRegistered, isOpen]);

  // Initialize Self Protocol app when wallet is connected
  useEffect(() => {
    if (!isOpen || !address || currentStep !== 2) return;

    console.log('🔍 Initializing Self App...');
    console.log('🔍 User address:', address);
    console.log('🔍 Contract address:', NGORegistryContract.address);

    try {
      const config = createSelfAppConfig(address);
      
      console.log('🔍 Building Self App with config:', {
        ...config,
        endpoint: config.endpoint, // Log the endpoint (should be lowercase)
      });
      
      const app = new SelfAppBuilder(config).build();

      console.log('✅ Self App built successfully:', app);
      setSelfApp(app);

      // Generate universal link for mobile users
      const link = getUniversalLink(app);
      console.log('✅ Universal link generated:', link);
      setUniversalLink(link);
    } catch (error: unknown) {
      console.error('❌ Failed to initialize Self App:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize verification';
      setErrorMessage(errorMsg);
      console.error('Error details:', error);
    }
  }, [isOpen, address, currentStep]);

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

  // Handle successful verification from Self Protocol
  const handleSuccessfulVerification = async (proofData?: unknown) => {
    console.log('✅ Identity verified by Self Protocol!');
    console.log('Proof data received:', proofData);
    
    // Store the proof data for later use in registration
    setVerificationProofData(proofData);
    
    // Process the verification result
    const processedData = processSelfProtocolResult(proofData);
    
    if (processedData) {
      // Auto-advance to next step after successful verification
      setTimeout(() => {
        handleNextStep();
      }, 1000);
    } else {
      setErrorMessage('Failed to process verification result');
    }
  };

  // Handle verification error
  const handleVerificationError = (data?: any) => {
    console.error('❌ Verification failed:', data);
    
    // Extract error message from various possible formats
    let errorMsg = 'Verification failed. Please try again.';
    
    if (data) {
      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data.reason) {
        errorMsg = data.reason;
      } else if (data.error_code) {
        errorMsg = `Error: ${data.error_code}`;
      } else if (data.message) {
        errorMsg = data.message;
      } else if (data.error) {
        errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data.status) {
        errorMsg = `Verification failed with status: ${data.status}`;
      } else {
        // Try to stringify the object for debugging
        try {
          const errorStr = JSON.stringify(data);
          if (errorStr !== '{}') {
            errorMsg = `Verification failed: ${errorStr.substring(0, 200)}`;
          }
        } catch {
          errorMsg = 'Verification failed. Please try again.';
        }
      }
    }
    
    setErrorMessage(errorMsg);
    setVerificationStep('intro'); // Go back to intro to allow retry
  };

  // Start verification flow
  const handleStartVerification = (method: 'desktop' | 'mobile') => {
    if (!address) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!selfApp) {
      setErrorMessage('Self App not initialized. Please try again.');
      return;
    }

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

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  if (!isOpen) return null;

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

                    {/* Step 1: Connect Wallet */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        {!isConnected ? (
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

                    {/* Step 2: Self Protocol Verification */}
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
                        ) : !selfApp ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex flex-col items-center text-center">
                              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                              <h4 className="font-semibold text-gray-900 mb-2">Initializing Self Protocol...</h4>
                              <p className="text-sm text-gray-600">Setting up identity verification</p>
                            </div>
                          </div>
                        ) : verificationStep === 'intro' ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h3 className="font-semibold text-blue-900 mb-2">Why verify?</h3>
                              <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>Access to NGO registration</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>Secure and privacy-preserving</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>One-time verification process</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>Age 18+ and compliance checks</span>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-3">
                                Self Protocol uses zero-knowledge proofs to verify your identity without sharing personal data on-chain.
                              </p>
                              <p className="text-xs text-gray-600 font-medium mb-2">Choose your device:</p>
                            </div>

                            {/* Desktop Verification */}
                            <button
                              onClick={() => handleStartVerification('desktop')}
                              disabled={!selfApp}
                              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              <Monitor className="h-5 w-5" />
                              <div className="text-left">
                                <div>Verify on Desktop</div>
                                <div className="text-xs opacity-90">Scan QR code with Self app</div>
                              </div>
                            </button>

                            {/* Mobile Verification */}
                            <button
                              onClick={() => handleStartVerification('mobile')}
                              disabled={!selfApp || !universalLink}
                              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              <Smartphone className="h-5 w-5" />
                              <div className="text-left">
                                <div>Verify on Mobile</div>
                                <div className="text-xs opacity-90">Open Self app directly</div>
                              </div>
                            </button>
                          </motion.div>
                        ) : verificationStep === 'qrcode' ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                              <p className="text-sm font-medium text-gray-900 mb-2">
                                Scan with Self App
                              </p>
                              <p className="text-xs text-gray-600 mb-4">
                                Use your phone&apos;s Self app to scan this QR code
                              </p>
                              
                              {/* Self Protocol QR Code Component */}
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

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-900 font-medium mb-2">Instructions:</p>
                              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Open the Self app on your mobile device</li>
                                <li>Tap &quot;Scan QR Code&quot;</li>
                                <li>Complete the verification steps in the app</li>
                                <li>You&apos;ll be verified automatically</li>
                              </ol>
                            </div>

                            <button
                              onClick={() => setVerificationStep('intro')}
                              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                              ← Back to options
                            </button>
                          </motion.div>
                        ) : verificationStep === 'mobile' ? (
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

                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-700 font-medium mb-2">What happens next:</p>
                              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                                <li>The Self app will open on your device</li>
                                <li>Complete the verification steps</li>
                                <li>Return here when done</li>
                              </ol>
                            </div>

                            <button
                              onClick={() => setVerificationStep('intro')}
                              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                              ← Back to options
                            </button>
                          </motion.div>
                        ) : null}

                        {errorMessage && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-semibold text-red-900 mb-1">Verification Error</h5>
                                <p className="text-sm text-red-700 mb-3">{errorMessage}</p>
                                <button
                                  onClick={() => {
                                    setErrorMessage('');
                                    setVerificationStep('intro');
                                  }}
                                  className="text-sm text-red-600 hover:text-red-800 underline font-medium"
                                >
                                  Try Again
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Approve Registration Fee */}
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

                    {/* Step 4: Register NGO */}
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
                                      if (verificationProofData) {
                                        registerNGO(verificationProofData, ipfsProfile || 'QmPlaceholder');
                                      } else {
                                        setErrorMessage('Verification proof not found. Please verify your identity first.');
                                      }
                                    }}
                                    disabled={isRegistering || !ipfsProfile || !verificationProofData}
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
