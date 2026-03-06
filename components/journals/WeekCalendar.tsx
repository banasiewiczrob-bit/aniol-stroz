import { getJournalDateKey, parseJournalDateKey } from '@/constants/journals';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'] as const;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

type WeekCalendarProps = {
  selectedDateKey: string;
  onChangeDateKey: (dateKey: string) => void;
  title?: string;
};

export function WeekCalendar({ selectedDateKey, onChangeDateKey, title = 'Bieżący tydzień' }: WeekCalendarProps) {
  const selectedDate = parseJournalDateKey(selectedDateKey) ?? new Date();
  const [weekAnchor, setWeekAnchor] = useState<Date>(startOfWeek(selectedDate));

  useEffect(() => {
    setWeekAnchor(startOfWeek(selectedDate));
  }, [selectedDateKey]);

  const weekDates = useMemo(() => {
    const start = startOfWeek(weekAnchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekAnchor]);

  const rangeLabel = `${weekDates[0].toLocaleDateString('pl-PL')} - ${weekDates[6].toLocaleDateString('pl-PL')}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.range}>{rangeLabel}</Text>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.navBtn} onPress={() => setWeekAnchor((prev) => addDays(prev, -7))}>
          <Text style={styles.navBtnText}>Poprzedni</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => setWeekAnchor((prev) => addDays(prev, 7))}>
          <Text style={styles.navBtnText}>Następny</Text>
        </Pressable>
      </View>

      <View style={styles.daysRow}>
        {weekDates.map((date, index) => {
          const dateKey = getJournalDateKey(date);
          const active = dateKey === selectedDateKey;
          return (
            <Pressable
              key={dateKey}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => onChangeDateKey(dateKey)}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{WEEKDAY_LABELS[index]}</Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>{date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { color: 'white', fontSize: 16, fontWeight: '700' },
  range: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  navBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  navBtnText: { color: 'rgba(255,255,255,0.86)', fontSize: 12, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dayBtnActive: {
    borderColor: 'rgba(120,200,255,0.6)',
    backgroundColor: 'rgba(120,200,255,0.2)',
  },
  dayLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '600' },
  dayLabelActive: { color: 'white' },
  dayNum: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700', marginTop: 2 },
  dayNumActive: { color: 'white' },
});

