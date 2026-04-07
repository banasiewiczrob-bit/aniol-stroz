import { APP_BACKUP_SCHEMA_VERSION, AppBackupPayload, parseAppBackupPayload } from '@/services/appBackup';
import { Buffer } from 'buffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';
const CLOUD_BACKUP_ENABLED = process.env.EXPO_PUBLIC_ENABLE_CLOUD_BACKUP === 'true';

const SAVE_CLOUD_BACKUP_URL = `${SUPABASE_URL}/rest/v1/rpc/zapisz_kopie_zapasowa_aplikacji`;
const FETCH_CLOUD_BACKUP_URL = `${SUPABASE_URL}/rest/v1/rpc/pobierz_kopie_zapasowa_aplikacji`;
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION = 1;
const CLOUD_BACKUP_PBKDF2_ITERATIONS = 250000;

type CloudBackupSaveResponse = {
  utworzono_o?: string;
  zaktualizowano_o?: string;
};

type SupabaseErrorPayload = {
  message?: string;
  hint?: string;
  details?: string;
};

type CloudBackupEncryptedEnvelope = {
  schemaVersion: typeof APP_BACKUP_SCHEMA_VERSION;
  createdAt: string;
  appVersion: string | null;
  encrypted: {
    formatVersion: typeof CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION;
    algorithm: 'AES-GCM';
    kdf: 'PBKDF2-SHA-256';
    iterations: number;
    saltB64: string;
    ivB64: string;
    ciphertextB64: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getCommonHeaders() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function getWebCrypto() {
  const maybeCrypto = globalThis.crypto;
  if (!maybeCrypto?.subtle || !maybeCrypto.getRandomValues) {
    throw new Error('Ten runtime nie obsługuje szyfrowania potrzebnego do kopii w chmurze.');
  }
  return maybeCrypto;
}

function bytesToBase64(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(value: string) {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function randomBytes(length: number) {
  return getWebCrypto().getRandomValues(new Uint8Array(length));
}

function toArrayBuffer(value: Uint8Array) {
  return Uint8Array.from(value).buffer as ArrayBuffer;
}

export function normalizeCloudBackupRecoveryCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function formatCloudBackupRecoveryCode(value: string) {
  const normalized = normalizeCloudBackupRecoveryCode(value);
  return normalized.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

export function isValidCloudBackupRecoveryCode(value: string) {
  const normalized = normalizeCloudBackupRecoveryCode(value);
  return normalized.length >= 16 && normalized.length <= 32;
}

export function generateCloudBackupRecoveryCode() {
  const random = randomBytes(16);
  let raw = '';
  for (let index = 0; index < random.length; index += 1) {
    raw += RECOVERY_CODE_ALPHABET[random[index] % RECOVERY_CODE_ALPHABET.length];
  }

  return formatCloudBackupRecoveryCode(raw);
}

export function isCloudBackupFeatureEnabled() {
  return CLOUD_BACKUP_ENABLED;
}

export function isCloudBackupRuntimeSupported() {
  return (
    typeof TextEncoder !== 'undefined' &&
    typeof TextDecoder !== 'undefined' &&
    typeof Buffer !== 'undefined' &&
    !!globalThis.crypto?.subtle &&
    typeof globalThis.crypto?.getRandomValues === 'function'
  );
}

async function deriveCloudBackupKey(normalizedCode: string, salt: Uint8Array) {
  const encoder = new TextEncoder();
  const subtle = getWebCrypto().subtle;
  const keyMaterial = await subtle.importKey('raw', encoder.encode(normalizedCode), 'PBKDF2', false, ['deriveKey']);

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations: CLOUD_BACKUP_PBKDF2_ITERATIONS,
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

function isEncryptedEnvelope(value: unknown): value is CloudBackupEncryptedEnvelope {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== APP_BACKUP_SCHEMA_VERSION) return false;
  if (typeof value.createdAt !== 'string') return false;
  if (!(typeof value.appVersion === 'string' || value.appVersion === null)) return false;
  if (!isRecord(value.encrypted)) return false;

  return (
    value.encrypted.formatVersion === CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION &&
    value.encrypted.algorithm === 'AES-GCM' &&
    value.encrypted.kdf === 'PBKDF2-SHA-256' &&
    typeof value.encrypted.iterations === 'number' &&
    typeof value.encrypted.saltB64 === 'string' &&
    typeof value.encrypted.ivB64 === 'string' &&
    typeof value.encrypted.ciphertextB64 === 'string'
  );
}

async function encryptCloudBackupPayload(payload: AppBackupPayload, recoveryCode: string): Promise<CloudBackupEncryptedEnvelope> {
  const normalizedCode = normalizeCloudBackupRecoveryCode(recoveryCode);
  const encoder = new TextEncoder();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveCloudBackupKey(normalizedCode, salt);
  const plaintext = toArrayBuffer(encoder.encode(JSON.stringify(payload)));
  const ciphertext = await getWebCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    plaintext
  );

  return {
    schemaVersion: payload.schemaVersion,
    createdAt: payload.createdAt,
    appVersion: payload.appVersion,
    encrypted: {
      formatVersion: CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION,
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2-SHA-256',
      iterations: CLOUD_BACKUP_PBKDF2_ITERATIONS,
      saltB64: bytesToBase64(salt),
      ivB64: bytesToBase64(iv),
      ciphertextB64: bytesToBase64(ciphertext),
    },
  };
}

async function decryptCloudBackupEnvelope(payload: CloudBackupEncryptedEnvelope, recoveryCode: string) {
  const normalizedCode = normalizeCloudBackupRecoveryCode(recoveryCode);
  const salt = base64ToBytes(payload.encrypted.saltB64);
  const iv = base64ToBytes(payload.encrypted.ivB64);
  const ciphertext = base64ToBytes(payload.encrypted.ciphertextB64);
  const key = await deriveCloudBackupKey(normalizedCode, salt);
  const decrypted = await getWebCrypto().subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(ciphertext)
  );

  const plaintext = new TextDecoder().decode(decrypted);
  return parseAppBackupPayload(plaintext);
}

async function readResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new Error('Serwer nie zwrócił danych.');
  }

  return JSON.parse(text) as T;
}

async function readSupabaseError(response: Response, fallbackMessage: string) {
  const text = await response.text();
  if (!text) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(text) as SupabaseErrorPayload;
    return parsed.message || parsed.hint || parsed.details || fallbackMessage;
  } catch {
    return text;
  }
}

export async function saveCloudBackup(payload: AppBackupPayload, recoveryCode: string) {
  if (!isCloudBackupFeatureEnabled()) {
    throw new Error('Backup w chmurze jest wyłączony w tej konfiguracji aplikacji.');
  }
  if (!isCloudBackupRuntimeSupported()) {
    throw new Error('Ten runtime nie obsługuje bezpiecznej kopii w chmurze.');
  }

  const normalizedCode = normalizeCloudBackupRecoveryCode(recoveryCode);
  if (!isValidCloudBackupRecoveryCode(normalizedCode)) {
    throw new Error('Kod odzyskiwania musi mieć od 16 do 32 znaków.');
  }

  const encryptedPayload = await encryptCloudBackupPayload(payload, normalizedCode);

  const response = await fetch(SAVE_CLOUD_BACKUP_URL, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({
      p_kod_odzyskiwania: normalizedCode,
      p_dane: encryptedPayload,
    }),
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, 'Nie udało się zapisać kopii danych w chmurze.'));
  }

  return readResponseJson<CloudBackupSaveResponse>(response);
}

export async function fetchCloudBackup(recoveryCode: string): Promise<AppBackupPayload> {
  if (!isCloudBackupFeatureEnabled()) {
    throw new Error('Backup w chmurze jest wyłączony w tej konfiguracji aplikacji.');
  }
  if (!isCloudBackupRuntimeSupported()) {
    throw new Error('Ten runtime nie obsługuje bezpiecznej kopii w chmurze.');
  }

  const normalizedCode = normalizeCloudBackupRecoveryCode(recoveryCode);
  if (!isValidCloudBackupRecoveryCode(normalizedCode)) {
    throw new Error('Kod odzyskiwania musi mieć od 16 do 32 znaków.');
  }

  const response = await fetch(FETCH_CLOUD_BACKUP_URL, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({
      p_kod_odzyskiwania: normalizedCode,
    }),
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, 'Nie udało się pobrać kopii danych z chmury.'));
  }

  const payload = await readResponseJson<unknown>(response);

  if (isEncryptedEnvelope(payload)) {
    try {
      return await decryptCloudBackupEnvelope(payload, normalizedCode);
    } catch {
      throw new Error('Nie udało się odszyfrować kopii z chmury. Sprawdź kod odzyskiwania.');
    }
  }

  return parseAppBackupPayload(JSON.stringify(payload));
}

export function ensureCurrentBackupSchema(payload: AppBackupPayload) {
  if (payload.schemaVersion !== APP_BACKUP_SCHEMA_VERSION) {
    throw new Error('Kopia z chmury ma nieobsługiwaną wersję schematu.');
  }

  return payload;
}
