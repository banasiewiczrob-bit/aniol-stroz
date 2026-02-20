import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  CRAVING_SYMPTOMS,
  getJournalDateKey,
  type CravingJournalEntry,
} from '@/constants/journals';
import { createCravingJournalEntry, deleteJournalEntry, listJournalEntries } from '@/hooks/useJournals';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

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
  const [lastTapKey, setLastTapKey] = useState<string | null>(null);
  const [lastTapAt, setLastTapAt] = useState(0);
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
    const isDoubleTap = lastTapKey === key && now - lastTapAt < 350;
    setLastTapKey(key);
    setLastTapAt(now);
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

  const onSave = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Brak objawów', 'Zaznacz przynajmniej jeden objaw.');
      return;
    }

    setBusy(true);
    try {
      await createCravingJournalEntry({
        dateKey: selectedDateKey,
        urgeBefore: 0,
        selectedSymptoms,
        preTriggerNote: '',
        plan15m: '',
        urgeAfter: null,
        whatHelped: '',
      });
      setSelectedSymptoms([]);
      await loadDayEntries();
      Alert.alert('Zapisano', 'Wpis w Dzienniku Głodu/Kryzysu został zapisany.');
    } catch (e) {
      console.error('Błąd zapisu Dziennika Głodu/Kryzysu:', e);
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

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dziennik Głodu/Kryzysu</Text>
        <Text style={styles.subtitle}>Checklista 20 objawów i podsumowanie dzienne.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz kryzysu" />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Objawy (1-20)</Text>
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
                                      <Text style={styles.entryTitle}>Objawy: {entry.symptomsCount}/20</Text>
                                      <Text style={styles.helpText}>{entry.selectedSymptoms.join(', ')}</Text>
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
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { color: 'white', fontSize: 31, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
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
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderColor: 'rgba(120,200,255,0.6)',
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
  archiveHeaderChevron: { color: '#78C8FF', fontSize: 20, fontWeight: '700' },
  innerArchiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
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
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
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
    borderTopColor: 'rgba(120,200,255,0.22)',
    paddingTop: 8,
  },
  hourTitle: { color: '#AEE1FF', fontSize: 13, fontWeight: '700', marginBottom: 4 },
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
