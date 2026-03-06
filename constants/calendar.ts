export type DateKey = string;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string') return false;
  if (!DATE_KEY_RE.test(value)) return false;

  const parsed = parseDateKey(value);
  return parsed !== null;
}

export function getLocalDateKey(date = new Date()): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: DateKey): Date | null {
  if (!DATE_KEY_RE.test(dateKey)) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;

  const year = Number.parseInt(m[1], 10);
  const monthIndex = Number.parseInt(m[2], 10) - 1;
  const day = Number.parseInt(m[3], 10);
  const parsed = new Date(year, monthIndex, day);

  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== monthIndex || parsed.getDate() !== day) return null;
  return parsed;
}

export function toLocalDateKeyFromIso(iso: string): DateKey | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return getLocalDateKey(parsed);
}

export function todayDateKey(): DateKey {
  return getLocalDateKey(new Date());
}
