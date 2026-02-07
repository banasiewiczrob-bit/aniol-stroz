import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { SCREEN_PADDING } from '@/styles/screenStyles';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PlanScreen() {
  const [planDate, setPlanDate] = useState<string>('');
  const [tasks, setTasks] = useState([
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
  ]);
  const [challenge, setChallenge] = useState('');
  const [challengeDone, setChallengeDone] = useState(false);
  const [halt, setHalt] = useState({ hungry: false, angry: false, lonely: false, tired: false });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('21:00');
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{
    date: string;
    tasks: { text: string; done: boolean }[];
    challenge: string;
    challengeDone: boolean;
    halt: { hungry: boolean; angry: boolean; lonely: boolean; tired: boolean };
  }>>([]);
  const [historyWindow, setHistoryWindow] = useState<7 | 30>(7);

  // Ładowanie planu przy starcie
  useEffect(() => {
    loadPlan();
  }, []);

  const todayKey = () => new Date().toISOString().slice(0, 10);

  const savePlan = async (
    nextDate: string,
    nextTasks: { text: string; done: boolean }[],
    nextChallenge: string,
    nextChallengeDone: boolean,
    nextHalt: { hungry: boolean; angry: boolean; lonely: boolean; tired: boolean },
    nextHistory: typeof history
  ) => {
    try {
      await AsyncStorage.setItem(
        '@daily_plan_v2',
        JSON.stringify({
          date: nextDate,
          tasks: nextTasks,
          challenge: nextChallenge,
          challengeDone: nextChallengeDone,
          halt: nextHalt,
        })
      );
      await AsyncStorage.setItem('@daily_plan_history_v2', JSON.stringify(nextHistory));
    } catch (e) {
      console.error("Błąd zapisu", e);
    }
  };

  const loadPlan = async () => {
    try {
      const [savedPlan, savedHistory, savedReminder] = await Promise.all([
        AsyncStorage.getItem('@daily_plan_v2'),
        AsyncStorage.getItem('@daily_plan_history_v2'),
        AsyncStorage.getItem('@daily_plan_reminder_v2'),
      ]);

      const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];
      setHistory(parsedHistory);
      if (savedReminder) {
        const parsed = JSON.parse(savedReminder);
        setReminderEnabled(!!parsed.enabled);
        setReminderTime(parsed.time || '21:00');
        setReminderId(parsed.id || null);
      }

      const today = todayKey();
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (parsed?.date && parsed.date !== today) {
          const nextHistory = [
            {
              date: parsed.date,
              tasks: parsed.tasks || [],
              challenge: parsed.challenge || '',
              challengeDone: !!parsed.challengeDone,
              halt: parsed.halt || { hungry: false, angry: false, lonely: false, tired: false },
            },
            ...parsedHistory,
          ].slice(0, 30);
          setHistory(nextHistory);
          setPlanDate(today);
          setTasks([
            { text: '', done: false },
            { text: '', done: false },
            { text: '', done: false },
          ]);
          setChallenge('');
          setChallengeDone(false);
          setHalt({ hungry: false, angry: false, lonely: false, tired: false });
          savePlan(
            today,
            [
              { text: '', done: false },
              { text: '', done: false },
              { text: '', done: false },
            ],
            '',
            false,
            { hungry: false, angry: false, lonely: false, tired: false },
            nextHistory
          );
          return;
        }
        setPlanDate(parsed.date || today);
        setTasks(parsed.tasks || [
          { text: '', done: false },
          { text: '', done: false },
          { text: '', done: false },
        ]);
        setChallenge(parsed.challenge || '');
        setChallengeDone(!!parsed.challengeDone);
        setHalt(parsed.halt || { hungry: false, angry: false, lonely: false, tired: false });
        return;
      }

      setPlanDate(today);
    } catch (e) {
      console.error("Błąd odczytu", e);
    }
  };

  const updateTaskText = (index: number, text: string) => {
    const nextTasks = tasks.map((t, i) => (i === index ? { ...t, text } : t));
    setTasks(nextTasks);
    savePlan(planDate || todayKey(), nextTasks, challenge, challengeDone, halt, history);
  };

  const toggleTaskDone = (index: number) => {
    const nextTasks = tasks.map((t, i) => (i === index ? { ...t, done: !t.done } : t));
    setTasks(nextTasks);
    savePlan(planDate || todayKey(), nextTasks, challenge, challengeDone, halt, history);
  };

  const updateChallenge = (text: string) => {
    setChallenge(text);
    savePlan(planDate || todayKey(), tasks, text, challengeDone, halt, history);
  };

  const toggleChallengeDone = () => {
    const next = !challengeDone;
    setChallengeDone(next);
    savePlan(planDate || todayKey(), tasks, challenge, next, halt, history);
  };

  const toggleHalt = (key: 'hungry' | 'angry' | 'lonely' | 'tired') => {
    const next = { ...halt, [key]: !halt[key] };
    setHalt(next);
    savePlan(planDate || todayKey(), tasks, challenge, challengeDone, next, history);
  };

  const saveNow = () => {
    savePlan(planDate || todayKey(), tasks, challenge, challengeDone, halt, history);
    Alert.alert('Zapisano', 'Plan dnia został zapisany.');
  };

  const parseReminderTime = (value: string) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
    if (!match) return null;
    return { hour: Number(match[1]), minute: Number(match[2]) };
  };

  const getNotifications = async () => {
    try {
      return await import('expo-notifications');
    } catch (e) {
      Alert.alert(
        'Brak modułu powiadomień',
        'Aby włączyć przypomnienia, zainstaluj expo-notifications i przebuduj aplikację.'
      );
      return null;
    }
  };

  const saveReminder = async (enabled: boolean, time: string, id: string | null) => {
    await AsyncStorage.setItem(
      '@daily_plan_reminder_v2',
      JSON.stringify({ enabled, time, id })
    );
  };

  const scheduleReminder = async (time: string) => {
    const parsed = parseReminderTime(time);
    if (!parsed) return null;
    const { hour, minute } = parsed;

    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    await Notifications.setNotificationChannelAsync('plan-reminders', {
      name: 'Plan dnia',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Podsumowanie dnia',
        body: 'Zrób krótkie HALT i domknij plan dnia.',
      },
      trigger: { hour, minute, repeats: true },
    });
    return id;
  };

  const toggleReminder = async () => {
    if (reminderEnabled) {
      const Notifications = await getNotifications();
      if (!Notifications) return;
      if (reminderId) {
        await Notifications.cancelScheduledNotificationAsync(reminderId);
      }
      setReminderEnabled(false);
      setReminderId(null);
      await saveReminder(false, reminderTime, null);
      return;
    }

    const id = await scheduleReminder(reminderTime);
    if (id) {
      setReminderEnabled(true);
      setReminderId(id);
      await saveReminder(true, reminderTime, id);
    }
  };

  const updateReminderTime = async (value: string) => {
    setReminderTime(value);
    if (!reminderEnabled) {
      await saveReminder(false, value, reminderId);
      return;
    }
    const Notifications = await getNotifications();
    if (!Notifications) return;
    if (reminderId) await Notifications.cancelScheduledNotificationAsync(reminderId);
    const id = await scheduleReminder(value);
    setReminderId(id);
    await saveReminder(!!id, value, id);
    setReminderEnabled(!!id);
  };

  const stats = useMemo(() => {
    const all = history.flatMap((h) => h.tasks.filter((t) => t.text.trim().length > 0));
    const done = all.filter((t) => t.done).length;
    const total = all.length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    const points = history.reduce((sum, h) => {
      const taskPoints = h.tasks.filter((t) => t.text.trim().length > 0 && t.done).length;
      const challengePoints = h.challenge && h.challengeDone ? 1 : 0;
      const haltPoints = Object.values(h.halt || {}).filter(Boolean).length;
      return sum + taskPoints + challengePoints + haltPoints;
    }, 0);
    return { total, done, rate, points };
  }, [history]);

  const todayPoints =
    tasks.filter((t) => t.text.trim().length > 0 && t.done).length +
    (challenge.trim().length > 0 && challengeDone ? 1 : 0) +
    Object.values(halt).filter(Boolean).length;

  const weeklyBars = useMemo(() => {
    const today = todayKey();
    const allDays = [
      {
        date: today,
        tasks,
        challenge,
        challengeDone,
        halt,
      },
      ...history,
    ];
    const last7: { date: string; points: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = allDays.find((x) => x.date === key);
      const points = day
        ? day.tasks.filter((t) => t.text.trim().length > 0 && t.done).length +
          (day.challenge && day.challengeDone ? 1 : 0) +
          Object.values(day.halt || {}).filter(Boolean).length
        : 0;
      last7.push({ date: key, points });
    }
    const max = Math.max(1, ...last7.map((d) => d.points));
    return { data: last7, max };
  }, [tasks, challenge, challengeDone, halt, history]);

  return (
    <BackgroundWrapper>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Plan dnia</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Instrukcja obsługi</Text>
          <Text style={styles.infoText}>
            Zaplanuj dzień! Wystarczą 2–3 rzeczy do zrobienia dziś.{'\n'}
            Dodaj jedno wyzwanie, by przekraczać ograniczenia.{'\n'}
            Wieczorem zrób krótkie podsumowanie planu dnia, wyzwania i HALT.
            Twoje plany zapisują się automatycznie i budują statystyki realizacji.
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Kartka na ścianę</Text>
          <Text style={styles.noteLine}>Plan na dziś:</Text>
          {tasks.filter((t) => t.text.trim().length > 0).length === 0 ? (
            <Text style={styles.noteMuted}>Brak wpisów</Text>
          ) : (
            tasks
              .filter((t) => t.text.trim().length > 0)
              .map((t, i) => (
                <Text key={`note-task-${i}`} style={styles.noteText}>
                  {t.done ? '✓' : '•'} {t.text}
                </Text>
              ))
          )}
          <Text style={[styles.noteLine, { marginTop: 8 }]}>Wyzwanie:</Text>
          <Text style={styles.noteText}>
            {challenge.trim().length > 0 ? `${challengeDone ? '✓' : '•'} ${challenge}` : 'Brak'}
          </Text>
          <Text style={[styles.noteLine, { marginTop: 8 }]}>HALT:</Text>
          <Text style={styles.noteText}>
            {[
              halt.hungry && 'Głodny',
              halt.angry && 'Zezłoszczony',
              halt.lonely && 'Samotny',
              halt.tired && 'Zmęczony',
            ]
              .filter(Boolean)
              .join(', ') || 'Brak'}
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.subtitle}>ZAPLANUJ 2–3 RZECZY:</Text>

          {tasks.map((t, index) => (
            <View key={`task-${index}`} style={styles.taskRow}>
              <TouchableOpacity
                style={styles.taskToggle}
                onPress={() => toggleTaskDone(index)}
              >
                <Ionicons
                  name={t.done ? "checkmark-circle" : "ellipse-outline"}
                  size={26}
                  color={t.done ? "#78C8FF" : "#D1D1D1"}
                />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, t.done && styles.inputDone]}
                placeholder={`Zadanie ${index + 1}...`}
                placeholderTextColor="#666"
                value={t.text}
                onChangeText={(txt) => updateTaskText(index, txt)}
                multiline
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          ))}

          <View style={styles.challengeWrap}>
            <Text style={styles.subtitle}>WYZWANIE NA DZIŚ czyli (czeledż):</Text>
            <TextInput
              style={styles.challengeInput}
              placeholder="Np. 30 min spaceru bez telefonu"
              placeholderTextColor="#666"
              value={challenge}
              onChangeText={updateChallenge}
              multiline
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <TouchableOpacity
              style={styles.challengeToggle}
              onPress={toggleChallengeDone}
            >
              <Ionicons
                name={challengeDone ? "checkmark-circle" : "ellipse-outline"}
                size={26}
                color={challengeDone ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={[styles.buttonText, challengeDone && styles.buttonTextDone]}>
                {challengeDone ? "Wyzwanie wykonane" : "Oznacz wyzwanie jako wykonane"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveNow}>
            <Text style={styles.saveBtnText}>Zapisz plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reminderCard}>
          <Text style={styles.statsTitle}>Przypomnienie wieczorne</Text>
          <Text style={styles.summaryHint}>Codziennie o wybranej godzinie.</Text>
          <View style={styles.reminderRow}>
            <TouchableOpacity style={styles.reminderToggle} onPress={toggleReminder}>
              <Ionicons
                name={reminderEnabled ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={reminderEnabled ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={[styles.buttonText, reminderEnabled && styles.buttonTextDone]}>
                {reminderEnabled ? "Włączone" : "Wyłączone"}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              placeholderTextColor="#666"
              value={reminderTime}
              onChangeText={updateReminderTime}
              maxLength={5}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.statsTitle}>Podsumowanie dnia (HALT)</Text>
          <Text style={styles.summaryHint}>Zaznacz wieczorem:</Text>
          <View style={styles.summaryRow}>
            <TouchableOpacity style={styles.summaryItem} onPress={() => toggleHalt('hungry')}>
              <Ionicons
                name={halt.hungry ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={halt.hungry ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={styles.summaryText}>Głodny</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.summaryItem} onPress={() => toggleHalt('angry')}>
              <Ionicons
                name={halt.angry ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={halt.angry ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={styles.summaryText}>Zezłoszczony</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.summaryItem} onPress={() => toggleHalt('lonely')}>
              <Ionicons
                name={halt.lonely ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={halt.lonely ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={styles.summaryText}>Samotny</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.summaryItem} onPress={() => toggleHalt('tired')}>
              <Ionicons
                name={halt.tired ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={halt.tired ? "#78C8FF" : "#D1D1D1"}
              />
              <Text style={styles.summaryText}>Zmęczony</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statystyki realizacji planów</Text>
          <Text style={styles.statsLine}>Wykonane: {stats.done} / {stats.total}</Text>
          <Text style={styles.statsLine}>Skuteczność: {stats.rate}%</Text>
          <Text style={styles.statsLine}>Punkty łącznie: {stats.points}</Text>
          <Text style={styles.statsLine}>Punkty dziś: {todayPoints}</Text>
        </View>

        <View style={styles.weeklyCard}>
          <Text style={styles.statsTitle}>Podsumowanie tygodnia</Text>
          <View style={styles.weeklyBars}>
            {weeklyBars.data.map((d) => {
              const height = Math.round((d.points / weeklyBars.max) * 90);
              return (
                <View key={d.date} style={styles.weeklyBarWrap}>
                  <View style={[styles.weeklyBar, { height }]} />
                  <Text style={styles.weeklyLabel}>{d.date.slice(5)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {history.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.statsTitle}>Historia planów</Text>
              <View style={styles.historyFilters}>
                <TouchableOpacity
                  style={[styles.filterBtn, historyWindow === 7 && styles.filterBtnActive]}
                  onPress={() => setHistoryWindow(7)}
                >
                  <Text style={styles.filterText}>7 dni</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, historyWindow === 30 && styles.filterBtnActive]}
                  onPress={() => setHistoryWindow(30)}
                >
                  <Text style={styles.filterText}>30 dni</Text>
                </TouchableOpacity>
              </View>
            </View>
            {history.slice(0, historyWindow).map((h) => {
              const total = h.tasks.filter((t) => t.text.trim().length > 0).length;
              const done = h.tasks.filter((t) => t.text.trim().length > 0 && t.done).length;
              const points =
                done +
                (h.challenge && h.challengeDone ? 1 : 0) +
                Object.values(h.halt || {}).filter(Boolean).length;
              return (
                <View key={h.date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{h.date}</Text>
                  <Text style={styles.historyValue}>{done}/{total} • {points} pkt</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { ...SCREEN_PADDING, flexGrow: 1 },
  title: { ...TYPE.display, color: '#FFFFFF', marginBottom: 30 },
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  subtitle: { ...TYPE.caption, color: '#78C8FF', fontWeight: '800', marginBottom: 15, letterSpacing: 1 },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 14,
    marginBottom: 16,
  },
  infoTitle: { ...TYPE.bodySmall, color: '#78C8FF', fontWeight: '800', marginBottom: 6 },
  infoText: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)' },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.18)',
    padding: 14,
    marginBottom: 16,
  },
  noteTitle: { ...TYPE.h3, color: '#78C8FF', marginBottom: 6 },
  noteLine: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)' },
  noteText: { ...TYPE.bodySmall, color: '#D1D1D1', marginTop: 4 },
  noteMuted: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  taskToggle: { paddingTop: 4 },
  input: { 
    ...TYPE.body,
    color: '#D1D1D1', // Jasnoszary tekst
    minHeight: 48,
    textAlignVertical: 'top',
    flex: 1,
  },
  inputDone: { 
    textDecorationLine: 'line-through', 
    color: 'rgba(209, 209, 209, 0.4)' 
  },
  challengeWrap: { marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  challengeInput: {
    ...TYPE.body,
    color: '#D1D1D1',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  challengeToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  buttonText: { ...TYPE.bodySmall, color: '#D1D1D1', marginLeft: 8 },
  buttonTextDone: { color: '#78C8FF', fontWeight: 'bold' },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(120, 200, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#78C8FF',
  },
  saveBtnText: { ...TYPE.button, color: 'white' },
  summaryCard: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  reminderCard: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 80,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#D1D1D1',
    textAlign: 'center',
  },
  summaryHint: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  summaryRow: { flexDirection: 'column', gap: 10 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { ...TYPE.bodySmall, color: '#D1D1D1', flexShrink: 1 },
  statsCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  statsTitle: { ...TYPE.caption, color: '#78C8FF', fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  statsLine: { ...TYPE.body, color: '#D1D1D1', marginBottom: 4 },
  historyCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  historyDate: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)' },
  historyValue: { color: '#78C8FF', fontWeight: '700' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyFilters: { flexDirection: 'row', gap: 6 },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.3)',
  },
  filterBtnActive: { backgroundColor: 'rgba(120,200,255,0.2)' },
  filterText: { ...TYPE.caption, color: '#78C8FF', fontWeight: '600' },
  weeklyCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  weeklyBars: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  weeklyBarWrap: { alignItems: 'center', width: 34 },
  weeklyBar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: '#78C8FF',
    marginBottom: 6,
  },
  weeklyLabel: { ...TYPE.caption, color: 'rgba(255,255,255,0.7)' },
});
