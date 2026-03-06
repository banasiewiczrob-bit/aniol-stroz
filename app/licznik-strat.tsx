import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Watermark = require('../assets/images/maly_aniol.png');
const STORAGE_KEY = '@loss_counter_v1';
const START_DATE_STORAGE_KEY = 'startDate';

type ConfidenceMode = 'ostrozny' | 'sredni' | 'szeroki';
type CategoryKey =
  | 'cigarettes'
  | 'vape'
  | 'alcohol'
  | 'drugs'
  | 'meds'
  | 'gambling'
  | 'otherChemical';

type LossInputs = {
  cigarettesMonthly: string;
  cigarettesMonths: string;
  cigarettesYears: string;
  cigarettesPacksPerDay: string;
  cigarettesPackPrice: string;
  vapeMonthly: string;
  vapeMonths: string;
  vapeYears: string;
  alcoholMonthly: string;
  alcoholMonths: string;
  alcoholYears: string;
  drugsMonthly: string;
  drugsMonths: string;
  drugsYears: string;
  medsMonthly: string;
  medsMonths: string;
  medsYears: string;
  gamblingMonthly: string;
  gamblingMonths: string;
  gamblingYears: string;
  otherChemicalMonthly: string;
  otherChemicalMonths: string;
  otherChemicalYears: string;
  centerStaysCount: string;
  centerStayCost: string;
  detoxStaysCount: string;
  detoxStayCost: string;
  soberingStaysCount: string;
  soberingStayCost: string;
  detentionStaysCount: string;
  detentionStayCost: string;
  confidenceMode: ConfidenceMode;
};

const DEFAULT_INPUTS: LossInputs = {
  cigarettesMonthly: '',
  cigarettesMonths: '',
  cigarettesYears: '',
  cigarettesPacksPerDay: '',
  cigarettesPackPrice: '',
  vapeMonthly: '',
  vapeMonths: '',
  vapeYears: '',
  alcoholMonthly: '',
  alcoholMonths: '',
  alcoholYears: '',
  drugsMonthly: '',
  drugsMonths: '',
  drugsYears: '',
  medsMonthly: '',
  medsMonths: '',
  medsYears: '',
  gamblingMonthly: '',
  gamblingMonths: '',
  gamblingYears: '',
  otherChemicalMonthly: '',
  otherChemicalMonths: '',
  otherChemicalYears: '',
  centerStaysCount: '',
  centerStayCost: '',
  detoxStaysCount: '',
  detoxStayCost: '',
  soberingStaysCount: '',
  soberingStayCost: '',
  detentionStaysCount: '',
  detentionStayCost: '',
  confidenceMode: 'sredni',
};

function parseNumber(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function resolveMonths(monthsRaw: string, yearsRaw: string) {
  const months = parseNumber(monthsRaw);
  if (months > 0) return months;
  const years = parseNumber(yearsRaw);
  return years > 0 ? years * 12 : 0;
}

function getConfidenceRange(mode: ConfidenceMode) {
  if (mode === 'ostrozny') return { min: 0.9, max: 1.1 };
  if (mode === 'szeroki') return { min: 0.55, max: 1.45 };
  return { min: 0.75, max: 1.25 };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function wholeDaysSince(startDateIso: string | null) {
  if (!startDateIso) return 0;
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = nowMid.getTime() - startMid.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

export default function LicznikStratScreen() {
  const insets = useSafeAreaInsets();
  const [inputs, setInputs] = useState<LossInputs>(DEFAULT_INPUTS);
  const [daysFromStart, setDaysFromStart] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openCategory, setOpenCategory] = useState<Record<CategoryKey, boolean>>({
    cigarettes: true,
    vape: false,
    alcohol: false,
    drugs: false,
    meds: false,
    gambling: false,
    otherChemical: false,
  });

  useEffect(() => {
    const load = async () => {
      const [savedInputsRaw, startDateRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(START_DATE_STORAGE_KEY),
      ]);

      if (savedInputsRaw) {
        try {
          const parsed = JSON.parse(savedInputsRaw) as Partial<LossInputs>;
          const legacyParsed = parsed as Partial<LossInputs> & {
            otherMonthly?: string;
            otherMonths?: string;
            otherYears?: string;
          };
          setInputs({
            cigarettesMonthly: typeof parsed.cigarettesMonthly === 'string' ? parsed.cigarettesMonthly : '',
            cigarettesMonths: typeof parsed.cigarettesMonths === 'string' ? parsed.cigarettesMonths : '',
            cigarettesYears: typeof parsed.cigarettesYears === 'string' ? parsed.cigarettesYears : '',
            cigarettesPacksPerDay:
              typeof parsed.cigarettesPacksPerDay === 'string' ? parsed.cigarettesPacksPerDay : '',
            cigarettesPackPrice:
              typeof parsed.cigarettesPackPrice === 'string' ? parsed.cigarettesPackPrice : '',
            vapeMonthly: typeof parsed.vapeMonthly === 'string' ? parsed.vapeMonthly : '',
            vapeMonths: typeof parsed.vapeMonths === 'string' ? parsed.vapeMonths : '',
            vapeYears: typeof parsed.vapeYears === 'string' ? parsed.vapeYears : '',
            alcoholMonthly: typeof parsed.alcoholMonthly === 'string' ? parsed.alcoholMonthly : '',
            alcoholMonths: typeof parsed.alcoholMonths === 'string' ? parsed.alcoholMonths : '',
            alcoholYears: typeof parsed.alcoholYears === 'string' ? parsed.alcoholYears : '',
            drugsMonthly: typeof parsed.drugsMonthly === 'string' ? parsed.drugsMonthly : '',
            drugsMonths: typeof parsed.drugsMonths === 'string' ? parsed.drugsMonths : '',
            drugsYears: typeof parsed.drugsYears === 'string' ? parsed.drugsYears : '',
            medsMonthly: typeof parsed.medsMonthly === 'string' ? parsed.medsMonthly : '',
            medsMonths: typeof parsed.medsMonths === 'string' ? parsed.medsMonths : '',
            medsYears: typeof parsed.medsYears === 'string' ? parsed.medsYears : '',
            gamblingMonthly: typeof parsed.gamblingMonthly === 'string' ? parsed.gamblingMonthly : '',
            gamblingMonths: typeof parsed.gamblingMonths === 'string' ? parsed.gamblingMonths : '',
            gamblingYears: typeof parsed.gamblingYears === 'string' ? parsed.gamblingYears : '',
            otherChemicalMonthly:
              typeof parsed.otherChemicalMonthly === 'string'
                ? parsed.otherChemicalMonthly
                : typeof legacyParsed.otherMonthly === 'string'
                  ? legacyParsed.otherMonthly
                  : '',
            otherChemicalMonths:
              typeof parsed.otherChemicalMonths === 'string'
                ? parsed.otherChemicalMonths
                : typeof legacyParsed.otherMonths === 'string'
                  ? legacyParsed.otherMonths
                  : '',
            otherChemicalYears:
              typeof parsed.otherChemicalYears === 'string'
                ? parsed.otherChemicalYears
                : typeof legacyParsed.otherYears === 'string'
                  ? legacyParsed.otherYears
                  : '',
            centerStaysCount: typeof parsed.centerStaysCount === 'string' ? parsed.centerStaysCount : '',
            centerStayCost: typeof parsed.centerStayCost === 'string' ? parsed.centerStayCost : '',
            detoxStaysCount: typeof parsed.detoxStaysCount === 'string' ? parsed.detoxStaysCount : '',
            detoxStayCost: typeof parsed.detoxStayCost === 'string' ? parsed.detoxStayCost : '',
            soberingStaysCount: typeof parsed.soberingStaysCount === 'string' ? parsed.soberingStaysCount : '',
            soberingStayCost: typeof parsed.soberingStayCost === 'string' ? parsed.soberingStayCost : '',
            detentionStaysCount: typeof parsed.detentionStaysCount === 'string' ? parsed.detentionStaysCount : '',
            detentionStayCost: typeof parsed.detentionStayCost === 'string' ? parsed.detentionStayCost : '',
            confidenceMode:
              parsed.confidenceMode === 'ostrozny' || parsed.confidenceMode === 'sredni' || parsed.confidenceMode === 'szeroki'
                ? parsed.confidenceMode
                : 'sredni',
          });
        } catch {
          setInputs(DEFAULT_INPUTS);
        }
      }

      setDaysFromStart(wholeDaysSince(startDateRaw));
    };
    void load();
  }, []);

  const metrics = useMemo(() => {
    const cigarettesMonthlyManual = parseNumber(inputs.cigarettesMonthly);
    const cigarettesPacksPerDay = parseNumber(inputs.cigarettesPacksPerDay);
    const cigarettesPackPrice = parseNumber(inputs.cigarettesPackPrice);
    const cigarettesMonthlyAuto =
      cigarettesPacksPerDay > 0 && cigarettesPackPrice > 0 ? cigarettesPacksPerDay * cigarettesPackPrice * 30.4 : 0;
    const cigarettesMonthly = cigarettesMonthlyAuto > 0 ? cigarettesMonthlyAuto : cigarettesMonthlyManual;
    const cigarettesMonths = resolveMonths(inputs.cigarettesMonths, inputs.cigarettesYears);
    const vapeMonthly = parseNumber(inputs.vapeMonthly);
    const vapeMonths = resolveMonths(inputs.vapeMonths, inputs.vapeYears);
    const alcoholMonthly = parseNumber(inputs.alcoholMonthly);
    const alcoholMonths = resolveMonths(inputs.alcoholMonths, inputs.alcoholYears);
    const drugsMonthly = parseNumber(inputs.drugsMonthly);
    const drugsMonths = resolveMonths(inputs.drugsMonths, inputs.drugsYears);
    const medsMonthly = parseNumber(inputs.medsMonthly);
    const medsMonths = resolveMonths(inputs.medsMonths, inputs.medsYears);
    const gamblingMonthly = parseNumber(inputs.gamblingMonthly);
    const gamblingMonths = resolveMonths(inputs.gamblingMonths, inputs.gamblingYears);
    const otherChemicalMonthly = parseNumber(inputs.otherChemicalMonthly);
    const otherChemicalMonths = resolveMonths(inputs.otherChemicalMonths, inputs.otherChemicalYears);

    const centerStaysCount = parseNumber(inputs.centerStaysCount);
    const centerStayCost = parseNumber(inputs.centerStayCost);
    const detoxStaysCount = parseNumber(inputs.detoxStaysCount);
    const detoxStayCost = parseNumber(inputs.detoxStayCost);
    const soberingStaysCount = parseNumber(inputs.soberingStaysCount);
    const soberingStayCost = parseNumber(inputs.soberingStayCost);
    const detentionStaysCount = parseNumber(inputs.detentionStaysCount);
    const detentionStayCost = parseNumber(inputs.detentionStayCost);
    const interventionsTotal =
      centerStaysCount * centerStayCost +
      detoxStaysCount * detoxStayCost +
      soberingStaysCount * soberingStayCost +
      detentionStaysCount * detentionStayCost;

    const monthlyTotal =
      cigarettesMonthly +
      vapeMonthly +
      alcoholMonthly +
      drugsMonthly +
      medsMonthly +
      gamblingMonthly +
      otherChemicalMonthly;
    const dailyTotal = monthlyTotal / 30.4;
    const historyTypical =
      cigarettesMonthly * cigarettesMonths +
      vapeMonthly * vapeMonths +
      alcoholMonthly * alcoholMonths +
      drugsMonthly * drugsMonths +
      medsMonthly * medsMonths +
      gamblingMonthly * gamblingMonths +
      otherChemicalMonthly * otherChemicalMonths +
      interventionsTotal;
    const recoveredTypical = daysFromStart * dailyTotal;

    const range = getConfidenceRange(inputs.confidenceMode);
    return {
      hasAnyInput: monthlyTotal > 0 || historyTypical > 0 || interventionsTotal > 0,
      monthlyTotal,
      dailyTotal,
      historyTypical,
      historyMin: historyTypical * range.min,
      historyMax: historyTypical * range.max,
      recoveredTypical,
      recoveredMin: recoveredTypical * range.min,
      recoveredMax: recoveredTypical * range.max,
      cigarettesMonthlyAuto,
      interventionsTotal,
    };
  }, [daysFromStart, inputs]);

  const setValue = (key: keyof LossInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (key: CategoryKey) => {
    setOpenCategory((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderCategory = (params: {
    keyName: CategoryKey;
    title: string;
    help: string;
    monthlyKey: keyof LossInputs;
    monthsKey: keyof LossInputs;
    yearsKey: keyof LossInputs;
    monthlyPlaceholder: string;
    monthsPlaceholder: string;
    yearsPlaceholder: string;
  }) => {
    const isOpen = openCategory[params.keyName];
    return (
      <View style={styles.categoryCard} key={params.keyName}>
        <Pressable style={styles.categoryHeader} onPress={() => toggleCategory(params.keyName)}>
          <Text style={styles.categoryTitle}>{params.title}</Text>
          <Text style={styles.categoryChevron}>{isOpen ? '▾' : '▸'}</Text>
        </Pressable>
        {isOpen ? (
          <>
            <Text style={styles.categoryHelp}>{params.help}</Text>

            {params.keyName === 'cigarettes' ? (
              <View style={styles.cardInlineBlock}>
                <Text style={styles.inlineTitle}>Szybki kalkulator papierosów (opc.)</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    value={inputs.cigarettesPacksPerDay}
                    onChangeText={(v) => setValue('cigarettesPacksPerDay', v)}
                    keyboardType="decimal-pad"
                    placeholder="Paczki/dzień"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.inlineInput}
                  />
                  <TextInput
                    value={inputs.cigarettesPackPrice}
                    onChangeText={(v) => setValue('cigarettesPackPrice', v)}
                    keyboardType="decimal-pad"
                    placeholder="Cena paczki"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.inlineInput}
                  />
                </View>
                {metrics.cigarettesMonthlyAuto > 0 ? (
                  <Text style={styles.inlineHint}>
                    Auto: papierosy to około {formatMoney(metrics.cigarettesMonthlyAuto)} / miesiąc.
                  </Text>
                ) : (
                  <Text style={styles.inlineHint}>Możesz też wpisać koszt miesięczny ręcznie poniżej.</Text>
                )}
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>PLN / miesiąc</Text>
              <TextInput
                value={String(inputs[params.monthlyKey] ?? '')}
                onChangeText={(v) => setValue(params.monthlyKey, v)}
                keyboardType="decimal-pad"
                placeholder={params.monthlyPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Miesięcy</Text>
              <TextInput
                value={String(inputs[params.monthsKey] ?? '')}
                onChangeText={(v) => setValue(params.monthsKey, v)}
                keyboardType="decimal-pad"
                placeholder={params.monthsPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.input}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Lata (opc.)</Text>
              <TextInput
                value={String(inputs[params.yearsKey] ?? '')}
                onChangeText={(v) => setValue(params.yearsKey, v)}
                keyboardType="decimal-pad"
                placeholder={params.yearsPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.input}
              />
              <Text style={styles.inputLabel}> </Text>
              <View style={styles.inputSpacer} />
            </View>
            <Text style={styles.rowHint}>Jeśli podasz miesiące i lata, priorytet mają miesiące.</Text>

            {params.keyName === 'otherChemical' ? (
              <>
                <Text style={styles.categoryHelp}>
                  Pobyty i interwencje: ośrodki, oddziały detoksykacyjne, izby wytrzeźwień, izby zatrzymań.
                </Text>
                <View style={styles.interventionGridHeader}>
                  <Text style={[styles.interventionHeaderLabel, styles.interventionAreaCol]}>Obszar</Text>
                  <Text style={styles.interventionHeaderLabel}>Liczba</Text>
                  <Text style={styles.interventionHeaderLabel}>Koszt 1 pobytu</Text>
                </View>
                <View style={styles.interventionRow}>
                  <Text style={[styles.inputLabel, styles.interventionAreaCol]}>Ośrodki</Text>
                  <TextInput
                    value={inputs.centerStaysCount}
                    onChangeText={(v) => setValue('centerStaysCount', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 2"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                  <TextInput
                    value={inputs.centerStayCost}
                    onChangeText={(v) => setValue('centerStayCost', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 12000"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                </View>
                <View style={styles.interventionRow}>
                  <Text style={[styles.inputLabel, styles.interventionAreaCol]}>Detoks</Text>
                  <TextInput
                    value={inputs.detoxStaysCount}
                    onChangeText={(v) => setValue('detoxStaysCount', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 3"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                  <TextInput
                    value={inputs.detoxStayCost}
                    onChangeText={(v) => setValue('detoxStayCost', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 4500"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                </View>
                <View style={styles.interventionRow}>
                  <Text style={[styles.inputLabel, styles.interventionAreaCol]}>Izby wytrzeźwień</Text>
                  <TextInput
                    value={inputs.soberingStaysCount}
                    onChangeText={(v) => setValue('soberingStaysCount', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 4"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                  <TextInput
                    value={inputs.soberingStayCost}
                    onChangeText={(v) => setValue('soberingStayCost', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 450"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                </View>
                <View style={styles.interventionRow}>
                  <Text style={[styles.inputLabel, styles.interventionAreaCol]}>Izby zatrzymań</Text>
                  <TextInput
                    value={inputs.detentionStaysCount}
                    onChangeText={(v) => setValue('detentionStaysCount', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 1"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                  <TextInput
                    value={inputs.detentionStayCost}
                    onChangeText={(v) => setValue('detentionStayCost', v)}
                    keyboardType="decimal-pad"
                    placeholder="np. 900"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                </View>
                <Text style={styles.rowHint}>Pobyty i interwencje wpływają na stratę historyczną, nie na dzienny odzysk.</Text>
              </>
            ) : null}
          </>
        ) : null}
      </View>
    );
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
      Alert.alert('Zapisano', 'Szacunki zostały zapisane lokalnie na tym urządzeniu.');
    } catch (e) {
      console.error('Błąd zapisu licznika strat:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać danych.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = () => {
    Alert.alert('Wyczyścić dane?', 'Usuniemy wpisane szacunki w tym liczniku.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyczyść',
        style: 'destructive',
        onPress: async () => {
          setInputs(DEFAULT_INPUTS);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.bgOrbA} />
          <View style={styles.bgOrbB} />
          <Text style={styles.title}>Licznik strat i odzysku (test)</Text>
          <Text style={styles.subtitle}>To jest bezpieczny szacunek finansowy. Najpierw odzysk, potem kontekst strat.</Text>

          <CoJakSection
            title="Opis i instrukcja"
            co="Ten moduł pomaga zobaczyć skalę wydatków związanych z używaniem oraz to, ile środków odzyskujesz od dnia startu."
            jak="Wpisz orientacyjne koszty miesięczne i liczbę miesięcy używania. Nie musisz być precyzyjny — to ma być pomocna orientacja, a nie księgowość."
          />

          <View style={styles.card}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <Text style={styles.cardTitle}>1) Źródła kosztów</Text>
            <Text style={styles.cardHint}>Rozwiń wybraną kategorię i wpisz dane. Wystarczy jedna, żeby zobaczyć wynik.</Text>

            {renderCategory({
              keyName: 'cigarettes',
              title: 'Papierosy',
              help: 'Podaj koszt miesięczny i liczbę miesięcy. Możesz też użyć kalkulatora paczek.',
              monthlyKey: 'cigarettesMonthly',
              monthsKey: 'cigarettesMonths',
              yearsKey: 'cigarettesYears',
              monthlyPlaceholder: 'np. 900',
              monthsPlaceholder: 'np. 36',
              yearsPlaceholder: 'np. 25',
            })}
            {renderCategory({
              keyName: 'vape',
              title: 'E-papierosy',
              help: 'Wpisz orientacyjny koszt liquidów i sprzętu w przeliczeniu na miesiąc.',
              monthlyKey: 'vapeMonthly',
              monthsKey: 'vapeMonths',
              yearsKey: 'vapeYears',
              monthlyPlaceholder: 'np. 400',
              monthsPlaceholder: 'np. 20',
              yearsPlaceholder: 'np. 2',
            })}
            {renderCategory({
              keyName: 'alcohol',
              title: 'Alkohol',
              help: 'Ujmij wszystkie wydatki związane z alkoholem: zakupy, wyjścia, dowóz.',
              monthlyKey: 'alcoholMonthly',
              monthsKey: 'alcoholMonths',
              yearsKey: 'alcoholYears',
              monthlyPlaceholder: 'np. 1200',
              monthsPlaceholder: 'np. 24',
              yearsPlaceholder: 'np. 3',
            })}
            {renderCategory({
              keyName: 'drugs',
              title: 'Narkotyki',
              help: 'Wpisz szacunkowy miesięczny koszt i okres, w którym był aktywny.',
              monthlyKey: 'drugsMonthly',
              monthsKey: 'drugsMonths',
              yearsKey: 'drugsYears',
              monthlyPlaceholder: 'np. 1800',
              monthsPlaceholder: 'np. 18',
              yearsPlaceholder: 'np. 1,5',
            })}
            {renderCategory({
              keyName: 'meds',
              title: 'Leczenie i leki psychiatryczne',
              help: 'Uwzględnij koszty leków psychiatrycznych, wizyt, prywatnych konsultacji i terapii.',
              monthlyKey: 'medsMonthly',
              monthsKey: 'medsMonths',
              yearsKey: 'medsYears',
              monthlyPlaceholder: 'np. 500',
              monthsPlaceholder: 'np. 10',
              yearsPlaceholder: 'np. 1',
            })}
            {renderCategory({
              keyName: 'gambling',
              title: 'Hazard / zakłady',
              help: 'Podaj średnią miesięczną z przegranych i opłat.',
              monthlyKey: 'gamblingMonthly',
              monthsKey: 'gamblingMonths',
              yearsKey: 'gamblingYears',
              monthlyPlaceholder: 'np. 700',
              monthsPlaceholder: 'np. 14',
              yearsPlaceholder: 'np. 2',
            })}
            {renderCategory({
              keyName: 'otherChemical',
              title: 'Inne chemiczne + pobyty/interwencje (opc.)',
              help: 'Dodatkowe koszty związane z używaniem substancji, których nie ujęto wyżej.',
              monthlyKey: 'otherChemicalMonthly',
              monthsKey: 'otherChemicalMonths',
              yearsKey: 'otherChemicalYears',
              monthlyPlaceholder: 'np. 600',
              monthsPlaceholder: 'np. 12',
              yearsPlaceholder: 'np. 1',
            })}
          </View>

          <View style={styles.card}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <Text style={styles.cardTitle}>2) Zakres szacunku</Text>
            <Text style={styles.cardHint}>Im szerszy zakres, tym większy margines niepewności.</Text>
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentBtn, inputs.confidenceMode === 'ostrozny' && styles.segmentBtnActive]}
                onPress={() => setValue('confidenceMode', 'ostrozny')}
              >
                <Text style={[styles.segmentText, inputs.confidenceMode === 'ostrozny' && styles.segmentTextActive]}>Wąski</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, inputs.confidenceMode === 'sredni' && styles.segmentBtnActive]}
                onPress={() => setValue('confidenceMode', 'sredni')}
              >
                <Text style={[styles.segmentText, inputs.confidenceMode === 'sredni' && styles.segmentTextActive]}>Średni</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, inputs.confidenceMode === 'szeroki' && styles.segmentBtnActive]}
                onPress={() => setValue('confidenceMode', 'szeroki')}
              >
                <Text style={[styles.segmentText, inputs.confidenceMode === 'szeroki' && styles.segmentTextActive]}>Szeroki</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, styles.resultCard]}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <Text style={styles.cardTitle}>3) Wynik</Text>
            <Text style={styles.positiveTitle}>Odzysk od dnia startu: {daysFromStart} dni</Text>
            <ResultRow label="Szacunek miesięczny (teraz nie wydajesz)" value={formatMoney(metrics.monthlyTotal)} />
            <ResultRow label="Szacunek dzienny (teraz nie wydajesz)" value={formatMoney(metrics.dailyTotal)} />
            <ResultRow label="Odzyskane (typowo)" value={formatMoney(metrics.recoveredTypical)} />
            <ResultRow
              label="Odzyskane (zakres)"
              value={`${formatMoney(metrics.recoveredMin)} - ${formatMoney(metrics.recoveredMax)}`}
            />

            <View style={styles.divider} />

            <Text style={styles.contextTitle}>Kontekst strat historycznych (szacunek)</Text>
            <ResultRow label="Strata historyczna (typowo)" value={formatMoney(metrics.historyTypical)} />
            <ResultRow
              label="Strata historyczna (zakres)"
              value={`${formatMoney(metrics.historyMin)} - ${formatMoney(metrics.historyMax)}`}
            />
            <ResultRow label="W tym pobyty i interwencje" value={formatMoney(metrics.interventionsTotal)} />

            {!metrics.hasAnyInput ? (
              <Text style={styles.emptyHint}>Wpisz przynajmniej jeden koszt, aby zobaczyć wynik.</Text>
            ) : null}

            <Text style={styles.disclaimer}>
              To narzędzie jest orientacyjne. Jego celem jest wzmocnienie sprawczości i decyzji o zdrowieniu.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.btnPrimary, busy && styles.btnDisabled]} disabled={busy} onPress={() => void onSave()}>
              <Text style={styles.btnPrimaryText}>{busy ? 'Zapisywanie...' : 'Zapisz szacunki'}</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={onReset}>
              <Text style={styles.btnSecondaryText}>Wyczyść</Text>
            </Pressable>
            <Pressable style={styles.btnSupport} onPress={() => router.push('/wsparcie-kontakt')}>
              <Text style={styles.btnSupportText}>Potrzebujesz wsparcia? Otwórz Kontakt</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: 'relative' },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,199,217,0.11)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(120,200,255,0.09)',
    bottom: 120,
    left: -80,
  },
  title: { color: 'white', fontSize: 33, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: 'rgba(232,245,255,0.84)', fontSize: 16, lineHeight: 24, marginBottom: 14 },
  card: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  resultCard: {
    borderColor: 'rgba(255,209,138,0.52)',
  },
  cardWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  cardHint: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cardInlineBlock: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    marginBottom: 10,
  },
  inlineTitle: { color: 'white', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inlineRow: { flexDirection: 'row', gap: 8 },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: 'white',
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inlineHint: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 8, lineHeight: 17 },
  categoryCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    marginBottom: 8,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  categoryTitle: { color: 'white', fontSize: 16, fontWeight: '700', flex: 1 },
  categoryChevron: { color: '#FFD18A', fontSize: 18, fontWeight: '700' },
  categoryHelp: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 17, marginTop: 8, marginBottom: 8 },
  interventionGridHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  interventionHeaderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', flex: 1 },
  interventionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  interventionAreaCol: { flex: 1.6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLabel: { color: 'white', fontSize: 13, fontWeight: '600', flex: 1 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputSpacer: { flex: 1 },
  rowHint: { color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: -2, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  segmentBtnActive: {
    borderColor: 'rgba(255,199,217,0.7)',
    backgroundColor: 'rgba(255,199,217,0.22)',
  },
  segmentText: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: 'white' },
  positiveTitle: { color: '#9EF3C7', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  contextTitle: { color: '#FFD18A', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  resultLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 13, flex: 1 },
  resultValue: { color: 'white', fontSize: 14, fontWeight: '700' },
  divider: {
    marginVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  emptyHint: { marginTop: 4, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  disclaimer: { marginTop: 10, color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 18 },
  actions: { marginTop: 2, gap: 8 },
  btnPrimary: {
    backgroundColor: 'rgba(255,199,217,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,217,0.7)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecondaryText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  btnSupport: {
    backgroundColor: 'rgba(126,216,190,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(126,216,190,0.55)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSupportText: { color: '#D9FFF1', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.65 },
});
