import { getLocalDateKey, parseDateKey, type DateKey } from '@/constants/calendar';
import { type BaseEmotion, type CravingJournalEntry, type EmotionJournalEntry } from '@/constants/journals';
import { loadAppSettings } from '@/hooks/useAppSettings';
import { listJournalEntries } from '@/hooks/useJournals';
import { loadRangeSnapshot, subscribeSync } from '@/hooks/useRecoveryCalendarSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

const PLAN_STORAGE_KEY = '@daily_task';
const INTELLIGENT_SUPPORT_STATE_KEY = '@intelligent_support_state_v1';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PUSH_GAP_MS = 48 * HOUR_MS;

type IntelligentSupportTopic = 'EMO' | 'WITHDRAW' | 'RISK';
type IntelligentSupportLevel = 1 | 2 | 3;
type IntelligentSupportSeverity = 'NONE' | 'LOW' | 'MED' | 'HIGH' | 'CRISIS';

export type IntelligentSupportSuggestion = {
  id: string;
  createdAt: string;
  dateKey: DateKey;
  topic: IntelligentSupportTopic;
  level: IntelligentSupportLevel;
  title: string;
  message: string;
  ctaPrimaryRoute: '/dziennik-uczucia' | '/plan-dnia' | '/dziennik-kryzysu' | '/wsparcie-siatka';
  ctaSecondaryRoute: '/plan-dnia' | '/wsparcie-siatka' | null;
  status: 'new' | 'done' | 'postponed';
  inAppOnly: boolean;
};

type IntelligentSupportHistoryItem = {
  sentAt: string;
  level: IntelligentSupportLevel;
};

type IntelligentSupportEngineState = {
  activityDays: DateKey[];
  lastEvaluatedDate: DateKey | null;
  pushHistory: IntelligentSupportHistoryItem[];
  pendingSuggestion: IntelligentSupportSuggestion | null;
};

type HaltFlags = {
  hungry: boolean;
  angry: boolean;
  lonely: boolean;
  tired: boolean;
};

const EMPTY_ENGINE_STATE: IntelligentSupportEngineState = {
  activityDays: [],
  lastEvaluatedDate: null,
  pushHistory: [],
  pendingSuggestion: null,
};

const DIFFICULT_EMOTIONS = new Set<BaseEmotion>(['Złość', 'Wstyd', 'Strach', 'Smutek', 'Poczucie winy', 'Samotność']);

function isExpoGoAndroidRuntime() {
  if (Platform.OS !== 'android') return false;
  const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
  const executionEnvironment = (Constants as { executionEnvironment?: string | null }).executionEnvironment;
  return appOwnership === 'expo' || executionEnvironment === 'storeClient';
}

function addDays(dateKey: DateKey, delta: number): DateKey {
  const d = parseDateKey(dateKey);
  if (!d) return dateKey;
  d.setDate(d.getDate() + delta);
  return getLocalDateKey(d);
}

function dateWindow(lastDays: number): DateKey[] {
  const today = getLocalDateKey();
  const out: DateKey[] = [];
  for (let i = lastDays - 1; i >= 0; i -= 1) {
    out.push(addDays(today, -i));
  }
  return out;
}

function normalizeState(value: unknown): IntelligentSupportEngineState {
  if (!value || typeof value !== 'object') return EMPTY_ENGINE_STATE;
  const raw = value as Partial<IntelligentSupportEngineState>;
  const pushHistory = Array.isArray(raw.pushHistory)
    ? raw.pushHistory
        .filter((item): item is IntelligentSupportHistoryItem => {
          if (!item || typeof item !== 'object') return false;
          const record = item as Partial<IntelligentSupportHistoryItem>;
          return typeof record.sentAt === 'string' && (record.level === 1 || record.level === 2 || record.level === 3);
        })
        .slice(-20)
    : [];
  const activityDays = Array.isArray(raw.activityDays)
    ? raw.activityDays.filter((v): v is DateKey => typeof v === 'string').slice(-21)
    : [];
  const pendingSuggestion =
    raw.pendingSuggestion &&
    typeof raw.pendingSuggestion === 'object' &&
    typeof (raw.pendingSuggestion as Partial<IntelligentSupportSuggestion>).id === 'string'
      ? (raw.pendingSuggestion as IntelligentSupportSuggestion)
      : null;

  return {
    activityDays,
    lastEvaluatedDate: typeof raw.lastEvaluatedDate === 'string' ? raw.lastEvaluatedDate : null,
    pushHistory,
    pendingSuggestion,
  };
}

async function loadEngineState(): Promise<IntelligentSupportEngineState> {
  const raw = await AsyncStorage.getItem(INTELLIGENT_SUPPORT_STATE_KEY);
  if (!raw) return EMPTY_ENGINE_STATE;
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return EMPTY_ENGINE_STATE;
  }
}

async function saveEngineState(state: IntelligentSupportEngineState) {
  await AsyncStorage.setItem(INTELLIGENT_SUPPORT_STATE_KEY, JSON.stringify(state));
}

function toCravingSeverity(symptomsCount: number): IntelligentSupportSeverity {
  if (!Number.isFinite(symptomsCount) || symptomsCount <= 0) return 'NONE';
  if (symptomsCount <= 4) return 'LOW';
  if (symptomsCount <= 9) return 'MED';
  if (symptomsCount <= 14) return 'HIGH';
  return 'CRISIS';
}

function clampLevel(value: number): IntelligentSupportLevel {
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return 2;
}

async function loadPlanHaltFlagsByDate(): Promise<Map<DateKey, HaltFlags>> {
  const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
  if (!raw) return new Map<DateKey, HaltFlags>();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Map<DateKey, HaltFlags>();
    const out = new Map<DateKey, HaltFlags>();
    for (const [dateKey, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!parseDateKey(dateKey)) continue;
      const haltObj =
        value && typeof value === 'object' && (value as { halt?: unknown }).halt && typeof (value as { halt?: unknown }).halt === 'object'
          ? ((value as { halt: Record<string, unknown> }).halt as Record<string, unknown>)
          : {};
      out.set(dateKey, {
        hungry: haltObj.hungry === true,
        angry: haltObj.angry === true,
        lonely: haltObj.lonely === true,
        tired: haltObj.tired === true,
      });
    }
    return out;
  } catch {
    return new Map<DateKey, HaltFlags>();
  }
}

async function sendLocalSupportPush(title: string, body: string) {
  if (Platform.OS === 'web' || isExpoGoAndroidRuntime()) return false;
  try {
    const Notifications = await import('expo-notifications');
    const permissions = await Notifications.getPermissionsAsync();
    let status = permissions.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

function consecutiveCount(keysFromToday: DateKey[], predicate: (dateKey: DateKey) => boolean) {
  let count = 0;
  for (const key of keysFromToday) {
    if (!predicate(key)) break;
    count += 1;
  }
  return count;
}

function buildSuggestion(topic: IntelligentSupportTopic, level: IntelligentSupportLevel, inAppOnly: boolean): IntelligentSupportSuggestion {
  const now = new Date();
  const dateKey = getLocalDateKey(now);
  const createdAt = now.toISOString();

  if (level === 1) {
    if (topic === 'EMO') {
      return {
        id: `support_${Date.now()}_emo1`,
        createdAt,
        dateKey,
        topic,
        level,
        title: 'Anioł Stróż',
        message: 'Ostatnie dni były bardziej napięte. Jeśli chcesz, zatrzymaj się dziś na chwilę.',
        ctaPrimaryRoute: '/dziennik-uczucia',
        ctaSecondaryRoute: '/plan-dnia',
        status: 'new',
        inAppOnly,
      };
    }
    if (topic === 'WITHDRAW') {
      return {
        id: `support_${Date.now()}_w1`,
        createdAt,
        dateKey,
        topic,
        level,
        title: 'Anioł Stróż',
        message: 'Nie było Cię tu od kilku dni. Dobrze, że możesz wrócić choć na chwilę.',
        ctaPrimaryRoute: '/plan-dnia',
        ctaSecondaryRoute: null,
        status: 'new',
        inAppOnly,
      };
    }
    return {
      id: `support_${Date.now()}_r1`,
      createdAt,
      dateKey,
      topic,
      level,
      title: 'Anioł Stróż',
      message: 'W ostatnich dniach było więcej napięcia. Jeśli chcesz, zajrzyj dziś do siebie.',
      ctaPrimaryRoute: '/dziennik-kryzysu',
      ctaSecondaryRoute: '/wsparcie-siatka',
      status: 'new',
      inAppOnly,
    };
  }

  if (level === 2) {
    const primary = topic === 'EMO' ? '/dziennik-uczucia' : topic === 'WITHDRAW' ? '/plan-dnia' : '/dziennik-kryzysu';
    return {
      id: `support_${Date.now()}_l2`,
      createdAt,
      dateKey,
      topic,
      level,
      title: 'Anioł Stróż',
      message: 'Kilka ostatnich dni było trudniejszych. Jeśli chcesz, wybierz dziś jedną małą rzecz.',
      ctaPrimaryRoute: primary,
      ctaSecondaryRoute: topic === 'RISK' ? '/wsparcie-siatka' : '/plan-dnia',
      status: 'new',
      inAppOnly,
    };
  }

  return {
    id: `support_${Date.now()}_l3`,
    createdAt,
    dateKey,
    topic,
    level,
    title: 'Anioł Stróż',
    message: 'Ostatni tydzień był wymagający. Jeśli chcesz, zajrzyj dziś do swojej siatki wsparcia.',
    ctaPrimaryRoute: '/wsparcie-siatka',
    ctaSecondaryRoute: '/plan-dnia',
    status: 'new',
    inAppOnly,
  };
}

async function evaluateAndStoreIntelligentSupport() {
  const [settings, state] = await Promise.all([loadAppSettings(), loadEngineState()]);
  const today = getLocalDateKey();
  const activityDays = Array.from(new Set([...state.activityDays, today])).slice(-21);

  if (!settings.intelligentSupportEnabled) {
    if (state.activityDays.length !== activityDays.length || !state.activityDays.includes(today)) {
      await saveEngineState({ ...state, activityDays });
    }
    return;
  }

  if (state.lastEvaluatedDate === today) {
    if (state.activityDays.length !== activityDays.length || !state.activityDays.includes(today)) {
      await saveEngineState({ ...state, activityDays });
    }
    return;
  }

  const dates7Asc = dateWindow(7);
  const dates7FromToday = [...dates7Asc].reverse();
  const dates4FromToday = dates7FromToday.slice(0, 4);
  const dates3FromToday = dates7FromToday.slice(0, 3);

  const [range7, allEmotionRaw, allCravingRaw, planHaltByDate] = await Promise.all([
    loadRangeSnapshot(dates7Asc[0], dates7Asc[dates7Asc.length - 1]),
    listJournalEntries('emotion'),
    listJournalEntries('craving'),
    loadPlanHaltFlagsByDate(),
  ]);

  const allEmotion = allEmotionRaw as EmotionJournalEntry[];
  const allCraving = allCravingRaw as CravingJournalEntry[];

  const dayMap = new Map(range7.days.map((day) => [day.dateKey, day]));
  const emotionByDate = new Map<DateKey, BaseEmotion[]>();
  for (const entry of allEmotion) {
    if (!dayMap.has(entry.dateKey)) continue;
    const list = emotionByDate.get(entry.dateKey) ?? [];
    list.push(entry.baseEmotion);
    emotionByDate.set(entry.dateKey, list);
  }

  const cravingByDate = new Map<DateKey, CravingJournalEntry[]>();
  for (const entry of allCraving) {
    if (!dayMap.has(entry.dateKey)) continue;
    if (!entry.cravingReported) continue;
    const list = cravingByDate.get(entry.dateKey) ?? [];
    list.push(entry);
    cravingByDate.set(entry.dateKey, list);
  }

  const dominantEmotionByDate = new Map<DateKey, BaseEmotion | null>();
  for (const dateKey of dates7Asc) {
    const entries = emotionByDate.get(dateKey) ?? [];
    if (entries.length === 0) {
      dominantEmotionByDate.set(dateKey, null);
      continue;
    }
    const counts = new Map<BaseEmotion, number>();
    for (const emotion of entries) {
      counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
    }
    const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    dominantEmotionByDate.set(dateKey, dominant);
  }

  const difficultDays7 = dates7Asc.filter((dateKey) => {
    const emotion = dominantEmotionByDate.get(dateKey);
    return emotion ? DIFFICULT_EMOTIONS.has(emotion) : false;
  }).length;

  const emotionStreakSame = (() => {
    const first = dominantEmotionByDate.get(today);
    if (!first || !DIFFICULT_EMOTIONS.has(first)) return 0;
    let streak = 0;
    for (const dateKey of dates7FromToday) {
      const emotion = dominantEmotionByDate.get(dateKey);
      if (emotion !== first) break;
      streak += 1;
    }
    return streak;
  })();

  const gratitudeMissedStreak = consecutiveCount(dates7FromToday, (dateKey) => (dayMap.get(dateKey)?.journals.gratitudeCount ?? 0) === 0);
  const haltHighDays7 = dates7Asc.filter((dateKey) => (dayMap.get(dateKey)?.plan.haltCount ?? 0) >= 2).length;
  const haltAngry3of4 = dates4FromToday.filter((dateKey) => planHaltByDate.get(dateKey)?.angry === true).length >= 3;

  let emoLevel = 0;
  if (difficultDays7 >= 3 || emotionStreakSame >= 3 || haltAngry3of4) emoLevel = 1;
  if (difficultDays7 >= 5 || emotionStreakSame >= 4) emoLevel = Math.max(emoLevel, 2);
  if (difficultDays7 >= 7 && (gratitudeMissedStreak >= 4 || haltHighDays7 >= 5)) emoLevel = 3;

  const hasPlan = (dateKey: DateKey) => Boolean(dayMap.get(dateKey)?.plan.hasPlan);
  const planStreakMissed = consecutiveCount(dates7FromToday, (dateKey) => !hasPlan(dateKey));

  const activitySet = new Set(activityDays);
  const inactiveStreak = consecutiveCount(dates7FromToday, (dateKey) => !activitySet.has(dateKey));

  const noJournalAndHaltStreak = consecutiveCount(dates7FromToday, (dateKey) => {
    const day = dayMap.get(dateKey);
    if (!day) return false;
    return day.journals.emotionCount === 0 && day.journals.gratitudeCount === 0 && day.plan.haltCount === 0;
  });

  const withdrawBase = Math.max(inactiveStreak, planStreakMissed, noJournalAndHaltStreak);
  let withdrawLevel = 0;
  if (withdrawBase >= 3) withdrawLevel = 1;
  if (withdrawBase >= 5) withdrawLevel = 2;
  if (withdrawBase >= 7) withdrawLevel = 3;

  const cravingDays7 = dates7Asc.filter((dateKey) => (cravingByDate.get(dateKey)?.length ?? 0) > 0).length;
  const cravingStreak = consecutiveCount(dates7FromToday, (dateKey) => (cravingByDate.get(dateKey)?.length ?? 0) > 0);

  const cravingPattern2of3 = dates3FromToday.filter((dateKey) => {
    const hasCraving = (cravingByDate.get(dateKey)?.length ?? 0) > 0;
    const haltSum = dayMap.get(dateKey)?.plan.haltCount ?? 0;
    return hasCraving && (!hasPlan(dateKey) || haltSum >= 2);
  }).length;

  const lonelyOrTiredRecurring =
    dates4FromToday.filter((dateKey) => {
      const halt = planHaltByDate.get(dateKey);
      return Boolean(halt?.lonely || halt?.tired);
    }).length >= 3;

  const cravingSeverityMax = (() => {
    let max: IntelligentSupportSeverity = 'NONE';
    const order: Record<IntelligentSupportSeverity, number> = { NONE: 0, LOW: 1, MED: 2, HIGH: 3, CRISIS: 4 };
    for (const dateKey of dates7Asc) {
      const entries = cravingByDate.get(dateKey) ?? [];
      for (const entry of entries) {
        const severity = toCravingSeverity(entry.symptomsCount);
        if (order[severity] > order[max]) {
          max = severity;
        }
      }
    }
    return max;
  })();

  let riskLevel = 0;
  if (cravingStreak >= 3) riskLevel = 1;
  if (cravingDays7 >= 5 || cravingPattern2of3 >= 2 || cravingSeverityMax === 'HIGH' || cravingSeverityMax === 'CRISIS') {
    riskLevel = Math.max(riskLevel, 2);
  }
  const strongRiskTrend = cravingDays7 >= 7 || cravingStreak >= 5;
  if (strongRiskTrend && haltHighDays7 >= 4) {
    riskLevel = 3;
  }
  if (lonelyOrTiredRecurring && riskLevel > 0) {
    const boosted = riskLevel + 1;
    riskLevel = strongRiskTrend ? Math.min(3, boosted) : Math.min(2, boosted);
  }

  const levels: Record<IntelligentSupportTopic, number> = {
    EMO: emoLevel,
    WITHDRAW: withdrawLevel,
    RISK: riskLevel,
  };
  const priority: Record<IntelligentSupportTopic, number> = { RISK: 3, WITHDRAW: 2, EMO: 1 };

  const topTopic = (Object.keys(levels) as IntelligentSupportTopic[]).sort((a, b) => {
    if (levels[b] !== levels[a]) return levels[b] - levels[a];
    return priority[b] - priority[a];
  })[0];
  const topLevel = clampLevel(Math.max(0, levels[topTopic]));

  if (levels[topTopic] <= 0) {
    await saveEngineState({
      ...state,
      activityDays,
      lastEvaluatedDate: today,
      pendingSuggestion:
        state.pendingSuggestion && state.pendingSuggestion.status === 'new' ? { ...state.pendingSuggestion, status: 'postponed' } : null,
    });
    return;
  }

  const now = Date.now();
  const history7 = state.pushHistory.filter((item) => {
    const t = Date.parse(item.sentAt);
    return Number.isFinite(t) && now - t <= 7 * DAY_MS;
  });
  const lastPushAt = history7.length > 0 ? Math.max(...history7.map((item) => Date.parse(item.sentAt))) : null;
  const hasRecentLevel3 = history7.some((item) => item.level === 3);
  const canPushByGap = lastPushAt === null || now - lastPushAt >= PUSH_GAP_MS;
  const canPushByCount = history7.length < 3;
  const canPushByStrong = topLevel < 3 || !hasRecentLevel3;
  const canPush = canPushByGap && canPushByCount && canPushByStrong && settings.privacyConsentNotifications;

  const suggestion = buildSuggestion(topTopic, topLevel, !canPush);

  const nextHistory = canPush
    ? [...history7, { sentAt: new Date().toISOString(), level: suggestion.level }].slice(-20)
    : history7;

  if (canPush) {
    await sendLocalSupportPush(suggestion.title, suggestion.message);
  }

  await saveEngineState({
    ...state,
    activityDays,
    lastEvaluatedDate: today,
    pushHistory: nextHistory,
    pendingSuggestion: suggestion,
  });
}

export async function loadPendingIntelligentSupportSuggestion() {
  const state = await loadEngineState();
  return state.pendingSuggestion;
}

export async function markIntelligentSupportSuggestionHandled(status: 'done' | 'postponed') {
  const state = await loadEngineState();
  if (!state.pendingSuggestion) return;
  await saveEngineState({
    ...state,
    pendingSuggestion: {
      ...state.pendingSuggestion,
      status,
    },
  });
}

export function useIntelligentSupportEngine() {
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await evaluateAndStoreIntelligentSupport();
    };

    void run();
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void run();
      }
    });
    const unsubscribeSync = subscribeSync(() => {
      void run();
    });

    return () => {
      active = false;
      appStateSub.remove();
      unsubscribeSync();
    };
  }, []);
}
