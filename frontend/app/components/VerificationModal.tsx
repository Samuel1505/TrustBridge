'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, Upload, DollarSign, UserCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

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
    title: 'Submit Credential',
    description: 'Upload your verification credential from Self Protocol',
    icon: Upload,
  },
  {
    id: 4,
    title: 'Pay Registration Fee',
    description: 'Pay 1 cUSD registration fee to prevent spam',
    icon: DollarSign,
  },
  {
    id: 5,
    title: 'Create NGO Profile',
    description: 'Complete your NGO profile with mission and details',
    icon: UserCircle,
  },
];

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { isConnected } = useAccount();
  const { open } = useAppKit();

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
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
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
              <div className="p-8">
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
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="w-48 h-48 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4">
                              <QrCode className="w-32 h-32 text-gray-400" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Scan with Self Protocol App
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Download the Self Protocol mobile app and scan this QR code to verify your biometric passport or national ID.
                            </p>
                            <div className="flex gap-3">
                              <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Download for iOS
                              </button>
                              <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Download for Android
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Upload Verification Credential
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            After completing verification in the Self Protocol app, upload your credential file here.
                          </p>
                          <button className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                            Choose File
                          </button>
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                          <div className="flex items-start gap-3">
                            <DollarSign className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Registration Fee: 1 cUSD
                              </h4>
                              <p className="text-sm text-gray-600 mb-4">
                                This small fee helps prevent spam and fake registrations. It's a one-time payment.
                              </p>
                              <div className="bg-white rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-600">Amount</span>
                                  <span className="font-semibold text-gray-900">1 cUSD</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Network Fee</span>
                                  <span className="font-semibold text-gray-900">~0.001 CELO</span>
                                </div>
                              </div>
                              <button className="w-full px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors">
                                Pay Registration Fee
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                          <div className="flex items-start gap-3">
                            <UserCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-4">
                                Create Your NGO Profile
                              </h4>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Organization Name"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <textarea
                                  placeholder="Mission Statement (300 characters max)"
                                  rows={3}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                  type="email"
                                  placeholder="Contact Email"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                  type="url"
                                  placeholder="Website (optional)"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
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