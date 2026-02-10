import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
};

const STORAGE_KEY = '@daily_task';
const BG = '#071826';
const SUB = 'rgba(255,255,255,0.7)';

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
  };
}

export default function PlanScreen() {
  const todayKey = useMemo(() => getDateKey(), []);
  const [plan, setPlan] = useState<DailyPlan>(emptyPlan(todayKey));

  useEffect(() => {
    loadPlan();
  }, [todayKey]);

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
      });
    } catch (e) {
      console.error('Błąd odczytu planu dnia:', e);
      setPlan(emptyPlan(todayKey));
    }
  };

  const savePlan = async (next: DailyPlan) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Błąd zapisu planu dnia:', e);
    }
  };

  const updateText = (key: 'self' | 'duties' | 'relations' | 'challenge', value: string) => {
    const next = { ...plan, [key]: value };
    setPlan(next);
    savePlan(next);
  };

  const toggleDone = (key: keyof DoneState) => {
    const next = { ...plan, done: { ...plan.done, [key]: !plan.done[key] } };
    setPlan(next);
    savePlan(next);
  };

  const toggleHalt = (key: keyof HaltState) => {
    const next = { ...plan, halt: { ...plan.halt, [key]: !plan.halt[key] } };
    setPlan(next);
    savePlan(next);
  };

  const completedCount = Object.values(plan.done).filter(Boolean).length;
  const haltCount = Object.values(plan.halt).filter(Boolean).length;
  const score = completedCount - haltCount;

  const mood = (() => {
    if (score <= 0) return { emoji: '☹️', label: 'Słaby bilans dnia' };
    if (score === 1) return { emoji: '🙂', label: 'Jest progres' };
    if (score === 2) return { emoji: '😊', label: 'Dobry dzień' };
    if (score === 3) return { emoji: '😄', label: 'Bardzo dobry dzień' };
    return { emoji: '😁', label: 'Świetnie! 4 wykonania' };
  })();

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plan dnia</Text>
        <Text style={styles.dateLabel}>Dzisiaj: {todayKey}</Text>
        <Text style={styles.instructions}>
          Zaplanuj na dziś po jednej rzeczy z każdego obszaru: dla siebie, obowiązki, relacje.
          Dodaj jedno zadanie extra (challenge).
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Twój plan na dziś</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreEmoji}>{mood.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>{mood.label}</Text>
              <Text style={styles.scoreMeta}>
                Punkty: {completedCount} (plan) - {haltCount} (HALT) = {score}
              </Text>
            </View>
          </View>
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
            <Text style={[styles.previewLine, plan.done.challenge && styles.previewLineDone]}>4. Extra (challenge): {plan.challenge || '—'}</Text>
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
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 56, paddingBottom: 40 },
  title: { color: 'white', fontSize: 36, fontWeight: '900', marginBottom: 4 },
  dateLabel: { color: '#78C8FF', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  instructions: { color: SUB, fontSize: 16, lineHeight: 23, marginBottom: 16 },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 14,
  },
  previewTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.18)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  scoreEmoji: { fontSize: 30, marginRight: 10 },
  scoreLabel: { color: 'white', fontSize: 16, fontWeight: '700' },
  scoreMeta: { color: SUB, fontSize: 14, marginTop: 2 },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  previewCheck: { color: '#78C8FF', fontSize: 22, width: 24 },
  previewLine: { color: SUB, fontSize: 16, lineHeight: 22, flex: 1 },
  previewLineDone: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.45)' },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: '#78C8FF', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  fieldLabel: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(7, 24, 38, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.16)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },
  haltCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 16,
  },
  haltIntro: { color: SUB, fontSize: 16, marginBottom: 8 },
  haltItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  haltCheck: { color: '#78C8FF', fontSize: 22, width: 30 },
  haltText: { color: 'white', fontSize: 17 },
});
