import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { FirstStepsRoadmap } from '@/components/FirstStepsRoadmap';
import { CONTRACT_SIGNED_STORAGE_KEY } from '@/constants/storageKeys';
import {
  getFirstStepsState,
  markCounterDone,
  resolveFirstStepsStep,
  subscribeFirstStepsChanges,
  type FirstStepsStep,
} from '@/hooks/useFirstSteps';
import { SCREEN_PADDING } from '@/styles/screenStyles';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Watermark = require('../assets/images/maly_aniol.png');

export default function LicznikScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height <= 900;
  const [firstStepsStep, setFirstStepsStep] = useState<FirstStepsStep | 'intro' | null>(null);
  const [date, setDate] = useState(new Date());
  const [pickerDraftDate, setPickerDraftDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [stats, setStats] = useState({ years: 0, months: 0, days: 0, totalDays: 0 });
  const [manualDay, setManualDay] = useState('');
  const [manualMonth, setManualMonth] = useState('');
  const [manualYear, setManualYear] = useState('');
  const glow = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshFirstStepsStep = async () => {
      const state = await getFirstStepsState();
      const nextStep = state.introSeen ? resolveFirstStepsStep(state) : 'intro';
      if (mounted) setFirstStepsStep(nextStep);
    };
    void refreshFirstStepsStep();
    const unsubscribe = subscribeFirstStepsChanges(() => {
      void refreshFirstStepsStep();
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [glow]);

  useEffect(() => {
    const createSparkleLoop = (value: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(value, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2100,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(1200),
        ])
      );

    const loop1 = createSparkleLoop(sparkle1, 0);
    const loop2 = createSparkleLoop(sparkle2, 900);
    const loop3 = createSparkleLoop(sparkle3, 1800);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [sparkle1, sparkle2, sparkle3]);

  const loadData = async () => {
    try {
      const savedDate = await AsyncStorage.getItem('startDate');
      if (savedDate) {
        const d = new Date(savedDate);
        setDate(d);
        setPickerDraftDate(d);
        syncManualInputs(d);
        calculateStats(d);
        await markCounterDone();
      } else {
        const now = new Date();
        setDate(now);
        setPickerDraftDate(now);
        syncManualInputs(now);
        calculateStats(now);
      }
    } catch (e) {
      console.error('Błąd ładowania:', e);
    }
  };

  const persistStartDate = async (selectedDate: Date) => {
    const stepBeforeSave = firstStepsStep;
    setDate(selectedDate);
    syncManualInputs(selectedDate);
    calculateStats(selectedDate);
    await AsyncStorage.setItem('startDate', selectedDate.toISOString());
    await markCounterDone();

    const state = await getFirstStepsState();
    const nextStep = state.introSeen ? resolveFirstStepsStep(state) : 'intro';
    setFirstStepsStep(nextStep);

    if (stepBeforeSave === 'counter' && nextStep === 'consents') {
      router.replace('/ustawienia');
    }
  };

  const syncManualInputs = (d: Date) => {
    setManualDay(String(d.getDate()).padStart(2, '0'));
    setManualMonth(String(d.getMonth() + 1).padStart(2, '0'));
    setManualYear(String(d.getFullYear()));
  };

  const calculateStats = (startDate: Date) => {
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    setStats({ years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays: Math.max(0, totalDays) });
  };

  const onChange = async (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    if (Platform.OS === 'ios') {
      setPickerDraftDate(selectedDate);
      return;
    }

    setShow(false);
    await persistStartDate(selectedDate);
  };

  const applyPickerDate = async () => {
    await persistStartDate(pickerDraftDate);
    setShow(false);
  };

  const applyManualDate = async () => {
    const day = Number.parseInt(manualDay, 10);
    const month = Number.parseInt(manualMonth, 10);
    const year = Number.parseInt(manualYear, 10);
    const today = new Date();
    const maxYear = today.getFullYear();

    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
      Alert.alert('Niepoprawna data', 'Wpisz dzień, miesiąc i rok jako liczby.');
      return;
    }
    if (year < 1900 || year > maxYear) {
      Alert.alert('Niepoprawny rok', `Rok musi być w zakresie 1900-${maxYear}.`);
      return;
    }
    if (month < 1 || month > 12) {
      Alert.alert('Niepoprawny miesiąc', 'Miesiąc musi być w zakresie 1-12.');
      return;
    }

    const lastDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > lastDay) {
      Alert.alert('Niepoprawny dzień', `Dzień musi być w zakresie 1-${lastDay}.`);
      return;
    }

    const selectedDate = new Date(year, month - 1, day);
    if (selectedDate.getTime() > today.getTime()) {
      Alert.alert('Niepoprawna data', 'Data nie może być w przyszłości.');
      return;
    }

    await persistStartDate(selectedDate);
  };

  const handleReset = () => {
    Alert.alert('Zresetować licznik?', 'To wyzeruje licznik i rocznice. Będzie można ustawić nową datę.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Resetuj',
        style: 'destructive',
        onPress: async () => {
          const now = new Date();
          await AsyncStorage.removeItem('startDate');
          await AsyncStorage.removeItem(CONTRACT_SIGNED_STORAGE_KEY);
          setDate(now);
          syncManualInputs(now);
          calculateStats(now);
        },
      },
    ]);
  };

  const handleContinueFirstSteps = async () => {
    const state = await getFirstStepsState();
    const step = state.introSeen ? resolveFirstStepsStep(state) : 'intro';
    setFirstStepsStep(step);

    if (step === 'intro') {
      router.replace('/intro');
      return;
    }
    if (step === 'contract') {
      router.replace('/kontrakt');
      return;
    }
    if (step === 'counter') {
      Alert.alert('Najpierw ustaw datę startu', 'Aby przejść dalej, zapisz datę rozpoczęcia zdrowienia.');
      return;
    }
    if (step === 'consents') {
      router.replace('/ustawienia');
      return;
    }
    if (step === 'done') {
      router.replace('/(tabs)');
      return;
    }
  };

  const showFirstStepsRoadmap = firstStepsStep !== null && firstStepsStep !== 'done';
  const showContinueFirstSteps = firstStepsStep === 'consents';

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
            { paddingBottom: Math.max(140, insets.bottom + 110) },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled
          bounces
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <View style={styles.captureArea}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Twój licznik zdrowienia</Text>
          {compact ? (
            <Text style={[styles.headerSubtitle, styles.headerSubtitleCompact]}>Ustaw datę startu. Twoje zdrowienie trwa już:</Text>
          ) : (
            <>
              <View style={styles.infoCompact}>
                <Text style={styles.infoCompactTitle}>Opis i instrukcja</Text>
                <Text style={styles.infoCompactText}>Ustaw datę startu i obserwuj codzienny postęp.</Text>
              </View>
              <Text style={styles.headerSubtitle}>Pierwsze kroki: ustaw datę startu. Twoje zdrowienie trwa już:</Text>
            </>
          )}
          {showFirstStepsRoadmap && !compact ? (
            <View style={styles.roadmapWrap}>
              <FirstStepsRoadmap currentStep={2} compact />
            </View>
          ) : null}

        <View style={[styles.counterWrap, compact && styles.counterWrapCompact]}>
            <Animated.View
              style={[
                styles.counterGlow,
                compact && styles.counterGlowCompact,
                {
                  opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
                  transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  opacity: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.45] }),
                  transform: [
                    { translateX: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [-26, 22] }) },
                    { translateY: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [20, -22] }) },
                    { scale: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.05] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  opacity: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.4] }),
                  transform: [
                    { translateX: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [30, -18] }) },
                    { translateY: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [-16, 24] }) },
                    { scale: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }) },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  opacity: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.4] }),
                  transform: [
                    { translateX: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [-8, 28] }) },
                    { translateY: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [-26, 10] }) },
                    { scale: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.0] }) },
                  ],
                },
              ]}
            />
            <View style={[styles.mainCounter, compact && styles.mainCounterCompact]}>
              <Text style={[styles.totalNumber, compact && styles.totalNumberCompact]}>{stats.totalDays}</Text>
              <Text style={[styles.totalLabel, compact && styles.totalLabelCompact]}>DNI</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.button, compact && styles.buttonCompact]}
          onPress={() => {
            if (!show) {
              setPickerDraftDate(date);
            }
            setShow((prev) => !prev);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>{show ? 'Zwiń ustawienia' : 'Ustaw datę początkową'}</Text>
        </Pressable>
        {showContinueFirstSteps ? (
          <Pressable style={[styles.button, compact && styles.buttonCompact, styles.nextStepButton]} onPress={() => void handleContinueFirstSteps()}>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>
              Krok 3: zgody i ustawienia
            </Text>
          </Pressable>
        ) : null}
        {showFirstStepsRoadmap && compact ? (
          <View style={styles.roadmapWrapBelow}>
            <FirstStepsRoadmap currentStep={2} compact />
          </View>
        ) : null}

        {show && (
          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <>
                <DateTimePicker
                  value={pickerDraftDate}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  maximumDate={new Date()}
                  textColor="white"
                  locale="pl-PL"
                />
                <View style={styles.closeBtnRow}>
                  <Pressable
                    style={[styles.closeBtn, styles.closeBtnSecondary]}
                    onPress={() => {
                      setPickerDraftDate(date);
                      setShow(false);
                    }}
                  >
                    <Text style={[styles.closeBtnText, styles.closeBtnTextSecondary]}>Anuluj</Text>
                  </Pressable>
                  <Pressable style={styles.closeBtn} onPress={() => void applyPickerDate()}>
                    <Text style={styles.closeBtnText}>Ustaw datę</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.quickSet}>
                <Text style={styles.quickTitle}>Ustaw datę ręcznie</Text>
                <View style={styles.quickRow}>
                  <TextInput
                    value={manualDay}
                    onChangeText={setManualDay}
                    placeholder="DD"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.quickInput}
                  />
                  <TextInput
                    value={manualMonth}
                    onChangeText={setManualMonth}
                    placeholder="MM"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.quickInput}
                  />
                  <TextInput
                    value={manualYear}
                    onChangeText={setManualYear}
                    placeholder="RRRR"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.quickInput, styles.quickInputYear]}
                  />
                </View>
                <Pressable style={styles.quickBtn} onPress={applyManualDate}>
                  <Text style={styles.quickBtnText}>Ustaw datę</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={[styles.grid, compact && styles.gridCompact]}>
          <StatBox label="Lat" value={stats.years} compact={compact} />
          <StatBox label="Miesięcy" value={stats.months} compact={compact} />
          <StatBox label="Dni" value={stats.days} compact={compact} />
        </View>

        <Pressable onPress={() => router.push('/licznik-strat')} style={[styles.lossTile, compact && styles.lossTileCompact]}>
          <Image source={Watermark} resizeMode="contain" style={styles.rewardsWatermark} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.lossTitle, compact && styles.lossTitleCompact]}>Licznik kosztów kryzysu</Text>
            <Text style={[styles.lossSubtitle, compact && styles.lossSubtitleCompact]}>
              Moduł dodatkowy, poza onboardingiem.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFD18A" />
        </Pressable>

        <Pressable onPress={() => router.push('/licznik-nagrody')} style={[styles.rewardsTile, compact && styles.rewardsTileCompact]}>
          <Image source={Watermark} resizeMode="contain" style={styles.rewardsWatermark} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rewardsTitle, compact && styles.rewardsTitleCompact]}>Twoje odznaki</Text>
            <Text style={[styles.rewardsSubtitle, compact && styles.rewardsSubtitleCompact]}>Zobacz zdobyte nagrody</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#78C8FF" />
        </Pressable>

        <Pressable style={[styles.button, compact && styles.buttonCompact, styles.resetButton, compact && styles.resetButtonCompact]} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>Resetuj licznik</Text>
        </Pressable>

          {!compact ? <View style={{ height: 12 }} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

function StatBox({ label, value, compact }: { label: string; value: number; compact: boolean }) {
  return (
    <View style={[styles.statBox, compact && styles.statBoxCompact]}>
      <Text style={[styles.statValue, compact && styles.statValueCompact]}>{value}</Text>
      <Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: { flex: 1 },
  scrollContent: { ...SCREEN_PADDING, alignItems: 'center', position: 'relative', paddingTop: 16 },
  scrollContentCompact: { paddingTop: 8, paddingBottom: 4 },
  bgOrbA: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(118, 214, 255, 0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(158, 231, 216, 0.09)',
    bottom: 110,
    left: -80,
  },
  captureArea: { width: '100%', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 6 },
  roadmapWrap: {
    width: '100%',
    marginBottom: 12,
    zIndex: 4,
  },
  roadmapWrapBelow: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    zIndex: 4,
  },
  title: { ...TYPE.h1, color: 'white', marginBottom: 8, alignSelf: 'flex-start' },
  titleCompact: { fontSize: 32, lineHeight: 36, marginBottom: 4 },
  infoCompact: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  infoCompactTitle: { ...TYPE.bodyStrong, color: 'white', marginBottom: 2 },
  infoCompactText: { ...TYPE.caption, color: 'rgba(232,245,255,0.86)' },
  headerSubtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.6)', marginBottom: 18, alignSelf: 'flex-start' },
  headerSubtitleCompact: { marginBottom: 8, fontSize: 15, lineHeight: 19 },
  mainCounter: {
    width: 270,
    height: 270,
    borderRadius: 150,
    borderWidth: 6,
    borderColor: '#78C8FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 200, 255, 0.05)',
    shadowColor: '#78C8FF',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  mainCounterCompact: {
    width: 186,
    height: 186,
    borderRadius: 93,
    borderWidth: 3,
  },
  counterWrap: {
    width: 273,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    zIndex: 1,
  },
  counterWrapCompact: {
    width: 206,
    height: 206,
    marginTop: 10,
    marginBottom: 8,
  },
  counterGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: 'rgba(120, 200, 255, 0.9)',
    backgroundColor: 'rgba(120, 200, 255, 0.08)',
    shadowColor: '#78C8FF',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  counterGlowCompact: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 4,
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(170, 220, 255, 0.9)',
    shadowColor: '#AEE1FF',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  totalNumber: { fontSize: 60, fontWeight: '800', color: 'white', fontFamily: TYPE.display.fontFamily },
  totalNumberCompact: { fontSize: 42 },
  totalLabel: { ...TYPE.h3, color: '#78C8FF', letterSpacing: 2.5 },
  totalLabelCompact: { fontSize: 18, letterSpacing: 1.8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  gridCompact: { marginBottom: 8 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 5,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.1)',
  },
  statBoxCompact: {
    margin: 3,
    padding: 12,
    borderRadius: 12,
  },
  statValue: { ...TYPE.h2, color: 'white' },
  statValueCompact: { fontSize: 32, lineHeight: 36 },
  statLabel: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  statLabelCompact: { fontSize: 12, marginTop: 3 },
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 200, 255, 0.2)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#78C8FF',
    width: '100%',
    justifyContent: 'center',
  },
  buttonCompact: {
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { ...TYPE.button, color: 'white' },
  buttonTextCompact: { fontSize: 15 },
  nextStepButton: { marginTop: 8, marginBottom: 4, backgroundColor: 'rgba(120, 200, 255, 0.3)' },
  resetButton: { marginTop: 12, backgroundColor: 'rgba(255, 100, 100, 0.15)', borderColor: 'rgba(255, 100, 100, 0.5)' },
  resetButtonCompact: { marginTop: 8 },
  lossTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 209, 138, 0.08)',
    width: '100%',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 138, 0.35)',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  lossTileCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  lossTitle: { ...TYPE.h3, color: 'white' },
  lossTitleCompact: { fontSize: 18, lineHeight: 21 },
  lossSubtitle: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.76)', marginTop: 4 },
  lossSubtitleCompact: { fontSize: 13, lineHeight: 15, marginTop: 1 },
  rewardsTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.22)',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  rewardsTileCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rewardsWatermark: {
    position: 'absolute',
    right: -14,
    bottom: -18,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  rewardsTitle: { ...TYPE.h3, color: 'white' },
  rewardsTitleCompact: { fontSize: 18, lineHeight: 21 },
  rewardsSubtitle: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  rewardsSubtitleCompact: { fontSize: 13, lineHeight: 15, marginTop: 1 },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginTop: 10,
    padding: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.1)',
  },
  closeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  closeBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(120, 200, 255, 0.16)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.35)',
  },
  closeBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  closeBtnText: { ...TYPE.bodyStrong, color: '#78C8FF' },
  closeBtnTextSecondary: { color: 'rgba(255,255,255,0.76)' },
  quickSet: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(120, 200, 255, 0.12)' },
  quickTitle: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.35)',
    color: 'white',
    paddingHorizontal: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    ...TYPE.bodySmall,
    fontSize: 18,
  },
  quickInputYear: { flex: 1.3 },
  quickBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(120, 200, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.45)',
  },
  quickBtnText: { ...TYPE.button, color: '#78C8FF' },
});
