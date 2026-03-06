import { getLocalDateKey } from '@/constants/calendar';
import { createEmptyDailyTextsStore, DAILY_TEXTS_STORAGE_KEY, getDailyTextsForDate, parseDailyTextsStore } from '@/constants/daily-texts';
import { listJournalEntriesByDate } from '@/hooks/useJournals';
import { subscribeSync } from '@/hooks/recoverySyncEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const PLAN_STORAGE_KEY = '@daily_task';
const SUPPORT_CONTACTS_STORAGE_KEY = '@support_contacts';

export type PendingTasksBadgeState = {
  missingPlan: boolean;
  missingSummary: boolean;
  missingEmotionEntry: boolean;
  missingDailyTextsCount: number;
  missingSupportContact: boolean;
  total: number;
};

const EMPTY_STATE: PendingTasksBadgeState = {
  missingPlan: false,
  missingSummary: false,
  missingEmotionEntry: false,
  missingDailyTextsCount: 0,
  missingSupportContact: false,
  total: 0,
};

function hasAnyText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPlanContent(plan: unknown) {
  if (!plan || typeof plan !== 'object') return false;
  const row = plan as Record<string, unknown>;

  const planText = row.planText;
  const self = row.self;
  const duties = row.duties;
  const relations = row.relations;
  const challenge = row.challenge;
  const items = Array.isArray(row.items) ? row.items : [];
  const hasItemText = items.some((item) => item && typeof item === 'object' && hasAnyText((item as Record<string, unknown>).text));

  return (
    hasAnyText(planText) ||
    hasAnyText(self) ||
    hasAnyText(duties) ||
    hasAnyText(relations) ||
    hasAnyText(challenge) ||
    hasItemText
  );
}

async function readPlanForDate(dateKey: string) {
  const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const row = (parsed as Record<string, unknown>)[dateKey];
    return row && typeof row === 'object' ? (row as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function computePendingTasksBadgeState(): Promise<PendingTasksBadgeState> {
  const dateKey = getLocalDateKey();
  const now = new Date();
  const after20 = now.getHours() >= 20;

  const [todayPlan, emotionEntries, dailyTextsRaw, supportContactsRaw] = await Promise.all([
    readPlanForDate(dateKey),
    listJournalEntriesByDate('emotion', dateKey),
    AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY),
    AsyncStorage.getItem(SUPPORT_CONTACTS_STORAGE_KEY),
  ]);

  const planExists = hasPlanContent(todayPlan);
  const summaryDone = Boolean(todayPlan?.summarized);
  const missingPlan = !planExists;
  const missingSummary = planExists && after20 && !summaryDone;
  const missingEmotionEntry = emotionEntries.length === 0;

  let dailyTextsParsed: unknown = createEmptyDailyTextsStore();
  if (dailyTextsRaw) {
    try {
      dailyTextsParsed = JSON.parse(dailyTextsRaw);
    } catch {
      dailyTextsParsed = createEmptyDailyTextsStore();
    }
  }
  const dailyTextsStore = parseDailyTextsStore(dailyTextsParsed);
  const dailyTextsState = getDailyTextsForDate(dailyTextsStore, dateKey);
  const missingDailyTextsCount = Object.values(dailyTextsState).filter((done) => done !== true).length;

  let supportContactsCount = 0;
  if (supportContactsRaw) {
    try {
      const parsed = JSON.parse(supportContactsRaw);
      if (Array.isArray(parsed)) {
        supportContactsCount = parsed.length;
      }
    } catch {
      supportContactsCount = 0;
    }
  }
  const missingSupportContact = supportContactsCount === 0;

  const total = [
    missingPlan,
    missingSummary,
    missingEmotionEntry,
    missingSupportContact,
    ...Array.from({ length: missingDailyTextsCount }, () => true),
  ].filter(Boolean).length;

  return {
    missingPlan,
    missingSummary,
    missingEmotionEntry,
    missingDailyTextsCount,
    missingSupportContact,
    total,
  };
}

export function usePendingTasksBadge(enabled = true) {
  const [state, setState] = useState<PendingTasksBadgeState>(EMPTY_STATE);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    let mounted = true;

    const refresh = async () => {
      const next = await computePendingTasksBadgeState();
      if (mounted) {
        setState(next);
      }
    };

    void refresh();

    const unsubscribeSync = subscribeSync(() => {
      void refresh();
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    const interval = setInterval(() => {
      void refresh();
    }, 60_000);

    return () => {
      mounted = false;
      unsubscribeSync();
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, [enabled]);

  return state;
}
