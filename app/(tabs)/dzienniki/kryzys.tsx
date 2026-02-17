import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  clampIntensity,
  CRAVING_SYMPTOMS,
  getCravingSummaryLabel,
  getCravingSummaryLevel,
  getJournalDateKey,
  type CravingJournalEntry,
} from '@/constants/journals';
import { createCravingJournalEntry, deleteJournalEntry, listJournalEntriesByDate } from '@/hooks/useJournals';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function DziennikKryzysuScreen() {
  const navigation = useNavigation();
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [urgeBeforeText, setUrgeBeforeText] = useState('5');
  const [urgeAfterText, setUrgeAfterText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [preTriggerNote, setPreTriggerNote] = useState('');
  const [plan15m, setPlan15m] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [busy, setBusy] = useState(false);
  const [dayEntries, setDayEntries] = useState<CravingJournalEntry[]>([]);

  const urgeBefore = clampIntensity(Number.parseInt(urgeBeforeText, 10));
  const parsedAfter = urgeAfterText.trim().length ? Number.parseInt(urgeAfterText, 10) : Number.NaN;
  const urgeAfter = Number.isFinite(parsedAfter) ? clampIntensity(parsedAfter) : null;

  const summaryLevel = useMemo(() => getCravingSummaryLevel(selectedSymptoms.length), [selectedSymptoms.length]);
  const daySymptomsTotal = useMemo(
    () => dayEntries.reduce((acc, entry) => acc + entry.symptomsCount, 0),
    [dayEntries]
  );

  const loadDayEntries = useCallback(async () => {
    const entries = await listJournalEntriesByDate('craving', selectedDateKey);
    setDayEntries(entries as CravingJournalEntry[]);
  }, [selectedDateKey]);

  useFocusEffect(
    useCallback(() => {
      void loadDayEntries();
    }, [loadDayEntries])
  );

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => (prev.includes(symptom) ? prev.filter((v) => v !== symptom) : [...prev, symptom]));
  };

  const onSave = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Brak objawów', 'Zaznacz przynajmniej jeden objaw.');
      return;
    }
    if (!plan15m.trim()) {
      Alert.alert('Brak planu', 'Wpisz plan na najbliższe 15 minut.');
      return;
    }

    setBusy(true);
    try {
      await createCravingJournalEntry({
        dateKey: selectedDateKey,
        urgeBefore,
        selectedSymptoms,
        preTriggerNote,
        plan15m,
        urgeAfter,
        whatHelped,
      });
      setSelectedSymptoms([]);
      setPreTriggerNote('');
      setPlan15m('');
      setWhatHelped('');
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
          <Text style={styles.sectionTitle}>1. Poziom napięcia teraz (0-10)</Text>
          <TextInput
            value={urgeBeforeText}
            onChangeText={setUrgeBeforeText}
            keyboardType="number-pad"
            maxLength={2}
            style={styles.input}
            placeholder="np. 7"
            placeholderTextColor="rgba(255,255,255,0.45)"
          />
          <Text style={styles.helpText}>Aktualna wartość: {urgeBefore}/10</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Objawy (1-20)</Text>
          <View style={styles.chipWrap}>
            {CRAVING_SYMPTOMS.map((symptom, idx) => {
              const active = selectedSymptoms.includes(symptom);
              return (
                <Pressable key={symptom} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleSymptom(symptom)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{idx + 1}. {symptom}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helpText}>Suma objawów: {selectedSymptoms.length} | {getCravingSummaryLabel(summaryLevel)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Co wydarzyło się przed kryzysem?</Text>
          <TextInput
            value={preTriggerNote}
            onChangeText={setPreTriggerNote}
            multiline
            style={[styles.input, styles.inputArea]}
            placeholder="Krótko opisz sytuację..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Plan na 15 minut</Text>
          <TextInput
            value={plan15m}
            onChangeText={setPlan15m}
            multiline
            style={[styles.input, styles.inputArea]}
            placeholder="Np. spacer, oddech 4-6, telefon do zaufanej osoby..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Po 15 minutach (opcjonalnie)</Text>
          <TextInput
            value={urgeAfterText}
            onChangeText={setUrgeAfterText}
            keyboardType="number-pad"
            maxLength={2}
            style={styles.input}
            placeholder="np. 4"
            placeholderTextColor="rgba(255,255,255,0.45)"
          />
          <Text style={styles.helpText}>Wartość po 15 min: {urgeAfter ?? 'brak'}</Text>
          <TextInput
            value={whatHelped}
            onChangeText={setWhatHelped}
            multiline
            style={[styles.input, styles.inputArea, { marginTop: 10 }]}
            placeholder="Co pomogło najbardziej?"
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={onSave} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis'}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Wpisy z dnia: {selectedDateKey}</Text>
          <Text style={styles.helpText}>Suma objawów z dnia: {daySymptomsTotal}</Text>
          {dayEntries.length === 0 ? <Text style={styles.helpText}>Brak wpisów na ten dzień.</Text> : null}
          {dayEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryTitle}>
                  Objawy: {entry.symptomsCount}/20 | {getCravingSummaryLabel(entry.summaryLevel)}
                </Text>
                <Text style={styles.helpText}>{formatTime(entry.createdAt)}</Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => onDelete(entry.id)}>
                <Text style={styles.deleteBtnText}>Usuń</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/dzienniki');
          }}
        >
          <Text style={styles.secondaryBtnText}>Wróć do dzienników</Text>
        </Pressable>
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
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputArea: { minHeight: 96 },
  helpText: { marginTop: 6, color: SUB, fontSize: 13 },
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
  entryTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.86)', fontSize: 14, fontWeight: '600' },
});
