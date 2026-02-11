import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { DAILY_TEXTS_STORAGE_KEY, DailyTextId, DailyTextsPayload, EMPTY_DAILY_TEXTS } from '@/constants/daily-texts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from 'react-native';

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
  dateKey: string;
  self: string;
  duties: string;
  relations: string;
  challenge: string;
  done: DoneState;
  halt: HaltState;
  summarized: boolean;
};

type ArchiveEntry = {
  dateKey: string;
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

const STORAGE_KEY = '@daily_task';
const ARCHIVE_KEY = '@daily_task_archive';
const BG = '#071826';
const SUB = 'rgba(255,255,255,0.7)';
const PLAN_INSTRUCTION_CO =
  'Plan dnia to jedno z najważniejszych narzędzi zdrowienia. Pomaga świadomie zaplanować dzień, a wieczorem dokonać rozliczenia i wyciągnąć wnioski. To kluczowy element budowania zdrowych nawyków i stopniowego wychodzenia z trudności.';
const PLAN_INSTRUCTION_JAK =
  'Rano wybierasz 3 obszary, na których chcesz się skupić danego dnia (np. dla siebie, obowiązki, relacje) oraz jedno dodatkowe wyzwanie (challenge). Wieczorem zaznaczasz, co udało się zrealizować, a co nie, i uzupełniasz HALT (czy byłeś głodny, zły, samotny lub zmęczony). Na koniec klikasz "Podsumuj dzień" i zapisujesz swoje doświadczenie w archiwum.';
function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function emptyPlan(dateKey: string): DailyPlan {
  return {
    dateKey,
    self: '',
    duties: '',
    relations: '',
    challenge: '',
    done: { self: false, duties: false, relations: false, challenge: false },
    halt: { hungry: false, angry: false, lonely: false, tired: false },
    summarized: false,
  };
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
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getDateKey(today), [today]);
  const [plan, setPlan] = useState<DailyPlan>(emptyPlan(todayKey));
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(true);
  const [readDone, setReadDone] = useState<Record<DailyTextId, boolean>>(EMPTY_DAILY_TEXTS);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(true);
  const [summary, setSummary] = useState<{ emoji: string; message: string; score: number; completedCount: number; readCount: number; haltCount: number }>({
    emoji: '🙂',
    message: '',
    score: 0,
    completedCount: 0,
    readCount: 0,
    haltCount: 0,
  });
  const summaryTone = useMemo(() => {
    if (summary.score >= 4) return { accent: '#69D26D', label: 'Dobra robota' };
    if (summary.score >= 2) return { accent: '#78C8FF', label: 'Solidny dzień' };
    if (summary.score >= 1) return { accent: '#FFC966', label: 'Jest progres' };
    return { accent: '#FF8B8B', label: 'Jutro nowa próba' };
  }, [summary.score]);

  useEffect(() => {
    void loadAll();
  }, [todayKey]);

  useFocusEffect(
    React.useCallback(() => {
      void loadDailyTexts();
    }, [todayKey])
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadAll = async () => {
    await Promise.all([loadPlan(), loadArchive(), loadDailyTexts()]);
  };

  const loadDailyTexts = async () => {
    try {
      const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
      if (!raw) {
        setReadDone(EMPTY_DAILY_TEXTS);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        setReadDone(EMPTY_DAILY_TEXTS);
        return;
      }
      const value = parsed as Partial<DailyTextsPayload>;
      if (value.dateKey !== todayKey || !value.done || typeof value.done !== 'object') {
        setReadDone(EMPTY_DAILY_TEXTS);
        return;
      }
      setReadDone({ ...EMPTY_DAILY_TEXTS, ...(value.done as Partial<Record<DailyTextId, boolean>>) });
    } catch (e) {
      console.error('Błąd odczytu tekstów codziennych:', e);
      setReadDone(EMPTY_DAILY_TEXTS);
    }
  };

  const loadPlan = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setPlan(emptyPlan(todayKey));
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        setPlan(emptyPlan(todayKey));
        return;
      }

      const value = parsed as Partial<DailyPlan>;
      if (value.dateKey !== todayKey) {
        setPlan(emptyPlan(todayKey));
        return;
      }

      const halt = value.halt && typeof value.halt === 'object'
        ? {
            hungry: Boolean((value.halt as Partial<HaltState>).hungry),
            angry: Boolean((value.halt as Partial<HaltState>).angry),
            lonely: Boolean((value.halt as Partial<HaltState>).lonely),
            tired: Boolean((value.halt as Partial<HaltState>).tired),
          }
        : { hungry: false, angry: false, lonely: false, tired: false };

      const done = value.done && typeof value.done === 'object'
        ? {
            self: Boolean((value.done as Partial<DoneState>).self),
            duties: Boolean((value.done as Partial<DoneState>).duties),
            relations: Boolean((value.done as Partial<DoneState>).relations),
            challenge: Boolean((value.done as Partial<DoneState>).challenge),
          }
        : { self: false, duties: false, relations: false, challenge: false };

      setPlan({
        dateKey: todayKey,
        self: typeof value.self === 'string' ? value.self : '',
        duties: typeof value.duties === 'string' ? value.duties : '',
        relations: typeof value.relations === 'string' ? value.relations : '',
        challenge: typeof value.challenge === 'string' ? value.challenge : '',
        done,
        halt,
        summarized: Boolean(value.summarized),
      });
    } catch (e) {
      console.error('Błąd odczytu planu dnia:', e);
      setPlan(emptyPlan(todayKey));
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

  const savePlan = async (next: DailyPlan) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Błąd zapisu planu dnia:', e);
    }
  };

  const saveArchiveEntry = async (entry: ArchiveEntry) => {
    try {
      const existing = archive.filter((x) => x.dateKey !== entry.dateKey);
      const next = [entry, ...existing].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
      setArchive(next);
      await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Błąd zapisu archiwum:', e);
    }
  };

  const updateText = (key: 'self' | 'duties' | 'relations' | 'challenge', value: string) => {
    const next = { ...plan, [key]: value };
    setPlan(next);
    void savePlan(next);
  };

  const toggleDone = (key: keyof DoneState) => {
    const next = { ...plan, done: { ...plan.done, [key]: !plan.done[key] } };
    setPlan(next);
    void savePlan(next);
  };

  const toggleHalt = (key: keyof HaltState) => {
    const next = { ...plan, halt: { ...plan.halt, [key]: !plan.halt[key] } };
    setPlan(next);
    void savePlan(next);
  };

  const completedCount = Object.values(plan.done).filter(Boolean).length;
  const readCount = Object.values(readDone).filter(Boolean).length;
  const haltCount = Object.values(plan.halt).filter(Boolean).length;
  const evalResult = evaluateDay(completedCount, readCount, haltCount);

  const summarizeDay = async () => {
    const res = evaluateDay(completedCount, readCount, haltCount);
    const entry: ArchiveEntry = {
      dateKey: plan.dateKey,
      self: plan.self,
      duties: plan.duties,
      relations: plan.relations,
      challenge: plan.challenge,
      done: plan.done,
      halt: plan.halt,
      completedCount,
      readCount,
      haltCount,
      score: res.score,
      emoji: res.emoji,
      message: res.message,
      createdAt: new Date().toISOString(),
    };

    await saveArchiveEntry(entry);

    const nextPlan = emptyPlan(todayKey);
    setPlan(nextPlan);
    await savePlan(nextPlan);

    setSummary({ emoji: res.emoji, message: res.message, score: res.score, completedCount, readCount, haltCount });
    setSummaryModalOpen(true);
  };

  const toggleInstruction = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInstructionOpen((prev) => !prev);
  };

  const eveningReminder = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19 && !plan.summarized;
  }, [plan.summarized]);

  const weekPoints = useMemo(() => {
    const map = new Map(archive.map((a) => [a.dateKey, a.score]));
    return weekDates(today).map((d) => {
      const key = getDateKey(d);
      const score = map.get(key) ?? (key === todayKey ? evalResult.score : 0);
      return { label: dayShort(d), score };
    });
  }, [archive, evalResult.score, today, todayKey]);

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plan dnia</Text>
        <Text style={styles.dateLabel}>Dzisiaj: {todayKey}</Text>
        <View style={styles.instructionsWrap}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsHeaderTitle}>Instrukcja planu dnia</Text>
            <Pressable style={styles.instructionsToggleBtn} onPress={toggleInstruction}>
              <Text style={styles.instructionsToggleText}>{instructionOpen ? 'Ukryj instrukcję' : 'Pokaż instrukcję'}</Text>
            </Pressable>
          </View>
          {instructionOpen && (
            <View style={styles.instructionsBody}>
              <Text style={styles.instructionsSectionTitle}>Co?</Text>
              <Text style={styles.instructions}>{PLAN_INSTRUCTION_CO}</Text>

              <Text style={styles.instructionsSectionTitle}>Jak?</Text>
              <Text style={styles.instructions}>{PLAN_INSTRUCTION_JAK}</Text>
            </View>
          )}
        </View>

        {eveningReminder && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Wieczorne przypomnienie</Text>
            <Text style={styles.reminderText}>To dobry moment, żeby uzupełnić HALT i kliknąć „Podsumuj dzień”.</Text>
          </View>
        )}

        <View style={styles.dailyTextsCard}>
          <Text style={styles.dailyTextsTitle}>Teksty codzienne - dziś przeczytane</Text>
          <Text style={styles.dailyTextsValue}>{readCount}/4</Text>
          <Text style={styles.dailyTextsSub}>Każde zaznaczenie „Przeczytałem” daje +1 do bilansu dnia.</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Twój plan na dziś</Text>

          <Pressable style={styles.previewItem} onPress={() => toggleDone('self')}>
            <Text style={styles.previewCheck}>{plan.done.self ? '☑' : '☐'}</Text>
            <Text style={[styles.previewLine, plan.done.self && styles.previewLineDone]}>1. Dla siebie: {plan.self || '—'}</Text>
          </Pressable>
          <Pressable style={styles.previewItem} onPress={() => toggleDone('duties')}>
            <Text style={styles.previewCheck}>{plan.done.duties ? '☑' : '☐'}</Text>
            <Text style={[styles.previewLine, plan.done.duties && styles.previewLineDone]}>2. Obowiązki: {plan.duties || '—'}</Text>
          </Pressable>
          <Pressable style={styles.previewItem} onPress={() => toggleDone('relations')}>
            <Text style={styles.previewCheck}>{plan.done.relations ? '☑' : '☐'}</Text>
            <Text style={[styles.previewLine, plan.done.relations && styles.previewLineDone]}>3. Relacje: {plan.relations || '—'}</Text>
          </Pressable>
          <Pressable style={styles.previewItem} onPress={() => toggleDone('challenge')}>
            <Text style={styles.previewCheck}>{plan.done.challenge ? '☑' : '☐'}</Text>
            <Text style={[styles.previewLine, plan.done.challenge && styles.previewLineDone]}>
              4. Extra (challenge): {plan.challenge || '—'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>TRZY OBSZARY DNIA + EXTRA</Text>

          <Text style={styles.fieldLabel}>1. Dla siebie</Text>
          <TextInput
            style={styles.input}
            value={plan.self}
            placeholder="Np. spacer, modlitwa, dziennik, rozmowa"
            placeholderTextColor="rgba(255,255,255,0.45)"
            onChangeText={(v) => updateText('self', v)}
          />

          <Text style={styles.fieldLabel}>2. Obowiązki</Text>
          <TextInput
            style={styles.input}
            value={plan.duties}
            placeholder="Np. praca, dom, terapia"
            placeholderTextColor="rgba(255,255,255,0.45)"
            onChangeText={(v) => updateText('duties', v)}
          />

          <Text style={styles.fieldLabel}>3. Relacje</Text>
          <TextInput
            style={styles.input}
            value={plan.relations}
            placeholder="Np. kontakt z kimś, granice, wsparcie"
            placeholderTextColor="rgba(255,255,255,0.45)"
            onChangeText={(v) => updateText('relations', v)}
          />

          <Text style={styles.fieldLabel}>4. Extra (challenge)</Text>
          <TextInput
            style={styles.input}
            value={plan.challenge}
            placeholder="Jedno wyzwanie na dziś"
            placeholderTextColor="rgba(255,255,255,0.45)"
            onChangeText={(v) => updateText('challenge', v)}
          />
        </View>

        <View style={styles.haltCard}>
          <Text style={styles.sectionTitle}>HALT - rozliczenie dnia</Text>
          <Text style={styles.haltIntro}>Dziś byłem:</Text>

          <Pressable style={styles.haltItem} onPress={() => toggleHalt('hungry')}>
            <Text style={styles.haltCheck}>{plan.halt.hungry ? '☑' : '☐'}</Text>
            <Text style={styles.haltText}>Głodny</Text>
          </Pressable>
          <Pressable style={styles.haltItem} onPress={() => toggleHalt('angry')}>
            <Text style={styles.haltCheck}>{plan.halt.angry ? '☑' : '☐'}</Text>
            <Text style={styles.haltText}>Zezłoszczony</Text>
          </Pressable>
          <Pressable style={styles.haltItem} onPress={() => toggleHalt('lonely')}>
            <Text style={styles.haltCheck}>{plan.halt.lonely ? '☑' : '☐'}</Text>
            <Text style={styles.haltText}>Samotny</Text>
          </Pressable>
          <Pressable style={styles.haltItem} onPress={() => toggleHalt('tired')}>
            <Text style={styles.haltCheck}>{plan.halt.tired ? '☑' : '☐'}</Text>
            <Text style={styles.haltText}>Zmęczony</Text>
          </Pressable>
        </View>

        <Pressable style={styles.summaryButton} onPress={summarizeDay}>
          <Text style={styles.summaryButtonText}>Podsumuj dzień</Text>
        </Pressable>

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
                <View key={item.dateKey} style={styles.archiveCard}>
                  <View style={styles.archiveTop}>
                    <Text style={styles.archiveDate}>{item.dateKey}</Text>
                    <Text style={styles.archiveEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={styles.archiveScore}>Wynik: {item.score}</Text>
                  <Text style={styles.archiveMsg}>{item.message}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <WeeklyLineChart points={weekPoints} />
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
  dateLabel: { color: '#78C8FF', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  instructionsWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 12,
    marginBottom: 18,
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
  instructionsBody: { marginTop: 12, gap: 6 },
  instructionsSectionTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 },
  instructions: { color: SUB, fontSize: 18, lineHeight: 27 },

  reminderCard: {
    backgroundColor: 'rgba(120,200,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  reminderTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 3 },
  reminderText: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22 },
  dailyTextsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 12,
    marginBottom: 14,
  },
  dailyTextsTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  dailyTextsValue: { color: '#78C8FF', fontSize: 24, fontWeight: '900', marginTop: 4 },
  dailyTextsSub: { color: SUB, fontSize: 14, marginTop: 4 },

  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 14,
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

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: '#78C8FF', fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
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

  haltCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 14,
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

  summaryButton: {
    backgroundColor: '#3b5998',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryButtonText: { color: 'white', fontSize: 19, fontWeight: '700' },

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
