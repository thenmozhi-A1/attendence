import api from './api';
import {
  prepareRegistrationOptions,
  prepareAuthenticationOptions,
  processRegistrationCredential,
  processAuthenticationCredential,
  isWebAuthnSupported,
} from '../utils/webauthn';

const webauthnService = {
  isSupported: isWebAuthnSupported,

  registerChallenge: async (employeeId) => {
    const response = await api.post('/webauthn/register/challenge', null, { params: { employeeId } });
    return response.data;
  },

  registerVerify: async (credential) => {
    const processed = processRegistrationCredential(credential);
    const response = await api.post('/webauthn/register/verify', processed);
    return response.data;
  },

  authChallenge: async (employeeId) => {
    const response = await api.post('/webauthn/auth/challenge', null, { params: { employeeId } });
    return response.data;
  },

  authVerify: async (credential) => {
    const processed = processAuthenticationCredential(credential);
    const response = await api.post('/webauthn/auth/verify', processed);
    return response.data;
  },

  /**
   * Full WebAuthn registration flow
   * 1. Get challenge from server
   * 2. Prompt user for fingerprint/biometric
   * 3. Send credential to server for verification
   */
  register: async (employeeId) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported by your browser');
    }

    // Step 1: Get registration challenge from server
    const challengeData = await webauthnService.registerChallenge(employeeId);
    const publicKeyCredentialCreationOptions = prepareRegistrationOptions(challengeData);

    // Step 2: Prompt user for biometric
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error('Registration was cancelled');
    }

    // Step 3: Verify with server
    const result = await webauthnService.registerVerify(credential);
    return result;
  },

  /**
   * Full WebAuthn authentication flow
   * 1. Get challenge from server
   * 2. Prompt user for fingerprint/biometric
   * 3. Send signed challenge to server for verification
   */
  authenticate: async (employeeCode) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported by your browser');
    }

    // Step 1: Get authentication challenge from server
    const challengeData = await webauthnService.authChallenge(employeeCode);
    const publicKeyCredentialRequestOptions = prepareAuthenticationOptions(challengeData);

    // Step 2: Prompt user for biometric
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!credential) {
      throw new Error('Authentication was cancelled');
    }

    // Step 3: Verify with server
    const result = await webauthnService.authVerify(credential);
    return result;
  },
};

export default webauthnService;
