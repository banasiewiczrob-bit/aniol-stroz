import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { WeekCalendar } from '@/components/journals/WeekCalendar';
import {
  BASE_EMOTIONS,
  clampIntensity,
  EMOTION_DETAILS_BY_BASE,
  getJournalDateKey,
  type BaseEmotion,
  type EmotionJournalEntry,
} from '@/constants/journals';
import { createEmotionJournalEntry, deleteJournalEntry, listJournalEntriesByDate } from '@/hooks/useJournals';
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

export default function DziennikUczucScreen() {
  const navigation = useNavigation();
  const [selectedDateKey, setSelectedDateKey] = useState(getJournalDateKey());
  const [baseEmotion, setBaseEmotion] = useState<BaseEmotion>('Strach');
  const [detailEmotion, setDetailEmotion] = useState<string>(EMOTION_DETAILS_BY_BASE['Strach'][0]);
  const [intensityText, setIntensityText] = useState('5');
  const [triggerNote, setTriggerNote] = useState('');
  const [needNote, setNeedNote] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [dayEntries, setDayEntries] = useState<EmotionJournalEntry[]>([]);

  const detailOptions = useMemo(() => EMOTION_DETAILS_BY_BASE[baseEmotion], [baseEmotion]);
  const intensityValue = clampIntensity(Number.parseInt(intensityText, 10));

  const loadDayEntries = useCallback(async () => {
    const entries = await listJournalEntriesByDate('emotion', selectedDateKey);
    setDayEntries(entries as EmotionJournalEntry[]);
  }, [selectedDateKey]);

  useFocusEffect(
    useCallback(() => {
      void loadDayEntries();
    }, [loadDayEntries])
  );

  const onSave = async () => {
    if (!detailEmotion.trim()) {
      Alert.alert('Brak doprecyzowania', 'Wybierz odcień emocji.');
      return;
    }

    setBusy(true);
    try {
      await createEmotionJournalEntry({
        dateKey: selectedDateKey,
        baseEmotion,
        detailEmotion,
        intensity: intensityValue,
        triggerNote,
        needNote,
        actionNote,
      });
      setTriggerNote('');
      setNeedNote('');
      setActionNote('');
      await loadDayEntries();
      Alert.alert('Zapisano', 'Wpis w Dzienniku Uczuć został zapisany.');
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
    setBaseEmotion(next);
    setDetailEmotion(EMOTION_DETAILS_BY_BASE[next][0]);
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dziennik Uczuć</Text>
        <Text style={styles.subtitle}>Zapisuj emocje dzień po dniu w układzie tygodniowym.</Text>

        <WeekCalendar selectedDateKey={selectedDateKey} onChangeDateKey={setSelectedDateKey} title="Kalendarz uczuć" />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Emocja bazowa</Text>
          <View style={styles.chipWrap}>
            {BASE_EMOTIONS.map((emotion) => {
              const active = emotion === baseEmotion;
              return (
                <Pressable
                  key={emotion}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onChangeBaseEmotion(emotion)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{emotion}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Odcień emocji</Text>
          <View style={styles.chipWrap}>
            {detailOptions.map((detail) => {
              const active = detail === detailEmotion;
              return (
                <Pressable
                  key={detail}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDetailEmotion(detail)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{detail}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Intensywność (0-10)</Text>
          <TextInput
            value={intensityText}
            onChangeText={setIntensityText}
            keyboardType="number-pad"
            maxLength={2}
            style={styles.input}
            placeholder="np. 5"
            placeholderTextColor="rgba(255,255,255,0.45)"
          />
          <Text style={styles.helpText}>Aktualna wartość: {intensityValue}/10</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Co to uruchomiło?</Text>
          <TextInput
            value={triggerNote}
            onChangeText={setTriggerNote}
            multiline
            style={[styles.input, styles.inputArea]}
            placeholder="Krótko opisz sytuację..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Czego teraz potrzebuję?</Text>
          <TextInput
            value={needNote}
            onChangeText={setNeedNote}
            multiline
            style={[styles.input, styles.inputArea]}
            placeholder="Np. spokoju, rozmowy, odpoczynku..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>6. Co zrobię teraz?</Text>
          <TextInput
            value={actionNote}
            onChangeText={setActionNote}
            multiline
            style={[styles.input, styles.inputArea]}
            placeholder="Najbliższy mały krok..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            textAlignVertical="top"
          />
        </View>

        <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={onSave} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Zapisywanie...' : 'Zapisz wpis'}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Wpisy z dnia: {selectedDateKey}</Text>
          {dayEntries.length === 0 ? <Text style={styles.helpText}>Brak wpisów na ten dzień.</Text> : null}
          {dayEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryTitle}>
                  {entry.baseEmotion} {'->'} {entry.detailEmotion} ({entry.intensity}/10)
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
  title: { color: 'white', fontSize: 33, fontWeight: '800', marginBottom: 8 },
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
  chipText: { color: 'rgba(255,255,255,0.86)', fontSize: 14, fontWeight: '600' },
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
