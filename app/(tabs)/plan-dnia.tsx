import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { getLocalDateKey, type DateKey } from '@/constants/calendar';
import {
  DAILY_TEXTS_STORAGE_KEY,
  createEmptyDailyTextsStore,
  getDailyTextsForDate,
  parseDailyTextsStore,
  type DailyTextsStore,
} from '@/constants/daily-texts';
import { DEFAULT_APP_SETTINGS, loadAppSettings } from '@/hooks/useAppSettings';
import { notifyDataChanged, subscribeSync } from '@/hooks/recoverySyncEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type HaltState = {
  hungry: boolean;
  angry: boolean;
  lonely: boolean;
  tired: boolean;
};

type DoneState = {
  self: boolean;
  duties: boolean;
  relations: boolean;
  challenge: boolean;
};

type DailyPlan = {
  dateKey: DateKey;
  self: string;
  duties: string;
  relations: string;
  challenge: string;
  done: DoneState;
  halt: HaltState;
  summarized: boolean;
  morningConfirmed: boolean;
};

type PlanStore = Record<DateKey, DailyPlan>;

type ArchiveEntry = {
  dateKey: DateKey;
  self: string;
  duties: string;
  relations: string;
  challenge: string;
  done: DoneState;
  halt: HaltState;
  completedCount: number;
  readCount: number;
  haltCount: number;
  score: number;
  emoji: string;
  message: string;
  createdAt: string;
};

type DayViewMode = 'plan' | 'summary';
type CalendarDisplayMode = 'week' | 'month';

type EditablePlanField = 'self' | 'duties' | 'relations' | 'challenge';

const STORAGE_KEY = '@daily_task';
const ARCHIVE_KEY = '@daily_task_archive';
const BG = '#071826';
const SUB = 'rgba(255,255,255,0.7)';
const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const PLAN_INSTRUCTION_CO =
  'Wybierasz dzień z kalendarza i planujesz 3 obszary + 1 dodatkowy element. Wieczorem wracasz do tego samego dnia, potwierdzasz wykonanie i uzupełniasz HALT.';
const PLAN_INSTRUCTION_JAK =
  'Kliknij datę, wpisz plan i zapisz. Wieczorem otwórz ten sam dzień, zaznacz, co się udało, wpisz HALT i zapisz do archiwum. Archiwum buduje wykres linii.';
const PLAN_INSTRUCTION_SHORT =
  'Zaplanuj dzień, wykonaj plan, podsumuj i ucz się na przyszłość. To prosta praktyka, która może pomóc Ci lepiej rozumieć siebie i swoje nawyki.';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthGridDates(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDatesFrom(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function titleCase(value: string) {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function emptyPlan(dateKey: DateKey): DailyPlan {
  return {
    dateKey,
    self: '',
    duties: '',
    relations: '',
    challenge: '',
    done: { self: false, duties: false, relations: false, challenge: false },
    halt: { hungry: false, angry: false, lonely: false, tired: false },
    summarized: false,
    morningConfirmed: false,
  };
}

function hasPlanContent(plan: DailyPlan) {
  return [plan.self, plan.duties, plan.relations, plan.challenge].some((x) => x.trim().length > 0);
}

function sanitizePlan(value: Partial<DailyPlan> | undefined, dateKey: DateKey): DailyPlan {
  const halt =
    value?.halt && typeof value.halt === 'object'
      ? {
          hungry: Boolean((value.halt as Partial<HaltState>).hungry),
          angry: Boolean((value.halt as Partial<HaltState>).angry),
          lonely: Boolean((value.halt as Partial<HaltState>).lonely),
          tired: Boolean((value.halt as Partial<HaltState>).tired),
        }
      : { hungry: false, angry: false, lonely: false, tired: false };

  const done =
    value?.done && typeof value.done === 'object'
      ? {
          self: Boolean((value.done as Partial<DoneState>).self),
          duties: Boolean((value.done as Partial<DoneState>).duties),
          relations: Boolean((value.done as Partial<DoneState>).relations),
          challenge: Boolean((value.done as Partial<DoneState>).challenge),
        }
      : { self: false, duties: false, relations: false, challenge: false };

  return {
    dateKey,
    self: typeof value?.self === 'string' ? value.self : '',
    duties: typeof value?.duties === 'string' ? value.duties : '',
    relations: typeof value?.relations === 'string' ? value.relations : '',
    challenge: typeof value?.challenge === 'string' ? value.challenge : '',
    done,
    halt,
    summarized: Boolean(value?.summarized),
    morningConfirmed: Boolean(value?.morningConfirmed),
  };
}

function parsePlanStore(raw: unknown, fallbackDateKey: DateKey): PlanStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  if ('dateKey' in raw) {
    const legacy = raw as Partial<DailyPlan>;
    const legacyDate = typeof legacy.dateKey === 'string' ? (legacy.dateKey as DateKey) : fallbackDateKey;
    const migrated = sanitizePlan(legacy, legacyDate);
    return { [legacyDate]: migrated };
  }

  const out: PlanStore = {};
  for (const [dateKey, planValue] of Object.entries(raw)) {
    if (!planValue || typeof planValue !== 'object') {
      continue;
    }
    out[dateKey] = sanitizePlan(planValue as Partial<DailyPlan>, dateKey);
  }

  return out;
}

function evaluateDay(completedCount: number, readCount: number, haltCount: number) {
  const score = completedCount + readCount - haltCount * 2;
  if (score >= 6) return { score, emoji: '😁', message: 'Dobra robota! Świetnie domknąłeś dzień.' };
  if (score >= 3) return { score, emoji: '😊', message: 'Dobra robota. To był solidny dzień.' };
  if (score === 1) return { score, emoji: '🙂', message: 'Jest progres. Krok po kroku.' };
  return { score, emoji: '🤔', message: 'Hmmm... no cóż, czasem tak bywa.' };
}

function weekDates(today = new Date()) {
  const out: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

function dayShort(date: Date) {
  return date.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '');
}

function WeeklyLineChart({ points }: { points: Array<{ label: string; score: number }> }) {
  const chartWidth = 300;
  const chartHeight = 132;
  const padX = 14;
  const padY = 16;
  const minScore = -4;
  const maxScore = 4;
  const plotW = chartWidth - padX * 2;
  const plotH = chartHeight - padY * 2;

  const xy = points.map((p, i) => {
    const x = padX + (plotW * i) / Math.max(1, points.length - 1);
    const normalized = (p.score - minScore) / (maxScore - minScore);
    const y = chartHeight - padY - normalized * plotH;
    return { ...p, x, y };
  });

  return (
    <View style={styles.chartWrap}>
      <Text style={styles.chartTitle}>Tygodniowy wykres realizacji</Text>
      <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}> 
        <View style={[styles.chartAxis, { left: padX, right: padX, top: chartHeight / 2 }]} />

        {xy.slice(0, -1).map((p, i) => {
          const p2 = xy[i + 1];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <View
              key={`seg-${p.label}-${i}`}
              style={{
                position: 'absolute',
                left: (p.x + p2.x) / 2 - length / 2,
                top: (p.y + p2.y) / 2 - 1,
                width: length,
                height: 2,
                backgroundColor: '#78C8FF',
                transform: [{ rotateZ: `${angle}rad` }],
              }}
            />
          );
        })}

        {xy.map((p) => (
          <View key={`pt-${p.label}-${p.score}`} style={[styles.chartPoint, { left: p.x - 4, top: p.y - 4 }]} />
        ))}
      </View>

      <View style={styles.chartLabelsRow}>
        {xy.map((p) => (
          <View key={`lbl-${p.label}`} style={styles.chartLabelCell}>
            <Text style={styles.chartLabel}>{p.label}</Text>
            <Text style={styles.chartValue}>{p.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const [calendarNow, setCalendarNow] = useState(() => new Date());
  const [calendarDisplay, setCalendarDisplay] = useState<CalendarDisplayMode>(DEFAULT_APP_SETTINGS.planDefaultCalendarView);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<DateKey | null>(null);
  const [dayViewMode, setDayViewMode] = useState<DayViewMode>('plan');
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);
  const [planStore, setPlanStore] = useState<PlanStore>({});
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(true);
  const [textsStore, setTextsStore] = useState<DailyTextsStore>(createEmptyDailyTextsStore());
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [summary, setSummary] = useState<{ emoji: string; message: string; score: number; completedCount: number; readCount: number; haltCount: number }>({
    emoji: '🙂',
    message: '',
    score: 0,
    completedCount: 0,
    readCount: 0,
    haltCount: 0,
  });

  const todayKey = useMemo(() => getLocalDateKey(calendarNow), [calendarNow]);
  const tomorrowKey = useMemo(() => getLocalDateKey(addDays(calendarNow, 1)), [calendarNow]);
  const readDone = useMemo(() => getDailyTextsForDate(textsStore, todayKey), [textsStore, todayKey]);
  const monthLabel = useMemo(() => titleCase(viewMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })), [viewMonth]);
  const monthCells = useMemo(() => monthGridDates(viewMonth), [viewMonth]);
  const weekCells = useMemo(() => weekDatesFrom(weekAnchor), [weekAnchor]);
  const weekLabel = useMemo(() => {
    const first = weekCells[0];
    const last = weekCells[6];
    return `${first.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [weekCells]);

  const todayPlan = useMemo(() => planStore[todayKey] ?? emptyPlan(todayKey), [planStore, todayKey]);
  const archiveMap = useMemo(() => new Map(archive.map((entry) => [entry.dateKey, entry])), [archive]);

  const selectedPlan = useMemo(() => {
    if (!selectedDateKey) return null;
    return planStore[selectedDateKey] ?? emptyPlan(selectedDateKey);
  }, [planStore, selectedDateKey]);

  const selectedArchiveEntry = useMemo(() => {
    if (!selectedDateKey) return undefined;
    return archiveMap.get(selectedDateKey);
  }, [archiveMap, selectedDateKey]);

  const selectedHasPlan = useMemo(() => (selectedPlan ? hasPlanContent(selectedPlan) : false), [selectedPlan]);
  const selectedCanSummarize = useMemo(
    () => Boolean(selectedDateKey && selectedPlan && hasPlanContent(selectedPlan) && !selectedArchiveEntry),
    [selectedDateKey, selectedPlan, selectedArchiveEntry]
  );

  const summaryTone = useMemo(() => {
    if (summary.score >= 4) return { accent: '#69D26D', label: 'Dobra robota' };
    if (summary.score >= 2) return { accent: '#78C8FF', label: 'Solidny dzień' };
    if (summary.score >= 1) return { accent: '#FFC966', label: 'Jest progres' };
    return { accent: '#FF8B8B', label: 'Jutro nowa próba' };
  }, [summary.score]);

  const loadDailyTexts = async () => {
    try {
      const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
      if (!raw) {
        setTextsStore(createEmptyDailyTextsStore());
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      setTextsStore(parseDailyTextsStore(parsed));
    } catch (e) {
      console.error('Błąd odczytu tekstów codziennych:', e);
      setTextsStore(createEmptyDailyTextsStore());
    }
  };

  const loadPlans = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setPlanStore({});
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      const clean = parsePlanStore(parsed, todayKey);
      setPlanStore(clean);
    } catch (e) {
      console.error('Błąd odczytu planów dnia:', e);
      setPlanStore({});
    }
  };

  const loadArchive = async () => {
    try {
      const raw = await AsyncStorage.getItem(ARCHIVE_KEY);
      if (!raw) {
        setArchive([]);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setArchive([]);
        return;
      }
      const clean = parsed.filter((x) => x && typeof x === 'object') as ArchiveEntry[];
      clean.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
      setArchive(clean);
    } catch (e) {
      console.error('Błąd odczytu archiwum:', e);
      setArchive([]);
    }
  };

  const loadSettings = async () => {
    const settings = await loadAppSettings();
    setAppSettings(settings);
    setCalendarDisplay(settings.planDefaultCalendarView);
  };

  const loadAll = async () => {
    await Promise.all([loadPlans(), loadArchive(), loadDailyTexts(), loadSettings()]);
  };

  const refreshCoreData = async () => {
    await Promise.all([loadPlans(), loadArchive(), loadDailyTexts()]);
  };

  useEffect(() => {
    void loadAll();
  }, [todayKey]);

  useFocusEffect(
    React.useCallback(() => {
      const now = new Date();
      setCalendarNow(now);
      setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setWeekAnchor(now);
      void loadAll();
    }, [todayKey])
  );

  useEffect(() => {
    return subscribeSync(() => {
      void refreshCoreData();
    });
  }, [todayKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCalendarNow(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const savePlanStore = async (nextStore: PlanStore) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
      notifyDataChanged('plan');
    } catch (e) {
      console.error('Błąd zapisu planów dnia:', e);
    }
  };

  const patchPlan = (dateKey: DateKey, update: (current: DailyPlan) => DailyPlan) => {
    setPlanStore((prev) => {
      const current = prev[dateKey] ?? emptyPlan(dateKey);
      const next = sanitizePlan(update(current), dateKey);
      const nextStore = { ...prev, [dateKey]: next };
      void savePlanStore(nextStore);
      return nextStore;
    });
  };

  const saveArchiveEntry = async (entry: ArchiveEntry) => {
    try {
      const existing = archive.filter((x) => x.dateKey !== entry.dateKey);
      const next = [entry, ...existing].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
      setArchive(next);
      await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
      notifyDataChanged('plan');
    } catch (e) {
      console.error('Błąd zapisu archiwum:', e);
    }
  };

  const updateText = (dateKey: DateKey, key: EditablePlanField, value: string) => {
    patchPlan(dateKey, (current) => ({ ...current, [key]: value }));
  };

  const toggleDone = (dateKey: DateKey, key: keyof DoneState) => {
    patchPlan(dateKey, (current) => ({ ...current, done: { ...current.done, [key]: !current.done[key] } }));
  };

  const toggleHalt = (dateKey: DateKey, key: keyof HaltState) => {
    patchPlan(dateKey, (current) => ({ ...current, halt: { ...current.halt, [key]: !current.halt[key] } }));
  };

  const summarizeDay = async (dateKey: DateKey) => {
    const targetPlan = planStore[dateKey] ?? emptyPlan(dateKey);
    if (!hasPlanContent(targetPlan)) {
      return;
    }

    const completedCount = Object.values(targetPlan.done).filter(Boolean).length;
    const targetReadCount = Object.values(getDailyTextsForDate(textsStore, dateKey)).filter(Boolean).length;
    const haltCount = Object.values(targetPlan.halt).filter(Boolean).length;
    const res = evaluateDay(completedCount, targetReadCount, haltCount);

    const entry: ArchiveEntry = {
      dateKey: targetPlan.dateKey,
      self: targetPlan.self,
      duties: targetPlan.duties,
      relations: targetPlan.relations,
      challenge: targetPlan.challenge,
      done: targetPlan.done,
      halt: targetPlan.halt,
      completedCount,
      readCount: targetReadCount,
      haltCount,
      score: res.score,
      emoji: res.emoji,
      message: res.message,
      createdAt: new Date().toISOString(),
    };

    await saveArchiveEntry(entry);
    patchPlan(dateKey, (current) => ({ ...current, summarized: true }));

    setSummary({
      emoji: res.emoji,
      message: res.message,
      score: res.score,
      completedCount,
      readCount: targetReadCount,
      haltCount,
    });
    setSummaryModalOpen(true);
    setSelectedDateKey(null);
    setDayViewMode('plan');
  };

  const openDay = (dateKey: DateKey) => {
    const dayPlan = planStore[dateKey] ?? emptyPlan(dateKey);
    const archived = Boolean(archiveMap.get(dateKey)) || dayPlan.summarized;
    const evening = calendarNow.getHours() >= 19;
    const canOpenSummary = hasPlanContent(dayPlan) && !archived;

    setSelectedDateKey(dateKey);
    if (archived) {
      setDayViewMode('summary');
      return;
    }

    if (dateKey === todayKey && canOpenSummary && evening && appSettings.planAutoSwitchToSummaryEvening) {
      setDayViewMode('summary');
      return;
    }

    if (appSettings.planDefaultDayOpenMode === 'summary' && canOpenSummary) {
      setDayViewMode('summary');
      return;
    }

    setDayViewMode('plan');
  };

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const shiftWeek = (delta: number) => {
    setWeekAnchor((prev) => addDays(prev, delta * 7));
  };

  const getMarkerColor = (dateKey: DateKey) => {
    const dayPlan = planStore[dateKey];
    const hasPlan = Boolean(dayPlan && hasPlanContent(dayPlan));
    const archiveEntry = archiveMap.get(dateKey);
    if (!archiveEntry) {
      return hasPlan ? '#78C8FF' : 'transparent';
    }
    if (archiveEntry.score >= 3) return '#69D26D';
    if (archiveEntry.score >= 1) return '#FFC966';
    return '#FF8B8B';
  };

  const closeDayView = () => {
    setSelectedDateKey(null);
    setDayViewMode('plan');
  };

  const completedCountToday = Object.values(todayPlan.done).filter(Boolean).length;
  const readCountToday = Object.values(readDone).filter(Boolean).length;
  const haltCountToday = Object.values(todayPlan.halt).filter(Boolean).length;
  const evalResultToday = evaluateDay(completedCountToday, readCountToday, haltCountToday);
  const isTodaySummarized = todayPlan.summarized || archiveMap.has(todayKey);

  const weekPoints = useMemo(() => {
    const map = new Map(archive.map((a) => [a.dateKey, a.score]));
    return weekDates(calendarNow).map((d) => {
      const key = getLocalDateKey(d);
      const score = map.get(key) ?? (key === todayKey ? evalResultToday.score : 0);
      return { label: dayShort(d), score };
    });
  }, [archive, calendarNow, evalResultToday.score, todayKey]);

  const toggleInstruction = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInstructionOpen((prev) => !prev);
  };

  const renderPlanForm = (params: {
    dateKey: DateKey;
    plan: DailyPlan;
    title: string;
    subtitle: string;
    challengeLabel?: string;
  }) => (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>{params.title}</Text>
      <Text style={styles.formSubLabel}>{params.subtitle}</Text>
      <Text style={styles.formDateLabel}>Data planu: {params.dateKey}</Text>

      <Text style={styles.fieldLabel}>1. Dla siebie</Text>
      <TextInput
        style={styles.input}
        value={params.plan.self}
        placeholder="Np. spacer, modlitwa, dziennik"
        placeholderTextColor="rgba(255,255,255,0.45)"
        onChangeText={(v) => updateText(params.dateKey, 'self', v)}
      />

      <Text style={styles.fieldLabel}>2. Obowiązki</Text>
      <TextInput
        style={styles.input}
        value={params.plan.duties}
        placeholder="Np. praca, dom, terapia"
        placeholderTextColor="rgba(255,255,255,0.45)"
        onChangeText={(v) => updateText(params.dateKey, 'duties', v)}
      />

      <Text style={styles.fieldLabel}>3. Relacje</Text>
      <TextInput
        style={styles.input}
        value={params.plan.relations}
        placeholder="Np. kontakt, granice, wsparcie"
        placeholderTextColor="rgba(255,255,255,0.45)"
        onChangeText={(v) => updateText(params.dateKey, 'relations', v)}
      />

      <Text style={styles.fieldLabel}>{params.challengeLabel ?? '4. Extra (challenge)'}</Text>
      <TextInput
        style={styles.input}
        value={params.plan.challenge}
        placeholder="Jedno konkretne wyzwanie"
        placeholderTextColor="rgba(255,255,255,0.45)"
        onChangeText={(v) => updateText(params.dateKey, 'challenge', v)}
      />
    </View>
  );

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plan dnia</Text>
        <Text style={styles.dateLabel}>Dzisiaj: {todayKey}</Text>
        <Text style={styles.dateSubLabel}>Jutro: {tomorrowKey}</Text>

        <View style={styles.instructionsWrap}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsHeaderTitle}>Instrukcja planu dnia</Text>
            <Pressable style={styles.instructionsToggleBtn} onPress={toggleInstruction}>
              <Text style={styles.instructionsToggleText}>{instructionOpen ? 'Ukryj instrukcję' : 'Pokaż instrukcję'}</Text>
            </Pressable>
          </View>
          <Text style={styles.instructionsLead}>{PLAN_INSTRUCTION_SHORT}</Text>
          {instructionOpen && (
            <View style={styles.instructionsBody}>
              <Text style={styles.instructionsSectionTitle}>Co?</Text>
              <Text style={styles.instructions}>{PLAN_INSTRUCTION_CO}</Text>
              <Text style={styles.instructionsSectionTitle}>Jak?</Text>
              <Text style={styles.instructions}>{PLAN_INSTRUCTION_JAK}</Text>
            </View>
          )}
        </View>

        <View style={styles.calendarModeSwitch}>
          <Pressable
            style={[styles.calendarModeBtn, calendarDisplay === 'week' && styles.calendarModeBtnActive]}
            onPress={() => setCalendarDisplay('week')}
          >
            <Text style={[styles.calendarModeText, calendarDisplay === 'week' && styles.calendarModeTextActive]}>Tydzień</Text>
          </Pressable>
          <Pressable
            style={[styles.calendarModeBtn, calendarDisplay === 'month' && styles.calendarModeBtnActive]}
            onPress={() => setCalendarDisplay('month')}
          >
            <Text style={[styles.calendarModeText, calendarDisplay === 'month' && styles.calendarModeTextActive]}>Miesiąc</Text>
          </Pressable>
        </View>

        {calendarDisplay === 'week' ? (
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Pressable style={styles.monthNavBtn} onPress={() => shiftWeek(-1)}>
                <Text style={styles.monthNavText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{weekLabel}</Text>
              <Pressable style={styles.monthNavBtn} onPress={() => shiftWeek(1)}>
                <Text style={styles.monthNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekStrip}>
              {weekCells.map((date) => {
                const dateKey = getLocalDateKey(date);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDateKey;
                const markerColor = getMarkerColor(dateKey);
                return (
                  <Pressable
                    key={dateKey}
                    style={[styles.weekDayCell, isToday && styles.dayCellToday, isSelected && styles.dayCellSelected]}
                    hitSlop={4}
                    onPress={() => openDay(dateKey)}
                  >
                    <Text style={styles.weekDayName}>{dayShort(date)}</Text>
                    <Text style={styles.weekDayNumber}>{date.getDate()}</Text>
                    <View style={[styles.dayMarker, { backgroundColor: markerColor }]} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#78C8FF' }]} />
                <Text style={styles.legendText}>plan</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#69D26D' }]} />
                <Text style={styles.legendText}>dobry wynik</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF8B8B' }]} />
                <Text style={styles.legendText}>do poprawy</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Pressable style={styles.monthNavBtn} onPress={() => shiftMonth(-1)}>
                <Text style={styles.monthNavText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Pressable style={styles.monthNavBtn} onPress={() => shiftMonth(1)}>
                <Text style={styles.monthNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthCells.map((date) => {
                const dateKey = getLocalDateKey(date);
                const inCurrentMonth = date.getMonth() === viewMonth.getMonth();
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDateKey;
                const markerColor = getMarkerColor(dateKey);

                return (
                  <Pressable
                    key={dateKey}
                    style={[
                      styles.dayCell,
                      !inCurrentMonth && styles.dayCellMuted,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                    hitSlop={4}
                    onPress={() => openDay(dateKey)}
                  >
                    <Text style={[styles.dayCellText, !inCurrentMonth && styles.dayCellTextMuted]}>{date.getDate()}</Text>
                    <View style={[styles.dayMarker, { backgroundColor: markerColor }]} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#78C8FF' }]} />
                <Text style={styles.legendText}>plan</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#69D26D' }]} />
                <Text style={styles.legendText}>dobry wynik</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF8B8B' }]} />
                <Text style={styles.legendText}>do poprawy</Text>
              </View>
            </View>
          </View>
        )}

        {selectedDateKey && selectedPlan && (
          <View style={styles.dayViewCard}>
            <View style={styles.dayViewHeader}>
              <Text style={styles.dayViewTitle}>Dzień: {selectedDateKey}</Text>
              <Pressable onPress={closeDayView} style={styles.dayCloseBtn}>
                <Text style={styles.dayCloseText}>Zamknij</Text>
              </Pressable>
            </View>

            <View style={styles.dayModeSwitch}>
              <Pressable
                style={[styles.dayModeBtn, dayViewMode === 'plan' && styles.dayModeBtnActive]}
                onPress={() => setDayViewMode('plan')}
              >
                <Text style={[styles.dayModeBtnText, dayViewMode === 'plan' && styles.dayModeBtnTextActive]}>Plan</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dayModeBtn,
                  dayViewMode === 'summary' && styles.dayModeBtnActive,
                  !selectedHasPlan && !selectedArchiveEntry && styles.dayModeBtnDisabled,
                ]}
                onPress={() => setDayViewMode('summary')}
                disabled={!selectedHasPlan && !selectedArchiveEntry}
              >
                <Text style={[styles.dayModeBtnText, dayViewMode === 'summary' && styles.dayModeBtnTextActive]}>Podsumowanie</Text>
              </Pressable>
            </View>

            {dayViewMode === 'plan' && (
              <>
                {renderPlanForm({
                  dateKey: selectedDateKey,
                  plan: selectedPlan,
                  title: selectedHasPlan ? 'PLAN DNIA (3 + 1)' : 'USTAW PLAN DNIA (3 + 1)',
                  subtitle: 'Zaplanuj trzy rzeczy i jedną dodatkową.',
                })}

                <View style={styles.reminderCard}>
                  <Text style={styles.reminderTitle}>Po zapisaniu planu</Text>
                  <Text style={styles.reminderText}>Push: „Pamiętaj o HALT i przeczytaj teksty codzienne”.</Text>
                </View>

                <Pressable style={styles.primaryButton} onPress={closeDayView}>
                  <Text style={styles.primaryButtonText}>Zapisz plan i zamknij dzień</Text>
                </Pressable>

                {selectedDateKey === todayKey && selectedHasPlan && !selectedArchiveEntry && (
                  <Pressable style={styles.secondaryButton} onPress={() => setDayViewMode('summary')}>
                    <Text style={styles.secondaryButtonText}>Przejdź do wieczornego podsumowania</Text>
                  </Pressable>
                )}
              </>
            )}

            {dayViewMode === 'summary' && (
              <>
                {selectedArchiveEntry ? (
                  <View style={styles.archiveCard}>
                    <View style={styles.archiveTop}>
                      <Text style={styles.archiveDate}>{selectedArchiveEntry.dateKey}</Text>
                      <Text style={styles.archiveEmoji}>{selectedArchiveEntry.emoji}</Text>
                    </View>
                    <Text style={styles.archiveScore}>Wynik: {selectedArchiveEntry.score}</Text>
                    <Text style={styles.archiveMsg}>{selectedArchiveEntry.message}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.previewCard}>
                      <Text style={styles.previewTitle}>Potwierdź wykonanie</Text>

                      <Pressable style={styles.previewItem} onPress={() => toggleDone(selectedDateKey, 'self')}>
                        <Text style={styles.previewCheck}>{selectedPlan.done.self ? '☑' : '☐'}</Text>
                        <Text style={[styles.previewLine, selectedPlan.done.self && styles.previewLineDone]}>
                          1. {selectedPlan.self.trim() || 'Dla siebie'}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.previewItem} onPress={() => toggleDone(selectedDateKey, 'duties')}>
                        <Text style={styles.previewCheck}>{selectedPlan.done.duties ? '☑' : '☐'}</Text>
                        <Text style={[styles.previewLine, selectedPlan.done.duties && styles.previewLineDone]}>
                          2. {selectedPlan.duties.trim() || 'Obowiązki'}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.previewItem} onPress={() => toggleDone(selectedDateKey, 'relations')}>
                        <Text style={styles.previewCheck}>{selectedPlan.done.relations ? '☑' : '☐'}</Text>
                        <Text style={[styles.previewLine, selectedPlan.done.relations && styles.previewLineDone]}>
                          3. {selectedPlan.relations.trim() || 'Relacje'}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.previewItem} onPress={() => toggleDone(selectedDateKey, 'challenge')}>
                        <Text style={styles.previewCheck}>{selectedPlan.done.challenge ? '☑' : '☐'}</Text>
                        <Text style={[styles.previewLine, selectedPlan.done.challenge && styles.previewLineDone]}>
                          4. {selectedPlan.challenge.trim() || 'Extra (challenge)'}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.haltCard}>
                      <Text style={styles.sectionTitle}>HALT - rozliczenie dnia</Text>
                      <Text style={styles.haltIntro}>Dziś byłem:</Text>

                      <Pressable style={styles.haltItem} onPress={() => toggleHalt(selectedDateKey, 'hungry')}>
                        <Text style={styles.haltCheck}>{selectedPlan.halt.hungry ? '☑' : '☐'}</Text>
                        <Text style={styles.haltText}>Głodny</Text>
                      </Pressable>
                      <Pressable style={styles.haltItem} onPress={() => toggleHalt(selectedDateKey, 'angry')}>
                        <Text style={styles.haltCheck}>{selectedPlan.halt.angry ? '☑' : '☐'}</Text>
                        <Text style={styles.haltText}>Zezłoszczony</Text>
                      </Pressable>
                      <Pressable style={styles.haltItem} onPress={() => toggleHalt(selectedDateKey, 'lonely')}>
                        <Text style={styles.haltCheck}>{selectedPlan.halt.lonely ? '☑' : '☐'}</Text>
                        <Text style={styles.haltText}>Samotny</Text>
                      </Pressable>
                      <Pressable style={styles.haltItem} onPress={() => toggleHalt(selectedDateKey, 'tired')}>
                        <Text style={styles.haltCheck}>{selectedPlan.halt.tired ? '☑' : '☐'}</Text>
                        <Text style={styles.haltText}>Zmęczony</Text>
                      </Pressable>
                    </View>

                    {selectedDateKey === todayKey && (
                      <View style={styles.reminderCard}>
                        <Text style={styles.reminderTitle}>Teksty codzienne</Text>
                        <Text style={styles.reminderText}>Dziś przeczytane: {readCountToday}/4 (każde daje +1 do bilansu).</Text>
                      </View>
                    )}

                    <View style={styles.reminderCard}>
                      <Text style={styles.reminderTitle}>Wieczorne przypomnienie</Text>
                      <Text style={styles.reminderText}>Push: „Podsumuj swój dzień w Anioł Stróż”.</Text>
                    </View>

                    <Pressable
                      style={[styles.primaryButton, !selectedCanSummarize && styles.primaryButtonDisabled]}
                      onPress={() => summarizeDay(selectedDateKey)}
                      disabled={!selectedCanSummarize}
                    >
                      <Text style={styles.primaryButtonText}>Zapisz dzień do archiwum</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        )}

        <Pressable style={styles.archiveHeader} onPress={() => setArchiveOpen((v) => !v)}>
          <Text style={styles.archiveHeaderText}>Archiwum dni ({archive.length})</Text>
          <Text style={styles.archiveHeaderChevron}>{archiveOpen ? '▾' : '▸'}</Text>
        </Pressable>

        {archiveOpen && (
          <View style={styles.archiveList}>
            {archive.length === 0 ? (
              <Text style={styles.archiveEmpty}>Brak zapisanych dni.</Text>
            ) : (
              archive.map((item) => (
                <Pressable
                  key={item.dateKey}
                  style={styles.archiveCard}
                  onPress={() => {
                    setSelectedDateKey(item.dateKey);
                    setDayViewMode('summary');
                  }}
                >
                  <View style={styles.archiveTop}>
                    <Text style={styles.archiveDate}>{item.dateKey}</Text>
                    <Text style={styles.archiveEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={styles.archiveScore}>Wynik: {item.score}</Text>
                  <Text style={styles.archiveMsg}>{item.message}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        <WeeklyLineChart points={weekPoints} />

        {!isTodaySummarized && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Status dzisiaj</Text>
            <Text style={styles.reminderText}>
              Dziś: plan {hasPlanContent(todayPlan) ? 'ustawiony' : 'brak'} | wykonane {completedCountToday}/4 | HALT {haltCountToday} | bilans {evalResultToday.score}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={summaryModalOpen} transparent animationType="fade" onRequestClose={() => setSummaryModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderColor: summaryTone.accent }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>{summary.emoji}</Text>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Podsumowanie dnia</Text>
                <Text style={[styles.modalTag, { color: summaryTone.accent }]}>{summaryTone.label}</Text>
              </View>
            </View>

            <Text style={styles.modalText}>{summary.message}</Text>

            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatLabel}>Wykonane</Text>
                <Text style={styles.modalStatValue}>{summary.completedCount}</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatLabel}>Teksty</Text>
                <Text style={styles.modalStatValue}>{summary.readCount}</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatLabel}>HALT</Text>
                <Text style={styles.modalStatValue}>{summary.haltCount}</Text>
              </View>
              <View style={[styles.modalStatCard, styles.modalScoreCard, { borderColor: summaryTone.accent }]}> 
                <Text style={styles.modalStatLabel}>Bilans</Text>
                <Text style={[styles.modalScoreValue, { color: summaryTone.accent }]}>{summary.score}</Text>
              </View>
            </View>
            <Text style={styles.modalFormula}>
              Punkty: {summary.completedCount} (plan) + {summary.readCount} (teksty) - {summary.haltCount * 2} (HALT)
            </Text>

            <Pressable style={styles.modalBtn} onPress={() => setSummaryModalOpen(false)}>
              <Text style={styles.modalBtnText}>Zamknij</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 56, paddingBottom: 40 },
  title: { color: 'white', fontSize: 39, fontWeight: '900', marginBottom: 6 },
  dateLabel: { color: '#78C8FF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  dateSubLabel: { color: 'rgba(255,255,255,0.66)', fontSize: 14, fontWeight: '600', marginBottom: 12 },

  instructionsWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 12,
    marginBottom: 14,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  instructionsHeaderTitle: { color: 'white', fontSize: 17, fontWeight: '800' },
  instructionsToggleBtn: {
    backgroundColor: 'rgba(120,200,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  instructionsToggleText: { color: '#AEE1FF', fontSize: 13, fontWeight: '700' },
  instructionsLead: { color: SUB, fontSize: 15, lineHeight: 22, marginTop: 10 },
  instructionsBody: { marginTop: 12, gap: 6 },
  instructionsSectionTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 },
  instructions: { color: SUB, fontSize: 18, lineHeight: 27 },

  calendarModeSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  calendarModeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calendarModeBtnActive: {
    backgroundColor: 'rgba(120,200,255,0.22)',
    borderColor: 'rgba(120,200,255,0.5)',
  },
  calendarModeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarModeTextActive: {
    color: '#D8F1FF',
  },

  monthCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    padding: 12,
    marginBottom: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthTitle: { color: 'white', fontSize: 19, fontWeight: '800', textAlign: 'center', flex: 1 },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,200,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
  },
  monthNavText: { color: '#D8F1FF', fontSize: 22, fontWeight: '800', marginTop: -1 },
  weekStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    minHeight: 76,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.16)',
    backgroundColor: 'rgba(7,24,38,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  weekDayName: { color: 'rgba(255,255,255,0.76)', fontSize: 11, fontWeight: '700', marginBottom: 5 },
  weekDayNumber: { color: 'white', fontSize: 22, fontWeight: '800' },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.66)',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.16)',
    backgroundColor: 'rgba(7,24,38,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  dayCellMuted: {
    opacity: 0.5,
  },
  dayCellToday: {
    borderColor: '#78C8FF',
  },
  dayCellSelected: {
    backgroundColor: 'rgba(120,200,255,0.22)',
    borderColor: 'rgba(120,200,255,0.6)',
  },
  dayCellText: { color: 'white', fontSize: 14, fontWeight: '700' },
  dayCellTextMuted: { color: 'rgba(255,255,255,0.66)' },
  dayMarker: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: { color: 'rgba(255,255,255,0.74)', fontSize: 12, fontWeight: '600' },

  dayViewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    padding: 12,
    marginBottom: 14,
  },
  dayViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dayViewTitle: { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  dayCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    backgroundColor: 'rgba(120,200,255,0.16)',
  },
  dayCloseText: { color: '#AEE1FF', fontSize: 13, fontWeight: '700' },
  dayModeSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dayModeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayModeBtnActive: {
    backgroundColor: 'rgba(120,200,255,0.22)',
    borderColor: 'rgba(120,200,255,0.5)',
  },
  dayModeBtnDisabled: {
    opacity: 0.5,
  },
  dayModeBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
  },
  dayModeBtnTextActive: {
    color: '#D8F1FF',
  },

  reminderCard: {
    backgroundColor: 'rgba(120,200,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  reminderTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 3 },
  reminderText: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22 },

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { color: '#78C8FF', fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  formSubLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  formDateLabel: { color: 'rgba(120,200,255,0.9)', fontSize: 13, marginBottom: 8, fontWeight: '700' },
  fieldLabel: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(7, 24, 38, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.16)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 18,
  },

  primaryButton: {
    backgroundColor: '#3b5998',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: 'rgba(120,200,255,0.16)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.3)',
    marginBottom: 10,
  },
  secondaryButtonText: { color: '#D8F1FF', fontSize: 15, fontWeight: '700' },

  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 12,
  },
  previewTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  previewCheck: { color: '#78C8FF', fontSize: 22, width: 24 },
  previewLine: { color: SUB, fontSize: 18, lineHeight: 26, flex: 1 },
  previewLineDone: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.45)' },

  haltCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 12,
  },
  haltIntro: { color: SUB, fontSize: 18, marginBottom: 8 },
  haltItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  haltCheck: { color: '#78C8FF', fontSize: 22, width: 30 },
  haltText: { color: 'white', fontSize: 19 },

  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  archiveHeaderText: { color: 'white', fontSize: 18, fontWeight: '700' },
  archiveHeaderChevron: { color: '#78C8FF', fontSize: 20, fontWeight: '700' },
  archiveList: { marginBottom: 16 },
  archiveEmpty: { color: SUB, fontSize: 16, paddingVertical: 8 },
  archiveCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.14)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  archiveTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  archiveDate: { color: 'white', fontSize: 16, fontWeight: '700' },
  archiveEmoji: { fontSize: 22 },
  archiveScore: { color: '#78C8FF', fontSize: 15, marginTop: 4 },
  archiveMsg: { color: SUB, fontSize: 15, marginTop: 2 },

  chartWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  chartArea: {
    backgroundColor: 'rgba(7,24,38,0.55)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.15)',
  },
  chartAxis: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AEE1FF',
    borderWidth: 1,
    borderColor: '#78C8FF',
  },
  chartLabelsRow: { flexDirection: 'row', width: 300, marginTop: 8 },
  chartLabelCell: { flex: 1, alignItems: 'center' },
  chartLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  chartValue: { color: '#78C8FF', fontSize: 12, fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0A1D2D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.3)',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  modalEmoji: { fontSize: 44 },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: '800' },
  modalTag: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  modalText: { color: 'rgba(255,255,255,0.88)', fontSize: 18, lineHeight: 25, marginBottom: 12 },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  modalStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalScoreCard: {
    backgroundColor: 'rgba(120,200,255,0.08)',
  },
  modalStatLabel: {
    color: SUB,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalStatValue: { color: 'white', fontSize: 24, fontWeight: '800' },
  modalScoreValue: { fontSize: 26, fontWeight: '900' },
  modalFormula: { color: SUB, fontSize: 14, marginBottom: 10 },
  modalBtn: {
    marginTop: 2,
    backgroundColor: '#3b5998',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
