import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import {
  DEFAULT_DAILY_PLAN_NOTIFICATION_SETTINGS,
  DailyPlanNotificationSettings,
  ensureDailyPlanNotifications,
  loadDailyPlanNotificationSettings,
  resetDailyPlanNotificationSettings,
  saveDailyPlanNotificationSettings,
} from '@/hooks/useDailyPlanNotifications';
import { getFirstStepsState, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import { AppSettings, DEFAULT_APP_SETTINGS, loadAppSettings, saveAppSettings } from '@/hooks/useAppSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

const BG = '#071826';
const SUB = 'rgba(255,255,255,0.72)';
const AngelWatermark = require('../assets/images/maly_aniol.png');
const SETTINGS_SECTIONS_STORAGE_KEY = '@settings_sections_expanded';

type ConsentKey = 'privacyConsentLocalStorage' | 'privacyConsentNotifications' | 'privacyConsentRegulations';
type SettingsSectionKey = 'consents' | 'notifications' | 'plan' | 'personalization';
type SectionExpandedState = Record<SettingsSectionKey, boolean>;

const DEFAULT_SECTION_EXPANDED: SectionExpandedState = {
  consents: false,
  notifications: false,
  plan: false,
  personalization: false,
};

function normalizeSectionExpanded(value: unknown): SectionExpandedState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SECTION_EXPANDED;
  }

  const parsed = value as Partial<SectionExpandedState>;
  return {
    consents: typeof parsed.consents === 'boolean' ? parsed.consents : DEFAULT_SECTION_EXPANDED.consents,
    notifications: typeof parsed.notifications === 'boolean' ? parsed.notifications : DEFAULT_SECTION_EXPANDED.notifications,
    plan: typeof parsed.plan === 'boolean' ? parsed.plan : DEFAULT_SECTION_EXPANDED.plan,
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

  const notificationsConsentEnabled = appSettings.privacyConsentNotifications;
  const notificationsSectionLocked = busy || !notificationsConsentEnabled;

  const appVersion = useMemo(
    () => Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0',
    []
  );

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
      const firstStepsStep = resolveFirstStepsStep(await getFirstStepsState());
      if (firstStepsStep !== 'consents' && firstStepsStep !== 'done') {
        router.replace('/');
      }
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
      <BackgroundWrapper>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Ładowanie ustawień...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ustawienia</Text>
        <Text style={styles.subtitle}>Pierwsze kroki: najpierw zgody, potem pozostałe ustawienia aplikacji.</Text>

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
                onPress={() => saveAppPreferences('Zapisano personalizację.', 'personalization')}
              >
                <Text style={styles.buttonPrimaryText}>Zapisz personalizację</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pomoc i informacje</Text>
          <Text style={styles.cardText}>Wersja aplikacji: {appVersion}</Text>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/wsparcie-kontakt')}>
            <Text style={styles.buttonSecondaryText}>Kontakt i wsparcie</Text>
          </Pressable>
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        <Pressable style={styles.homeTile} onPress={() => router.push('/(tabs)')}>
          <Image source={AngelWatermark} resizeMode="contain" style={styles.homeTileWatermark} />
          <View style={styles.homeTileContent}>
            <Text style={styles.homeTileTitle}>Dom</Text>
            <Text style={styles.homeTileSubtitle}>Przejdź do ekranu głównego</Text>
          </View>
        </Pressable>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '700' },

  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 78, paddingBottom: 42 },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 18, lineHeight: 27, marginBottom: 18 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.24)',
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
  buttonSecondaryText: { color: '#CDEBFF', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },

  noticeText: {
    color: '#BFE6FF',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  homeTile: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(120,200,255,0.22)',
    marginTop: 14,
    overflow: 'hidden',
    minHeight: 85,
  },
  homeTileContent: {
    zIndex: 2,
    width: '84%',
  },
  homeTileTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  homeTileSubtitle: {
    marginTop: 6,
    color: SUB,
    fontSize: 16,
    lineHeight: 23,
  },
  homeTileWatermark: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 86,
    height: 86,
    opacity: 0.07,
    tintColor: 'white',
    transform: [{ rotate: '15deg' }],
  },
});
