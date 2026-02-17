import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const IDS_STORAGE_KEY = '@daily_plan_notification_ids';
const SETTINGS_STORAGE_KEY = '@daily_plan_notification_settings';
const CHANNEL_ID = 'daily-plan-reminders';
const MORNING_KIND = 'daily_plan_morning';
const EVENING_KIND = 'daily_plan_evening';

type NotificationsModule = any;
let notificationsModuleCache: NotificationsModule | null | undefined;
let notificationsSkipLogged = false;

function isExpoGoAndroidRuntime() {
  if (Platform.OS !== 'android') return false;
  const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
  const executionEnvironment = (Constants as { executionEnvironment?: string | null }).executionEnvironment;
  return appOwnership === 'expo' || executionEnvironment === 'storeClient';
}

function getNotificationsModule(): NotificationsModule | null {
  if (notificationsModuleCache !== undefined) {
    return notificationsModuleCache;
  }

  if (Platform.OS === 'web' || isExpoGoAndroidRuntime()) {
    notificationsModuleCache = null;
    if (!notificationsSkipLogged && Platform.OS === 'android') {
      notificationsSkipLogged = true;
      console.warn('[Notifications] Expo Go Android: lokalne powiadomienia są wyłączone. Użyj dev build.');
    }
    return notificationsModuleCache;
  }

  try {
    notificationsModuleCache = require('expo-notifications');
  } catch {
    notificationsModuleCache = null;
    console.warn('[Notifications] expo-notifications unavailable in this runtime. Local reminders are disabled.');
  }

  return notificationsModuleCache;
}

export type DailyPlanNotificationSettings = {
  enabled: boolean;
  morningHour: number;
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
  weekdaysOnly: boolean;
  playSound: boolean;
};

export const DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS: DailyPlanNotificationSettings = {
  enabled: true,
  morningHour: 8,
  morningMinute: 0,
  eveningHour: 20,
  eveningMinute: 0,
  weekdaysOnly: false,
  playSound: true,
};

let handlerConfigured = false;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(max, Math.max(min, rounded));
}

function normalizeSettings(input: Partial<DailyPlanNotificationSettings> | null | undefined): DailyPlanNotificationSettings {
  return {
    enabled: typeof input?.enabled === 'boolean' ? input.enabled : DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.enabled,
    morningHour: clampInt(input?.morningHour, 0, 23, DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningHour),
    morningMinute: clampInt(input?.morningMinute, 0, 59, DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningMinute),
    eveningHour: clampInt(input?.eveningHour, 0, 23, DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningHour),
    eveningMinute: clampInt(input?.eveningMinute, 0, 59, DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningMinute),
    weekdaysOnly:
      typeof input?.weekdaysOnly === 'boolean' ? input.weekdaysOnly : DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.weekdaysOnly,
    playSound: typeof input?.playSound === 'boolean' ? input.playSound : DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.playSound,
  };
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

async function cancelKnownReminders() {
  const notifications = getNotificationsModule();
  if (!notifications) {
    await AsyncStorage.setItem(IDS_STORAGE_KEY, JSON.stringify([]));
    return;
  }

  const storedIds = parseIds(await AsyncStorage.getItem(IDS_STORAGE_KEY));
  const scheduled = await notifications.getAllScheduledNotificationsAsync();
  const legacyIds = scheduled
    .filter((item: any) => {
      const kind = (item.content.data as { kind?: string } | undefined)?.kind;
      return kind === MORNING_KIND || kind === EVENING_KIND;
    })
    .map((item: any) => item.identifier);

  const allIds = Array.from(new Set([...storedIds, ...legacyIds]));
  await Promise.all(allIds.map((id) => notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await AsyncStorage.setItem(IDS_STORAGE_KEY, JSON.stringify([]));
}

async function scheduleReminder(
  kind: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  playSound: boolean,
  weekday?: number
) {
  const notifications = getNotificationsModule();
  if (!notifications) return '';

  return notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: playSound ? 'default' : undefined,
      data: { kind },
    },
    trigger:
      typeof weekday === 'number'
        ? {
            type: notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            channelId: CHANNEL_ID,
          }
        : {
            type: notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
  });
}

export async function loadDailyPlanNotificationSettings(): Promise<DailyPlanNotificationSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS;
    return normalizeSettings(parsed as Partial<DailyPlanNotificationSettings>);
  } catch {
    return DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS;
  }
}

export async function saveDailyPlanNotificationSettings(settings: DailyPlanNotificationSettings) {
  const normalized = normalizeSettings(settings);
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
}

async function configureNotificationRuntime() {
  const notifications = getNotificationsModule();
  if (!notifications) return;
  if (handlerConfigured) return;
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Plan dnia',
      importance: notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 120, 250],
      lightColor: '#78C8FF',
      sound: 'default',
    });
  }

  handlerConfigured = true;
}

export async function ensureDailyPlanNotifications(override?: DailyPlanNotificationSettings) {
  const notifications = getNotificationsModule();
  if (Platform.OS === 'web' || !notifications) {
    return false;
  }

  await configureNotificationRuntime();

  const settings = override ? normalizeSettings(override) : await loadDailyPlanNotificationSettings();

  if (!settings.enabled) {
    await cancelKnownReminders();
    return true;
  }

  const currentPermissions = await notifications.getPermissionsAsync();
  let status = currentPermissions.status;
  if (status !== 'granted') {
    const requested = await notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return false;
  }

  await cancelKnownReminders();

  const ids: string[] = [];
  const weekdays = settings.weekdaysOnly ? [2, 3, 4, 5, 6] : [undefined];

  for (const weekday of weekdays) {
    ids.push(
      await scheduleReminder(
        MORNING_KIND,
        'Anioł Stróż',
        'Zaplanuj 3 rzeczy + 1 extra. Pamiętaj o HALT i tekstach.',
        settings.morningHour,
        settings.morningMinute,
        settings.playSound,
        weekday
      )
    );

    ids.push(
      await scheduleReminder(
        EVENING_KIND,
        'Anioł Stróż',
        'Podsumuj dzień: potwierdź wykonanie i zaznacz HALT.',
        settings.eveningHour,
        settings.eveningMinute,
        settings.playSound,
        weekday
      )
    );
  }

  await AsyncStorage.setItem(IDS_STORAGE_KEY, JSON.stringify(ids));
  return true;
}

export async function resetDailyPlanNotificationSettings() {
  await saveDailyPlanNotificationSettings(DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS);
  return ensureDailyPlanNotifications(DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS);
}

export function useDailyPlanNotifications() {
  useEffect(() => {
    void ensureDailyPlanNotifications();
  }, []);
}
