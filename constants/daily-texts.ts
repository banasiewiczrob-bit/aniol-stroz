import { getLocalDateKey, isValidDateKey, type DateKey } from '@/constants/calendar';

export const DAILY_TEXTS_STORAGE_KEY = '@daily_texts_done';

export type DailyTextId = 'wsparcie24' | 'halt' | 'modlitwa' | 'desiderata' | 'kroki12';

export type DailyTextsState = Record<DailyTextId, boolean>;

export type DailyTextsLegacyPayload = {
  dateKey: DateKey;
  done: DailyTextsState;
};

export type DailyTextsStore = {
  version: 2;
  byDate: Record<DateKey, DailyTextsState>;
};

export const EMPTY_DAILY_TEXTS: DailyTextsState = Object.freeze({
  wsparcie24: false,
  halt: false,
  modlitwa: false,
  desiderata: false,
  kroki12: false,
});

export function emptyDailyTextsState(): DailyTextsState {
  return { ...EMPTY_DAILY_TEXTS };
}

const COUNTED_DAILY_TEXT_IDS = ['wsparcie24', 'halt', 'modlitwa', 'desiderata', 'kroki12'] as const satisfies readonly DailyTextId[];

export const DAILY_TEXTS_PROGRESS_TOTAL = COUNTED_DAILY_TEXT_IDS.length;

export function getCompletedDailyTextIds(state: DailyTextsState): DailyTextId[] {
  return COUNTED_DAILY_TEXT_IDS.filter((id) => state[id] === true) as DailyTextId[];
}

export function countCompletedDailyTexts(state: DailyTextsState) {
  return getCompletedDailyTextIds(state).length;
}

export function countMissingDailyTexts(state: DailyTextsState) {
  return DAILY_TEXTS_PROGRESS_TOTAL - countCompletedDailyTexts(state);
}

export function getDateKey(date = new Date()) {
  return getLocalDateKey(date);
}

export function normalizeDailyTextsState(value: unknown): DailyTextsState {
  if (!value || typeof value !== 'object') return emptyDailyTextsState();
  const parsed = value as Record<string, unknown>;
  return {
    wsparcie24: parsed.wsparcie24 === true,
    halt: parsed.halt === true,
    modlitwa: parsed.modlitwa === true,
    desiderata: parsed.desiderata === true,
    kroki12: parsed.kroki12 === true,
  };
}

export function createEmptyDailyTextsStore(): DailyTextsStore {
  return {
    version: 2,
    byDate: {},
  };
}

export function parseDailyTextsStore(raw: unknown): DailyTextsStore {
  if (!raw || typeof raw !== 'object') return createEmptyDailyTextsStore();

  const parsed = raw as Partial<DailyTextsStore & DailyTextsLegacyPayload>;

  if (parsed.version === 2 && parsed.byDate && typeof parsed.byDate === 'object') {
    const byDate: Record<DateKey, DailyTextsState> = {};
    for (const [dateKey, state] of Object.entries(parsed.byDate)) {
      if (!isValidDateKey(dateKey)) continue;
      byDate[dateKey] = normalizeDailyTextsState(state);
    }
    return { version: 2, byDate };
  }

  if (isValidDateKey(parsed.dateKey) && parsed.done && typeof parsed.done === 'object') {
    return {
      version: 2,
      byDate: {
        [parsed.dateKey]: normalizeDailyTextsState(parsed.done),
      },
    };
  }

  return createEmptyDailyTextsStore();
}

export function getDailyTextsForDate(store: DailyTextsStore, dateKey: DateKey): DailyTextsState {
  return store.byDate[dateKey] ? { ...store.byDate[dateKey] } : emptyDailyTextsState();
}

export function setDailyTextsForDate(
  store: DailyTextsStore,
  dateKey: DateKey,
  patch: Partial<DailyTextsState>
): DailyTextsStore {
  const current = getDailyTextsForDate(store, dateKey);
  return {
    version: 2,
    byDate: {
      ...store.byDate,
      [dateKey]: {
        ...current,
        ...patch,
      },
    },
  };
}
