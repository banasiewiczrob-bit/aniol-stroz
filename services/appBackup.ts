import { APP_BACKUP_STORAGE_KEYS, APP_RESTORE_CLEAR_STORAGE_KEYS } from '@/constants/appDataStorageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

export const APP_BACKUP_SCHEMA_VERSION = 1;

type AppBackupEntries = Record<string, string>;

export type AppBackupPayload = {
  schemaVersion: typeof APP_BACKUP_SCHEMA_VERSION;
  createdAt: string;
  appVersion: string | null;
  entries: AppBackupEntries;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toAppBackupEntries(value: unknown): AppBackupEntries {
  if (!isRecord(value)) {
    throw new Error('Plik nie zawiera poprawnej mapy danych aplikacji.');
  }

  const entries: AppBackupEntries = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue !== 'string') {
      throw new Error('Plik kopii zawiera dane w nieobsługiwanym formacie.');
    }
    entries[key] = rawValue;
  }

  return entries;
}

function buildBackupFileName(createdAt: string) {
  const stamp = createdAt.replace(/[:.]/g, '-');
  return `aniol-stroz-backup-${stamp}.json`;
}

type PickedBackupFile = Awaited<ReturnType<typeof File.pickFileAsync>>;

function normalizePickedFile(picked: PickedBackupFile) {
  return Array.isArray(picked) ? picked[0] ?? null : picked;
}

export async function createAppBackupPayload(appVersion?: string | null): Promise<AppBackupPayload> {
  const pairs = await AsyncStorage.multiGet([...APP_BACKUP_STORAGE_KEYS]);
  const entries = pairs.reduce<AppBackupEntries>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return {
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: appVersion ?? null,
    entries,
  };
}

export function serializeAppBackupPayload(payload: AppBackupPayload) {
  return JSON.stringify(payload, null, 2);
}

export function parseAppBackupPayload(raw: string): AppBackupPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Nie udało się odczytać pliku kopii. Sprawdź, czy to poprawny plik JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Plik kopii ma nieprawidłową strukturę.');
  }

  if (parsed.schemaVersion !== APP_BACKUP_SCHEMA_VERSION) {
    throw new Error('Ta kopia danych pochodzi z nieobsługiwanego formatu.');
  }

  if (typeof parsed.createdAt !== 'string') {
    throw new Error('Plik kopii nie zawiera daty utworzenia.');
  }

  const appVersion = typeof parsed.appVersion === 'string' || parsed.appVersion === null ? parsed.appVersion : null;

  return {
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    createdAt: parsed.createdAt,
    appVersion,
    entries: toAppBackupEntries(parsed.entries),
  };
}

export async function createAppBackupFile(appVersion?: string | null) {
  const payload = await createAppBackupPayload(appVersion);
  const serialized = serializeAppBackupPayload(payload);

  const backupsDirectory = new Directory(Paths.cache, 'backups');
  if (!backupsDirectory.exists) {
    backupsDirectory.create({ idempotent: true, intermediates: true });
  }

  const file = new File(backupsDirectory, buildBackupFileName(payload.createdAt));
  file.create({ overwrite: true, intermediates: true });
  file.write(serialized, { encoding: 'utf8' });

  return { file, payload, serialized };
}

export async function pickAppBackupFile() {
  const picked = await File.pickFileAsync(undefined, 'application/json');
  const file = normalizePickedFile(picked);

  if (!file) {
    throw new Error('Nie wybrano pliku kopii.');
  }

  const raw = await file.text();
  return {
    file,
    payload: parseAppBackupPayload(raw),
  };
}

export function getAppBackupSummary(payload: AppBackupPayload) {
  return {
    createdAt: payload.createdAt,
    appVersion: payload.appVersion,
    keyCount: Object.keys(payload.entries).length,
  };
}

export async function restoreAppBackupPayload(payload: AppBackupPayload) {
  const previousPairs = await AsyncStorage.multiGet([...APP_BACKUP_STORAGE_KEYS]);
  const previousEntries = previousPairs.reduce<AppBackupEntries>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const keysToClear = Array.from(
    new Set([...APP_RESTORE_CLEAR_STORAGE_KEYS, ...Object.keys(previousEntries), ...Object.keys(payload.entries)])
  );
  const nextPairs = Object.entries(payload.entries);

  try {
    if (keysToClear.length > 0) {
      await AsyncStorage.multiRemove(keysToClear);
    }
    if (nextPairs.length > 0) {
      await AsyncStorage.multiSet(nextPairs);
    }
  } catch (error) {
    try {
      if (keysToClear.length > 0) {
        await AsyncStorage.multiRemove(keysToClear);
      }
      const rollbackPairs = Object.entries(previousEntries);
      if (rollbackPairs.length > 0) {
        await AsyncStorage.multiSet(rollbackPairs);
      }
    } catch {
      // Keep the original restore error, but do our best to roll back the previous state.
    }

    throw error;
  }
}
