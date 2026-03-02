import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  BASE_EMOTIONS,
  EMOTION_DETAILS_BY_BASE,
  getJournalDateKey,
  type BaseEmotion,
  type EmotionJournalEntry,
} from '@/constants/journals';
import { createEmotionJournalEntry, deleteJournalEntry, listJournalEntries } from '@/hooks/useJournals';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const ACCENT = '#9AC7FF';
const ACCENT_BG = 'rgba(154,199,255,0.25)';
const ACCENT_BORDER = 'rgba(154,199,255,0.55)';
const Watermark = require('../../../../assets/images/maly_aniol.png');

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function toHourKey(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function buildDayDraft(
  selectedBaseEmotions: BaseEmotion[],
  selectedDetailsByBase: Partial<Record<BaseEmotion, string[]>>
) {
  const detailDraft: Array<{ base: BaseEmotion; detail: string; label: string }> = [];
  (Object.keys(selectedDetailsByBase) as BaseEmotion[]).forEach((base) => {
    const details = selectedDetailsByBase[base] ?? [];
    details.forEach((detail) => {
      const clean = detail.trim();
      if (!clean) return;
      detailDraft.push({ base, detail: clean, label: clean });
    });
  });

  const baseOnly = selectedBaseEmotions
    .filter((base) => !detailDraft.some((item) => item.base === base))
    .map((base) => ({ base, detail: '', label: base }));

  return [...baseOnly, ...detailDraft];
}

export default function DziennikUczucScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [baseEmotion, setBaseEmotion] = useState<BaseEmotion>('Strach');
  const [detailEmotion, setDetailEmotion] = useState<string>(EMOTION_DETAILS_BY_BASE['Strach'][0]);
  const baseEmotionRef = useRef<BaseEmotion>('Strach');
  const detailEmotionRef = useRef<string>(EMOTION_DETAILS_BY_BASE['Strach'][0]);
  const [selectedBaseEmotions, setSelectedBaseEmotions] = useState<BaseEmotion[]>([]);
  const [selectedDetailsByBase, setSelectedDetailsByBase] = useState<Partial<Record<BaseEmotion, string[]>>>({});
  const selectedBaseEmotionsRef = useRef<BaseEmotion[]>([]);
  const selectedDetailsByBaseRef = useRef<Partial<Record<BaseEmotion, string[]>>>({});
  const [lastTapKey, setLastTapKey] = useState<string | null>(null);
  const [lastTapAt, setLastTapAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveDateCount, setArchiveDateCount] = useState(0);
  const [allEmotionEntries, setAllEmotionEntries] = useState<EmotionJournalEntry[]>([]);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [openHours, setOpenHours] = useState<Record<string, boolean>>({});

  const detailOptions = useMemo(() => EMOTION_DETAILS_BY_BASE[baseEmotion], [baseEmotion]);

  const loadDayEntries = useCallback(async () => {
    const all = (await listJournalEntries('emotion')) as EmotionJournalEntry[];
    setAllEmotionEntries(all);
    const uniqueDates = new Set(all.map((entry) => entry.dateKey));
    setArchiveDateCount(uniqueDates.size);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDayEntries();
    }, [loadDayEntries])
  );

  const saveOne = async (
    nextBaseEmotion = baseEmotionRef.current,
    nextDetailEmotion = detailEmotionRef.current,
    createdAt?: string
  ) => {
    await createEmotionJournalEntry({
      dateKey: selectedDateKey,
      createdAt,
      baseEmotion: nextBaseEmotion,
      detailEmotion: nextDetailEmotion,
      intensity: 0,
      triggerNote: '',
      needNote: '',
      actionNote: '',
    });
  };

  const onSave = async () => {
    setBusy(true);
    try {
      const draft = buildDayDraft(selectedBaseEmotionsRef.current, selectedDetailsByBaseRef.current);
      if (draft.length === 0) {
        Alert.alert('Brak wyboru', 'Wybierz co najmniej jedną emocję bazową lub odcień emocji.');
        return;
      }

      const batchCreatedAt = new Date().toISOString();
      for (const item of draft) {
        await saveOne(item.base, item.detail, batchCreatedAt);
      }

      setSelectedBaseEmotions([]);
      setSelectedDetailsByBase({});
      selectedBaseEmotionsRef.current = [];
      selectedDetailsByBaseRef.current = {};
      await loadDayEntries();
      Alert.alert('Zapisano', 'Zapisano wybrane emocje dla bieżącej daty.');
    } catch (e) {
      console.error('Błąd zapisu Dziennika Uczuć:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać wpisu.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (entryId: string) => {
    Alert.alert('Usunąć wpis?', 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await deleteJournalEntry(entryId);
          await loadDayEntries();
        },
      },
    ]);
  };

  const onChangeBaseEmotion = (next: BaseEmotion) => {
    const defaultDetail = EMOTION_DETAILS_BY_BASE[next][0];
    baseEmotionRef.current = next;
    detailEmotionRef.current = defaultDetail;
    setBaseEmotion(next);
    setDetailEmotion(defaultDetail);
  };

  const toggleSelectedBase = (emotion: BaseEmotion) => {
    setSelectedBaseEmotions((prev) => {
      const next = prev.includes(emotion) ? prev.filter((item) => item !== emotion) : [...prev, emotion];
      selectedBaseEmotionsRef.current = next;
      return next;
    });
  };

  const toggleSelectedDetailForBase = (base: BaseEmotion, detail: string) => {
    setSelectedDetailsByBase((prev) => {
      const current = prev[base] ?? [];
      const next = current.includes(detail) ? current.filter((item) => item !== detail) : [...current, detail];
      const snapshot = { ...prev, [base]: next };
      selectedDetailsByBaseRef.current = snapshot;
      return snapshot;
    });
  };

  const onChipTap = async (key: string, onSingleTap: () => void, onDoubleTap: () => Promise<void>) => {
    const now = Date.now();
    const isDoubleTap = lastTapKey === key && now - lastTapAt < 350;
    setLastTapKey(key);
    setLastTapAt(now);
    onSingleTap();
    if (isDoubleTap && !busy) {
      await onDoubleTap();
    }
  };

  const archiveByDate = useMemo(() => {
    const dates = new Map<string, Map<string, EmotionJournalEntry[]>>();
    allEmotionEntries.forEach((entry) => {
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
  }, [allEmotionEntries]);

  const dayDraft = useMemo(
    () => buildDayDraft(selectedBaseEmotions, selectedDetailsByBase),
    [selectedBaseEmotions, selectedDetailsByBase]
  );

  const toggleDateOpen = (dateKey: string) => {
    setOpenDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const toggleHourOpen = (dateKey: string, hourKey: string) => {
    const key = `${dateKey}|${hourKey}`;
    setOpenHours((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <Text style={styles.title}>Dziennik Uczuć</Text>
        <Text style={styles.subtitle}>Zapisuj emocje dzień po dniu w układzie tygodniowym.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz uczuć" />

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>1. Emocja bazowa</Text>
          <View style={styles.chipWrap}>
            {BASE_EMOTIONS.map((emotion) => {
              const active = emotion === baseEmotion;
              return (
                <Pressable
                  key={emotion}
                  style={[styles.chip, (active || selectedBaseEmotions.includes(emotion)) && styles.chipActive]}
                  onPress={() =>
                    void onChipTap(
                      `base:${emotion}`,
                      () => onChangeBaseEmotion(emotion),
                      async () => toggleSelectedBase(emotion)
                    )
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{emotion}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>2. Odcień emocji</Text>
          <View style={styles.chipWrap}>
            {detailOptions.map((detail) => {
              const active = detail === detailEmotion;
              const selectedForBase = (selectedDetailsByBase[baseEmotion] ?? []).includes(detail);
              return (
                <Pressable
                  key={detail}
                  style={[styles.chip, (active || selectedForBase) && styles.chipActive]}
                  onPress={() =>
                    void onChipTap(
                      `detail:${detail}`,
                      () => {
                        detailEmotionRef.current = detail;
                        setDetailEmotion(detail);
                      },
                      async () => toggleSelectedDetailForBase(baseEmotionRef.current, detail)
                    )
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{detail}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>Wybrane uczucia</Text>
          {dayDraft.length === 0 ? <Text style={styles.helpText}>Brak wybranych uczuć.</Text> : null}
          {dayDraft.map((item, index) => (
            <Text key={`${item.base}_${item.detail}_${index}`} style={styles.entryTitle}>
              {index + 1}. {item.label}
            </Text>
          ))}
        </View>

        <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={() => void onSave()} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis'}</Text>
        </Pressable>

        <Pressable style={styles.archiveHeader} onPress={() => setArchiveOpen((prev) => !prev)}>
          <Text style={styles.archiveHeaderText}>Archiwum wpisów ({archiveDateCount})</Text>
          <Text style={styles.archiveHeaderChevron}>{archiveOpen ? '▾' : '▸'}</Text>
        </Pressable>

        {archiveOpen ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Archiwum według dat</Text>
            {archiveByDate.length === 0 ? <Text style={styles.helpText}>Brak wpisów.</Text> : null}
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
                    ? hours.map(([hourKey, entries]) => {
                        const hourOpen = openHours[`${dateKey}|${hourKey}`] === true;
                        return (
                          <View key={`${dateKey}_${hourKey}`} style={styles.hourWrap}>
                            <Pressable style={styles.innerHourHeader} onPress={() => toggleHourOpen(dateKey, hourKey)}>
                              <Text style={styles.hourTitle}>
                                Godzina {hourKey} ({entries.length})
                              </Text>
                              <Text style={styles.archiveHeaderChevron}>{hourOpen ? '▾' : '▸'}</Text>
                            </Pressable>
                            {hourOpen
                              ? entries.map((entry) => (
                                  <View key={entry.id} style={styles.entryRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.entryTitle}>
                                        {entry.detailEmotion.trim().length > 0 ? entry.detailEmotion : entry.baseEmotion}
                                      </Text>
                                      <Text style={styles.helpText}>{formatTime(entry.createdAt)}</Text>
                                    </View>
                                    <Pressable style={styles.deleteBtn} onPress={() => onDelete(entry.id)}>
                                      <Text style={styles.deleteBtnText}>Usuń</Text>
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
    backgroundColor: 'rgba(154,199,255,0.1)',
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
  title: { color: 'white', fontSize: 33, fontWeight: '800', marginBottom: 8 },
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
  helpText: { marginTop: 6, color: SUB, fontSize: 13 },
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 8,
    marginTop: 8,
    gap: 8,
  },
  hourGroup: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: ACCENT_BORDER,
    paddingTop: 8,
  },
  hourTitle: { color: ACCENT, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  entryTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
});
