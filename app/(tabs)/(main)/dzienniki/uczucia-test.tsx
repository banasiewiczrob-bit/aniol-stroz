import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  BASE_EMOTIONS,
  EMOTION_DETAILS_BY_BASE,
  getJournalDateKey,
  type BaseEmotion,
} from '@/constants/journals';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const ACCENT = '#7ED8BE';
const ACCENT_BG = 'rgba(126,216,190,0.23)';
const ACCENT_BORDER = 'rgba(126,216,190,0.58)';
const Watermark = require('../../../../assets/images/maly_aniol.png');
const LAB_STORAGE_KEY = '@emotion_journal_lab_v2';

type EmotionLabEntry = {
  id: string;
  dateKey: string;
  createdAt: string;
  baseEmotion: BaseEmotion;
  detailEmotion: string;
  situation: string;
  expression: string;
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

export default function DziennikUczucTestScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [baseEmotion, setBaseEmotion] = useState<BaseEmotion>('Strach');
  const [detailEmotion, setDetailEmotion] = useState<string>(EMOTION_DETAILS_BY_BASE['Strach'][0]);
  const baseEmotionRef = useRef<BaseEmotion>('Strach');
  const [lastTapKey, setLastTapKey] = useState<string | null>(null);
  const [lastTapAt, setLastTapAt] = useState(0);
  const [draftFeelings, setDraftFeelings] = useState<DraftFeeling[]>([]);
  const [entries, setEntries] = useState<EmotionLabEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveDateCount, setArchiveDateCount] = useState(0);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [openHours, setOpenHours] = useState<Record<string, boolean>>({});

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

  const loadEntries = async () => {
    try {
      const raw = await AsyncStorage.getItem(LAB_STORAGE_KEY);
      if (!raw) {
        setEntries([]);
        setArchiveDateCount(0);
        return;
      }
      const parsed = JSON.parse(raw) as EmotionLabEntry[];
      const sorted = [...parsed].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setEntries(sorted);
      const uniqueDates = new Set(sorted.map((item) => item.dateKey));
      setArchiveDateCount(uniqueDates.size);
    } catch (e) {
      console.error('Blad odczytu testowego dziennika uczuc:', e);
      Alert.alert('Blad', 'Nie udalo sie odczytac wpisow testowych.');
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const saveEntries = async (next: EmotionLabEntry[]) => {
    await AsyncStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(next));
  };

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

  const onSave = async () => {
    if (draftFeelings.length === 0) {
      Alert.alert('Brak wyboru', 'Wybierz przynajmniej jedno uczucie do zapisu.');
      return;
    }

    setBusy(true);
    try {
      const createdAt = new Date().toISOString();
      const newRows: EmotionLabEntry[] = draftFeelings.map((item) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        dateKey: selectedDateKey,
        createdAt,
        baseEmotion: item.baseEmotion,
        detailEmotion: item.detailEmotion,
        situation: item.situation.trim(),
        expression: item.expression.trim(),
      }));

      const next = [...newRows, ...entries];
      setEntries(next);
      await saveEntries(next);
      setDraftFeelings([]);
      Alert.alert('Zapisano', 'Zapisano wpisy testowe Dziennika Uczuć 2.0.');
    } catch (e) {
      console.error('Blad zapisu testowego dziennika uczuc:', e);
      Alert.alert('Blad', 'Nie udalo sie zapisac wpisu testowego.');
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
          const next = entries.filter((item) => item.id !== id);
          setEntries(next);
          await saveEntries(next);
        },
      },
    ]);
  };

  const archiveByDate = useMemo(() => {
    const dates = new Map<string, Map<string, EmotionLabEntry[]>>();
    entries.forEach((entry) => {
      const byHour = dates.get(entry.dateKey) ?? new Map<string, EmotionLabEntry[]>();
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
        <Text style={styles.title}>Dziennik Uczuc 2.0 (test)</Text>
        <Text style={styles.subtitle}>Wybieraj uczucia podwojnym kliknieciem. Kazde ma osobny opis i sposob okazania.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz testowy" />

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>1. Emocja bazowa</Text>
          <Text style={styles.helper}>Jedno klikniecie podswietla emocje bazowa, podwojne klikniecie dodaje ja do wpisu.</Text>
          <View style={styles.chipWrap}>
            {BASE_EMOTIONS.map((emotion) => (
              <Pressable
                key={emotion}
                style={[styles.chip, baseEmotion === emotion && styles.chipActive]}
                onPress={() =>
                  void onChipTap(
                    `base:${emotion}`,
                    () => {
                      setBaseEmotion(emotion);
                      baseEmotionRef.current = emotion;
                      setDetailEmotion(EMOTION_DETAILS_BY_BASE[emotion][0]);
                    },
                    async () => addDraftFeeling(emotion, '')
                  )
                }
              >
                <Text style={[styles.chipText, baseEmotion === emotion && styles.chipTextActive]}>{emotion}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>2. Odcien emocji</Text>
          <Text style={styles.helper}>Jedno klikniecie podswietla odcien, podwojne klikniecie dodaje go do wpisu.</Text>
          <View style={styles.chipWrap}>
            {detailOptions.map((detail) => {
              const active = detailEmotion === detail;
              return (
                <Pressable
                  key={detail}
                  style={[styles.chip, active && styles.chipActive]}
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
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{detail}</Text>
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
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis testowy'}</Text>
        </Pressable>

        <Pressable style={styles.archiveHeader} onPress={() => setArchiveOpen((prev) => !prev)}>
          <Text style={styles.archiveHeaderText}>Archiwum testowe ({archiveDateCount})</Text>
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
                                      {entry.situation.trim().length > 0 ? (
                                        <Text style={styles.helpText}>Sytuacja: {entry.situation}</Text>
                                      ) : null}
                                      {entry.expression.trim().length > 0 ? (
                                        <Text style={styles.helpText}>Wyrazenie: {entry.expression}</Text>
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
