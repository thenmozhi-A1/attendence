import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import scannerService from '../../services/scannerService';
import { setToken, setCurrentUser } from '../../utils/auth';

const SCANNER_REGION_ID = 'qr-scanner-region';

const ScannerLogin = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (err) {
        // Scanner might already be stopped
      }
      try {
        scannerRef.current.clear();
      } catch (err) {
        // Ignore clear errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError('');
    setSuccess('');
    hasScannedRef.current = false;

    try {
      // Create the scanner element container
      const container = document.getElementById(SCANNER_REGION_ID);
      if (!container) return;

      // Clean up any previous instance
      await stopScanner();

      const html5QrCode = new Html5Qrcode(SCANNER_REGION_ID);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Prevent multiple scans
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          try {
            await stopScanner();
          } catch (e) {
            // Ignore
          }

          setScanning(false);
          setLoading(true);
          setSuccess(`QR Code detected! Verifying...`);

          try {
            const result = await scannerService.verifyScan(decodedText);
            if (result.token && result.user) {
              setToken(result.token);
              setCurrentUser(result.user);
              setSuccess('Login successful! Redirecting...');
              setTimeout(() => {
                navigate('/accounts/dashboard');
              }, 500);
            } else {
              setError('Verification failed. Invalid QR code response.');
              setLoading(false);
            }
          } catch (err) {
            setError(
              err.response?.data?.message ||
              'QR code verification failed. Please try again.'
            );
            setLoading(false);
          }
        },
        () => {
          // QR code scan failure (not found yet) - ignore as this fires frequently
        }
      );

      setScanning(true);
    } catch (err) {
      setError(
        'Unable to access camera. Please ensure camera permissions are granted and try again.'
      );
      setScanning(false);
    }
  }, [navigate, stopScanner]);

  const handleStop = useCallback(async () => {
    await stopScanner();
    setScanning(false);
  }, [stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
            }).catch(() => {});
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="scanner-login">
      <div className="scanner-instructions">
        {loading
          ? 'Verifying your QR code, please wait...'
          : scanning
          ? 'Point your camera at the QR code to sign in.'
          : 'Click the button below to open your camera and scan your QR code.'}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div
        id={SCANNER_REGION_ID}
        className="scanner-container"
        style={{ display: scanning ? 'block' : 'none' }}
      />

      {loading && (
        <div className="loading-container" style={{ minHeight: 100 }}>
          <div className="spinner" />
          <span className="loading-text">Verifying...</span>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {!scanning && !loading ? (
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={startScanner}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            Open Camera & Scan QR Code
          </button>
        ) : scanning ? (
          <button
            className="btn btn-outline btn-block btn-lg"
            onClick={handleStop}
          >
            Cancel Scanning
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ScannerLogin;
