/**
 * JWT Implementation using Web Crypto API
 * Compatible with Cloudflare Workers - no external dependencies
 */

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to base64url string (JWT safe)
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert base64url string to ArrayBuffer
 */
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Import JWT secret as CryptoKey for HMAC SHA-256
 */
async function importJwtSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  sub?: string;
  type?: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Sign a JWT token using HMAC SHA-256
 * @param payload - The JWT payload
 * @param secret - The JWT secret from environment
 * @returns The signed JWT string
 */
export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp
  };
  
  // Create header
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerBase64 = arrayBufferToBase64Url(stringToArrayBuffer(JSON.stringify(header)));
  
  // Create payload
  const payloadBase64 = arrayBufferToBase64Url(stringToArrayBuffer(JSON.stringify(fullPayload)));
  
  // Create signing input
  const signingInput = `${headerBase64}.${payloadBase64}`;
  
  // Sign with HMAC SHA-256
  const key = await importJwtSecret(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToArrayBuffer(signingInput)
  );
  
  // Create final token
  const signatureBase64 = arrayBufferToBase64Url(signature);
  return `${signingInput}.${signatureBase64}`;
}

/**
 * Verify a JWT token
 * @param token - The JWT string to verify
 * @param secret - The JWT secret from environment
 * @returns The decoded payload if valid, null if invalid
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await importJwtSecret(secret);
    const signature = base64UrlToArrayBuffer(signatureB64);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      stringToArrayBuffer(signingInput)
    );
    
    if (!isValid) return null;
    
    // Decode payload
    const payloadJson = new TextDecoder().decode(base64UrlToArrayBuffer(payloadB64));
    const payload: JWTPayload = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT payload without verification (for UI purposes only)
 * @param token - The JWT string
 * @returns The decoded payload or null
 */
export function decodeJWTUnsafe(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payloadJson = new TextDecoder().decode(base64UrlToArrayBuffer(parts[1]));
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}
