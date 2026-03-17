import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_SETTINGS_STORAGE_KEY = '@app_settings';
const settingsListeners = new Set<(settings: AppSettings) => void>();

export type PlanCalendarView = 'week' | 'month';
export type PlanDayOpenMode = 'plan' | 'summary';
export type AppTextScale = 'small' | 'medium' | 'large';
export type AppLanguage = 'pl';

export type AppSettings = {
  planDefaultCalendarView: PlanCalendarView;
  planDefaultDayOpenMode: PlanDayOpenMode;
  planAutoSwitchToSummaryEvening: boolean;
  textScale: AppTextScale;
  highContrast: boolean;
  language: AppLanguage;
  privacyConsentLocalStorage: boolean;
  privacyConsentNotifications: boolean;
  privacyConsentRegulations: boolean;
  privacyConsentSharedExperience: boolean;
  introSeen: boolean;
  counterDone: boolean;
  anniversaryDone: boolean;
  firstStepsDone: boolean;
  intelligentSupportEnabled: boolean;
  intelligentSupportPromptNextAt: string | null;
  badgeIndicatorsEnabled: boolean;
  firstRunSetupDone: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  planDefaultCalendarView: 'week',
  planDefaultDayOpenMode: 'plan',
  planAutoSwitchToSummaryEvening: true,
  textScale: 'medium',
  highContrast: false,
  language: 'pl',
  privacyConsentLocalStorage: false,
  privacyConsentNotifications: false,
  privacyConsentRegulations: false,
  privacyConsentSharedExperience: false,
  introSeen: false,
  counterDone: false,
  anniversaryDone: false,
  firstStepsDone: false,
  intelligentSupportEnabled: false,
  intelligentSupportPromptNextAt: null,
  badgeIndicatorsEnabled: false,
  firstRunSetupDone: false,
};

function isTextScale(value: unknown): value is AppTextScale {
  return value === 'small' || value === 'medium' || value === 'large';
}

function isCalendarView(value: unknown): value is PlanCalendarView {
  return value === 'week' || value === 'month';
}

function isPlanDayOpenMode(value: unknown): value is PlanDayOpenMode {
  return value === 'plan' || value === 'summary';
}

function normalizeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    planDefaultCalendarView: isCalendarView(value?.planDefaultCalendarView)
      ? value.planDefaultCalendarView
      : DEFAULT_APP_SETTINGS.planDefaultCalendarView,
    planDefaultDayOpenMode: isPlanDayOpenMode(value?.planDefaultDayOpenMode)
      ? value.planDefaultDayOpenMode
      : DEFAULT_APP_SETTINGS.planDefaultDayOpenMode,
    planAutoSwitchToSummaryEvening:
      typeof value?.planAutoSwitchToSummaryEvening === 'boolean'
        ? value.planAutoSwitchToSummaryEvening
        : DEFAULT_APP_SETTINGS.planAutoSwitchToSummaryEvening,
    textScale: isTextScale(value?.textScale) ? value.textScale : DEFAULT_APP_SETTINGS.textScale,
    highContrast: typeof value?.highContrast === 'boolean' ? value.highContrast : DEFAULT_APP_SETTINGS.highContrast,
    language: value?.language === 'pl' ? 'pl' : DEFAULT_APP_SETTINGS.language,
    privacyConsentLocalStorage:
      typeof value?.privacyConsentLocalStorage === 'boolean'
        ? value.privacyConsentLocalStorage
        : DEFAULT_APP_SETTINGS.privacyConsentLocalStorage,
    privacyConsentNotifications:
      typeof value?.privacyConsentNotifications === 'boolean'
        ? value.privacyConsentNotifications
        : DEFAULT_APP_SETTINGS.privacyConsentNotifications,
    privacyConsentRegulations:
      typeof value?.privacyConsentRegulations === 'boolean'
        ? value.privacyConsentRegulations
        : DEFAULT_APP_SETTINGS.privacyConsentRegulations,
    privacyConsentSharedExperience:
      typeof value?.privacyConsentSharedExperience === 'boolean'
        ? value.privacyConsentSharedExperience
        : DEFAULT_APP_SETTINGS.privacyConsentSharedExperience,
    introSeen: typeof value?.introSeen === 'boolean' ? value.introSeen : DEFAULT_APP_SETTINGS.introSeen,
    counterDone: typeof value?.counterDone === 'boolean' ? value.counterDone : DEFAULT_APP_SETTINGS.counterDone,
    anniversaryDone:
      typeof value?.anniversaryDone === 'boolean' ? value.anniversaryDone : DEFAULT_APP_SETTINGS.anniversaryDone,
    firstStepsDone:
      typeof value?.firstStepsDone === 'boolean'
        ? value.firstStepsDone
        : typeof (value as { onboardingDone?: unknown } | undefined)?.onboardingDone === 'boolean'
          ? Boolean((value as { onboardingDone?: boolean }).onboardingDone)
          : DEFAULT_APP_SETTINGS.firstStepsDone,
    intelligentSupportEnabled:
      typeof value?.intelligentSupportEnabled === 'boolean'
        ? value.intelligentSupportEnabled
        : DEFAULT_APP_SETTINGS.intelligentSupportEnabled,
    intelligentSupportPromptNextAt:
      typeof value?.intelligentSupportPromptNextAt === 'string' || value?.intelligentSupportPromptNextAt === null
        ? value.intelligentSupportPromptNextAt
        : DEFAULT_APP_SETTINGS.intelligentSupportPromptNextAt,
    badgeIndicatorsEnabled:
      typeof value?.badgeIndicatorsEnabled === 'boolean'
        ? value.badgeIndicatorsEnabled
        : DEFAULT_APP_SETTINGS.badgeIndicatorsEnabled,
    firstRunSetupDone:
      typeof value?.firstRunSetupDone === 'boolean'
        ? value.firstRunSetupDone
        : typeof value?.firstStepsDone === 'boolean'
          ? value.firstStepsDone
          : DEFAULT_APP_SETTINGS.firstRunSetupDone,
  };
}

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_APP_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_APP_SETTINGS;
    return normalizeSettings(parsed as Partial<AppSettings>);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings) {
  const normalized = normalizeSettings(settings);
  await AsyncStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  settingsListeners.forEach((listener) => listener(normalized));
}

export async function resetAppSettings() {
  await saveAppSettings(DEFAULT_APP_SETTINGS);
  return DEFAULT_APP_SETTINGS;
}

export function subscribeAppSettingsChanges(listener: (settings: AppSettings) => void) {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}
