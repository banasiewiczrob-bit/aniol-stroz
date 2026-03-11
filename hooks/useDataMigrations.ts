import { isValidDateKey, todayDateKey, toLocalDateKeyFromIso, type DateKey } from '@/constants/calendar';
import {
  DAILY_TEXTS_STORAGE_KEY,
  parseDailyTextsStore,
} from '@/constants/daily-texts';
import { EMOTION_DIRECTION_BY_BASE, type BaseEmotion } from '@/constants/journals';
import { JOURNALS_ENTRIES_STORAGE_KEY } from '@/constants/storageKeys';
import { notifyDataChanged } from '@/hooks/recoverySyncEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_STORAGE_KEY = '@daily_task';
const ARCHIVE_STORAGE_KEY = '@daily_task_archive';
const EMOTION_JOURNAL_LAB_STORAGE_KEY = '@emotion_journal_lab_v2';
const MIGRATIONS_VERSION_KEY = '@migrations_version';
const TARGET_MIGRATIONS_VERSION = '3';

type LegacyEmotionLabEntry = {
  dateKey: DateKey;
  createdAt: string;
  baseEmotion: BaseEmotion;
  detailEmotion: string;
  situation: string;
  expression: string;
};

function normalizeDateKey(rawDateKey: unknown, createdAt: unknown): DateKey {
  if (isValidDateKey(rawDateKey)) return rawDateKey;
  if (typeof createdAt === 'string') {
    const fromIso = toLocalDateKeyFromIso(createdAt);
    if (fromIso) return fromIso;
  }
  return todayDateKey();
}

function isBaseEmotion(value: unknown): value is BaseEmotion {
  return typeof value === 'string' && value in EMOTION_DIRECTION_BY_BASE;
}

function normalizeLegacyEmotionLabEntry(raw: unknown): LegacyEmotionLabEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (!isBaseEmotion(item.baseEmotion) || typeof item.createdAt !== 'string') return null;

  return {
    dateKey: normalizeDateKey(item.dateKey, item.createdAt),
    createdAt: item.createdAt,
    baseEmotion: item.baseEmotion,
    detailEmotion: typeof item.detailEmotion === 'string' ? item.detailEmotion.trim() : '',
    situation: typeof item.situation === 'string' ? item.situation.trim() : '',
    expression: typeof item.expression === 'string' ? item.expression.trim() : '',
  };
}

function toEmotionFingerprint(raw: Record<string, unknown>) {
  if (raw.type !== 'emotion' || !isBaseEmotion(raw.baseEmotion) || typeof raw.createdAt !== 'string') {
    return null;
  }

  const dateKey = normalizeDateKey(raw.dateKey, raw.createdAt);
  const detailEmotion = typeof raw.detailEmotion === 'string' ? raw.detailEmotion.trim() : '';
  const triggerNote = typeof raw.triggerNote === 'string' ? raw.triggerNote.trim() : '';
  const actionNote = typeof raw.actionNote === 'string' ? raw.actionNote.trim() : '';
  return [dateKey, raw.createdAt, raw.baseEmotion, detailEmotion, triggerNote, actionNote].join('|');
}

function createMigratedEmotionEntry(entry: LegacyEmotionLabEntry) {
  const random = Math.random().toString(36).slice(2, 10);
  return {
    id: `journal_emotion_${Date.now()}_${random}`,
    type: 'emotion',
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
    dateKey: entry.dateKey,
    baseEmotion: entry.baseEmotion,
    detailEmotion: entry.detailEmotion,
    directionHint: EMOTION_DIRECTION_BY_BASE[entry.baseEmotion],
    intensity: 0,
    triggerNote: entry.situation,
    needNote: '',
    actionNote: entry.expression,
  };
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

export async function migrateEmotionJournalLabV2ToMainEmotionJournal() {
  const raw = await AsyncStorage.getItem(EMOTION_JOURNAL_LAB_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const legacyEntries = parsed
      .map((item) => normalizeLegacyEmotionLabEntry(item))
      .filter((item): item is LegacyEmotionLabEntry => item !== null);

    const currentRaw = await AsyncStorage.getItem(JOURNALS_ENTRIES_STORAGE_KEY);
    const currentParsed: unknown = currentRaw ? JSON.parse(currentRaw) : [];
    const currentEntries = Array.isArray(currentParsed) ? currentParsed.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object') : [];

    const knownFingerprints = new Set(
      currentEntries.map((item) => toEmotionFingerprint(item)).filter((item): item is string => item !== null)
    );

    const migratedEntries = legacyEntries
      .map((entry) => createMigratedEmotionEntry(entry))
      .filter((entry) => {
        const fingerprint = toEmotionFingerprint(entry);
        if (!fingerprint || knownFingerprints.has(fingerprint)) return false;
        knownFingerprints.add(fingerprint);
        return true;
      });

    if (migratedEntries.length > 0) {
      const next = [...migratedEntries, ...currentEntries].sort((a, b) => {
        const aTime = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 0;
        const bTime = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
      await AsyncStorage.setItem(JOURNALS_ENTRIES_STORAGE_KEY, JSON.stringify(next));
      notifyDataChanged('journals');
    }

    await AsyncStorage.removeItem(EMOTION_JOURNAL_LAB_STORAGE_KEY);
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
  await migrateEmotionJournalLabV2ToMainEmotionJournal();
  await AsyncStorage.setItem(MIGRATIONS_VERSION_KEY, TARGET_MIGRATIONS_VERSION);
}
