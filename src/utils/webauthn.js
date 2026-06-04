/**
 * WebAuthn utility functions for proper encoding/decoding
 * Handles base64url encoding/decoding as required by the WebAuthn API
 */

/**
 * Convert a base64url string to ArrayBuffer
 * WebAuthn API requires ArrayBuffer for challenges and credentials
 */
export const base64urlToBuffer = (base64url) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
};

/**
 * Convert an ArrayBuffer to base64url string
 * Used when sending WebAuthn responses back to the server
 */
export const bufferToBase64url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Prepare the registration options received from the server
 * Converts base64url strings to ArrayBuffers as required by navigator.credentials.create()
 */
export const prepareRegistrationOptions = (options) => {
  const prepared = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (typeof prepared.challenge === 'string') {
    prepared.challenge = base64urlToBuffer(prepared.challenge);
  }

  // Convert excludeCredentials
  if (prepared.excludeCredentials && Array.isArray(prepared.excludeCredentials)) {
    prepared.excludeCredentials = prepared.excludeCredentials.map((cred) => ({
      ...cred,
      id: typeof cred.id === 'string' ? base64urlToBuffer(cred.id) : cred.id,
    }));
  }

  // Convert user.id if present
  if (prepared.user && typeof prepared.user.id === 'string') {
    prepared.user.id = base64urlToBuffer(prepared.user.id);
  }

  return prepared;
};

/**
 * Prepare the authentication options received from the server
 * Converts base64url strings to ArrayBuffers as required by navigator.credentials.get()
 */
export const prepareAuthenticationOptions = (options) => {
  const prepared = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (typeof prepared.challenge === 'string') {
    prepared.challenge = base64urlToBuffer(prepared.challenge);
  }

  // Convert allowCredentials
  if (prepared.allowCredentials && Array.isArray(prepared.allowCredentials)) {
    prepared.allowCredentials = prepared.allowCredentials.map((cred) => ({
      ...cred,
      id: typeof cred.id === 'string' ? base64urlToBuffer(cred.id) : cred.id,
    }));
  }

  return prepared;
};

/**
 * Process the registration credential for sending to server
 * Converts ArrayBuffers to base64url strings for JSON serialization
 */
export const processRegistrationCredential = (credential) => {
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(credential.response.attestationObject),
      clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
    },
  };
};

/**
 * Process the authentication credential for sending to server
 * Converts ArrayBuffers to base64url strings for JSON serialization
 */
export const processAuthenticationCredential = (credential) => {
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(credential.response.authenticatorData),
      clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
      signature: bufferToBase64url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? bufferToBase64url(credential.response.userHandle)
        : null,
    },
  };
};

/**
 * Check if WebAuthn is supported by the browser
 */
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined;
};
