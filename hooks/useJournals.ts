import {
  CRAVING_SYMPTOMS,
  EMOTION_DETAILS_BY_BASE,
  EMOTION_DIRECTION_BY_BASE,
  type BaseEmotion,
  clampIntensity,
  type CreateCravingJournalInput,
  type CreateEmotionJournalInput,
  type CreateGratitudeJournalInput,
  getCravingSummaryLevel,
  getJournalDateKey,
  type JournalEntry,
  type JournalType,
} from '@/constants/journals';
import { JOURNALS_ENTRIES_STORAGE_KEY } from '@/constants/storageKeys';
import { notifyDataChanged } from '@/hooks/recoverySyncEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function isBaseEmotion(value: unknown): value is BaseEmotion {
  return typeof value === 'string' && value in EMOTION_DETAILS_BY_BASE;
}

function resolveDateKey(rawDateKey: unknown, createdAt: string) {
  if (typeof rawDateKey === 'string' && rawDateKey.length > 0) return rawDateKey;
  const created = new Date(createdAt);
  if (!Number.isNaN(created.getTime())) return getJournalDateKey(created);
  return getJournalDateKey();
}

function normalizeEmotionEntry(raw: Record<string, unknown>): JournalEntry | null {
  if (
    typeof raw.id !== 'string' ||
    raw.type !== 'emotion' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string' ||
    !isBaseEmotion(raw.baseEmotion) ||
    typeof raw.detailEmotion !== 'string' ||
    typeof raw.directionHint !== 'string' ||
    typeof raw.intensity !== 'number' ||
    typeof raw.triggerNote !== 'string' ||
    typeof raw.needNote !== 'string' ||
    typeof raw.actionNote !== 'string'
  ) {
    return null;
  }

  return {
    id: raw.id,
    type: 'emotion',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    dateKey: resolveDateKey(raw.dateKey, raw.createdAt),
    baseEmotion: raw.baseEmotion,
    detailEmotion: raw.detailEmotion,
    directionHint: raw.directionHint,
    intensity: clampIntensity(raw.intensity),
    triggerNote: raw.triggerNote,
    needNote: raw.needNote,
    actionNote: raw.actionNote,
  };
}

function normalizeLegacySymptoms(raw: Record<string, unknown>) {
  const selected: string[] = [];
  if (raw.haltHungry === true) selected.push('HALT: Głód');
  if (raw.haltAngry === true) selected.push('HALT: Złość');
  if (raw.haltLonely === true) selected.push('HALT: Samotność');
  if (raw.haltTired === true) selected.push('HALT: Zmęczenie');
  return selected;
}

function normalizeCravingEntry(raw: Record<string, unknown>): JournalEntry | null {
  if (
    typeof raw.id !== 'string' ||
    raw.type !== 'craving' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string' ||
    typeof raw.urgeBefore !== 'number' ||
    typeof raw.preTriggerNote !== 'string' ||
    typeof raw.plan15m !== 'string' ||
    !(typeof raw.urgeAfter === 'number' || raw.urgeAfter === null || raw.urgeAfter === undefined) ||
    typeof raw.whatHelped !== 'string'
  ) {
    return null;
  }

  const selectedSymptoms = Array.isArray(raw.selectedSymptoms)
    ? raw.selectedSymptoms.filter((value): value is string => typeof value === 'string')
    : normalizeLegacySymptoms(raw);

  const symptomsCount =
    typeof raw.symptomsCount === 'number'
      ? Math.max(0, Math.min(20, Math.round(raw.symptomsCount)))
      : selectedSymptoms.length;

  return {
    id: raw.id,
    type: 'craving',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    dateKey: resolveDateKey(raw.dateKey, raw.createdAt),
    urgeBefore: clampIntensity(raw.urgeBefore),
    selectedSymptoms,
    symptomsCount,
    summaryLevel: getCravingSummaryLevel(symptomsCount),
    preTriggerNote: raw.preTriggerNote,
    plan15m: raw.plan15m,
    urgeAfter: raw.urgeAfter == null ? null : clampIntensity(raw.urgeAfter),
    whatHelped: raw.whatHelped,
  };
}

function normalizeGratitudeEntry(raw: Record<string, unknown>): JournalEntry | null {
  if (
    typeof raw.id !== 'string' ||
    raw.type !== 'gratitude' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string'
  ) {
    return null;
  }

  // Compatibility with previous schema: item1/item2/item3/whyImportant/tomorrowCarry.
  const legacyItem1 = typeof raw.item1 === 'string' ? raw.item1 : '';
  const legacyItem2 = typeof raw.item2 === 'string' ? raw.item2 : '';
  const legacyItem3 = typeof raw.item3 === 'string' ? raw.item3 : '';
  const legacyWhy = typeof raw.whyImportant === 'string' ? raw.whyImportant : '';
  const legacyTomorrow = typeof raw.tomorrowCarry === 'string' ? raw.tomorrowCarry : '';

  const item =
    typeof raw.item === 'string' && raw.item.trim().length > 0
      ? raw.item
      : legacyItem1 || legacyItem2 || legacyItem3 || '';

  const note =
    typeof raw.note === 'string'
      ? raw.note
      : [legacyWhy, legacyTomorrow].filter((v) => v.trim().length > 0).join(' | ');

  if (item.length === 0 && note.length === 0) return null;

  return {
    id: raw.id,
    type: 'gratitude',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    dateKey: resolveDateKey(raw.dateKey, raw.createdAt),
    item,
    note,
  };
}

function normalizeEntry(raw: unknown): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  if (record.type === 'emotion') return normalizeEmotionEntry(record);
  if (record.type === 'craving') return normalizeCravingEntry(record);
  if (record.type === 'gratitude') return normalizeGratitudeEntry(record);
  return null;
}

async function loadEntries(): Promise<JournalEntry[]> {
  const raw = await AsyncStorage.getItem(JOURNALS_ENTRIES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeEntry(item))
      .filter((item): item is JournalEntry => item !== null)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

async function saveEntries(entries: JournalEntry[]) {
  await AsyncStorage.setItem(JOURNALS_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  notifyDataChanged('journals');
}

export async function listJournalEntries(type?: JournalType) {
  const entries = await loadEntries();
  if (!type) return entries;
  return entries.filter((entry) => entry.type === type);
}

export async function listJournalEntriesByDate(type: JournalType, dateKey: string) {
  const entries = await listJournalEntries(type);
  return entries.filter((entry) => entry.dateKey === dateKey);
}

export async function listRecentJournalEntriesByType(type: JournalType, limit = 5) {
  const all = await listJournalEntries(type);
  return all.slice(0, Math.max(1, limit));
}

export async function getJournalEntryById(entryId: string) {
  const all = await loadEntries();
  return all.find((entry) => entry.id === entryId) ?? null;
}

export async function createEmotionJournalEntry(input: CreateEmotionJournalInput) {
  const details = EMOTION_DETAILS_BY_BASE[input.baseEmotion];
  const safeDetail = details.includes(input.detailEmotion) ? input.detailEmotion : details[0];
  const createdAt = nowIso();
  const dateKey = input.dateKey ?? getJournalDateKey();

  const nextEntry: JournalEntry = {
    id: createId('journal_emotion'),
    type: 'emotion',
    createdAt,
    updatedAt: createdAt,
    dateKey,
    baseEmotion: input.baseEmotion,
    detailEmotion: safeDetail,
    directionHint: EMOTION_DIRECTION_BY_BASE[input.baseEmotion],
    intensity: clampIntensity(input.intensity),
    triggerNote: input.triggerNote.trim(),
    needNote: input.needNote.trim(),
    actionNote: input.actionNote.trim(),
  };

  const all = await loadEntries();
  const next = [nextEntry, ...all];
  await saveEntries(next);
  return nextEntry;
}

export async function createCravingJournalEntry(input: CreateCravingJournalInput) {
  const createdAt = nowIso();
  const dateKey = input.dateKey ?? getJournalDateKey();
  const uniqueSymptoms = Array.from(
    new Set(input.selectedSymptoms.map((v) => v.trim()).filter((v) => v.length > 0))
  );
  const symptomsCount = uniqueSymptoms.length;

  const nextEntry: JournalEntry = {
    id: createId('journal_craving'),
    type: 'craving',
    createdAt,
    updatedAt: createdAt,
    dateKey,
    urgeBefore: clampIntensity(input.urgeBefore),
    selectedSymptoms: uniqueSymptoms,
    symptomsCount,
    summaryLevel: getCravingSummaryLevel(symptomsCount),
    preTriggerNote: input.preTriggerNote.trim(),
    plan15m: input.plan15m.trim(),
    urgeAfter: input.urgeAfter === null ? null : clampIntensity(input.urgeAfter),
    whatHelped: input.whatHelped.trim(),
  };

  const all = await loadEntries();
  const next = [nextEntry, ...all];
  await saveEntries(next);
  return nextEntry;
}

export async function createGratitudeJournalEntry(input: CreateGratitudeJournalInput) {
  const createdAt = nowIso();
  const dateKey = input.dateKey ?? getJournalDateKey();

  const nextEntry: JournalEntry = {
    id: createId('journal_gratitude'),
    type: 'gratitude',
    createdAt,
    updatedAt: createdAt,
    dateKey,
    item: input.item.trim(),
    note: input.note.trim(),
  };

  const all = await loadEntries();
  const next = [nextEntry, ...all];
  await saveEntries(next);
  return nextEntry;
}

export async function deleteJournalEntry(entryId: string) {
  const all = await loadEntries();
  const next = all.filter((entry) => entry.id !== entryId);
  await saveEntries(next);
}

export function isKnownCravingSymptom(symptom: string) {
  return CRAVING_SYMPTOMS.includes(symptom as (typeof CRAVING_SYMPTOMS)[number]);
}
