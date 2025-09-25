// src/utils/encryption.js
// Advanced Encryption Utilities for Project Connect
// Implements field-level encryption for sensitive data (PII, financial information)

const crypto = require('crypto');
const { securityLogger } = require('../middleware/security');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

// Master encryption key (should be stored securely, ideally in HSM or key management service)
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH);

// Derive encryption key from master key and salt
const deriveKey = (salt, purpose = 'general') => {
  return crypto.pbkdf2Sync(
    MASTER_KEY,
    Buffer.concat([salt, Buffer.from(purpose, 'utf8')]),
    100000, // iterations
    KEY_LENGTH,
    'sha256'
  );
};

// Encrypt sensitive data
const encrypt = (data, purpose = 'general') => {
  try {
    if (!data) return null;

    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt, purpose);

    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from(purpose, 'utf8')); // Additional authenticated data

    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + ciphertext
    const encrypted = Buffer.concat([
      salt,
      iv,
      tag,
      ciphertext
    ]);

    securityLogger.debug('Data encrypted', {
      purpose,
      originalLength: plaintext.length,
      encryptedLength: encrypted.length
    });

    return encrypted.toString('base64');
  } catch (error) {
    securityLogger.error('Encryption failed', {
      error: error.message,
      purpose,
      stack: error.stack
    });
    throw new Error('Encryption failed');
  }
};

// Decrypt sensitive data
const decrypt = (encryptedData, purpose = 'general') => {
  try {
    if (!encryptedData) return null;

    const encrypted = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = encrypted.slice(0, SALT_LENGTH);
    const iv = encrypted.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = encrypted.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = encrypted.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(salt, purpose);

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from(purpose, 'utf8'));

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const plaintext = decrypted.toString('utf8');

    securityLogger.debug('Data decrypted', {
      purpose,
      encryptedLength: encrypted.length,
      decryptedLength: plaintext.length
    });

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(plaintext);
    } catch {
      return plaintext;
    }
  } catch (error) {
    securityLogger.error('Decryption failed', {
      error: error.message,
      purpose,
      stack: error.stack
    });
    throw new Error('Decryption failed');
  }
};

// Hash sensitive data (one-way, for searches and indexing)
const hash = (data, salt = null) => {
  if (!data) return null;

  const input = typeof data === 'string' ? data : JSON.stringify(data);
  const hashSalt = salt || crypto.randomBytes(SALT_LENGTH);

  const hash = crypto.pbkdf2Sync(input, hashSalt, 100000, 64, 'sha256');

  return {
    hash: hash.toString('hex'),
    salt: hashSalt.toString('hex')
  };
};

// Verify hashed data
const verifyHash = (data, hashedData, salt) => {
  if (!data || !hashedData || !salt) return false;

  const input = typeof data === 'string' ? data : JSON.stringify(data);
  const saltBuffer = Buffer.from(salt, 'hex');

  const computedHash = crypto.pbkdf2Sync(input, saltBuffer, 100000, 64, 'sha256');
  const storedHash = Buffer.from(hashedData, 'hex');

  return crypto.timingSafeEqual(computedHash, storedHash);
};

// Generate cryptographically secure random tokens
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure API keys
const generateApiKey = (prefix = 'pk_') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(24).toString('base64url');
  return `${prefix}${timestamp}_${random}`;
};

// Encrypt specific field types with different purposes
const encryptPII = (data) => encrypt(data, 'pii');
const decryptPII = (data) => decrypt(data, 'pii');

const encryptFinancial = (data) => encrypt(data, 'financial');
const decryptFinancial = (data) => decrypt(data, 'financial');

const encryptCommunication = (data) => encrypt(data, 'communication');
const decryptCommunication = (data) => decrypt(data, 'communication');

// Secure data masking for logs and responses
const maskSensitiveData = (data, fields = []) => {
  if (typeof data !== 'object' || data === null) return data;

  const masked = { ...data };

  const defaultSensitiveFields = [
    'password', 'ssn', 'social_security_number',
    'credit_card', 'creditCard', 'card_number',
    'bank_account', 'bankAccount', 'routing_number',
    'api_key', 'apiKey', 'secret', 'token',
    'private_key', 'privateKey'
  ];

  const allSensitiveFields = [...defaultSensitiveFields, ...fields];

  for (const [key, value] of Object.entries(masked)) {
    const isFieldSensitive = allSensitiveFields.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (isFieldSensitive) {
      if (typeof value === 'string') {
        if (value.length <= 4) {
          masked[key] = '*'.repeat(value.length);
        } else {
          // Show first 2 and last 2 characters
          masked[key] = value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
        }
      } else {
        masked[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, fields);
    }
  }

  return masked;
};

// MongoDB field-level encryption schema transformer
const createEncryptedField = (fieldName, purpose = 'general') => {
  return {
    type: String,
    set: function(value) {
      if (!value) return value;
      return encrypt(value, purpose);
    },
    get: function(value) {
      if (!value) return value;
      try {
        return decrypt(value, purpose);
      } catch (error) {
        securityLogger.warn('Failed to decrypt field', {
          fieldName,
          purpose,
          error: error.message
        });
        return null;
      }
    }
  };
};

// Key rotation utilities
const rotateEncryptionKey = async (oldKey, newKey) => {
  // This would be used in a migration script to re-encrypt data with new keys
  securityLogger.info('Encryption key rotation initiated');

  return {
    oldKeyHash: crypto.createHash('sha256').update(oldKey).digest('hex').slice(0, 16),
    newKeyHash: crypto.createHash('sha256').update(newKey).digest('hex').slice(0, 16),
    rotationTimestamp: new Date().toISOString()
  };
};

// Secure random number generation
const generateSecureRandom = (min = 0, max = 100) => {
  const range = max - min;
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / (0xFFFFFFFF + 1);
  return Math.floor(randomValue * (range + 1)) + min;
};

// Time-based one-time password (TOTP) utilities
const generateTOTP = (secret, timeWindow = 30) => {
  const time = Math.floor(Date.now() / 1000 / timeWindow);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);

  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[19] & 0x0f;
  const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;

  return code.toString().padStart(6, '0');
};

const verifyTOTP = (token, secret, timeWindow = 30, tolerance = 1) => {
  const currentTime = Math.floor(Date.now() / 1000 / timeWindow);

  // Check current time window and adjacent windows for tolerance
  for (let i = -tolerance; i <= tolerance; i++) {
    const time = currentTime + i;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(time, 4);

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[19] & 0x0f;
    const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    const expectedToken = code.toString().padStart(6, '0');

    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
      return true;
    }
  }

  return false;
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateSecureToken,
  generateApiKey,

  // Specific encryption functions
  encryptPII,
  decryptPII,
  encryptFinancial,
  decryptFinancial,
  encryptCommunication,
  decryptCommunication,

  // Utility functions
  maskSensitiveData,
  createEncryptedField,
  rotateEncryptionKey,
  generateSecureRandom,

  // TOTP functions
  generateTOTP,
  verifyTOTP
};