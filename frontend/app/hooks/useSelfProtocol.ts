import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { SelfVerificationResult } from '../config/selfProtocol';

/**
 * Hook for Self Protocol verification using popup window
 */
export function useSelfProtocol() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<SelfVerificationResult | null>(null);
  const { address, isConnected } = useAccount();

  // Listen for messages from Self Protocol popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin - check if it's from Self Protocol
      const selfProtocolOrigins = ['https://app.self.id', 'https://self.id'];
      if (!selfProtocolOrigins.some(origin => event.origin.startsWith(origin))) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const { type, data } = event.data || {};

      // Handle Self Protocol verification messages
      if (type === 'self_protocol_success' || type === 'success') {
        console.log('Self Protocol verification successful:', data);
        setResult({
          success: true,
          data: {
            userId: address || '',
            ...data,
          },
        });
        setIsVerifying(false);
      } else if (type === 'self_protocol_error' || type === 'error') {
        console.error('Self Protocol verification failed:', data);
        setResult({
          success: false,
          error: data?.message || data?.error || 'Verification failed',
        });
        setIsVerifying(false);
      } else if (type === 'self_protocol_cancelled' || type === 'cancelled') {
        console.log('Self Protocol verification cancelled');
        setResult({
          success: false,
          error: 'Verification cancelled by user',
        });
        setIsVerifying(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [address]);

  /**
   * Open Self Protocol verification popup
   */
  const verify = useCallback(() => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsVerifying(true);
    setResult(null);

    // Build verification URL - this would need to be implemented based on Self Protocol API
    const verificationUrl = `https://app.self.id/verify?userId=${address}`;
    const popupFeatures = 'width=500,height=700,left=100,top=100';

    // Open popup window
    const popup = window.open(
      verificationUrl,
      'SelfProtocolVerification',
      popupFeatures
    );

    if (!popup) {
      setIsVerifying(false);
      setResult({
        success: false,
        error: 'Popup blocked. Please allow popups for this site.',
      });
      return;
    }

    // Check if popup is closed (user might close it manually)
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (isVerifying && !result) {
          setIsVerifying(false);
          setResult({
            success: false,
            error: 'Verification window was closed',
          });
        }
      }
    }, 1000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(checkClosed);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
  }, [address, isConnected, isVerifying, result]);

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setResult(null);
    setIsVerifying(false);
  }, []);

  return {
    verify,
    reset,
    isVerifying,
    result,
  };
}







