import { getLocalDateKey, parseDateKey, type DateKey } from '@/constants/calendar';

export type PolishHoliday = {
  dateKey: DateKey;
  name: string;
};

type FixedHoliday = {
  month: number;
  day: number;
  name: string;
  fromYear?: number;
};

const FIXED_HOLIDAYS: FixedHoliday[] = [
  { month: 1, day: 1, name: 'Nowy Rok' },
  { month: 1, day: 6, name: 'Święto Trzech Króli' },
  { month: 5, day: 1, name: 'Święto Pracy' },
  { month: 5, day: 3, name: 'Święto Konstytucji 3 Maja' },
  { month: 8, day: 15, name: 'Wniebowzięcie NMP / Święto Wojska Polskiego' },
  { month: 11, day: 1, name: 'Wszystkich Świętych' },
  { month: 11, day: 11, name: 'Narodowe Święto Niepodległości' },
  { month: 12, day: 24, name: 'Wigilia Bożego Narodzenia', fromYear: 2025 },
  { month: 12, day: 25, name: 'Boże Narodzenie' },
  { month: 12, day: 26, name: 'Drugi dzień Bożego Narodzenia' },
];

const holidaysByYearCache = new Map<number, Map<DateKey, PolishHoliday>>();

function toDate(year: number, month: number, day: number) {
  const value = new Date(year, month - 1, day);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  value.setHours(0, 0, 0, 0);
  return value;
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toDate(year, month, day);
}

function buildHolidaysForYear(year: number) {
  const holidayMap = new Map<DateKey, PolishHoliday>();
  const addHoliday = (date: Date, name: string) => {
    const dateKey = getLocalDateKey(date);
    holidayMap.set(dateKey, { dateKey, name });
  };

  FIXED_HOLIDAYS.forEach((holiday) => {
    if (holiday.fromYear && year < holiday.fromYear) return;
    addHoliday(toDate(year, holiday.month, holiday.day), holiday.name);
  });

  const easter = easterSunday(year);
  addHoliday(easter, 'Wielkanoc');
  addHoliday(addDays(easter, 1), 'Poniedziałek Wielkanocny');
  addHoliday(addDays(easter, 49), 'Zielone Świątki');
  addHoliday(addDays(easter, 60), 'Boże Ciało');

  return holidayMap;
}

function getHolidayMap(year: number) {
  const cached = holidaysByYearCache.get(year);
  if (cached) return cached;

  const built = buildHolidaysForYear(year);
  holidaysByYearCache.set(year, built);
  return built;
}

export function getPolishHolidays(year: number): PolishHoliday[] {
  return Array.from(getHolidayMap(year).values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getPolishHoliday(dateOrDateKey: Date | DateKey | null | undefined): PolishHoliday | null {
  if (!dateOrDateKey) return null;

  if (dateOrDateKey instanceof Date) {
    const dateKey = getLocalDateKey(dateOrDateKey);
    return getHolidayMap(dateOrDateKey.getFullYear()).get(dateKey) ?? null;
  }

  const parsed = parseDateKey(dateOrDateKey);
  if (!parsed) return null;
  return getHolidayMap(parsed.getFullYear()).get(dateOrDateKey) ?? null;
}

export function isPolishHoliday(dateOrDateKey: Date | DateKey | null | undefined) {
  return getPolishHoliday(dateOrDateKey) !== null;
}
