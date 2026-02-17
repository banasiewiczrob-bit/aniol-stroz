import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_SETTINGS_STORAGE_KEY = '@app_settings';

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
}

export async function resetAppSettings() {
  await saveAppSettings(DEFAULT_APP_SETTINGS);
  return DEFAULT_APP_SETTINGS;
}
