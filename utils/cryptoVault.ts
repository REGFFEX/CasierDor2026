/**
 * Coffre cryptographique central — Casier d'Or
 * Web Crypto API : PBKDF2-SHA256 + AES-256-GCM
 */

import CryptoJS from 'crypto-js';

const INSTALL_SECRET_KEY = 'casierdor_install_secret';
const LEGACY_MASTER_KEY = 'casierdor-security-master-key-2026-v3';

export const CRYPTO_CONSTANTS = {
  PBKDF2_ITERATIONS_PASSWORD: 310_000,
  PBKDF2_ITERATIONS_RECOVERY: 600_000,
  PBKDF2_ITERATIONS_DEVICE_WRAP: 100_000,
  RECOVERY_KEY_BYTES: 32,
  RECOVERY_FILE_VERSION: 2,
  PASSWORD_HASH_PREFIX: 'v2.pbkdf2',
} as const;

export interface RecoveryFilePayload {
  accountId: string;
  emailHint: string;
  issuedAt: number;
  keyVersion: number;
  method?: string;
}

export interface RecoveryKeyFileV2 {
  v: 2;
  format: 'casierdor-recovery-key';
  kdf: { alg: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { alg: 'AES-256-GCM'; iv: string; data: string };
  deviceWrap?: { salt: string; iv: string; data: string };
}

/** Enveloppe externe quand un mot de passe protège tout le fichier */
export interface RecoveryKeyFileLocked {
  v: 2;
  format: 'casierdor-recovery-key-locked';
  outerKdf: { alg: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  outerCipher: { alg: 'AES-256-GCM'; iv: string; data: string };
}

// ─── Helpers binaires ───────────────────────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function computeKeyChecksum(bytes: Uint8Array): string {
  let sum = 0;
  for (const b of bytes) sum = (sum + b) & 0xffff;
  return sum.toString(16).padStart(4, '0').toUpperCase();
}

// ─── Secret d'installation (lié à l'appareil) ───────────────────────

export function ensureInstallationSecret(): void {
  if (localStorage.getItem(INSTALL_SECRET_KEY)) return;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(INSTALL_SECRET_KEY, bytesToBase64(bytes));
}

export function getInstallationSecret(): Uint8Array {
  ensureInstallationSecret();
  return base64ToBytes(localStorage.getItem(INSTALL_SECRET_KEY)!);
}

// ─── Clé de récupération ────────────────────────────────────────────

export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CRYPTO_CONSTANTS.RECOVERY_KEY_BYTES));
  return formatRecoveryKey(bytes);
}

export function formatRecoveryKey(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const groups = hex.match(/.{1,4}/g) ?? [];
  return `CDOR-${groups.join('-')}-${computeKeyChecksum(bytes)}`;
}

/** Retire préfixe, tirets et checksum pour obtenir les 32 octets hex */
export function normalizeRecoveryKey(input: string): string {
  let raw = input.trim().toUpperCase().replace(/^CDOR-?/i, '').replace(/-/g, '');
  if (raw.length > 64) raw = raw.slice(0, 64);
  return raw;
}

export function validateRecoveryKeyChecksum(input: string): boolean {
  const trimmed = input.trim().toUpperCase();
  const parts = trimmed.split('-');
  if (parts.length < 3 || parts[0] !== 'CDOR') return true;
  const checksumPart = parts[parts.length - 1];
  if (checksumPart.length !== 4) return false;
  const hexBody = parts.slice(1, -1).join('');
  if (hexBody.length !== 64) return false;
  try {
    const bytes = hexToBytes(hexBody);
    return computeKeyChecksum(bytes) === checksumPart;
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// ─── PBKDF2 / AES-GCM ───────────────────────────────────────────────

async function pbkdf2DeriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBytes = 32
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    lengthBytes * 8
  );
  return new Uint8Array(bits);
}

async function importAesGcmKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function aesGcmEncrypt(key: CryptoKey, plaintext: Uint8Array): Promise<{ iv: Uint8Array; data: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return { iv, data };
}

async function aesGcmDecrypt(key: CryptoKey, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data));
}

// ─── Hash mot de passe (stockage utilisateur) ───────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2DeriveBits(password, salt, CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_PASSWORD);
  return `${CRYPTO_CONSTANTS.PASSWORD_HASH_PREFIX}$${CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_PASSWORD}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith(CRYPTO_CONSTANTS.PASSWORD_HASH_PREFIX)) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = base64ToBytes(parts[2]);
    const expected = base64ToBytes(parts[3]);
    const computed = await pbkdf2DeriveBits(password, salt, iterations);
    return timingSafeEqual(computed, expected);
  }
  // Legacy btoa — migration progressive
  const legacy = btoa(password + 'salt_secret');
  return legacy === stored;
}

export async function upgradePasswordHashIfLegacy(password: string, stored: string): Promise<string | null> {
  if (stored.startsWith(CRYPTO_CONSTANTS.PASSWORD_HASH_PREFIX)) return null;
  const legacyOk = btoa(password + 'salt_secret') === stored;
  if (!legacyOk) return null;
  return hashPassword(password);
}

// ─── Hash clé de récupération (jamais en clair dans settings) ───────

export async function hashRecoveryKeyForStorage(
  recoveryKey: string,
  accountId: string
): Promise<{ keyHash: string; keySalt: string; keyFingerprint: string; keyVersion: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pepper = bytesToBase64(getInstallationSecret()).slice(0, 16);
  const material = `${normalizeRecoveryKey(recoveryKey)}:${accountId}:${pepper}`;
  const hash = await pbkdf2DeriveBits(material, salt, CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_RECOVERY);
  const fingerprint = Array.from(hash.slice(0, 3), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    keyHash: bytesToBase64(hash),
    keySalt: bytesToBase64(salt),
    keyFingerprint: fingerprint,
    keyVersion: CRYPTO_CONSTANTS.RECOVERY_FILE_VERSION,
  };
}

export async function verifyRecoveryKeyAgainstStorage(
  recoveryKey: string,
  accountId: string,
  keyHash: string,
  keySalt: string
): Promise<boolean> {
  const salt = base64ToBytes(keySalt);
  const expected = base64ToBytes(keyHash);
  const pepper = bytesToBase64(getInstallationSecret()).slice(0, 16);
  const material = `${normalizeRecoveryKey(recoveryKey)}:${accountId}:${pepper}`;
  const computed = await pbkdf2DeriveBits(material, salt, CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_RECOVERY);
  return timingSafeEqual(computed, expected);
}

// ─── Fichier clé v2 ─────────────────────────────────────────────────

async function wrapWithFilePassword(innerJson: string, filePassword: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2DeriveBits(filePassword, salt, CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_PASSWORD);
  const aesKey = await importAesGcmKey(derived);
  const plain = new TextEncoder().encode(innerJson);
  const { iv, data } = await aesGcmEncrypt(aesKey, plain);
  const locked: RecoveryKeyFileLocked = {
    v: 2,
    format: 'casierdor-recovery-key-locked',
    outerKdf: {
      alg: 'PBKDF2',
      hash: 'SHA-256',
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_PASSWORD,
      salt: bytesToBase64(salt),
    },
    outerCipher: { alg: 'AES-256-GCM', iv: bytesToBase64(iv), data: bytesToBase64(data) },
  };
  return JSON.stringify(locked, null, 2);
}

async function unwrapFilePassword(content: string, filePassword: string): Promise<string | null> {
  try {
    const locked = JSON.parse(content) as RecoveryKeyFileLocked;
    if (locked.format !== 'casierdor-recovery-key-locked') return null;
    const salt = base64ToBytes(locked.outerKdf.salt);
    const derived = await pbkdf2DeriveBits(filePassword, salt, locked.outerKdf.iterations);
    const aesKey = await importAesGcmKey(derived);
    const iv = base64ToBytes(locked.outerCipher.iv);
    const data = base64ToBytes(locked.outerCipher.data);
    const plain = await aesGcmDecrypt(aesKey, iv, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export function isLockedRecoveryKeyFile(content: string): boolean {
  try {
    const parsed = JSON.parse(content.trim());
    return parsed?.format === 'casierdor-recovery-key-locked';
  } catch {
    return false;
  }
}

export async function createRecoveryKeyFile(
  payload: RecoveryFilePayload,
  recoveryKey: string,
  filePassword?: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const normalized = normalizeRecoveryKey(recoveryKey);
  const derived = await pbkdf2DeriveBits(normalized, salt, CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_RECOVERY);
  const aesKey = await importAesGcmKey(derived);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const { iv, data } = await aesGcmEncrypt(aesKey, plaintext);

  const envelope: RecoveryKeyFileV2 = {
    v: 2,
    format: 'casierdor-recovery-key',
    kdf: {
      alg: 'PBKDF2',
      hash: 'SHA-256',
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_RECOVERY,
      salt: bytesToBase64(salt),
    },
    cipher: { alg: 'AES-256-GCM', iv: bytesToBase64(iv), data: bytesToBase64(data) },
  };

  // Enveloppe appareil : auto-remplissage sur le même poste (USB local)
  try {
    const deviceSalt = crypto.getRandomValues(new Uint8Array(16));
    const deviceDerived = await pbkdf2DeriveBits(
      bytesToBase64(getInstallationSecret()),
      deviceSalt,
      CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_DEVICE_WRAP
    );
    const deviceKey = await importAesGcmKey(deviceDerived);
    const keyPlain = new TextEncoder().encode(recoveryKey.trim());
    const wrapped = await aesGcmEncrypt(deviceKey, keyPlain);
    envelope.deviceWrap = {
      salt: bytesToBase64(deviceSalt),
      iv: bytesToBase64(wrapped.iv),
      data: bytesToBase64(wrapped.data),
    };
  } catch {
    /* deviceWrap optionnel */
  }

  const inner = JSON.stringify(envelope, null, 2);
  if (filePassword && filePassword.length >= 4) {
    return wrapWithFilePassword(inner, filePassword);
  }
  return inner;
}

export async function parseRecoveryKeyFile(
  content: string,
  filePassword?: string
): Promise<{ recoveryKey?: string; payload?: RecoveryFilePayload; version: number; needsFilePassword?: boolean }> {
  let trimmed = content.trim();

  if (isLockedRecoveryKeyFile(trimmed)) {
    if (!filePassword) {
      return { version: 2, needsFilePassword: true };
    }
    const inner = await unwrapFilePassword(trimmed, filePassword);
    if (!inner) return { version: 2, needsFilePassword: true };
    trimmed = inner;
  }

  if (trimmed.startsWith('{')) {
    try {
      const envelope = JSON.parse(trimmed) as RecoveryKeyFileV2;
      if (envelope.v === 2 && envelope.format === 'casierdor-recovery-key') {
        if (envelope.deviceWrap) {
          const keyFromDevice = await unwrapDeviceLayer(envelope.deviceWrap);
          if (keyFromDevice) {
            const payload = await decryptRecoveryEnvelope(envelope, keyFromDevice);
            return { recoveryKey: keyFromDevice, payload: payload ?? undefined, version: 2 };
          }
        }
        return { version: 2 };
      }
    } catch {
      /* fallback legacy */
    }
  }

  const legacy = decryptLegacyV1(trimmed);
  if (legacy?.key) {
    return { recoveryKey: legacy.key, payload: undefined, version: 1 };
  }

  return { version: 0 };
}

export async function decryptRecoveryEnvelope(
  envelope: RecoveryKeyFileV2,
  recoveryKey: string
): Promise<RecoveryFilePayload | null> {
  try {
    const salt = base64ToBytes(envelope.kdf.salt);
    const normalized = normalizeRecoveryKey(recoveryKey);
    const derived = await pbkdf2DeriveBits(normalized, salt, envelope.kdf.iterations);
    const aesKey = await importAesGcmKey(derived);
    const iv = base64ToBytes(envelope.cipher.iv);
    const data = base64ToBytes(envelope.cipher.data);
    const plain = await aesGcmDecrypt(aesKey, iv, data);
    return JSON.parse(new TextDecoder().decode(plain)) as RecoveryFilePayload;
  } catch {
    return null;
  }
}

async function unwrapDeviceLayer(wrap: { salt: string; iv: string; data: string }): Promise<string | null> {
  try {
    const deviceSalt = base64ToBytes(wrap.salt);
    const ciphertext = base64ToBytes(wrap.data);
    const deviceDerived = await pbkdf2DeriveBits(
      bytesToBase64(getInstallationSecret()),
      deviceSalt,
      CRYPTO_CONSTANTS.PBKDF2_ITERATIONS_DEVICE_WRAP
    );
    const deviceKey = await importAesGcmKey(deviceDerived);
    const iv = base64ToBytes(wrap.iv);
    const plain = await aesGcmDecrypt(deviceKey, iv, ciphertext);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

function decryptLegacyV1(encrypted: string): { key?: string; method?: string } | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, LEGACY_MASTER_KEY);
    const str = bytes.toString(CryptoJS.enc.Utf8);
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/** @deprecated v1 — compatibilité lecture seule */
export function encryptDataLegacy(data: unknown): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), LEGACY_MASTER_KEY).toString();
}

/** @deprecated v1 — compatibilité lecture seule */
export function decryptDataLegacy(encrypted: string): unknown {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, LEGACY_MASTER_KEY);
    const str = bytes.toString(CryptoJS.enc.Utf8);
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ─── Migration recoveryConfig ─────────────────────────────────────────

export async function migrateRecoveryConfigIfNeeded(
  recoveryConfig: import('../types').RecoveryConfig | null | undefined,
  accountId: string
): Promise<import('../types').RecoveryConfig | null | undefined> {
  if (!recoveryConfig) return recoveryConfig;
  if (recoveryConfig.keyHash && recoveryConfig.keySalt) {
    const { key, ...rest } = recoveryConfig as import('../types').RecoveryConfig & { key?: string };
    return rest;
  }
  if (recoveryConfig.key) {
    const hashed = await hashRecoveryKeyForStorage(recoveryConfig.key, accountId);
    const { key, ...rest } = recoveryConfig as import('../types').RecoveryConfig & { key: string };
    return { ...rest, ...hashed };
  }
  return recoveryConfig;
}
