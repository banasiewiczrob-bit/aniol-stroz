import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  BASE_EMOTIONS,
  EMOTION_DETAILS_BY_BASE,
  getJournalDateKey,
  parseJournalDateKey,
  type BaseEmotion,
  type EmotionJournalEntry,
} from '@/constants/journals';
import { createEmotionJournalEntry, deleteJournalEntry, listJournalEntries } from '@/hooks/useJournals';
import { useScrollAnchors } from '@/hooks/useScrollAnchors';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const ACCENT = '#7ED8BE';
const ACCENT_BG = 'rgba(126,216,190,0.23)';
const ACCENT_BORDER = 'rgba(126,216,190,0.58)';
const Watermark = require('../../../../assets/images/maly_aniol.png');
// Etap 1: trend szacowany z emocji bazowych. Etap 2 do zaproponowania pozniej: zapisywac jawna ocene samopoczucia przy wpisie.
const EMOTION_MOOD_SCORE_BY_BASE: Record<BaseEmotion, number> = {
  'Złość': -2,
  'Wstyd': -2,
  'Strach': -2,
  'Smutek': -2,
  'Poczucie winy': -1,
  'Samotność': -1,
  'Radość': 2,
};

type TrendWindowDays = 14 | 30;
type MoodTrendDay = {
  dateKey: string;
  score: number | null;
  entryCount: number;
  dominantEmotion: BaseEmotion | null;
  barHeight: number;
  barColor: string;
};

type DraftFeeling = {
  key: string;
  baseEmotion: BaseEmotion;
  detailEmotion: string;
  situation: string;
  expression: string;
};

const toDraftKey = (baseEmotion: BaseEmotion, detailEmotion: string) => `${baseEmotion}::${detailEmotion.trim()}`;
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const toHourKey = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

function resolveDominantEmotion(entries: EmotionJournalEntry[]) {
  if (entries.length === 0) return null;

  const counts = new Map<BaseEmotion, number>();
  entries.forEach((entry) => {
    counts.set(entry.baseEmotion, (counts.get(entry.baseEmotion) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function getMoodBarColor(score: number) {
  if (score >= 1) return '#7ED8BE';
  if (score >= 0.1) return '#8FD6F2';
  if (score > -1) return '#F0C36D';
  return '#F09A9A';
}

function getMoodSummaryLabel(score: number | null) {
  if (score === null) return 'Brak danych';
  if (score >= 1) return 'Wiecej lekkosci';
  if (score >= 0.1) return 'Raczej stabilnie';
  if (score > -1) return 'Mieszany okres';
  return 'Wiecej napiecia';
}

function formatTrendLabel(dateKey: string) {
  const parsed = parseJournalDateKey(dateKey);
  if (!parsed) return dateKey.slice(8);
  return parsed.toLocaleDateString('pl-PL', { day: '2-digit' });
}

function shouldShowTrendTick(index: number, total: number, windowDays: TrendWindowDays) {
  if (index === 0 || index === total - 1) return true;
  return windowDays === 14 ? index % 3 === 0 : index % 5 === 0;
}

export default function DziennikUczucTestScreen() {
  const { scrollRef, setAnchor, scrollToAnchor, onScroll, onViewportLayout } =
    useScrollAnchors<'detail-card' | 'archive-section'>();
  const insets = useSafeAreaInsets();
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [baseEmotion, setBaseEmotion] = useState<BaseEmotion>('Strach');
  const [detailEmotion, setDetailEmotion] = useState<string>(EMOTION_DETAILS_BY_BASE['Strach'][0]);
  const baseEmotionRef = useRef<BaseEmotion>('Strach');
  const [lastTapKey, setLastTapKey] = useState<string | null>(null);
  const [lastTapAt, setLastTapAt] = useState(0);
  const [draftFeelings, setDraftFeelings] = useState<DraftFeeling[]>([]);
  const [entries, setEntries] = useState<EmotionJournalEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [openHours, setOpenHours] = useState<Record<string, boolean>>({});
  const [trendWindowDays, setTrendWindowDays] = useState<TrendWindowDays>(14);

  const detailOptions = useMemo(() => EMOTION_DETAILS_BY_BASE[baseEmotion], [baseEmotion]);

  const onChipTap = async (key: string, onSingleTap: () => void, onDoubleTap: () => Promise<void>) => {
    const now = Date.now();
    const isDoubleTap = lastTapKey === key && now - lastTapAt < 450;
    setLastTapKey(key);
    setLastTapAt(now);
    onSingleTap();
    if (isDoubleTap && !busy) {
      await onDoubleTap();
    }
  };

  const loadEntries = useCallback(async () => {
    try {
      const all = (await listJournalEntries('emotion')) as EmotionJournalEntry[];
      setEntries(all);
    } catch (e) {
      console.error('Blad odczytu dziennika uczuc:', e);
      Alert.alert('Blad', 'Nie udalo sie odczytac wpisow.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries])
  );

  const addDraftFeeling = (base: BaseEmotion, detail: string) => {
    const cleanDetail = detail.trim();
    const key = toDraftKey(base, cleanDetail);
    setDraftFeelings((prev) => {
      if (prev.some((item) => item.key === key)) return prev;
      return [
        ...prev,
        {
          key,
          baseEmotion: base,
          detailEmotion: cleanDetail,
          situation: '',
          expression: '',
        },
      ];
    });
  };

  const updateDraftFeeling = (key: string, patch: Partial<Pick<DraftFeeling, 'situation' | 'expression'>>) => {
    setDraftFeelings((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  };

  const removeDraftFeeling = (key: string) => {
    setDraftFeelings((prev) => prev.filter((item) => item.key !== key));
  };

  const focusBaseEmotion = (emotion: BaseEmotion) => {
    setBaseEmotion(emotion);
    baseEmotionRef.current = emotion;
    setDetailEmotion(EMOTION_DETAILS_BY_BASE[emotion][0]);
  };

  const onSave = async () => {
    const itemsToSave = draftFeelings;
    if (itemsToSave.length === 0) {
      Alert.alert('Brak wyboru', 'Wybierz przynajmniej jedno uczucie do zapisu.');
      return;
    }

    setBusy(true);
    try {
      const createdAt = new Date().toISOString();
      for (const item of itemsToSave) {
        await createEmotionJournalEntry({
          dateKey: selectedDateKey,
          createdAt,
          baseEmotion: item.baseEmotion,
          detailEmotion: item.detailEmotion,
          intensity: 0,
          triggerNote: item.situation.trim(),
          needNote: '',
          actionNote: item.expression.trim(),
        });
      }

      setDraftFeelings([]);
      await loadEntries();
      Alert.alert('Zapisano', 'Zapisano wpisy Dziennika Uczuć.');
    } catch (e) {
      console.error('Blad zapisu dziennika uczuc:', e);
      Alert.alert('Blad', 'Nie udalo sie zapisac wpisu.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Usunac wpis?', 'Tej operacji nie mozna cofnac.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usun',
        style: 'destructive',
        onPress: async () => {
          await deleteJournalEntry(id);
          await loadEntries();
        },
      },
    ]);
  };

  const archiveByDate = useMemo(() => {
    const dates = new Map<string, Map<string, EmotionJournalEntry[]>>();
    entries.forEach((entry) => {
      const byHour = dates.get(entry.dateKey) ?? new Map<string, EmotionJournalEntry[]>();
      const hourKey = toHourKey(entry.createdAt);
      const rows = byHour.get(hourKey) ?? [];
      rows.push(entry);
      byHour.set(hourKey, rows);
      dates.set(entry.dateKey, byHour);
    });

    return Array.from(dates.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([dateKey, byHour]) => ({
        dateKey,
        hours: Array.from(byHour.entries()).sort(([a], [b]) => (a < b ? 1 : -1)),
      }));
  }, [entries]);

  const archiveEntryCount = useMemo(() => new Set(entries.map((entry) => entry.createdAt)).size, [entries]);
  const moodTrend = useMemo(() => {
    const entriesByDate = new Map<string, EmotionJournalEntry[]>();
    entries.forEach((entry) => {
      const current = entriesByDate.get(entry.dateKey) ?? [];
      current.push(entry);
      entriesByDate.set(entry.dateKey, current);
    });

    const today = new Date();
    const days: MoodTrendDay[] = [];
    for (let offset = trendWindowDays - 1; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const dateKey = getJournalDateKey(date);
      const dayEntries = entriesByDate.get(dateKey) ?? [];

      if (dayEntries.length === 0) {
        days.push({
          dateKey,
          score: null,
          entryCount: 0,
          dominantEmotion: null,
          barHeight: 8,
          barColor: 'rgba(255,255,255,0.14)',
        });
        continue;
      }

      const score =
        dayEntries.reduce((sum, entry) => sum + EMOTION_MOOD_SCORE_BY_BASE[entry.baseEmotion], 0) / dayEntries.length;
      const normalized = (score + 2) / 4;
      days.push({
        dateKey,
        score,
        entryCount: dayEntries.length,
        dominantEmotion: resolveDominantEmotion(dayEntries),
        barHeight: 18 + normalized * 74,
        barColor: getMoodBarColor(score),
      });
    }

    const filledDays = days.filter((day) => day.score !== null);
    const averageScore =
      filledDays.length > 0
        ? filledDays.reduce((sum, day) => sum + (day.score ?? 0), 0) / filledDays.length
        : null;

    const dominantEmotionCounts = new Map<BaseEmotion, number>();
    filledDays.forEach((day) => {
      if (!day.dominantEmotion) return;
      dominantEmotionCounts.set(day.dominantEmotion, (dominantEmotionCounts.get(day.dominantEmotion) ?? 0) + 1);
    });

    const leadingEmotion = Array.from(dominantEmotionCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const selectedDateEntries = entriesByDate.get(selectedDateKey) ?? [];

    return {
      days,
      filledDaysCount: filledDays.length,
      averageScore,
      leadingEmotion,
      selectedDateEntryCount: selectedDateEntries.length,
      selectedDateDominantEmotion: resolveDominantEmotion(selectedDateEntries),
    };
  }, [entries, selectedDateKey, trendWindowDays]);

  const toggleDateOpen = (dateKey: string) => {
    setOpenDates((prev) => {
      const nextOpen = !prev[dateKey];
      if (nextOpen) {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
      }
      return { ...prev, [dateKey]: nextOpen };
    });
  };

  const toggleHourOpen = (dateKey: string, hourKey: string) => {
    const key = `${dateKey}|${hourKey}`;
    setOpenHours((prev) => {
      const nextOpen = !prev[key];
      if (nextOpen) {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
      }
      return { ...prev, [key]: nextOpen };
    });
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        onLayout={onViewportLayout}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.screen}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(72, insets.bottom + 44) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.bgOrbA} />
          <View style={styles.bgOrbB} />
          <Text style={styles.title}>Dziennik Uczuc</Text>
          <Text style={styles.subtitle}>Wybieraj uczucia podwojnym kliknieciem i dopisz sytuacje oraz sposob okazania.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz uczuć" />

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>1. Emocja bazowa</Text>
          <Text style={styles.helper}>Jedno klikniecie podswietla emocje bazowa, podwojne klikniecie dodaje ja do wpisu.</Text>
          <View style={styles.chipWrap}>
            {BASE_EMOTIONS.map((emotion) => (
              <Pressable
                key={emotion}
                style={[
                  styles.chip,
                  (baseEmotion === emotion || draftFeelings.some((item) => item.baseEmotion === emotion)) && styles.chipActive,
                ]}
                onPress={() =>
                  void onChipTap(
                    `base:${emotion}`,
                    () => focusBaseEmotion(emotion),
                    async () => {
                      addDraftFeeling(emotion, '');
                      scrollToAnchor('detail-card', { offset: 10, onlyIfNeeded: true });
                    }
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    (baseEmotion === emotion || draftFeelings.some((item) => item.baseEmotion === emotion)) &&
                      styles.chipTextActive,
                  ]}
                >
                  {emotion}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card} onLayout={setAnchor('detail-card')}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>2. Odcien emocji</Text>
          <Text style={styles.helper}>Jedno klikniecie podswietla odcien, podwojne klikniecie dodaje go do wpisu.</Text>
          <View style={styles.chipWrap}>
            {detailOptions.map((detail) => {
              const active = detailEmotion === detail;
              const selectedForBase = draftFeelings.some(
                (item) => item.baseEmotion === baseEmotion && item.detailEmotion === detail
              );
              return (
                <Pressable
                  key={detail}
                  style={[styles.chip, (active || selectedForBase) && styles.chipActive]}
                  onPress={() =>
                    void onChipTap(
                      `detail:${baseEmotion}:${detail}`,
                      () => {
                        setDetailEmotion(detail);
                      },
                      async () => addDraftFeeling(baseEmotionRef.current, detail)
                    )
                  }
                >
                  <Text style={[styles.chipText, (active || selectedForBase) && styles.chipTextActive]}>{detail}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>3. Wybrane uczucia i opisy</Text>
          {draftFeelings.length === 0 ? <Text style={styles.helpText}>Brak wybranych uczuc.</Text> : null}
          {draftFeelings.map((item, index) => (
            <View key={item.key} style={styles.selectedItemBox}>
              <View style={styles.selectedRow}>
                <Text style={styles.entryTitle}>
                  {index + 1}. {item.detailEmotion || item.baseEmotion}
                </Text>
                <Pressable style={styles.removeBtn} onPress={() => removeDraftFeeling(item.key)}>
                  <Text style={styles.removeBtnText}>Usun</Text>
                </Pressable>
              </View>
              <TextInput
                value={item.situation}
                onChangeText={(value) => updateDraftFeeling(item.key, { situation: value })}
                placeholder="Opis sytuacji dla tego uczucia"
                placeholderTextColor="rgba(255,255,255,0.45)"
                multiline
                style={styles.input}
              />
              <TextInput
                value={item.expression}
                onChangeText={(value) => updateDraftFeeling(item.key, { expression: value })}
                placeholder="Jak okazales/as to uczucie?"
                placeholderTextColor="rgba(255,255,255,0.45)"
                multiline
                style={styles.input}
              />
            </View>
          ))}
        </View>

        <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={() => void onSave()} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis'}</Text>
        </Pressable>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={styles.trendHeaderRow}>
            <View style={styles.trendHeaderTextWrap}>
              <Text style={styles.sectionTitle}>Trend samopoczucia</Text>
              <Text style={styles.helper}>
                Na podstawie emocji bazowych z wpisow. Wyzej = lzej, nizej = trudniej.
              </Text>
            </View>
            <View style={styles.trendToggleWrap}>
              {([14, 30] as const).map((days) => (
                <Pressable
                  key={days}
                  style={[styles.trendToggleChip, trendWindowDays === days && styles.trendToggleChipActive]}
                  onPress={() => setTrendWindowDays(days)}
                >
                  <Text style={[styles.trendToggleText, trendWindowDays === days && styles.trendToggleTextActive]}>
                    {days} dni
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.trendSummaryRow}>
            <View style={styles.trendStatCard}>
              <Text style={styles.trendStatLabel}>Srednia</Text>
              <Text style={styles.trendStatValue}>{getMoodSummaryLabel(moodTrend.averageScore)}</Text>
            </View>
            <View style={styles.trendStatCard}>
              <Text style={styles.trendStatLabel}>Dni z wpisem</Text>
              <Text style={styles.trendStatValue}>
                {moodTrend.filledDaysCount}/{trendWindowDays}
              </Text>
            </View>
          </View>

          {moodTrend.leadingEmotion ? (
            <Text style={styles.helpText}>Najczesciej wracalo: {moodTrend.leadingEmotion}.</Text>
          ) : (
            <Text style={styles.helpText}>W tym okresie nie ma jeszcze wpisow do pokazania trendu.</Text>
          )}

          {moodTrend.selectedDateEntryCount > 0 ? (
            <Text style={styles.helpText}>
              Dla wybranego dnia {selectedDateKey}: {moodTrend.selectedDateDominantEmotion ?? 'wiele roznych emocji'} (
              {moodTrend.selectedDateEntryCount} wpis{moodTrend.selectedDateEntryCount === 1 ? '' : 'y'}).
            </Text>
          ) : (
            <Text style={styles.helpText}>Dla wybranego dnia {selectedDateKey} nie ma jeszcze wpisu.</Text>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trendChartScroll}
            contentContainerStyle={styles.trendChartContent}
          >
            {moodTrend.days.map((day, index) => {
              const isSelected = day.dateKey === selectedDateKey;
              return (
                <Pressable key={day.dateKey} style={styles.trendColumn} onPress={() => setSelectedDateKey(day.dateKey)}>
                  <View style={[styles.trendTrack, isSelected && styles.trendTrackSelected]}>
                    <View
                      style={[
                        day.score === null ? styles.trendBarEmpty : styles.trendBarFill,
                        { height: day.barHeight, backgroundColor: day.barColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendTickLabel, isSelected && styles.trendTickLabelSelected]}>
                    {shouldShowTrendTick(index, moodTrend.days.length, trendWindowDays) ? formatTrendLabel(day.dateKey) : ' '}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.trendLegendRow}>
            <Text style={styles.trendLegendText}>Trudniej</Text>
            <Text style={styles.trendLegendText}>Lzej</Text>
          </View>
        </View>

        <Pressable
          style={styles.archiveHeader}
          onLayout={setAnchor('archive-section')}
          onPress={() =>
            setArchiveOpen((prev) => {
              const next = !prev;
              if (next) {
                scrollToAnchor('archive-section', { offset: 12 });
              }
              return next;
            })
          }
        >
          <Text style={styles.archiveHeaderText}>Historia wpisow ({archiveEntryCount})</Text>
          <Text style={styles.archiveHeaderChevron}>{archiveOpen ? '▾' : '▸'}</Text>
        </Pressable>

        {archiveOpen ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Archiwum wedlug dat</Text>
            {archiveByDate.length === 0 ? <Text style={styles.helpText}>Brak wpisow.</Text> : null}
            {archiveByDate.map(({ dateKey, hours }) => {
              const dateOpen = openDates[dateKey] === true;
              return (
                <View key={dateKey} style={styles.hourGroup}>
                  <Pressable style={styles.innerArchiveHeader} onPress={() => toggleDateOpen(dateKey)}>
                    <Text style={styles.innerArchiveHeaderText}>
                      Data {dateKey} ({hours.length})
                    </Text>
                    <Text style={styles.archiveHeaderChevron}>{dateOpen ? '▾' : '▸'}</Text>
                  </Pressable>
                  {dateOpen
                    ? hours.map(([hourKey, hourEntries]) => {
                        const hourOpen = openHours[`${dateKey}|${hourKey}`] === true;
                        return (
                          <View key={`${dateKey}_${hourKey}`} style={styles.hourWrap}>
                            <Pressable style={styles.innerHourHeader} onPress={() => toggleHourOpen(dateKey, hourKey)}>
                              <Text style={styles.hourTitle}>
                                Godzina {hourKey} ({hourEntries.length})
                              </Text>
                              <Text style={styles.archiveHeaderChevron}>{hourOpen ? '▾' : '▸'}</Text>
                            </Pressable>
                            {hourOpen
                              ? hourEntries.map((entry) => (
                                  <View key={entry.id} style={styles.entryRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.entryTitle}>
                                        {entry.detailEmotion.trim().length > 0 ? entry.detailEmotion : entry.baseEmotion}
                                      </Text>
                                      {entry.triggerNote.trim().length > 0 ? (
                                        <Text style={styles.helpText}>Sytuacja: {entry.triggerNote}</Text>
                                      ) : null}
                                      {entry.actionNote.trim().length > 0 ? (
                                        <Text style={styles.helpText}>Wyrazenie: {entry.actionNote}</Text>
                                      ) : null}
                                      <Text style={styles.helpText}>{formatTime(entry.createdAt)}</Text>
                                    </View>
                                    <Pressable style={styles.deleteBtn} onPress={() => onDelete(entry.id)}>
                                      <Text style={styles.deleteBtnText}>Usun</Text>
                                    </Pressable>
                                  </View>
                                ))
                              : null}
                          </View>
                        );
                      })
                    : null}
                </View>
              );
            })}
          </View>
        ) : null}
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
    backgroundColor: 'rgba(126,216,190,0.11)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(184,198,255,0.09)',
    bottom: 120,
    left: -80,
  },
  title: { color: 'white', fontSize: 31, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
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
  sectionTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
  },
  chipText: { color: 'rgba(255,255,255,0.86)', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: 'white' },
  helper: { color: SUB, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  selectedItemBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 52,
    textAlignVertical: 'top',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  trendHeaderTextWrap: {
    flex: 1,
  },
  trendToggleWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  trendToggleChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  trendToggleChipActive: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
  },
  trendToggleText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '700',
  },
  trendToggleTextActive: {
    color: 'white',
  },
  trendSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 2,
  },
  trendStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  trendStatLabel: {
    color: SUB,
    fontSize: 12,
    marginBottom: 4,
  },
  trendStatValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  trendChartScroll: {
    marginTop: 10,
  },
  trendChartContent: {
    alignItems: 'flex-end',
    gap: 10,
    paddingRight: 8,
  },
  trendColumn: {
    width: 22,
    alignItems: 'center',
  },
  trendTrack: {
    width: 18,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'flex-end',
    padding: 2,
  },
  trendTrackSelected: {
    borderColor: ACCENT_BORDER,
    backgroundColor: 'rgba(126,216,190,0.08)',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  trendBarEmpty: {
    width: '100%',
    borderRadius: 10,
    opacity: 0.8,
  },
  trendTickLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    minHeight: 12,
  },
  trendTickLabelSelected: {
    color: 'white',
  },
  trendLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  trendLegendText: {
    color: SUB,
    fontSize: 12,
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  archiveHeaderText: { color: 'white', fontSize: 16, fontWeight: '700' },
  archiveHeaderChevron: { color: ACCENT, fontSize: 20, fontWeight: '700' },
  helpText: { marginTop: 6, color: SUB, fontSize: 13 },
  innerArchiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  innerArchiveHeaderText: { color: 'white', fontSize: 14, fontWeight: '700' },
  innerHourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  hourWrap: {
    marginTop: 8,
    marginLeft: 8,
  },
  hourGroup: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: ACCENT_BORDER,
    paddingTop: 8,
  },
  hourTitle: { color: ACCENT, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 8,
    marginTop: 8,
    gap: 8,
  },
  entryTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
  removeBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  removeBtnText: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
});
