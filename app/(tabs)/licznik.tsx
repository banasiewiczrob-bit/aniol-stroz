import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { CONTRACT_SIGNED_STORAGE_KEY } from '@/constants/storageKeys';
import { markCounterDone } from '@/hooks/useFirstSteps';
import { SCREEN_PADDING } from '@/styles/screenStyles';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LicznikScreen() {
  const [date, setDate] = useState(new Date());
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
        syncManualInputs(d);
        calculateStats(d);
        await markCounterDone();
      } else {
        const now = new Date();
        setDate(now);
        syncManualInputs(now);
        calculateStats(now);
      }
    } catch (e) {
      console.error('Błąd ładowania:', e);
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
    if (Platform.OS === 'android') setShow(false);
    if (!selectedDate) return;

    setDate(selectedDate);
    syncManualInputs(selectedDate);
    calculateStats(selectedDate);
    await AsyncStorage.setItem('startDate', selectedDate.toISOString());
    await markCounterDone();
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

    setDate(selectedDate);
    syncManualInputs(selectedDate);
    calculateStats(selectedDate);
    await AsyncStorage.setItem('startDate', selectedDate.toISOString());
    await markCounterDone();
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

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.captureArea}>
          <Text style={styles.title}>Twój licznik zdrowienia</Text>
          <CoJakSection
            title="Opis i instrukcja"
            co="Każdy z nas lubi wiedzieć, jak długo zdrowieje. Mimo tego, co mówimy, że to nieważne, 
            to jednak dobrze znamy datę rozpoczęcia tej drogi. Licznik pokazuje, jak długo trwa Twoja droga i pomaga zauważyć postęp dzień po dniu."
            jak="Ustaw datę początkową i aktualizuj ją tylko wtedy, gdy naprawdę trzeba. 
            Traktuj licznik jako wsparcie, nie presję. Gdy ustawisz datę, a licznik pokaże liczbę dni, sprawdź, co jest w Twoich odznakach i zobacz, czy nie masz już jakiejś nagrody do odebrania. Pamiętaj, że to nie wyścig, a każdy dzień zdrowienia jest ważny."
          />
          <Text style={styles.headerSubtitle}>
             Pierwsze kroki: ustaw datę startu. Twoje zdrowienie trwa już:
          </Text>

          <View style={styles.counterWrap}>
            <Animated.View
              style={[
                styles.counterGlow,
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
            <View style={styles.mainCounter}>
              <Text style={styles.totalNumber}>{stats.totalDays}</Text>
              <Text style={styles.totalLabel}>DNI</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.button} onPress={() => setShow(!show)}>
          <Ionicons name="calendar-outline" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>{show ? 'Zwiń ustawienia' : 'Ustaw datę początkową'}</Text>
        </Pressable>

        {show && (
          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  maximumDate={new Date()}
                  textColor="white"
                  locale="pl-PL"
                />
                <Pressable style={styles.closeBtn} onPress={() => setShow(false)}>
                  <Text style={styles.closeBtnText}>Gotowe</Text>
                </Pressable>
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

        <View style={styles.grid}>
          <StatBox label="Lat" value={stats.years} />
          <StatBox label="Miesięcy" value={stats.months} />
          <StatBox label="Dni" value={stats.days} />
        </View>

        <Pressable onPress={() => router.push('/licznik-nagrody')} style={styles.rewardsTile}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardsTitle}>Twoje odznaki</Text>
            <Text style={styles.rewardsSubtitle}>Zobacz zdobyte nagrody</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#78C8FF" />
        </Pressable>

        <Pressable style={[styles.button, styles.resetButton]} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Resetuj licznik</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </BackgroundWrapper>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { ...SCREEN_PADDING, alignItems: 'center' },
  captureArea: { width: '100%', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 10 },
  title: { ...TYPE.h1, color: 'white', marginBottom: 10, alignSelf: 'flex-start' },
  headerSubtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.6)', marginBottom: 60, alignSelf: 'flex-start' },
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
  counterWrap: {
    width: 273,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
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
  totalLabel: { ...TYPE.h3, color: '#78C8FF', letterSpacing: 2.5 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
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
  statValue: { ...TYPE.h2, color: 'white' },
  statLabel: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
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
  buttonText: { ...TYPE.button, color: 'white' },
  resetButton: { marginTop: 12, backgroundColor: 'rgba(255, 100, 100, 0.15)', borderColor: 'rgba(255, 100, 100, 0.5)' },
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
  },
  rewardsTitle: { ...TYPE.h3, color: 'white' },
  rewardsSubtitle: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginTop: 10,
    padding: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.1)',
  },
  closeBtn: { padding: 10, alignItems: 'center', marginTop: 5, backgroundColor: 'rgba(120, 200, 255, 0.1)', borderRadius: 10 },
  closeBtnText: { ...TYPE.bodyStrong, color: '#78C8FF' },
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
