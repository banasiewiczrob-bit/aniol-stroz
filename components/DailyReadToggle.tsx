import { DAILY_TEXTS_STORAGE_KEY, DailyTextId, DailyTextsPayload, EMPTY_DAILY_TEXTS, getDateKey } from '@/constants/daily-texts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function DailyReadToggle({ id }: { id: DailyTextId }) {
  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void load();
  }, [todayKey, id]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
      if (!raw) {
        setChecked(false);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        setChecked(false);
        return;
      }
      const value = parsed as Partial<DailyTextsPayload>;
      if (value.dateKey !== todayKey || !value.done || typeof value.done !== 'object') {
        setChecked(false);
        return;
      }
      setChecked(Boolean((value.done as Partial<Record<DailyTextId, boolean>>)[id]));
    } catch {
      setChecked(false);
    }
  };

  const toggle = async () => {
    const nextChecked = !checked;
    setChecked(nextChecked);
    try {
      const raw = await AsyncStorage.getItem(DAILY_TEXTS_STORAGE_KEY);
      let nextDone = { ...EMPTY_DAILY_TEXTS };
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const value = parsed as Partial<DailyTextsPayload>;
          if (value.dateKey === todayKey && value.done && typeof value.done === 'object') {
            nextDone = { ...nextDone, ...(value.done as Partial<Record<DailyTextId, boolean>>) };
          }
        }
      }
      nextDone[id] = nextChecked;
      const payload: DailyTextsPayload = { dateKey: todayKey, done: nextDone };
      await AsyncStorage.setItem(DAILY_TEXTS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Intentionally silent: toggle should still be responsive in UI.
    }
  };

  return (
    <Pressable style={styles.wrap} onPress={toggle}>
      <Text style={styles.check}>{checked ? '☑' : '☐'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Przeczytałem</Text>
        <Text style={styles.sub}>Zalicza się do realizacji planu dnia</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: { color: '#78C8FF', fontSize: 28, width: 32 },
  title: { color: 'white', fontSize: 22, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 17, marginTop: 3, lineHeight: 22 },
});
