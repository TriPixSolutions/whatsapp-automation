import crypto from 'crypto';

// AES-256-GCM Authenticated Encryption for Tokens & Sensitive Credentials at Rest
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit recommended IV for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

function getEncryptionKey(): Buffer {
  const envKey =
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'production_secure_tripix_aes256_key_32bytes_min';
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * PBKDF2 Secure Password Hashing (replaces weak raw SHA-256)
 */
export function hashPassword(password: string): string {
  const salt = process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.substring(0, 16) : 'tripix_salt_2026';
  const iterations = 10000;
  const keylen = 64;
  const digest = 'sha512';
  return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
}

/**
 * Verify password against stored PBKDF2 hash (with backward compatibility for previous sha256 hashes)
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  // 1. Check PBKDF2 hash
  const pbkdf2Hash = hashPassword(password);
  if (crypto.timingSafeEqual(Buffer.from(pbkdf2Hash), Buffer.from(storedHash))) {
    return true;
  }
  // 2. Backward compatibility check for previous sha256 hash
  const legacyHash = crypto.createHash('sha256').update(password + '_passionfruit_salt_2026').digest('hex');
  if (legacyHash.length === storedHash.length && crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedHash))) {
    return true;
  }
  return false;
}

/**
 * Encrypt sensitive string (e.g. Meta Permanent Access Token) using AES-256-GCM
 * Output format: `enc:gcm:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  // Avoid double-encrypting
  if (plainText.startsWith('enc:gcm:')) return plainText;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('[Crypto] Encryption error:', error);
    return plainText;
  }
}

/**
 * Decrypt token at rest back to plaintext for authorized server-side API calls
 */
export function decryptToken(cipherString: string): string {
  if (!cipherString) return '';
  if (!cipherString.startsWith('enc:gcm:')) {
    // Return unencrypted plaintext directly for backward compatibility
    return cipherString;
  }

  try {
    const parts = cipherString.split(':');
    if (parts.length !== 5) return cipherString;

    const [, , ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed (invalid key or corrupted ciphertext):', error);
    return cipherString;
  }
}

/**
 * Safely mask sensitive access token for client-facing displays or logs
 * Example: `EAAB...a1b2` -> `EAAB****************b1c2`
 */
export function maskToken(token: string): string {
  if (!token) return '';
  const decrypted = decryptToken(token);
  if (decrypted.length <= 10) {
    return '••••••••';
  }
  const prefix = decrypted.slice(0, 4);
  const suffix = decrypted.slice(-4);
  return `${prefix}${'•'.repeat(Math.min(16, Math.max(4, decrypted.length - 8)))}${suffix}`;
}

/**
 * Validates Meta Webhook x-hub-signature-256 header using HMAC-SHA256
 * Header format: `sha256={hex_digest}`
 */
export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  appSecret?: string
): boolean {
  if (!signatureHeader) return false;

  const secret = appSecret || process.env.META_APP_SECRET || '';
  if (!secret) {
    console.warn('[Crypto] Warning: No appSecret provided to verify Meta signature.');
    return false;
  }

  try {
    const expectedPrefix = 'sha256=';
    if (!signatureHeader.startsWith(expectedPrefix)) {
      return false;
    }

    const signatureHash = signatureHeader.substring(expectedPrefix.length);
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bodyBuffer);
    const digest = hmac.digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signatureHash, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');

    if (sigBuffer.length !== digestBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
  } catch (error) {
    console.error('[Crypto] Meta signature verification error:', error);
    return false;
  }
}
