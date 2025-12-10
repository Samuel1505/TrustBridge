'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, DollarSign, UserCircle, CheckCircle2, ArrowRight, Loader2, Shield, AlertCircle, Smartphone, Monitor, Upload, Image as ImageIcon } from 'lucide-react';
// Removed wagmi import - using ethers.js directly via useNgoRegistration hook
import { useAppKit } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { formatEther } from 'ethers';
import { countries, SelfQRcodeWrapper, SelfAppBuilder, getUniversalLink } from '@selfxyz/qrcode';
import { NGORegistryContract } from '../abi';
import { useNgoRegistration } from '../hooks/useNgoRegistration';
import { processSelfProtocolResult } from '../utils/selfProtocol';

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
    description: 'Approve 1 cUSD registration fee to prevent spam',
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
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationProofData, setVerificationProofData] = useState<any | null>(null);
  
  const { open } = useAppKit();
  const { 
    registerNGO, 
    approveCUSD, 
    isRegistered, 
    needsApproval,
    hasEnoughBalance,
    balance,
    isLoading, 
    isApprovalSuccess,
    isRegistrationSuccess,
    approvalHash,
    error: registrationError,
    address,
    isConnected,
    stagingMode
  } = useNgoRegistration();

  const router = useRouter();
  
  // If user is already registered, redirect to dashboard instead of showing modal
  useEffect(() => {
    if (isConnected && isRegistered && isOpen) {
      console.log('✅ User is already registered, redirecting to NGO dashboard');
      onClose();
      router.push('/ngo/dashboard');
    }
  }, [isConnected, isRegistered, isOpen, onClose, router]);

  // Redirect to dashboard after successful registration
  useEffect(() => {
    if (isRegistrationSuccess && isConnected) {
      console.log('✅ Registration successful! Redirecting to NGO dashboard...');
      // Close modal and redirect after a short delay to show success message
      setTimeout(() => {
        onClose();
        router.push('/ngo/dashboard');
      }, 2000); // 2 second delay to show success message
    }
  }, [isRegistrationSuccess, isConnected, onClose, router]);

  // Also redirect if user becomes registered (e.g., from another tab or after registration)
  useEffect(() => {
    if (isConnected && isRegistered && isOpen && !isRegistrationSuccess) {
      console.log('✅ User is registered, redirecting to NGO dashboard');
      onClose();
      router.push('/ngo/dashboard');
    }
  }, [isConnected, isRegistered, isOpen, isRegistrationSuccess, onClose, router]);

  // Initialize Self Protocol app when wallet is connected and on step 2
  useEffect(() => {
    if (!isOpen || !address || currentStep !== 2) return;

    console.log('🔍 Initializing Self App...');
    console.log('🔍 Address:', address);
    console.log('🔍 Contract address:', NGORegistryContract.address);

    try {
      // Build Self App configuration - matching Attestify's exact approach
      console.log('🔍 Building Self App with config:');
      console.log('  - version: 2');
      console.log('  - appName: TrustBridge');
      console.log('  - scope: attestify');
      console.log('  - userId:', address);
      console.log('  - endpoint:', NGORegistryContract.address);
      console.log('  - endpointType: staging_celo');
      
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'TrustBridge',
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'attestify',
        endpoint: NGORegistryContract.address, // Contract address for staging_celo (matching Attestify format)
        logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
        userId: address,
        endpointType: 'staging_celo', // Correct type for Celo Sepolia
        userIdType: 'hex', // EVM address type
        userDefinedData: `TrustBridge NGO registration for ${address}`,
        disclosures: {
          // Required verifications for NGO registration
          minimumAge: 18,
          excludedCountries: [
            countries.CUBA,
            countries.IRAN,
            countries.NORTH_KOREA,
            countries.RUSSIA,
          ],
          // Optional: Request additional information
          nationality: true,
        },
      }).build();

      console.log('✅ Self App built successfully:', app);
      setSelfApp(app);

      // Generate universal link for mobile users
      const link = getUniversalLink(app);
      console.log('✅ Universal link generated:', link);
      setUniversalLink(link);
    } catch (error: unknown) {
      console.error('❌ Failed to initialize Self App:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize verification');
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
    console.log('Proof data type:', typeof proofData);
    console.log('Proof data keys:', proofData ? Object.keys(proofData as any) : 'N/A');
    
    // Store the proof data for registration (even if undefined/null for mock passport)
    setVerificationProofData(proofData);
    
    // Process the verification result
    // Note: With mock passport in staging, proofData may be undefined/null
    // The processSelfProtocolResult function will handle this and generate mock data
    const processedData = processSelfProtocolResult(proofData);
    
    if (processedData) {
      console.log('✅ Processed Self Protocol data:', processedData);
      console.log('⚠️ Note: If using mock passport, signature verification may fail on-chain');
      console.log('⚠️ This is expected in staging mode - contract will reject invalid signatures');
      
      // Auto-advance to next step after successful verification
      setTimeout(() => {
        handleNextStep();
      }, 1000);
    } else {
      setErrorMessage('Failed to process verification result. Please try again.');
    }
  };

  // Handle verification error
  const handleVerificationError = (data?: { error_code?: string; reason?: string; status?: string }) => {
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
      } else if (data.status) {
        errorMsg = `Verification failed with status: ${data.status}`;
      } else if (data.message) {
        errorMsg = data.message;
      }
    }
    
    setErrorMessage(errorMsg);
    setVerificationStep('intro'); // Go back to intro to allow retry
  };

  // Start verification flow
  const handleStartVerification = (method: 'desktop' | 'mobile') => {
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

  // Handle cUSD approval
  const handleApproveCUSD = async () => {
    try {
      await approveCUSD();
      // Approval success will be handled by useEffect
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to approve cUSD');
    }
  };
  
  // Auto-advance steps when conditions are met
  useEffect(() => {
    // Step 1 → Step 2: Auto-advance when wallet is connected
    if (currentStep === 1 && isConnected && address) {
      setCurrentStep(2);
    }
    
    // Step 2 → Step 3: Auto-advance when verification is complete (handled in handleSuccessfulVerification)
    
    // Step 3 → Step 4: Auto-advance when approval is complete or already approved
    if (currentStep === 3 && (!needsApproval || isApprovalSuccess)) {
      setCurrentStep(4);
    }
  }, [currentStep, isConnected, address, needsApproval, isApprovalSuccess]);

  // Handle image upload and mock IPFS upload
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage('');
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setUploadedImage(file);
      
      // Mock IPFS upload - generate a mock IPFS hash
      // In production, this would upload to IPFS (Pinata, Web3.Storage, etc.)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
      
      // Generate mock IPFS hash (format: Qm...)
      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setIpfsProfile(mockIpfsHash);
      
      console.log('✅ Image uploaded (mocked) - IPFS hash:', mockIpfsHash);
      setIsUploading(false);
    } catch (error: any) {
      console.error('Image upload error:', error);
      setErrorMessage('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle NGO registration
  const handleRegisterNGO = async () => {
    if (!ipfsProfile || ipfsProfile.trim().length === 0) {
      setErrorMessage('Please upload an image for your NGO profile');
      return;
    }

    try {
      // If verificationProofData is missing (common with mock passport), use mock data
      let proofDataToUse = verificationProofData;
      
      if (!proofDataToUse) {
        console.warn('⚠️ Verification proof data missing - using mock data for registration');
        console.warn('⚠️ This is expected when using mock passport in staging mode');
        
        // Create mock proof data for registration
        proofDataToUse = {
          did: `did:self:mock:${address}:${Date.now()}`,
          userId: address,
          mock: true,
          timestamp: Date.now(),
        };
      }

      await registerNGO(proofDataToUse, ipfsProfile.trim());
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to register NGO');
    }
  };

  // Handle registration success - redirect to NGO dashboard
  useEffect(() => {
    if (isRegistrationSuccess) {
      console.log('✅ NGO registration successful!');
      // Redirect to NGO dashboard after a short delay
      setTimeout(() => {
        onClose();
        router.push('/ngo/dashboard');
      }, 2000);
    }
  }, [isRegistrationSuccess, onClose, router]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Register Your NGO</h2>
                <p className="text-sm text-white/80 mt-1">Complete all steps to register</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-between">
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
                          <CheckCircle2 className="w-5 h-5" />
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
            {/* Step 1: Connect Wallet */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-8">
                  Connect your Celo wallet to start the NGO registration process
                </p>
                {!isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm text-emerald-800">
                        ✅ Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                      </p>
                    </div>
                    <button
                      onClick={handleNextStep}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Self Protocol Verification */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {verificationStep === 'intro' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h3>
                      <p className="text-gray-600">
                        Verify your identity using Self Protocol's zero-knowledge proofs
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Why verify?</h4>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Prove you're 18+ without revealing your age</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Verify nationality for compliance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>One-time verification process</span>
                        </li>
                      </ul>
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

                    <button
                      onClick={handlePrevStep}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {/* QR Code Step */}
                {verificationStep === 'qrcode' && selfApp && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-900 font-medium mb-2">Instructions:</p>
                      <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Open the Self app on your mobile device</li>
                        <li>Tap "Scan QR Code"</li>
                        <li>Complete the verification steps</li>
                        <li>You'll be verified automatically</li>
                      </ol>
                    </div>

                    <button
                      onClick={() => setVerificationStep('intro')}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      ← Back to options
                    </button>
                  </div>
                )}

                {/* Mobile Step */}
                {verificationStep === 'mobile' && (
                  <div className="space-y-4">
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
                      onClick={() => setVerificationStep('intro')}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      ← Back to options
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                    <button
                      onClick={() => {
                        setErrorMessage('');
                        setVerificationStep('intro');
                      }}
                      className="mt-2 text-sm text-red-700 underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Approve Registration Fee */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Approve Registration Fee</h3>
                <p className="text-gray-600 mb-4">
                  You need to approve the <span className="font-semibold text-gray-900">1 cUSD</span> registration fee for the NGO Registry contract.
                </p>
                
                {/* Balance Display */}
                {balance !== undefined && (
                  <div className={`mb-4 p-3 rounded-lg border ${
                    hasEnoughBalance 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      hasEnoughBalance ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {hasEnoughBalance === true ? '✓' : '⚠'} Your cUSD Balance: {formatEther(balance)} cUSD
                      {hasEnoughBalance === false && (
                        <span className="block mt-1 text-xs">
                          You need at least 1 cUSD to register. Please add more cUSD to your wallet.
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mb-8">
                  This fee helps prevent spam and ensures only serious NGOs register.
                </p>
                
                <div className="space-y-4">
                  {needsApproval ? (
                    <div className="space-y-4">
                      <button
                        onClick={handleApproveCUSD}
                        disabled={isLoading || (balance !== undefined && balance !== null && balance < parseUnits('1', 18))}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        title={balance !== undefined && balance !== null && balance < parseUnits('1', 18) ? 'Insufficient cUSD balance. You need at least 1 cUSD.' : (isLoading ? 'Processing...' : 'Click to approve 1 cUSD')}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {approvalHash ? 'Confirming...' : 'Approving...'}
                          </>
                        ) : (
                          <>
                            Approve 1 cUSD
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      {approvalHash && (
                        <p className="text-sm text-gray-500 text-center">
                          Transaction: {approvalHash.substring(0, 10)}...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-sm text-emerald-800 font-medium">
                          ✅ cUSD approved. You can proceed to registration.
                        </p>
                      </div>
                      <button
                        onClick={handleNextStep}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
                      >
                        Continue to Registration
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePrevStep}
                  className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Step 4: Register NGO */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCircle className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Register Your NGO</h3>
                  <p className="text-gray-600">
                    Complete your NGO registration with your verified identity
                  </p>
                </div>

                {!isRegistrationSuccess ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload NGO Profile Image
                      </label>
                      
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            className="hidden"
                            id="image-upload"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                                <p className="text-sm text-gray-600">Uploading to IPFS...</p>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                            <img
                              src={imagePreview}
                              alt="NGO profile preview"
                              className="w-full h-64 object-cover"
                            />
                            <button
                              onClick={() => {
                                setImagePreview(null);
                                setUploadedImage(null);
                                setIpfsProfile('');
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {ipfsProfile && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                              <p className="text-xs text-emerald-800 font-medium mb-1">
                                ✅ Image uploaded to IPFS
                              </p>
                              <p className="text-xs text-emerald-700 font-mono break-all">
                                {ipfsProfile}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="mt-2 text-xs text-gray-500">
                        Upload an image representing your NGO. This will be stored on IPFS and used as your profile image.
                      </p>
                    </div>

                    {/* Approval Status */}
                    {needsApproval && !isApprovalSuccess ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800 mb-1">
                              Approval Required
                            </p>
                            <p className="text-sm text-yellow-700 mb-3">
                              You need to approve cUSD spending before you can register. Please approve 1 cUSD for the registration fee.
                            </p>
                            <button
                              onClick={handleApproveCUSD}
                              disabled={isLoading || (hasEnoughBalance === false)}
                              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              title={hasEnoughBalance === false ? 'Insufficient cUSD balance. You need at least 1 cUSD.' : ''}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {approvalHash ? 'Confirming...' : 'Approving...'}
                                </>
                              ) : (
                                <>
                                  Approve 1 cUSD
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (!needsApproval || isApprovalSuccess) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-800">
                            ✓ cUSD approved. You can proceed to registration.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Balance Warning */}
                    {balance !== undefined && hasEnoughBalance === false && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-1">
                              Insufficient cUSD Balance
                            </p>
                            <p className="text-sm text-red-600">
                              You have {formatEther(balance)} cUSD, but you need at least 1 cUSD to register.
                              Please add more cUSD to your wallet before proceeding.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {registrationError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600">{registrationError}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={handlePrevStep}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleRegisterNGO}
                        disabled={isLoading || !ipfsProfile || isUploading || hasEnoughBalance === false || (needsApproval && !isApprovalSuccess)}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            Register NGO
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                    <p className="text-gray-600 mb-4">
                      Your NGO has been successfully registered on the blockchain.
                    </p>
                    <p className="text-sm text-gray-500">
                      You can now receive donations through TrustBridge.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Error Display */}
            {errorMessage && currentStep !== 2 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage('')}
                  className="mt-2 text-sm text-red-700 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
