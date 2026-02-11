export const DAILY_TEXTS_STORAGE_KEY = '@daily_texts_done';

export type DailyTextId = 'wsparcie24' | 'halt' | 'modlitwa' | 'desiderata';

export type DailyTextsState = Record<DailyTextId, boolean>;

export type DailyTextsPayload = {
  dateKey: string;
  done: DailyTextsState;
};

export const EMPTY_DAILY_TEXTS: DailyTextsState = {
  wsparcie24: false,
  halt: false,
  modlitwa: false,
  desiderata: false,
};

export function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
