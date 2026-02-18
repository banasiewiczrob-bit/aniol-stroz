import { DAILY_TEXTS_STORAGE_KEY } from '@/constants/daily-texts';
import { CONTRACT_SIGNED_STORAGE_KEY, JOURNALS_ENTRIES_STORAGE_KEY } from '@/constants/storageKeys';
import { AppSettings, loadAppSettings, saveAppSettings } from '@/hooks/useAppSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';

const START_DATE_STORAGE_KEY = 'startDate';
const PLAN_STORAGE_KEY = '@daily_task';
const ARCHIVE_STORAGE_KEY = '@daily_task_archive';
const ANNIVERSARY_SEEN_STORAGE_KEY = '@anniversary_seen_once';

export type FirstStepsStep = 'intro' | 'consents' | 'contract' | 'counter' | 'anniversary' | 'done';

export type FirstStepsState = {
  introSeen: boolean;
  consentsCompleted: boolean;
  contractSigned: boolean;
  counterDone: boolean;
  anniversaryDone: boolean;
  firstStepsDone: boolean;
  legacyUser: boolean;
};

const listeners = new Set<() => void>();

function notifyFirstStepsChanged() {
  listeners.forEach((listener) => listener());
}

export function subscribeFirstStepsChanges(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function hasUsablePayload(raw: string | null) {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed === '{}' || trimmed === '[]' || trimmed === 'null') return false;
  return true;
}

async function detectLegacyUser(introSeen: boolean, contractSigned: boolean, startDateRaw: string | null) {
  if (introSeen) return false;
  if (contractSigned || Boolean(startDateRaw)) return true;

  const [plans, archive, journals, dailyTexts] = await Promise.all([
    AsyncStorage.getItem(PLAN_STORAGE_KEY),
    AsyncStorage.getItem(ARCHIVE_STORAGE_KEY),
    AsyncStorage.getItem(JOURNALS_ENTRIES_STORAGE_KEY),
    AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY),
  ]);

  return [plans, archive, journals, dailyTexts].some(hasUsablePayload);
}

function buildState(
  settings: AppSettings,
  contractSigned: boolean,
  counterDone: boolean,
  anniversaryDone: boolean,
  legacyUser: boolean
): FirstStepsState {
  const consentsCompleted = settings.privacyConsentLocalStorage && settings.privacyConsentRegulations;
  const firstStepsDone =
    legacyUser || (settings.introSeen && consentsCompleted && contractSigned && counterDone && anniversaryDone);

  return {
    introSeen: settings.introSeen,
    consentsCompleted,
    contractSigned,
    counterDone,
    anniversaryDone,
    firstStepsDone,
    legacyUser,
  };
}

export function resolveFirstStepsStep(state: FirstStepsState): FirstStepsStep {
  if (state.firstStepsDone) return 'done';
  if (!state.introSeen) return 'intro';
  if (!state.consentsCompleted) return 'consents';
  if (!state.contractSigned) return 'contract';
  if (!state.counterDone) return 'counter';
  if (!state.anniversaryDone) return 'anniversary';
  return 'done';
}

export async function getFirstStepsState(): Promise<FirstStepsState> {
  const [settings, signedRaw, startDateRaw, anniversarySeenRaw] = await Promise.all([
    loadAppSettings(),
    AsyncStorage.getItem(CONTRACT_SIGNED_STORAGE_KEY),
    AsyncStorage.getItem(START_DATE_STORAGE_KEY),
    AsyncStorage.getItem(ANNIVERSARY_SEEN_STORAGE_KEY),
  ]);

  const contractSigned = signedRaw === '1';
  const counterDone = settings.counterDone || Boolean(startDateRaw);
  const anniversaryDone = settings.anniversaryDone || anniversarySeenRaw === '1';
  const legacyUser = await detectLegacyUser(settings.introSeen, contractSigned, startDateRaw);
  const state = buildState(settings, contractSigned, counterDone, anniversaryDone, legacyUser);

  const needsSettingsUpdate =
    settings.counterDone !== state.counterDone ||
    settings.anniversaryDone !== state.anniversaryDone ||
    settings.firstStepsDone !== state.firstStepsDone;

  if (needsSettingsUpdate) {
    await saveAppSettings({
      ...settings,
      counterDone: state.counterDone,
      anniversaryDone: state.anniversaryDone,
      firstStepsDone: state.firstStepsDone,
    });
    notifyFirstStepsChanged();
  }

  return state;
}

export async function markIntroSeen() {
  const settings = await loadAppSettings();
  if (settings.introSeen) return;
  await saveAppSettings({ ...settings, introSeen: true });
  notifyFirstStepsChanged();
}

export async function markCounterDone() {
  const settings = await loadAppSettings();
  if (settings.counterDone) return;
  await saveAppSettings({ ...settings, counterDone: true });
  notifyFirstStepsChanged();
}

export async function markAnniversarySeen() {
  await AsyncStorage.setItem(ANNIVERSARY_SEEN_STORAGE_KEY, '1');
  const settings = await loadAppSettings();
  if (!settings.anniversaryDone) {
    await saveAppSettings({ ...settings, anniversaryDone: true });
  }
  notifyFirstStepsChanged();
}

export async function recomputeFirstStepsDone() {
  const state = await getFirstStepsState();
  return state.firstStepsDone;
}
