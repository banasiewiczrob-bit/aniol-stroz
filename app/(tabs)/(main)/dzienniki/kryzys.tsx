import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  CRAVING_SYMPTOMS,
  getJournalDateKey,
  type CravingJournalEntry,
} from '@/constants/journals';
import { createCravingJournalEntry, deleteJournalEntry, listJournalEntries } from '@/hooks/useJournals';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const ACCENT = '#FF9E9E';
const ACCENT_BG = 'rgba(255,158,158,0.25)';
const ACCENT_BORDER = 'rgba(255,158,158,0.55)';
const Watermark = require('../../../../assets/images/maly_aniol.png');

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function toHourKey(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function DziennikKryzysuScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [focusedSymptom, setFocusedSymptom] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const lastTapKeyRef = useRef<string | null>(null);
  const lastTapAtRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveDateCount, setArchiveDateCount] = useState(0);
  const [allCravingEntries, setAllCravingEntries] = useState<CravingJournalEntry[]>([]);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [openHours, setOpenHours] = useState<Record<string, boolean>>({});

  const loadDayEntries = useCallback(async () => {
    const all = (await listJournalEntries('craving')) as CravingJournalEntry[];
    setAllCravingEntries(all);
    const uniqueDates = new Set(all.map((entry) => entry.dateKey));
    setArchiveDateCount(uniqueDates.size);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDayEntries();
    }, [loadDayEntries])
  );

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => (prev.includes(symptom) ? prev.filter((v) => v !== symptom) : [...prev, symptom]));
  };

  const onChipTap = async (key: string, onSingleTap: () => void, onDoubleTap: () => Promise<void>) => {
    const now = Date.now();
    const isDoubleTap = lastTapKeyRef.current === key && now - lastTapAtRef.current < 450;
    lastTapKeyRef.current = key;
    lastTapAtRef.current = now;
    onSingleTap();
    if (isDoubleTap && !busy) {
      await onDoubleTap();
    }
  };

  const archiveByDate = useMemo(() => {
    const dates = new Map<string, Map<string, CravingJournalEntry[]>>();
    allCravingEntries.forEach((entry) => {
      const byHour = dates.get(entry.dateKey) ?? new Map<string, CravingJournalEntry[]>();
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
  }, [allCravingEntries]);

  const toggleDateOpen = (dateKey: string) => {
    setOpenDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const toggleHourOpen = (dateKey: string, hourKey: string) => {
    const key = `${dateKey}|${hourKey}`;
    setOpenHours((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveEntry = async (symptoms: string[], cravingReported: boolean, successMessage: string) => {
    setBusy(true);
    try {
      await createCravingJournalEntry({
        dateKey: selectedDateKey,
        cravingReported,
        urgeBefore: 0,
        selectedSymptoms: symptoms,
        preTriggerNote: '',
        plan15m: '',
        urgeAfter: null,
        whatHelped: '',
      });
      setSelectedSymptoms([]);
      await loadDayEntries();
      Alert.alert('Zapisano', successMessage);
    } catch (e) {
      console.error('Błąd zapisu Dziennika Głodu/Kryzysu:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać wpisu.');
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Brak objawów', 'Wybierz objawy albo użyj przycisku "Zapisz: bez objawów".');
      return;
    }
    await saveEntry(selectedSymptoms, true, 'Wpis w Dzienniku Głodu/Kryzysu został zapisany.');
  };

  const onSaveNoSymptoms = async () => {
    await saveEntry([], false, 'Zapisano dzień bez zgłoszonego głodu.');
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

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <Text style={styles.title}>Dziennik Głodu/Kryzysu</Text>
        <Text style={styles.subtitle}>Checklista 20 objawów i podsumowanie dzienne.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz kryzysu" />

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>Objawy (1-20)</Text>
          <Text style={styles.tapHint}>Jedno kliknięcie podświetla objaw, a podwójne kliknięcie wybiera go do wpisu.</Text>
          <View style={styles.chipWrap}>
            {CRAVING_SYMPTOMS.map((symptom, idx) => {
              const active = selectedSymptoms.includes(symptom) || focusedSymptom === symptom;
              return (
                <Pressable
                  key={symptom}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    void onChipTap(
                      `symptom:${symptom}`,
                      () => setFocusedSymptom(symptom),
                      async () => toggleSymptom(symptom)
                    )
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {idx + 1}. {symptom}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.sectionTitle}>Wybrane objawy</Text>
          {selectedSymptoms.length === 0 ? <Text style={styles.helpText}>Brak wybranych objawów.</Text> : null}
          {selectedSymptoms.map((symptom, index) => (
            <Text key={`${symptom}_${index}`} style={styles.entryTitle}>
              {index + 1}. {symptom}
            </Text>
          ))}
        </View>

        <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={onSave} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis'}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, busy && styles.btnDisabled]} onPress={onSaveNoSymptoms} disabled={busy}>
          <Text style={styles.secondaryBtnText}>Zapisz: bez objawów</Text>
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
                                        {entry.cravingReported ? `Objawy: ${entry.symptomsCount}/20` : 'Zapis: bez objawów'}
                                      </Text>
                                      {entry.cravingReported ? (
                                        <Text style={styles.helpText}>{entry.selectedSymptoms.join(', ')}</Text>
                                      ) : (
                                        <Text style={styles.helpText}>Brak zgłoszonego głodu w tym zapisie.</Text>
                                      )}
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
    backgroundColor: 'rgba(255,158,158,0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,199,217,0.09)',
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
  tapHint: { color: SUB, fontSize: 13, lineHeight: 18, marginBottom: 10 },
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
  chipText: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '600' },
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
  secondaryBtn: {
    marginTop: -2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '700' },
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
