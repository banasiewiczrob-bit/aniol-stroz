import { isValidDateKey, todayDateKey, toLocalDateKeyFromIso, type DateKey } from '@/constants/calendar';
import {
  DAILY_TEXTS_STORAGE_KEY,
  parseDailyTextsStore,
} from '@/constants/daily-texts';
import { JOURNALS_ENTRIES_STORAGE_KEY } from '@/constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_STORAGE_KEY = '@daily_task';
const ARCHIVE_STORAGE_KEY = '@daily_task_archive';
const MIGRATIONS_VERSION_KEY = '@migrations_version';
const TARGET_MIGRATIONS_VERSION = '2';

function normalizeDateKey(rawDateKey: unknown, createdAt: unknown): DateKey {
  if (isValidDateKey(rawDateKey)) return rawDateKey;
  if (typeof createdAt === 'string') {
    const fromIso = toLocalDateKeyFromIso(createdAt);
    if (fromIso) return fromIso;
  }
  return todayDateKey();
}

export async function migrateJournalsDateKeysV1ToV2() {
  const raw = await AsyncStorage.getItem(JOURNALS_ENTRIES_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    let changed = false;
    const migrated = parsed.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const entry = item as Record<string, unknown>;
      const dateKey = normalizeDateKey(entry.dateKey, entry.createdAt);
      if (entry.dateKey !== dateKey) changed = true;
      return { ...entry, dateKey };
    });

    if (changed) {
      await AsyncStorage.setItem(JOURNALS_ENTRIES_STORAGE_KEY, JSON.stringify(migrated));
    }
  } catch {
    // Keep data untouched when parsing fails.
  }
}

export async function migrateDailyTextsPayloadV1ToV2() {
  const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    const store = parseDailyTextsStore(parsed);
    await AsyncStorage.setItem(DAILY_TEXTS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Keep data untouched when parsing fails.
  }
}

export async function migratePlanStoreDateKeysNormalization() {
  const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        let changed = false;
        const out: Record<DateKey, Record<string, unknown>> = {};

        if ('dateKey' in obj) {
          const normalized = normalizeDateKey(obj.dateKey, obj.createdAt);
          out[normalized] = { ...obj, dateKey: normalized };
          changed = true;
        } else {
          for (const [key, value] of Object.entries(obj)) {
            if (!value || typeof value !== 'object') continue;
            const plan = value as Record<string, unknown>;
            const normalized = normalizeDateKey(isValidDateKey(key) ? key : plan.dateKey, plan.createdAt);
            if (normalized !== key || plan.dateKey !== normalized) changed = true;
            out[normalized] = { ...plan, dateKey: normalized };
          }
        }

        if (changed) {
          await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(out));
        }
      }
    } catch {
      // Keep data untouched when parsing fails.
    }
  }

  const archiveRaw = await AsyncStorage.getItem(ARCHIVE_STORAGE_KEY);
  if (!archiveRaw) return;

  try {
    const parsed: unknown = JSON.parse(archiveRaw);
    if (!Array.isArray(parsed)) return;

    let changed = false;
    const migrated = parsed.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const entry = item as Record<string, unknown>;
      const dateKey = normalizeDateKey(entry.dateKey, entry.createdAt);
      if (entry.dateKey !== dateKey) changed = true;
      return { ...entry, dateKey };
    });

    if (changed) {
      await AsyncStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(migrated));
    }
  } catch {
    // Keep data untouched when parsing fails.
  }
}

export async function runMigrationsIfNeeded() {
  const currentVersion = await AsyncStorage.getItem(MIGRATIONS_VERSION_KEY);
  if (currentVersion === TARGET_MIGRATIONS_VERSION) return;

  await migrateJournalsDateKeysV1ToV2();
  await migrateDailyTextsPayloadV1ToV2();
  await migratePlanStoreDateKeysNormalization();
  await AsyncStorage.setItem(MIGRATIONS_VERSION_KEY, TARGET_MIGRATIONS_VERSION);
}
