import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  SELF_PROTOCOL_CONFIG,
  buildVerificationUrl,
  isValidSelfProtocolOrigin,
  getPopupFeatures,
  type SelfVerificationResult,
} from '../config/selfProtocol';

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
      // Validate origin
      if (!isValidSelfProtocolOrigin(event.origin)) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const { type, data } = event.data || {};

      switch (type) {
        case SELF_PROTOCOL_CONFIG.events.success:
          console.log('Self Protocol verification successful:', data);
          setResult({
            success: true,
            data: {
              userId: address || '',
              ...data,
            },
          });
          setIsVerifying(false);
          break;

        case SELF_PROTOCOL_CONFIG.events.error:
          console.error('Self Protocol verification failed:', data);
          setResult({
            success: false,
            error: data?.message || data?.error || 'Verification failed',
          });
          setIsVerifying(false);
          break;

        case SELF_PROTOCOL_CONFIG.events.cancelled:
          console.log('Self Protocol verification cancelled');
          setResult({
            success: false,
            error: 'Verification cancelled by user',
          });
          setIsVerifying(false);
          break;

        default:
          // Ignore other message types
          break;
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

    const verificationUrl = buildVerificationUrl(address);
    const popupFeatures = getPopupFeatures();

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







