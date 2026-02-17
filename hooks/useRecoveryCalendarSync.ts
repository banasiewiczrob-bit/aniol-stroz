import { getLocalDateKey, parseDateKey, todayDateKey, type DateKey } from '@/constants/calendar';
import {
  DAILY_TEXTS_STORAGE_KEY,
  getDailyTextsForDate,
  parseDailyTextsStore,
  type DailyTextId,
} from '@/constants/daily-texts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listJournalEntries } from '@/hooks/useJournals';
import { notifyDataChanged, subscribeSync, type SyncSource } from '@/hooks/recoverySyncEvents';

const PLAN_STORAGE_KEY = '@daily_task';

type HaltState = {
  hungry: boolean;
  angry: boolean;
  lonely: boolean;
  tired: boolean;
};

type DoneState = {
  self: boolean;
  duties: boolean;
  relations: boolean;
  challenge: boolean;
};

type DailyPlan = {
  dateKey: DateKey;
  self: string;
  duties: string;
  relations: string;
  challenge: string;
  done: DoneState;
  halt: HaltState;
  summarized: boolean;
};

type PlanStore = Record<DateKey, DailyPlan>;

type CravingRiskLevel = 'pod_kontrola' | 'ostrzegawczy' | 'wysokie_ryzyko' | 'kryzys' | 'brak';

type JournalRollup = {
  emotionCount: number;
  cravingCount: number;
  cravingSymptomsTotal: number;
  cravingMaxLevel: CravingRiskLevel;
  gratitudeCount: number;
};

export type DaySnapshot = {
  dateKey: DateKey;
  plan: {
    hasPlan: boolean;
    doneCount: number;
    haltCount: number;
    summarized: boolean;
  };
  texts: {
    readCount: number;
    idsDone: DailyTextId[];
  };
  journals: JournalRollup;
  consistencyFlags: {
    missingPlanData: boolean;
    missingTextsData: boolean;
    legacyDataRecovered: boolean;
  };
};

export type RangeSnapshot = {
  days: DaySnapshot[];
  totals: {
    doneCount: number;
    haltCount: number;
    readCount: number;
    emotionCount: number;
    cravingCount: number;
    cravingSymptomsTotal: number;
    gratitudeCount: number;
  };
  trend: {
    averageDailyBalance: number;
    balanceDelta: number;
  };
};

const cravingSeverityOrder: Record<CravingRiskLevel, number> = {
  brak: 0,
  pod_kontrola: 1,
  ostrzegawczy: 2,
  wysokie_ryzyko: 3,
  kryzys: 4,
};

function emptyPlan(dateKey: DateKey): DailyPlan {
  return {
    dateKey,
    self: '',
    duties: '',
    relations: '',
    challenge: '',
    done: { self: false, duties: false, relations: false, challenge: false },
    halt: { hungry: false, angry: false, lonely: false, tired: false },
    summarized: false,
  };
}

function hasPlanContent(plan: DailyPlan) {
  return [plan.self, plan.duties, plan.relations, plan.challenge].some((v) => v.trim().length > 0);
}

function normalizePlan(raw: unknown, fallbackDateKey: DateKey): DailyPlan {
  const parsed = (raw && typeof raw === 'object' ? raw : {}) as Partial<DailyPlan>;
  const dateKey = typeof parsed.dateKey === 'string' ? parsed.dateKey : fallbackDateKey;

  const doneParsed = parsed.done && typeof parsed.done === 'object' ? (parsed.done as Partial<DoneState>) : {};
  const haltParsed = parsed.halt && typeof parsed.halt === 'object' ? (parsed.halt as Partial<HaltState>) : {};

  return {
    dateKey: dateKey as DateKey,
    self: typeof parsed.self === 'string' ? parsed.self : '',
    duties: typeof parsed.duties === 'string' ? parsed.duties : '',
    relations: typeof parsed.relations === 'string' ? parsed.relations : '',
    challenge: typeof parsed.challenge === 'string' ? parsed.challenge : '',
    done: {
      self: doneParsed.self === true,
      duties: doneParsed.duties === true,
      relations: doneParsed.relations === true,
      challenge: doneParsed.challenge === true,
    },
    halt: {
      hungry: haltParsed.hungry === true,
      angry: haltParsed.angry === true,
      lonely: haltParsed.lonely === true,
      tired: haltParsed.tired === true,
    },
    summarized: parsed.summarized === true,
  };
}

function parsePlanStore(raw: unknown): PlanStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const parsed = raw as Record<string, unknown>;
  const out: PlanStore = {};
  for (const [dateKey, value] of Object.entries(parsed)) {
    if (!parseDateKey(dateKey as DateKey)) continue;
    out[dateKey as DateKey] = normalizePlan(value, dateKey as DateKey);
  }
  return out;
}

function getCravingLevelFromSymptoms(symptomsCount: number): CravingRiskLevel {
  if (symptomsCount <= 0) return 'brak';
  if (symptomsCount <= 3) return 'pod_kontrola';
  if (symptomsCount <= 6) return 'ostrzegawczy';
  if (symptomsCount <= 10) return 'wysokie_ryzyko';
  return 'kryzys';
}

function addDays(dateKey: DateKey, days: number): DateKey {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  parsed.setDate(parsed.getDate() + days);
  return getLocalDateKey(parsed);
}

function dateKeyDiffInDays(from: DateKey, to: DateKey) {
  const d1 = parseDateKey(from);
  const d2 = parseDateKey(to);
  if (!d1 || !d2) return 0;
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

async function loadPlanStore(): Promise<PlanStore> {
  const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
  if (!raw) return {};
  try {
    return parsePlanStore(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function loadTextsStore() {
  const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
  if (!raw) return parseDailyTextsStore(null);
  try {
    return parseDailyTextsStore(JSON.parse(raw));
  } catch {
    return parseDailyTextsStore(null);
  }
}

async function loadJournalRollupByDate(): Promise<Map<DateKey, JournalRollup>> {
  const entries = await listJournalEntries();
  const map = new Map<DateKey, JournalRollup>();

  for (const entry of entries) {
    const dateKey = entry.dateKey;
    if (!parseDateKey(dateKey)) continue;

    const current =
      map.get(dateKey as DateKey) ??
      ({
        emotionCount: 0,
        cravingCount: 0,
        cravingSymptomsTotal: 0,
        cravingMaxLevel: 'brak',
        gratitudeCount: 0,
      } satisfies JournalRollup);

    if (entry.type === 'emotion') {
      current.emotionCount += 1;
    } else if (entry.type === 'gratitude') {
      current.gratitudeCount += 1;
    } else if (entry.type === 'craving') {
      current.cravingCount += 1;
      current.cravingSymptomsTotal += entry.symptomsCount;
      const level = getCravingLevelFromSymptoms(entry.symptomsCount);
      if (cravingSeverityOrder[level] > cravingSeverityOrder[current.cravingMaxLevel]) {
        current.cravingMaxLevel = level;
      }
    }

    map.set(dateKey as DateKey, current);
  }

  return map;
}

export async function loadDaySnapshot(dateKey: DateKey): Promise<DaySnapshot> {
  const [planStore, textsStore, journalsByDate] = await Promise.all([
    loadPlanStore(),
    loadTextsStore(),
    loadJournalRollupByDate(),
  ]);

  const plan = planStore[dateKey] ?? emptyPlan(dateKey);
  const hasPlan = hasPlanContent(plan);
  const doneCount = Object.values(plan.done).filter(Boolean).length;
  const haltCount = Object.values(plan.halt).filter(Boolean).length;

  const texts = getDailyTextsForDate(textsStore, dateKey);
  const idsDone = (Object.entries(texts) as Array<[DailyTextId, boolean]>)
    .filter(([, done]) => done)
    .map(([id]) => id);

  const journals =
    journalsByDate.get(dateKey) ??
    ({
      emotionCount: 0,
      cravingCount: 0,
      cravingSymptomsTotal: 0,
      cravingMaxLevel: 'brak',
      gratitudeCount: 0,
    } satisfies JournalRollup);

  return {
    dateKey,
    plan: {
      hasPlan,
      doneCount,
      haltCount,
      summarized: plan.summarized,
    },
    texts: {
      readCount: idsDone.length,
      idsDone,
    },
    journals,
    consistencyFlags: {
      missingPlanData: !hasPlan,
      missingTextsData: idsDone.length === 0,
      legacyDataRecovered: false,
    },
  };
}

export async function loadRangeSnapshot(from: DateKey, to: DateKey): Promise<RangeSnapshot> {
  const diff = dateKeyDiffInDays(from, to);
  const step = diff >= 0 ? 1 : -1;
  const count = Math.abs(diff) + 1;

  const days: DaySnapshot[] = [];
  for (let i = 0; i < count; i += 1) {
    const key = addDays(from, i * step);
    days.push(await loadDaySnapshot(key));
  }

  const totals = days.reduce(
    (acc, day) => {
      acc.doneCount += day.plan.doneCount;
      acc.haltCount += day.plan.haltCount;
      acc.readCount += day.texts.readCount;
      acc.emotionCount += day.journals.emotionCount;
      acc.cravingCount += day.journals.cravingCount;
      acc.cravingSymptomsTotal += day.journals.cravingSymptomsTotal;
      acc.gratitudeCount += day.journals.gratitudeCount;
      return acc;
    },
    {
      doneCount: 0,
      haltCount: 0,
      readCount: 0,
      emotionCount: 0,
      cravingCount: 0,
      cravingSymptomsTotal: 0,
      gratitudeCount: 0,
    }
  );

  const balances = days.map((day) => day.plan.doneCount + day.texts.readCount - day.plan.haltCount * 2);
  const averageDailyBalance =
    balances.length > 0 ? Number((balances.reduce((a, b) => a + b, 0) / balances.length).toFixed(2)) : 0;
  const balanceDelta = balances.length > 1 ? balances[balances.length - 1] - balances[0] : 0;

  return {
    days,
    totals,
    trend: {
      averageDailyBalance,
      balanceDelta,
    },
  };
}

export { notifyDataChanged, subscribeSync, type SyncSource };

export async function loadTodaySnapshot() {
  return loadDaySnapshot(todayDateKey());
}
