import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { FirstStepsRoadmap } from '@/components/FirstStepsRoadmap';
import { DAILY_TEXTS_STORAGE_KEY } from '@/constants/daily-texts';
import { CONTRACT_SIGNED_STORAGE_KEY, JOURNALS_DRAFTS_STORAGE_KEY, JOURNALS_ENTRIES_STORAGE_KEY } from '@/constants/storageKeys';
import {
  DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS,
  DailyPlanNotificationSettings,
  ensureDailyPlanNotifications,
  loadDailyPlanNotificationSettings,
  resetDailyPlanNotificationSettings,
  saveDailyPlanNotificationSettings,
} from '@/hooks/useDailyPlanNotifications';
import { getFirstStepsState, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import { APP_SETTINGS_STORAGE_KEY, AppSettings, DEFAULT_APP_SETTINGS, loadAppSettings, saveAppSettings } from '@/hooks/useAppSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

const BG = '#061A2C';
const SUB = 'rgba(232,245,255,0.84)';
const SETTINGS_SECTIONS_STORAGE_KEY = '@settings_sections_expanded';
const START_DATE_STORAGE_KEY = 'startDate';
const ANNIVERSARY_SEEN_STORAGE_KEY = '@anniversary_seen_once';
const DAILY_PLAN_STORAGE_KEY = '@daily_task';
const DAILY_PLAN_ARCHIVE_STORAGE_KEY = '@daily_task_archive';
const MIGRATIONS_VERSION_KEY = '@migrations_version';
const DAILY_PLAN_NOTIFICATION_IDS_STORAGE_KEY = '@daily_plan_notification_ids';
const DAILY_PLAN_NOTIFICATION_SETTINGS_STORAGE_KEY = '@daily_plan_notification_settings';
const INTELLIGENT_SUPPORT_STATE_KEY = '@intelligent_support_state_v1';
const VISITED_TILES_STORAGE_KEY = '@visited_tiles_v1';
const SUPPORT_CONTACTS_STORAGE_KEY = '@support_contacts';
const SOS_CONTACT_STORAGE_KEY = '@sos_contact_v1';
const LOSS_COUNTER_STORAGE_KEY = '@loss_counter_v1';
const NOTE_STORAGE_KEY = 'single_note_v1';
const COMMUNITY_THREADS_STORAGE_KEY = '@community_threads_v1';
const COMMUNITY_COMMENTS_STORAGE_KEY = '@community_comments_v1';
const COMMUNITY_MAIN_ROOM_MESSAGES_STORAGE_KEY = '@community_main_room_messages_v1';
const COMMUNITY_SEEDED_STORAGE_KEY = '@community_seeded_v1';
const EMOTION_JOURNAL_LAB_STORAGE_KEY = '@emotion_journal_lab_v2';
const Watermark = require('../../../assets/images/maly_aniol.png');

type ConsentKey = 'privacyConsentLocalStorage' | 'privacyConsentNotifications' | 'privacyConsentRegulations';
type SettingsSectionKey = 'consents' | 'notifications' | 'plan' | 'intelligentSupport' | 'personalization';
type SectionExpandedState = Record<SettingsSectionKey, boolean>;

const DEFAULT_SECTION_EXPANDED: SectionExpandedState = {
  consents: false,
  notifications: false,
  plan: false,
  intelligentSupport: false,
  personalization: false,
};

const ONBOARDING_EXPANDED_STATE: SectionExpandedState = {
  consents: true,
  notifications: true,
  plan: false,
  intelligentSupport: true,
  personalization: true,
};

const FULL_APP_RESET_STORAGE_KEYS = [
  APP_SETTINGS_STORAGE_KEY,
  SETTINGS_SECTIONS_STORAGE_KEY,
  CONTRACT_SIGNED_STORAGE_KEY,
  START_DATE_STORAGE_KEY,
  ANNIVERSARY_SEEN_STORAGE_KEY,
  DAILY_PLAN_STORAGE_KEY,
  DAILY_PLAN_ARCHIVE_STORAGE_KEY,
  DAILY_TEXTS_STORAGE_KEY,
  JOURNALS_ENTRIES_STORAGE_KEY,
  JOURNALS_DRAFTS_STORAGE_KEY,
  DAILY_PLAN_NOTIFICATION_IDS_STORAGE_KEY,
  DAILY_PLAN_NOTIFICATION_SETTINGS_STORAGE_KEY,
  INTELLIGENT_SUPPORT_STATE_KEY,
  VISITED_TILES_STORAGE_KEY,
  SUPPORT_CONTACTS_STORAGE_KEY,
  SOS_CONTACT_STORAGE_KEY,
  LOSS_COUNTER_STORAGE_KEY,
  NOTE_STORAGE_KEY,
  COMMUNITY_THREADS_STORAGE_KEY,
  COMMUNITY_COMMENTS_STORAGE_KEY,
  COMMUNITY_MAIN_ROOM_MESSAGES_STORAGE_KEY,
  COMMUNITY_SEEDED_STORAGE_KEY,
  EMOTION_JOURNAL_LAB_STORAGE_KEY,
  MIGRATIONS_VERSION_KEY,
] as const;

function normalizeSectionExpanded(value: unknown): SectionExpandedState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SECTION_EXPANDED;
  }

  const parsed = value as Partial<SectionExpandedState>;
  return {
    consents: typeof parsed.consents === 'boolean' ? parsed.consents : DEFAULT_SECTION_EXPANDED.consents,
    notifications: typeof parsed.notifications === 'boolean' ? parsed.notifications : DEFAULT_SECTION_EXPANDED.notifications,
    plan: typeof parsed.plan === 'boolean' ? parsed.plan : DEFAULT_SECTION_EXPANDED.plan,
    intelligentSupport:
      typeof parsed.intelligentSupport === 'boolean'
        ? parsed.intelligentSupport
        : DEFAULT_SECTION_EXPANDED.intelligentSupport,
    personalization:
      typeof parsed.personalization === 'boolean' ? parsed.personalization : DEFAULT_SECTION_EXPANDED.personalization,
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseTime(value: string) {
  const clean = value.trim();
  const parts = clean.split(':');
  if (parts.length !== 2) return null;

  const hour = Number.parseInt(parts[0], 10);
  const minute = Number.parseInt(parts[1], 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export default function UstawieniaScreen() {
  const params = useLocalSearchParams<{ openSection?: string }>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<DailyPlanNotificationSettings>(
    DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS
  );
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:00');

  const [appSettings, setAppSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [sectionExpanded, setSectionExpanded] = useState<SectionExpandedState>(DEFAULT_SECTION_EXPANDED);
  const sectionExpandedRef = useRef<SectionExpandedState>(DEFAULT_SECTION_EXPANDED);
  const [onboardingSettingsRequired, setOnboardingSettingsRequired] = useState(false);
  const [fullAccessModalVisible, setFullAccessModalVisible] = useState(false);
  const fullAccessAnim = useRef(new Animated.Value(0)).current;
  const angelFloatAnim = useRef(new Animated.Value(0)).current;
  const haloPulseAnim = useRef(new Animated.Value(0)).current;
  const sparkleFallAnim = useRef(new Animated.Value(0)).current;
  const sparkleOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiBurstScaleAnim = useRef(new Animated.Value(0.7)).current;
  const confettiBurstOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiSpinAnim = useRef(new Animated.Value(0)).current;

  const notificationsConsentEnabled = appSettings.privacyConsentNotifications;
  const notificationsSectionLocked = busy || !notificationsConsentEnabled;

  const appVersion = useMemo(
    () => Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0',
    []
  );
  const canSimulateOnboarding = useMemo(() => {
    const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
    const executionEnvironment = (Constants as { executionEnvironment?: string | null }).executionEnvironment;
    const isExpoGo = appOwnership === 'expo' || executionEnvironment === 'storeClient';
    const isSimulator = (Constants as { isDevice?: boolean }).isDevice === false;
    return isExpoGo || isSimulator;
  }, []);

  useEffect(() => {
    if (!fullAccessModalVisible) {
      fullAccessAnim.setValue(0);
      angelFloatAnim.setValue(0);
      haloPulseAnim.setValue(0);
      sparkleFallAnim.setValue(0);
      sparkleOpacityAnim.setValue(0);
      confettiBurstScaleAnim.setValue(0.7);
      confettiBurstOpacityAnim.setValue(0);
      confettiSpinAnim.setValue(0);
      return;
    }

    Animated.timing(fullAccessAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(angelFloatAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(angelFloatAnim, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sparkleFallAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(sparkleOpacityAnim, {
              toValue: 1,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(sparkleOpacityAnim, {
              toValue: 0,
              duration: 1350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(sparkleFallAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel([
      Animated.timing(confettiBurstOpacityAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(confettiBurstScaleAnim, {
        toValue: 1.35,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(confettiSpinAnim, {
        toValue: 1,
        duration: 960,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(confettiBurstOpacityAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
    loop.start();
    haloLoop.start();
    sparkleLoop.start();

    return () => {
      loop.stop();
      haloLoop.stop();
      sparkleLoop.stop();
    };
  }, [
    angelFloatAnim,
    fullAccessAnim,
    fullAccessModalVisible,
    haloPulseAnim,
    sparkleFallAnim,
    sparkleOpacityAnim,
    confettiBurstOpacityAnim,
    confettiBurstScaleAnim,
    confettiSpinAnim,
  ]);

  const loadAllSettings = async () => {
    const [notif, app, savedSectionExpandedRaw] = await Promise.all([
      loadDailyPlanNotificationSettings(),
      loadAppSettings(),
      AsyncStorage.getItem(SETTINGS_SECTIONS_STORAGE_KEY),
    ]);
    const safeNotif = app.privacyConsentNotifications ? notif : { ...notif, enabled: false };

    if (!app.privacyConsentNotifications && notif.enabled) {
      await saveDailyPlanNotificationSettings(safeNotif);
      await ensureDailyPlanNotifications(safeNotif);
    }

    setNotificationSettings(safeNotif);
    setMorningTime(`${pad(safeNotif.morningHour)}:${pad(safeNotif.morningMinute)}`);
    setEveningTime(`${pad(safeNotif.eveningHour)}:${pad(safeNotif.eveningMinute)}`);
    setAppSettingsState(app);

    if (!app.firstRunSetupDone) {
      setOnboardingSettingsRequired(true);
      setSectionExpanded(ONBOARDING_EXPANDED_STATE);
      sectionExpandedRef.current = ONBOARDING_EXPANDED_STATE;
      return;
    }
    setOnboardingSettingsRequired(false);

    if (!savedSectionExpandedRaw) {
      setSectionExpanded(DEFAULT_SECTION_EXPANDED);
      sectionExpandedRef.current = DEFAULT_SECTION_EXPANDED;
      try {
        await AsyncStorage.setItem(SETTINGS_SECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SECTION_EXPANDED));
      } catch {
        // Ignorujemy błąd zapisu preferencji UI.
      }
      return;
    }

    try {
      const parsed: unknown = JSON.parse(savedSectionExpandedRaw);
      const normalized = normalizeSectionExpanded(parsed);
      setSectionExpanded(normalized);
      sectionExpandedRef.current = normalized;
    } catch {
      setSectionExpanded(DEFAULT_SECTION_EXPANDED);
      sectionExpandedRef.current = DEFAULT_SECTION_EXPANDED;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadAllSettings();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (typeof params.openSection !== 'string') return;
    const allowed: SettingsSectionKey[] = ['consents', 'notifications', 'plan', 'intelligentSupport', 'personalization'];
    if (!allowed.includes(params.openSection as SettingsSectionKey)) return;
    setSectionExpanded((prev) => {
      const next = { ...prev, [params.openSection as SettingsSectionKey]: true };
      sectionExpandedRef.current = next;
      return next;
    });
  }, [loading, params.openSection]);

  const setAppSettings = (patch: Partial<AppSettings>) => {
    setAppSettingsState((prev) => ({ ...prev, ...patch }));
  };

  const toggleConsent = (key: ConsentKey, nextValue?: boolean) => {
    setAppSettings({ [key]: typeof nextValue === 'boolean' ? nextValue : !appSettings[key] });
  };

  const collapseSection = async (key: SettingsSectionKey) => {
    const next = { ...sectionExpandedRef.current, [key]: false };
    sectionExpandedRef.current = next;
    setSectionExpanded(next);
    try {
      await AsyncStorage.setItem(SETTINGS_SECTIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorujemy błąd zapisu preferencji UI; stan w pamięci zostaje zwinięty.
    }
  };

  const expandSection = (key: SettingsSectionKey) => {
    setSectionExpanded((prev) => {
      const next = { ...prev, [key]: true };
      sectionExpandedRef.current = next;
      return next;
    });
  };

  const saveConsentSection = async () => {
    setBusy(true);
    setNotice('');

    try {
      await saveAppSettings(appSettings);

      if (!appSettings.privacyConsentNotifications) {
        const nextNotifications = { ...notificationSettings, enabled: false };
        await saveDailyPlanNotificationSettings(nextNotifications);
        await ensureDailyPlanNotifications(nextNotifications);
        setNotificationSettings(nextNotifications);
        setNotice('Zapisano zgody. Powiadomienia są wyłączone do czasu zaznaczenia zgody.');
      } else {
        setNotice('Zapisano zgody.');
      }
      await collapseSection('consents');
    } catch (e) {
      console.error('Błąd zapisu zgód:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać zgód.');
    } finally {
      setBusy(false);
    }
  };

  const saveNotificationSection = async () => {
    if (!notificationsConsentEnabled) {
      Alert.alert('Brak zgody', 'Najpierw zaznacz u góry zgodę na lokalne powiadomienia.');
      return;
    }

    const morning = parseTime(morningTime);
    const evening = parseTime(eveningTime);
    if (notificationSettings.enabled && (!morning || !evening)) {
      Alert.alert('Niepoprawny format godziny', 'Użyj formatu HH:MM, np. 08:00 lub 20:30.');
      return;
    }

    setBusy(true);
    setNotice('');

    try {
      const next: DailyPlanNotificationSettings = {
        ...notificationSettings,
        morningHour: morning?.hour ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningHour,
        morningMinute: morning?.minute ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningMinute,
        eveningHour: evening?.hour ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningHour,
        eveningMinute: evening?.minute ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningMinute,
      };

      await saveDailyPlanNotificationSettings(next);
      const notificationsReady = await ensureDailyPlanNotifications(next);
      setNotificationSettings(next);

      if (!next.enabled) {
        setNotice('Powiadomienia wyłączone.');
      } else if (notificationsReady) {
        setNotice('Ustawienia powiadomień zapisane.');
      } else {
        setNotice('Ustawienia zapisane, ale brak zgody systemowej na powiadomienia.');
      }
      await collapseSection('notifications');
    } catch (e) {
      console.error('Błąd zapisu powiadomień:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień powiadomień.');
    } finally {
      setBusy(false);
    }
  };

  const restoreNotificationDefaults = async () => {
    setBusy(true);
    setNotice('');
    try {
      const notificationsReady = await resetDailyPlanNotificationSettings();
      const restored = await loadDailyPlanNotificationSettings();

      const next = notificationsConsentEnabled ? restored : { ...restored, enabled: false };
      if (!notificationsConsentEnabled) {
        await saveDailyPlanNotificationSettings(next);
        await ensureDailyPlanNotifications(next);
      }

      setNotificationSettings(next);
      setMorningTime(`${pad(next.morningHour)}:${pad(next.morningMinute)}`);
      setEveningTime(`${pad(next.eveningHour)}:${pad(next.eveningMinute)}`);

      if (!notificationsConsentEnabled) {
        setNotice('Przywrócono godziny, ale powiadomienia są wyłączone bez zgody.');
      } else {
        setNotice(
          notificationsReady
            ? 'Przywrócono domyślne powiadomienia.'
            : 'Przywrócono ustawienia, ale brak zgody systemowej na powiadomienia.'
        );
      }
    } catch (e) {
      console.error('Błąd przywracania powiadomień:', e);
      Alert.alert('Błąd', 'Nie udało się przywrócić domyślnych powiadomień.');
    } finally {
      setBusy(false);
    }
  };

  const saveAppPreferences = async (message = 'Zapisano preferencje aplikacji.', sectionToCollapse?: SettingsSectionKey) => {
    setBusy(true);
    setNotice('');
    try {
      await saveAppSettings(appSettings);
      setNotice(message);
      if (sectionToCollapse) {
        await collapseSection(sectionToCollapse);
      }
    } catch (e) {
      console.error('Błąd zapisu preferencji:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać preferencji.');
    } finally {
      setBusy(false);
    }
  };

  const finishOnboardingSettings = async () => {
    if (!appSettings.privacyConsentLocalStorage || !appSettings.privacyConsentRegulations) {
      Alert.alert('Brak wymaganych zgód', 'Aby zakończyć konfigurację, zaznacz zgodę na zapis danych i akceptację zasad.');
      return;
    }

    const morning = parseTime(morningTime);
    const evening = parseTime(eveningTime);
    if (notificationSettings.enabled && (!morning || !evening)) {
      Alert.alert('Niepoprawny format godziny', 'Użyj formatu HH:MM, np. 08:00 lub 20:30.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const nextNotifications: DailyPlanNotificationSettings = {
        ...notificationSettings,
        enabled: appSettings.privacyConsentNotifications ? notificationSettings.enabled : false,
        morningHour: morning?.hour ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningHour,
        morningMinute: morning?.minute ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.morningMinute,
        eveningHour: evening?.hour ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningHour,
        eveningMinute: evening?.minute ?? DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS.eveningMinute,
      };

      const nextPromptAt =
        appSettings.intelligentSupportEnabled
          ? null
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() + 30);
              return d.toISOString();
            })();

      const nextAppSettings: AppSettings = {
        ...appSettings,
        firstRunSetupDone: true,
        intelligentSupportPromptNextAt: nextPromptAt,
      };

      await saveDailyPlanNotificationSettings(nextNotifications);
      await ensureDailyPlanNotifications(nextNotifications);
      await saveAppSettings(nextAppSettings);

      setAppSettingsState(nextAppSettings);
      setNotificationSettings(nextNotifications);
      setOnboardingSettingsRequired(false);
      await collapseSection('personalization');
      setNotice('Pierwsza konfiguracja została zapisana.');
      setFullAccessModalVisible(true);
    } catch (e) {
      console.error('Błąd zapisu konfiguracji startowej:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać konfiguracji startowej.');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePersonalization = async () => {
    const shouldFinishOnboarding =
      onboardingSettingsRequired || !appSettings.firstRunSetupDone || !appSettings.firstStepsDone;
    if (shouldFinishOnboarding) {
      await finishOnboardingSettings();
      return;
    }
    await saveAppPreferences('Zapisano personalizację.', 'personalization');
  };

  const resetOnboardingForSimulation = async () => {
    Alert.alert(
      'Symulacja onboardingu',
      'To zresetuje tylko kroki startowe (intro/kontrakt/licznik/zgody) i przeniesie Cię na początek onboardingu.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Resetuj onboarding',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            setNotice('');
            try {
              await AsyncStorage.multiRemove([
                CONTRACT_SIGNED_STORAGE_KEY,
                START_DATE_STORAGE_KEY,
                ANNIVERSARY_SEEN_STORAGE_KEY,
              ]);

              const resetSettings: AppSettings = {
                ...appSettings,
                introSeen: false,
                privacyConsentLocalStorage: false,
                privacyConsentNotifications: false,
                privacyConsentRegulations: false,
                firstRunSetupDone: false,
                firstStepsDone: false,
                counterDone: false,
                anniversaryDone: false,
              };

              await saveAppSettings(resetSettings);
              setAppSettingsState(resetSettings);
              setOnboardingSettingsRequired(true);
              setSectionExpanded(ONBOARDING_EXPANDED_STATE);
              sectionExpandedRef.current = ONBOARDING_EXPANDED_STATE;
              setNotice('Tryb testowy: onboarding został zresetowany.');
              router.replace('/intro');
            } catch (e) {
              console.error('Błąd resetu onboardingu:', e);
              Alert.alert('Błąd', 'Nie udało się zresetować onboardingu.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const resetAppToFactoryState = () => {
    Alert.alert(
      'Przywrócić aplikację do początku?',
      'To usunie lokalne dane aplikacji na tym telefonie i uruchomi onboarding od nowa. Znikną m.in. licznik zdrowienia, plan dnia, dzienniki, Licznik kosztów kryzysu, kontakty wsparcia i zapisane ustawienia.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Przywróć',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            setNotice('');
            try {
              const resetNotifications = {
                ...DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS,
                enabled: false,
              };
              await saveDailyPlanNotificationSettings(resetNotifications);
              await ensureDailyPlanNotifications(resetNotifications);
              await saveAppSettings(DEFAULT_APP_SETTINGS);
              await AsyncStorage.multiRemove([...FULL_APP_RESET_STORAGE_KEYS]);

              setAppSettingsState(DEFAULT_APP_SETTINGS);
              setNotificationSettings(resetNotifications);
              setMorningTime(`${pad(resetNotifications.morningHour)}:${pad(resetNotifications.morningMinute)}`);
              setEveningTime(`${pad(resetNotifications.eveningHour)}:${pad(resetNotifications.eveningMinute)}`);
              setOnboardingSettingsRequired(true);
              setFullAccessModalVisible(false);
              setSectionExpanded(ONBOARDING_EXPANDED_STATE);
              sectionExpandedRef.current = ONBOARDING_EXPANDED_STATE;
              setNotice('Aplikacja została przywrócona do początku.');
              router.replace('/intro');
            } catch (e) {
              console.error('Błąd pełnego resetu aplikacji:', e);
              Alert.alert('Błąd', 'Nie udało się przywrócić aplikacji do początku.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const restorePlanDefaults = async () => {
    setBusy(true);
    setNotice('');
    try {
      const next: AppSettings = {
        ...appSettings,
        planDefaultCalendarView: DEFAULT_APP_SETTINGS.planDefaultCalendarView,
        planDefaultDayOpenMode: DEFAULT_APP_SETTINGS.planDefaultDayOpenMode,
        planAutoSwitchToSummaryEvening: DEFAULT_APP_SETTINGS.planAutoSwitchToSummaryEvening,
      };
      setAppSettingsState(next);
      await saveAppSettings(next);
      setNotice('Przywrócono domyślne preferencje planu.');
    } catch (e) {
      console.error('Błąd przywracania preferencji planu:', e);
      Alert.alert('Błąd', 'Nie udało się przywrócić preferencji planu.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <BackgroundWrapper showSwipeHint={false}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Ładowanie ustawień...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper showSwipeHint={false}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.bgOrbA} />
          <View style={styles.bgOrbB} />
          <Text style={styles.title}>Ustawienia</Text>
        <Text style={styles.subtitle}>
          {onboardingSettingsRequired
            ? 'Krok 3 z 3: ustaw zgody oraz preferencje startowe (powiadomienia, badge i inteligentne wsparcie).'
            : 'Pierwsze kroki: najpierw zgody, potem pozostałe ustawienia aplikacji.'}
        </Text>
        {onboardingSettingsRequired ? <FirstStepsRoadmap currentStep={3} /> : null}

        <View style={[styles.card, styles.cardPrimary]}>
          <View style={[styles.sectionHeaderRow, !sectionExpanded.consents && styles.sectionHeaderRowCollapsed]}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Zgody i prywatność</Text>
            {!sectionExpanded.consents ? (
              <Pressable style={styles.sectionEditButton} disabled={busy} onPress={() => expandSection('consents')}>
                <Text style={styles.sectionEditButtonText}>Zmień</Text>
              </Pressable>
            ) : null}
          </View>

          {sectionExpanded.consents ? (
            <>
              <Text style={styles.cardText}>Podstawa działania aplikacji na tym urządzeniu.</Text>

              <View style={styles.checkboxRow}>
                <Checkbox
                  style={styles.checkbox}
                  value={appSettings.privacyConsentLocalStorage}
                  onValueChange={(v) => toggleConsent('privacyConsentLocalStorage', v)}
                  color={appSettings.privacyConsentLocalStorage ? '#4FA8E8' : undefined}
                  disabled={busy}
                />
                <Pressable style={styles.checkboxTextWrap} disabled={busy} onPress={() => toggleConsent('privacyConsentLocalStorage')}>
                  <Text style={styles.checkboxTitle}>Zgoda na lokalny zapis danych</Text>
                  <Text style={styles.checkboxHint}>Plan dnia i archiwum są przechowywane lokalnie na Twoim telefonie.</Text>
                </Pressable>
              </View>

              <View style={styles.checkboxRow}>
                <Checkbox
                  style={styles.checkbox}
                  value={appSettings.privacyConsentNotifications}
                  onValueChange={(v) => toggleConsent('privacyConsentNotifications', v)}
                  color={appSettings.privacyConsentNotifications ? '#4FA8E8' : undefined}
                  disabled={busy}
                />
                <Pressable style={styles.checkboxTextWrap} disabled={busy} onPress={() => toggleConsent('privacyConsentNotifications')}>
                  <Text style={styles.checkboxTitle}>Zgoda na lokalne powiadomienia</Text>
                  <Text style={styles.checkboxHint}>Bez tej zgody przypomnienia poranne i wieczorne pozostają wyłączone.</Text>
                </Pressable>
              </View>

              <View style={styles.checkboxRow}>
                <Checkbox
                  style={styles.checkbox}
                  value={appSettings.privacyConsentRegulations}
                  onValueChange={(v) => toggleConsent('privacyConsentRegulations', v)}
                  color={appSettings.privacyConsentRegulations ? '#4FA8E8' : undefined}
                  disabled={busy}
                />
                <Pressable style={styles.checkboxTextWrap} disabled={busy} onPress={() => toggleConsent('privacyConsentRegulations')}>
                  <Text style={styles.checkboxTitle}>Akceptuję zasady korzystania</Text>
                  <Text style={styles.checkboxHint}>Potwierdzasz, że świadomie korzystasz z narzędzi aplikacji.</Text>
                </Pressable>
              </View>

              <Pressable style={[styles.buttonPrimary, busy && styles.buttonDisabled]} disabled={busy} onPress={saveConsentSection}>
                <Text style={styles.buttonPrimaryText}>Zapisz zgody</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={[styles.sectionHeaderRow, !sectionExpanded.notifications && styles.sectionHeaderRowCollapsed]}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Powiadomienia</Text>
            {!sectionExpanded.notifications ? (
              <Pressable style={styles.sectionEditButton} disabled={busy} onPress={() => expandSection('notifications')}>
                <Text style={styles.sectionEditButtonText}>Zmień</Text>
              </Pressable>
            ) : null}
          </View>

          {sectionExpanded.notifications ? (
            <>
              <Text style={styles.cardText}>Codzienne przypomnienia o planie i podsumowaniu dnia.</Text>

              {!notificationsConsentEnabled ? (
                <Text style={styles.warningText}>Najpierw zaznacz na górze zgodę na lokalne powiadomienia.</Text>
              ) : null}

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Włącz powiadomienia</Text>
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={(v) => setNotificationSettings((prev) => ({ ...prev, enabled: v }))}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={notificationSettings.enabled ? '#AEE1FF' : '#d5d5d5'}
                  disabled={notificationsSectionLocked}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Rano (plan dnia)</Text>
                <TextInput
                  style={[styles.input, (!notificationSettings.enabled || notificationsSectionLocked) && styles.inputDisabled]}
                  value={morningTime}
                  onChangeText={setMorningTime}
                  editable={notificationSettings.enabled && !notificationsSectionLocked}
                  keyboardType="numbers-and-punctuation"
                  placeholder="08:00"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  maxLength={5}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Wieczór (podsumowanie dnia)</Text>
                <TextInput
                  style={[styles.input, (!notificationSettings.enabled || notificationsSectionLocked) && styles.inputDisabled]}
                  value={eveningTime}
                  onChangeText={setEveningTime}
                  editable={notificationSettings.enabled && !notificationsSectionLocked}
                  keyboardType="numbers-and-punctuation"
                  placeholder="20:00"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  maxLength={5}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Tylko dni robocze</Text>
                <Switch
                  value={notificationSettings.weekdaysOnly}
                  onValueChange={(v) => setNotificationSettings((prev) => ({ ...prev, weekdaysOnly: v }))}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={notificationSettings.weekdaysOnly ? '#AEE1FF' : '#d5d5d5'}
                  disabled={notificationsSectionLocked}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Dźwięk powiadomień</Text>
                <Switch
                  value={notificationSettings.playSound}
                  onValueChange={(v) => setNotificationSettings((prev) => ({ ...prev, playSound: v }))}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={notificationSettings.playSound ? '#AEE1FF' : '#d5d5d5'}
                  disabled={notificationsSectionLocked}
                />
              </View>

              <Text style={styles.hintText}>Format godziny: HH:MM, np. 08:00 albo 20:30.</Text>

              <Pressable style={[styles.buttonPrimary, busy && styles.buttonDisabled]} disabled={busy} onPress={saveNotificationSection}>
                <Text style={styles.buttonPrimaryText}>{busy ? 'Zapisywanie...' : 'Zapisz powiadomienia'}</Text>
              </Pressable>

              <Pressable
                style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
                disabled={busy}
                onPress={restoreNotificationDefaults}
              >
                <Text style={styles.buttonSecondaryText}>Domyślne powiadomienia</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {!onboardingSettingsRequired ? (
          <View style={styles.card}>
          <View style={[styles.sectionHeaderRow, !sectionExpanded.plan && styles.sectionHeaderRowCollapsed]}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Plan dnia</Text>
            {!sectionExpanded.plan ? (
              <Pressable style={styles.sectionEditButton} disabled={busy} onPress={() => expandSection('plan')}>
                <Text style={styles.sectionEditButtonText}>Zmień</Text>
              </Pressable>
            ) : null}
          </View>

          {sectionExpanded.plan ? (
            <>
              <Text style={styles.cardText}>Domyślne zachowanie kalendarza i widoku dnia.</Text>

              <Text style={styles.fieldLabel}>Domyślny widok kalendarza</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  style={[styles.segmentBtn, appSettings.planDefaultCalendarView === 'week' && styles.segmentBtnActive]}
                  onPress={() => setAppSettings({ planDefaultCalendarView: 'week' })}
                >
                  <Text style={[styles.segmentText, appSettings.planDefaultCalendarView === 'week' && styles.segmentTextActive]}>
                    Tydzień
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentBtn, appSettings.planDefaultCalendarView === 'month' && styles.segmentBtnActive]}
                  onPress={() => setAppSettings({ planDefaultCalendarView: 'month' })}
                >
                  <Text style={[styles.segmentText, appSettings.planDefaultCalendarView === 'month' && styles.segmentTextActive]}>
                    Miesiąc
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>Po kliknięciu dnia otwieraj</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  style={[styles.segmentBtn, appSettings.planDefaultDayOpenMode === 'plan' && styles.segmentBtnActive]}
                  onPress={() => setAppSettings({ planDefaultDayOpenMode: 'plan' })}
                >
                  <Text style={[styles.segmentText, appSettings.planDefaultDayOpenMode === 'plan' && styles.segmentTextActive]}>
                    Plan
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentBtn, appSettings.planDefaultDayOpenMode === 'summary' && styles.segmentBtnActive]}
                  onPress={() => setAppSettings({ planDefaultDayOpenMode: 'summary' })}
                >
                  <Text style={[styles.segmentText, appSettings.planDefaultDayOpenMode === 'summary' && styles.segmentTextActive]}>
                    Podsumowanie
                  </Text>
                </Pressable>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Wieczorem automatycznie przełącz na podsumowanie</Text>
                <Switch
                  value={appSettings.planAutoSwitchToSummaryEvening}
                  onValueChange={(v) => setAppSettings({ planAutoSwitchToSummaryEvening: v })}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={appSettings.planAutoSwitchToSummaryEvening ? '#AEE1FF' : '#d5d5d5'}
                />
              </View>

              <Pressable
                style={[styles.buttonPrimary, busy && styles.buttonDisabled]}
                disabled={busy}
                onPress={() => saveAppPreferences('Zapisano preferencje planu.', 'plan')}
              >
                <Text style={styles.buttonPrimaryText}>Zapisz preferencje planu</Text>
              </Pressable>

              <Pressable style={[styles.buttonSecondary, busy && styles.buttonDisabled]} disabled={busy} onPress={restorePlanDefaults}>
                <Text style={styles.buttonSecondaryText}>Domyślne preferencje planu</Text>
              </Pressable>
            </>
          ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={[styles.sectionHeaderRow, !sectionExpanded.intelligentSupport && styles.sectionHeaderRowCollapsed]}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Inteligentne wsparcie</Text>
            {!sectionExpanded.intelligentSupport ? (
              <Pressable style={styles.sectionEditButton} disabled={busy} onPress={() => expandSection('intelligentSupport')}>
                <Text style={styles.sectionEditButtonText}>Zmień</Text>
              </Pressable>
            ) : null}
          </View>

          {sectionExpanded.intelligentSupport ? (
            <>
              <Text style={styles.cardText}>Opcjonalne wsparcie, które reaguje na trudniejsze dni.</Text>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>🔘 Powiadomienia reagujące na Twój rytm</Text>
                <Switch
                  value={appSettings.intelligentSupportEnabled}
                  onValueChange={(v) =>
                    setAppSettings({
                      intelligentSupportEnabled: v,
                      intelligentSupportPromptNextAt: v ? null : appSettings.intelligentSupportPromptNextAt,
                    })
                  }
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={appSettings.intelligentSupportEnabled ? '#AEE1FF' : '#d5d5d5'}
                />
              </View>
              <Text style={styles.hintText}>
                Aplikacja może wysyłać delikatne przypomnienia, gdy zauważy trudniejsze dni.{'\n'}
                Możesz to wyłączyć w każdej chwili.
              </Text>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Ikony i badge</Text>
                <Switch
                  value={appSettings.badgeIndicatorsEnabled}
                  onValueChange={(v) => setAppSettings({ badgeIndicatorsEnabled: v })}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={appSettings.badgeIndicatorsEnabled ? '#AEE1FF' : '#d5d5d5'}
                />
              </View>
              <Text style={styles.hintText}>
                Pokazuje liczniki na kaflach i zakładce Dom oraz badge na ikonie aplikacji.
              </Text>

              <Pressable
                style={[styles.buttonPrimary, busy && styles.buttonDisabled]}
                disabled={busy}
                onPress={() => saveAppPreferences('Zapisano ustawienia inteligentnego wsparcia.', 'intelligentSupport')}
              >
                <Text style={styles.buttonPrimaryText}>Zapisz inteligentne wsparcie</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={[styles.sectionHeaderRow, !sectionExpanded.personalization && styles.sectionHeaderRowCollapsed]}>
            <Text style={[styles.cardTitle, styles.cardTitleTight]}>Personalizacja</Text>
            {!sectionExpanded.personalization ? (
              <Pressable style={styles.sectionEditButton} disabled={busy} onPress={() => expandSection('personalization')}>
                <Text style={styles.sectionEditButtonText}>Zmień</Text>
              </Pressable>
            ) : null}
          </View>

          {sectionExpanded.personalization ? (
            <>
              <Text style={styles.cardText}>Ustawienia wyglądu i czytelności.</Text>

              <Text style={styles.fieldLabel}>Rozmiar tekstu</Text>
              <View style={styles.segmentRowThree}>
                {(['small', 'medium', 'large'] as const).map((scale) => (
                  <Pressable
                    key={scale}
                    style={[styles.segmentBtn, appSettings.textScale === scale && styles.segmentBtnActive]}
                    onPress={() => setAppSettings({ textScale: scale })}
                  >
                    <Text style={[styles.segmentText, appSettings.textScale === scale && styles.segmentTextActive]}>
                      {scale === 'small' ? 'Mały' : scale === 'medium' ? 'Średni' : 'Duży'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Wysoki kontrast</Text>
                <Switch
                  value={appSettings.highContrast}
                  onValueChange={(v) => setAppSettings({ highContrast: v })}
                  trackColor={{ false: '#334', true: '#4f85a6' }}
                  thumbColor={appSettings.highContrast ? '#AEE1FF' : '#d5d5d5'}
                />
              </View>

              <Text style={styles.fieldLabel}>Język</Text>
              <View style={styles.segmentRow}>
                <View style={[styles.segmentBtn, styles.segmentBtnActive]}>
                  <Text style={[styles.segmentText, styles.segmentTextActive]}>Polski</Text>
                </View>
              </View>

              <Pressable
                style={[styles.buttonPrimary, busy && styles.buttonDisabled]}
                disabled={busy}
                onPress={() => void handleSavePersonalization()}
              >
                <Text style={styles.buttonPrimaryText}>Zapisz personalizację</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pomoc i informacje</Text>
          <Text style={styles.cardText}>Wersja aplikacji: {appVersion}</Text>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/polityka-prywatnosci')}>
            <Text style={styles.buttonSecondaryText}>Polityka prywatności</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/wsparcie-kontakt')}>
            <Text style={styles.buttonSecondaryText}>Kontakt i wsparcie</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonSecondary, styles.buttonDanger, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={resetAppToFactoryState}
          >
            <Text style={styles.buttonSecondaryText}>Przywróć aplikację do początku</Text>
          </Pressable>
          {canSimulateOnboarding ? (
            <Pressable
              style={[styles.buttonSecondary, styles.buttonDanger, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={resetOnboardingForSimulation}
            >
              <Text style={styles.buttonSecondaryText}>Symuluj onboarding (Expo Go / symulator)</Text>
            </Pressable>
          ) : null}
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={fullAccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullAccessModalVisible(false)}
      >
        <View style={styles.fullAccessOverlay}>
          <Animated.View
            style={[
              styles.fullAccessCard,
              {
                opacity: fullAccessAnim,
                transform: [
                  { scale: fullAccessAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) },
                  { translateY: fullAccessAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.fullAccessOrbA} />
            <View style={styles.fullAccessOrbB} />
            <Animated.View
              style={[
                styles.fullAccessHalo,
                {
                  opacity: haloPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.44] }),
                  transform: [{ scale: haloPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiBurstRing,
                {
                  opacity: confettiBurstOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] }),
                  transform: [{ scale: confettiBurstScaleAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiPiece,
                styles.confettiPieceA,
                {
                  opacity: confettiBurstOpacityAnim,
                  transform: [
                    { translateY: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [-10, -62] }) },
                    { translateX: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [0, -12] }) },
                    { rotate: confettiSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '235deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiPiece,
                styles.confettiPieceB,
                {
                  opacity: confettiBurstOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] }),
                  transform: [
                    { translateY: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [-8, -54] }) },
                    { translateX: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [0, 14] }) },
                    { rotate: confettiSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-215deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiPiece,
                styles.confettiPieceC,
                {
                  opacity: confettiBurstOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
                  transform: [
                    { translateY: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [-4, -50] }) },
                    { translateX: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [0, -22] }) },
                    { rotate: confettiSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '210deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiPiece,
                styles.confettiPieceD,
                {
                  opacity: confettiBurstOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.92] }),
                  transform: [
                    { translateY: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [-6, -58] }) },
                    { translateX: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [0, 18] }) },
                    { rotate: confettiSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-260deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.confettiPiece,
                styles.confettiPieceE,
                {
                  opacity: confettiBurstOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.88] }),
                  transform: [
                    { translateY: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [-6, -52] }) },
                    { translateX: confettiBurstScaleAnim.interpolate({ inputRange: [0.7, 1.35], outputRange: [0, -20] }) },
                    { rotate: confettiSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '245deg'] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkleDot,
                styles.sparkleDotA,
                {
                  opacity: sparkleOpacityAnim,
                  transform: [{ translateY: sparkleFallAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 72] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkleDot,
                styles.sparkleDotB,
                {
                  opacity: sparkleOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
                  transform: [{ translateY: sparkleFallAnim.interpolate({ inputRange: [0, 1], outputRange: [-34, 62] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkleDot,
                styles.sparkleDotC,
                {
                  opacity: sparkleOpacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
                  transform: [{ translateY: sparkleFallAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 68] }) }],
                },
              ]}
            />
            <Animated.Image
              source={Watermark}
              resizeMode="contain"
              style={[
                styles.fullAccessAngel,
                {
                  transform: [
                    { translateY: angelFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    { scale: angelFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
                  ],
                },
              ]}
            />
            <View style={styles.fullAccessBadge}>
              <Text style={styles.fullAccessBadgeText}>Odblokowano</Text>
            </View>
            <Text style={styles.fullAccessTitle}>Masz pełny dostęp</Text>
            <Text style={styles.fullAccessText}>
              do wszystkich funkcjonalności aplikacji. Gratuluję!{'\n'}Anioł Stróż. Korzystaj dzień po dniu.
            </Text>
            <Pressable
              style={styles.fullAccessButton}
              onPress={() => {
                setFullAccessModalVisible(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.fullAccessButtonText}>Wejdź do aplikacji</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '700' },

  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 78, paddingBottom: 42, position: 'relative' },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(118, 214, 255, 0.1)',
    top: -90,
    right: -92,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(184, 198, 255, 0.1)',
    bottom: 120,
    left: -80,
  },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 18, lineHeight: 27, marginBottom: 18 },

  card: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    padding: 14,
    marginBottom: 12,
  },
  cardPrimary: {
    borderColor: 'rgba(120,200,255,0.48)',
    backgroundColor: 'rgba(90,172,224,0.12)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionHeaderRowCollapsed: { marginBottom: 0 },
  cardTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cardTitleTight: { marginBottom: 0, flexShrink: 1 },
  sectionEditButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    backgroundColor: 'rgba(120,200,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionEditButtonText: { color: '#CDEBFF', fontSize: 13, fontWeight: '700' },
  cardText: { color: SUB, fontSize: 15, lineHeight: 22, marginBottom: 10 },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    marginTop: 2,
    width: 22,
    height: 22,
  },
  checkboxTextWrap: {
    flex: 1,
  },
  checkboxTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  checkboxHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
  },

  fieldBlock: { marginBottom: 10 },
  fieldLabel: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 6, flexShrink: 1 },
  input: {
    backgroundColor: 'rgba(7,24,38,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  inputDisabled: { opacity: 0.55 },
  hintText: { color: 'rgba(255,255,255,0.68)', fontSize: 13, marginBottom: 12 },
  warningText: {
    color: '#FFD6A1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  segmentRowThree: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  segmentBtnActive: {
    borderColor: 'rgba(120,200,255,0.55)',
    backgroundColor: 'rgba(120,200,255,0.2)',
  },
  segmentText: { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: '#D8F1FF' },

  buttonPrimary: {
    backgroundColor: '#3b5998',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonPrimaryText: { color: 'white', fontSize: 15, fontWeight: '700' },
  buttonSecondary: {
    backgroundColor: 'rgba(120,200,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDanger: {
    borderColor: 'rgba(255,140,140,0.42)',
    backgroundColor: 'rgba(255,120,120,0.12)',
  },
  buttonSecondaryText: { color: '#CDEBFF', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },

  noticeText: {
    color: '#BFE6FF',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  fullAccessOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,26,44,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fullAccessCard: {
    width: '100%',
    backgroundColor: 'rgba(12,38,62,0.95)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(159,216,255,0.52)',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#9BD8FF',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  fullAccessOrbA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(154,199,255,0.22)',
    top: -80,
    right: -70,
  },
  fullAccessOrbB: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,199,217,0.16)',
    bottom: -72,
    left: -66,
  },
  fullAccessHalo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(159,216,255,0.4)',
    top: 44,
    alignSelf: 'center',
  },
  confettiBurstRing: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 3,
    borderColor: 'rgba(186,230,255,0.9)',
    top: 10,
    alignSelf: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 13,
    height: 20,
    borderRadius: 4,
    top: 58,
  },
  confettiPieceA: {
    left: 104,
    backgroundColor: '#FFE083',
  },
  confettiPieceB: {
    right: 100,
    backgroundColor: '#C4F5DD',
  },
  confettiPieceC: {
    left: 86,
    backgroundColor: '#FFC6DF',
  },
  confettiPieceD: {
    right: 78,
    backgroundColor: '#C5E3FF',
  },
  confettiPieceE: {
    left: 74,
    backgroundColor: '#FFE9A8',
  },
  sparkleDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDF4FF',
  },
  sparkleDotA: {
    top: 56,
    right: 70,
  },
  sparkleDotB: {
    top: 46,
    left: 78,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE6EF',
  },
  sparkleDotC: {
    top: 66,
    left: 56,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8F8FF',
  },
  fullAccessAngel: {
    width: 132,
    height: 132,
    tintColor: 'white',
    opacity: 0.94,
    marginBottom: 8,
  },
  fullAccessBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(180,233,255,0.65)',
    backgroundColor: 'rgba(120,200,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  fullAccessBadgeText: {
    color: '#E2F5FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fullAccessTitle: {
    color: 'white',
    fontSize: 31,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullAccessText: {
    color: SUB,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 18,
  },
  fullAccessButton: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.6)',
    backgroundColor: 'rgba(120,200,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    shadowColor: '#9BD8FF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fullAccessButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
});
