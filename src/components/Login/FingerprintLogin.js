import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import webauthnService from '../../services/webauthnService';
import { setToken, setCurrentUser } from '../../utils/auth';

const FingerprintLogin = () => {
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!employeeCode.trim()) {
      setError('Employee code is required');
      return;
    }

    // Check WebAuthn support
    if (!webauthnService.isSupported()) {
      setError('WebAuthn is not supported by your browser. Please use a modern browser with biometric support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Get challenge from server
      // Step 2: Prompt biometric/passkey via navigator.credentials.get()
      // Step 3: Verify signed challenge with server
      setScanning(true);
      const result = await webauthnService.authenticate(employeeCode.trim());
      setScanning(false);

      if (result.token && result.user) {
        setToken(result.token);
        setCurrentUser(result.user);
        navigate('/tech/dashboard');
      } else {
        setError('Authentication failed. Invalid response from server.');
      }
    } catch (err) {
      setScanning(false);
      if (err.name === 'NotAllowedError') {
        setError('Authentication was cancelled or timed out. Please try again.');
      } else if (err.name === 'SecurityError') {
        setError('Security error. Make sure you are using HTTPS or localhost.');
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Authentication failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [employeeCode, navigate]);

  const handleChange = (e) => {
    setEmployeeCode(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="fingerprint-login">
      <div className={`fingerprint-icon-container ${scanning ? 'scanning' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
          <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
          <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
          <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
          <path d="M8.65 22c.21-.66.45-1.32.57-2" />
          <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
          <path d="M2 16h.01" />
          <path d="M21.8 16c.2-2 .131-5.354 0-6" />
          <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
        </svg>
      </div>

      <div className="fingerprint-instructions">
        {scanning
          ? 'Complete the biometric prompt to authenticate...'
          : 'Enter your employee code and press the button below to authenticate with your device biometric.'}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Employee Code <span className="required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your employee code"
            value={employeeCode}
            onChange={handleChange}
            disabled={loading}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading || !employeeCode.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              {scanning ? 'Waiting for Biometric...' : 'Authenticating...'}
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              </svg>
              Authenticate with Biometric
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FingerprintLogin;
