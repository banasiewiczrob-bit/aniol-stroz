import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import { getJournalDateKey, type GratitudeJournalEntry } from '@/constants/journals';
import { createGratitudeJournalEntry, deleteJournalEntry, listJournalEntriesByDate } from '@/hooks/useJournals';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function DziennikWdziecznosciScreen() {
  const navigation = useNavigation();
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [dayEntries, setDayEntries] = useState<GratitudeJournalEntry[]>([]);

  const loadDayEntries = useCallback(async () => {
    const entries = await listJournalEntriesByDate('gratitude', selectedDateKey);
    setDayEntries(entries as GratitudeJournalEntry[]);
  }, [selectedDateKey]);

  useFocusEffect(
    useCallback(() => {
      void loadDayEntries();
    }, [loadDayEntries])
  );

  const onSave = async () => {
    if (!item.trim()) {
      Alert.alert('Brak treści', 'Wpisz przynajmniej jedną rzecz, za którą jesteś wdzięczny.');
      return;
    }

    setBusy(true);
    try {
      await createGratitudeJournalEntry({
        dateKey: selectedDateKey,
        item,
        note,
      });
      setItem('');
      setNote('');
      await loadDayEntries();
      Alert.alert('Zapisano', 'Wpis w Dzienniku Wdzięczności został zapisany.');
    } catch (e) {
      console.error('Błąd zapisu Dziennika Wdzięczności:', e);
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
        <Text style={styles.title}>Dziennik Wdzięczności</Text>
        <Text style={styles.subtitle}>Dodawaj tyle wpisów dziennie, ile potrzebujesz.</Text>

        <WeekCalendar
          selectedDateKey={selectedDateKey}
          onChangeDateKey={setSelectedDateKey}
          title="Kalendarz wdzięczności"
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Za co jesteś wdzięczny?</Text>
          <TextInput
            value={item}
            onChangeText={setItem}
            style={styles.input}
            placeholder="Np. dobra rozmowa, spacer, spokojny wieczór..."
            placeholderTextColor="rgba(255,255,255,0.45)"
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            style={[styles.input, styles.inputArea, { marginTop: 10 }]}
            placeholder="Dodatkowa notatka (opcjonalnie)"
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
          <Pressable style={[styles.plusBtn, busy && styles.btnDisabled]} onPress={onSave} disabled={busy}>
            <Text style={styles.plusBtnText}>{busy ? 'Dodawanie...' : '+ Dodaj wdzięczność'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Wpisy z dnia: {selectedDateKey}</Text>
          <Text style={styles.helpText}>Liczba wpisów: {dayEntries.length}</Text>
          {dayEntries.length === 0 ? <Text style={styles.helpText}>Brak wpisów na ten dzień.</Text> : null}
          {dayEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryTitle}>{entry.item}</Text>
                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
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
  inputArea: { minHeight: 86 },
  plusBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(120,200,255,0.2)',
  },
  plusBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  helpText: { marginTop: 6, color: SUB, fontSize: 13 },
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
  entryNote: { color: 'rgba(255,255,255,0.86)', fontSize: 13, marginTop: 3 },
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
