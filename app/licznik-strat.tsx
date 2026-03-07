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

type CategoryKey =
  | 'cigarettes'
  | 'vape'
  | 'alcohol'
  | 'drugs'
  | 'gambling'
  | 'otherCosts';

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
  gamblingMonthly: string;
  gamblingMonths: string;
  gamblingYears: string;
  centerStaysCount: string;
  centerStayCost: string;
  detoxStaysCount: string;
  detoxStayCost: string;
  soberingStaysCount: string;
  soberingStayCost: string;
  detentionStaysCount: string;
  detentionStayCost: string;
  hospitalStaysCount: string;
  hospitalStayCost: string;
  medsCrisisCost: string;
  jobLossCost: string;
  schoolLossCost: string;
  licenseLossCost: string;
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
  gamblingMonthly: '',
  gamblingMonths: '',
  gamblingYears: '',
  centerStaysCount: '',
  centerStayCost: '',
  detoxStaysCount: '',
  detoxStayCost: '',
  soberingStaysCount: '',
  soberingStayCost: '',
  detentionStaysCount: '',
  detentionStayCost: '',
  hospitalStaysCount: '',
  hospitalStayCost: '',
  medsCrisisCost: '',
  jobLossCost: '',
  schoolLossCost: '',
  licenseLossCost: '',
};

type LegacyLossInputs = Partial<
  LossInputs & {
    medsMonthly: string;
    medsMonths: string;
    medsYears: string;
    medsCrisisCount: string;
    jobLossCount: string;
    schoolLossCount: string;
    licenseLossCount: string;
  }
>;

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

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberToInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
}

function resolveLegacyTotalCost({
  totalRaw,
  countRaw,
  unitCostRaw,
}: {
  totalRaw?: string;
  countRaw?: string;
  unitCostRaw?: string;
}) {
  const count = parseNumber(countRaw ?? '');
  const unitCost = parseNumber(unitCostRaw ?? '');
  if (count > 0 && unitCost > 0) {
    return numberToInput(count * unitCost);
  }
  return asString(totalRaw);
}

function normalizeSavedInputs(saved: LegacyLossInputs): LossInputs {
  const legacyMedsTotal = parseNumber(asString(saved.medsMonthly)) * resolveMonths(asString(saved.medsMonths), asString(saved.medsYears));

  return {
    cigarettesMonthly: asString(saved.cigarettesMonthly),
    cigarettesMonths: asString(saved.cigarettesMonths),
    cigarettesYears: asString(saved.cigarettesYears),
    cigarettesPacksPerDay: asString(saved.cigarettesPacksPerDay),
    cigarettesPackPrice: asString(saved.cigarettesPackPrice),
    vapeMonthly: asString(saved.vapeMonthly),
    vapeMonths: asString(saved.vapeMonths),
    vapeYears: asString(saved.vapeYears),
    alcoholMonthly: asString(saved.alcoholMonthly),
    alcoholMonths: asString(saved.alcoholMonths),
    alcoholYears: asString(saved.alcoholYears),
    drugsMonthly: asString(saved.drugsMonthly),
    drugsMonths: asString(saved.drugsMonths),
    drugsYears: asString(saved.drugsYears),
    gamblingMonthly: asString(saved.gamblingMonthly),
    gamblingMonths: asString(saved.gamblingMonths),
    gamblingYears: asString(saved.gamblingYears),
    centerStaysCount: asString(saved.centerStaysCount),
    centerStayCost: asString(saved.centerStayCost),
    detoxStaysCount: asString(saved.detoxStaysCount),
    detoxStayCost: asString(saved.detoxStayCost),
    soberingStaysCount: asString(saved.soberingStaysCount),
    soberingStayCost: asString(saved.soberingStayCost),
    detentionStaysCount: asString(saved.detentionStaysCount),
    detentionStayCost: asString(saved.detentionStayCost),
    hospitalStaysCount: asString(saved.hospitalStaysCount),
    hospitalStayCost: asString(saved.hospitalStayCost),
    medsCrisisCost:
      resolveLegacyTotalCost({
        totalRaw: asString(saved.medsCrisisCost),
        countRaw: asString(saved.medsCrisisCount),
        unitCostRaw: asString(saved.medsCrisisCost),
      }) || numberToInput(legacyMedsTotal),
    jobLossCost: resolveLegacyTotalCost({
      totalRaw: asString(saved.jobLossCost),
      countRaw: asString(saved.jobLossCount),
      unitCostRaw: asString(saved.jobLossCost),
    }),
    schoolLossCost: resolveLegacyTotalCost({
      totalRaw: asString(saved.schoolLossCost),
      countRaw: asString(saved.schoolLossCount),
      unitCostRaw: asString(saved.schoolLossCost),
    }),
    licenseLossCost: resolveLegacyTotalCost({
      totalRaw: asString(saved.licenseLossCost),
      countRaw: asString(saved.licenseLossCount),
      unitCostRaw: asString(saved.licenseLossCost),
    }),
  };
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

export default function LicznikKosztowKryzysuScreen() {
  const insets = useSafeAreaInsets();
  const [inputs, setInputs] = useState<LossInputs>(DEFAULT_INPUTS);
  const [daysFromStart, setDaysFromStart] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openCategory, setOpenCategory] = useState<Record<CategoryKey, boolean>>({
    cigarettes: false,
    vape: false,
    alcohol: false,
    drugs: false,
    gambling: false,
    otherCosts: false,
  });

  useEffect(() => {
    const load = async () => {
      const [savedInputsRaw, startDateRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(START_DATE_STORAGE_KEY),
      ]);

      if (savedInputsRaw) {
        try {
          const parsed = JSON.parse(savedInputsRaw) as LegacyLossInputs;
          setInputs(normalizeSavedInputs(parsed));
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
    const gamblingMonthly = parseNumber(inputs.gamblingMonthly);
    const gamblingMonths = resolveMonths(inputs.gamblingMonths, inputs.gamblingYears);

    const centerStaysCount = parseNumber(inputs.centerStaysCount);
    const centerStayCost = parseNumber(inputs.centerStayCost);
    const detoxStaysCount = parseNumber(inputs.detoxStaysCount);
    const detoxStayCost = parseNumber(inputs.detoxStayCost);
    const soberingStaysCount = parseNumber(inputs.soberingStaysCount);
    const soberingStayCost = parseNumber(inputs.soberingStayCost);
    const detentionStaysCount = parseNumber(inputs.detentionStaysCount);
    const detentionStayCost = parseNumber(inputs.detentionStayCost);
    const hospitalStaysCount = parseNumber(inputs.hospitalStaysCount);
    const hospitalStayCost = parseNumber(inputs.hospitalStayCost);
    const medsCrisisCost = parseNumber(inputs.medsCrisisCost);
    const jobLossCost = parseNumber(inputs.jobLossCost);
    const schoolLossCost = parseNumber(inputs.schoolLossCost);
    const licenseLossCost = parseNumber(inputs.licenseLossCost);
    const interventionsTotal =
      centerStaysCount * centerStayCost +
      detoxStaysCount * detoxStayCost +
      soberingStaysCount * soberingStayCost +
      detentionStaysCount * detentionStayCost +
      hospitalStaysCount * hospitalStayCost;
    const additionalCrisisCostsTotal = medsCrisisCost + jobLossCost + schoolLossCost + licenseLossCost;

    const monthlyTotal =
      cigarettesMonthly +
      vapeMonthly +
      alcoholMonthly +
      drugsMonthly +
      gamblingMonthly;
    const dailyTotal = monthlyTotal / 30.4;
    const historyTypical =
      cigarettesMonthly * cigarettesMonths +
      vapeMonthly * vapeMonths +
      alcoholMonthly * alcoholMonths +
      drugsMonthly * drugsMonths +
      gamblingMonthly * gamblingMonths +
      interventionsTotal +
      additionalCrisisCostsTotal;
    const recoveredTypical = daysFromStart * dailyTotal;

    return {
      hasAnyInput: monthlyTotal > 0 || historyTypical > 0 || interventionsTotal > 0,
      monthlyTotal,
      dailyTotal,
      historyTypical,
      recoveredTypical,
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

  const renderInterventionRow = (params: {
    label: string;
    countKey: keyof LossInputs;
    costKey: keyof LossInputs;
    countPlaceholder: string;
    costPlaceholder: string;
  }) => (
    <View style={styles.interventionRow} key={params.label}>
      <Text style={[styles.inputLabel, styles.interventionAreaCol]}>{params.label}</Text>
      <TextInput
        value={String(inputs[params.countKey] ?? '')}
        onChangeText={(v) => setValue(params.countKey, v)}
        keyboardType="decimal-pad"
        placeholder={params.countPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={styles.input}
      />
      <TextInput
        value={String(inputs[params.costKey] ?? '')}
        onChangeText={(v) => setValue(params.costKey, v)}
        keyboardType="decimal-pad"
        placeholder={params.costPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={styles.input}
      />
    </View>
  );

  const renderTotalCostRow = (params: {
    label: string;
    costKey: keyof LossInputs;
    costPlaceholder: string;
  }) => (
    <View style={styles.singleCostRow} key={params.label}>
      <Text style={[styles.inputLabel, styles.interventionAreaCol]}>{params.label}</Text>
      <TextInput
        value={String(inputs[params.costKey] ?? '')}
        onChangeText={(v) => setValue(params.costKey, v)}
        keyboardType="decimal-pad"
        placeholder={params.costPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={[styles.input, styles.singleCostInput]}
      />
    </View>
  );

  const renderRecurringCategory = (params: {
    keyName: Exclude<CategoryKey, 'otherCosts'>;
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
            <Text style={styles.rowHint}>
              Aby doliczyć koszt z przeszłości w tej kategorii, wpisz miesiące albo lata. Jeśli znasz tylko jedno z nich, to wystarczy.
            </Text>
          </>
        ) : null}
      </View>
    );
  };

  const renderOtherCostsCategory = () => {
    const isOpen = openCategory.otherCosts;

    return (
      <View style={styles.categoryCard} key="otherCosts">
        <Pressable style={styles.categoryHeader} onPress={() => toggleCategory('otherCosts')}>
          <Text style={styles.categoryTitle}>Inne koszty</Text>
          <Text style={styles.categoryChevron}>{isOpen ? '▾' : '▸'}</Text>
        </Pressable>
        {isOpen ? (
          <>
            <Text style={styles.categoryHelp}>Wpisz koszty jednorazowe, których nie było w innych kategoriach.</Text>

            <Text style={styles.categoryHelp}>Pobyty i interwencje kryzysowe</Text>
            <View style={styles.interventionGridHeader}>
              <Text style={[styles.interventionHeaderLabel, styles.interventionAreaCol]}>Obszar</Text>
              <Text style={styles.interventionHeaderLabel}>Liczba</Text>
              <Text style={styles.interventionHeaderLabel}>Koszt 1 pobytu</Text>
            </View>
            {renderInterventionRow({
              label: 'Ośrodki',
              countKey: 'centerStaysCount',
              costKey: 'centerStayCost',
              countPlaceholder: 'np. 2',
              costPlaceholder: 'np. 12000',
            })}
            {renderInterventionRow({
              label: 'Detoksy',
              countKey: 'detoxStaysCount',
              costKey: 'detoxStayCost',
              countPlaceholder: 'np. 3',
              costPlaceholder: 'np. 4500',
            })}
            {renderInterventionRow({
              label: 'Izby wytrzeźwień',
              countKey: 'soberingStaysCount',
              costKey: 'soberingStayCost',
              countPlaceholder: 'np. 4',
              costPlaceholder: 'np. 450',
            })}
            {renderInterventionRow({
              label: 'Izby zatrzymań',
              countKey: 'detentionStaysCount',
              costKey: 'detentionStayCost',
              countPlaceholder: 'np. 1',
              costPlaceholder: 'np. 900',
            })}
            {renderInterventionRow({
              label: 'Pobyty szpitalne',
              countKey: 'hospitalStaysCount',
              costKey: 'hospitalStayCost',
              countPlaceholder: 'np. 2',
              costPlaceholder: 'np. 8000',
            })}

            <Text style={styles.categoryHelp}>Leki</Text>
            <View style={styles.singleCostGridHeader}>
              <Text style={[styles.interventionHeaderLabel, styles.interventionAreaCol]}>Obszar</Text>
              <Text style={styles.interventionHeaderLabel}>Koszt łącznie</Text>
            </View>
            {renderTotalCostRow({
              label: 'Leki',
              costKey: 'medsCrisisCost',
              costPlaceholder: 'np. 1800',
            })}

            <Text style={styles.categoryHelp}>Koszty społeczne</Text>
            <View style={styles.singleCostGridHeader}>
              <Text style={[styles.interventionHeaderLabel, styles.interventionAreaCol]}>Obszar</Text>
              <Text style={styles.interventionHeaderLabel}>Koszt łącznie</Text>
            </View>
            {renderTotalCostRow({
              label: 'Strata pracy',
              costKey: 'jobLossCost',
              costPlaceholder: 'np. 7000',
            })}
            {renderTotalCostRow({
              label: 'Usunięcie ze szkoły',
              costKey: 'schoolLossCost',
              costPlaceholder: 'np. 5000',
            })}
            {renderTotalCostRow({
              label: 'Strata prawa jazdy',
              costKey: 'licenseLossCost',
              costPlaceholder: 'np. 4000',
            })}
            <Text style={styles.rowHint}>
              Pobyty policz jako liczbę razy koszt jednego pobytu. Przy lekach i kosztach społecznych wpisz od razu łączną kwotę.
            </Text>
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
      console.error('Błąd zapisu licznika kosztów kryzysu:', e);
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
          <Text style={styles.title}>Licznik kosztów kryzysu</Text>
          <Text style={styles.subtitle}>Ten licznik pomaga orientacyjnie oszacować koszt okresu kryzysu oraz to, ile udało się odzyskać od startu zdrowienia.</Text>

          <CoJakSection
            title="Opis i instrukcja"
            co="To orientacyjny szacunek kosztów kryzysu, a także kosztów poniesionych w związku z jego rozwojem w poszczególnych obszarach objawów i zachowań. Pokazuje też szacunkowe i orientacyjne rekompensaty od rozpoczęcia procesu zdrowienia, momentu podjęcia decyzji o zmianie Twojego życia. Nie jest to dokładne rozliczenie ani formalna podstawa do decyzji finansowych, prawnych czy medycznych."
            jak="Uzupełnij tylko te obszary, które Cię dotyczą. W kategoriach miesięcznych wpisz koszt i czas trwania. Szczegółowe podpowiedzi i przykłady znajdziesz po rozwinięciu kafli."
          />

          <View style={styles.card}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <Text style={styles.cardHint}>Rozwiń tylko te kategorie, które Cię dotyczą, i wpisz wartości orientacyjne.</Text>

            {renderRecurringCategory({
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
            {renderRecurringCategory({
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
            {renderRecurringCategory({
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
            {renderRecurringCategory({
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
            {renderRecurringCategory({
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
            {renderOtherCostsCategory()}
          </View>

          <View style={[styles.card, styles.resultCard]}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <Text style={styles.contextTitle}>Całość poniesionych kosztów</Text>
            <ResultRow label="Razem" value={formatMoney(metrics.historyTypical)} />

            <View style={styles.divider} />

            <Text style={styles.positiveTitle}>Do dziś, dzięki zdrowieniu udało Ci się zrekompensować</Text>
            <ResultRow label="Razem" value={formatMoney(metrics.recoveredTypical)} />

            <Text style={styles.resultNote}>
              To są dane szacunkowe. Mają pomóc zobaczyć skalę kosztów i odzysku, ale nie są dokładnym rozliczeniem ani formalną podstawą do decyzji finansowych, prawnych czy medycznych.
            </Text>

            {!metrics.hasAnyInput ? (
              <Text style={styles.emptyHint}>Wpisz przynajmniej jeden koszt, żeby zobaczyć prosty wynik.</Text>
            ) : null}

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
  singleCostGridHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  interventionHeaderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', flex: 1 },
  interventionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  singleCostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
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
  singleCostInput: { flex: 1.2 },
  inputSpacer: { flex: 1 },
  rowHint: { color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: -2, marginBottom: 8 },
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
  resultNote: { marginTop: 8, color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 17 },
  emptyHint: { marginTop: 4, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
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
