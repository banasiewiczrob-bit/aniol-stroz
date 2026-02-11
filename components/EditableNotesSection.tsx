import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, TextInput, UIManager, View } from 'react-native';

type NotesPayload = {
  description: string;
  instruction: string;
};

export function EditableNotesSection({
  storageKey,
  title = 'Twoje notatki',
}: {
  storageKey: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    void load();
  }, [storageKey]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      const payload = parsed as Partial<NotesPayload>;
      setDescription(typeof payload.description === 'string' ? payload.description : '');
      setInstruction(typeof payload.instruction === 'string' ? payload.instruction : '');
    } catch {
      // no-op, user can still type
    }
  };

  const save = async (next: NotesPayload) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // no-op
    }
  };

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  const onChangeDescription = (value: string) => {
    setDescription(value);
    void save({ description: value, instruction });
  };

  const onChangeInstruction = (value: string) => {
    setInstruction(value);
    void save({ description, instruction: value });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable style={styles.toggleBtn} onPress={toggle}>
          <Text style={styles.toggleText}>{open ? 'Ukryj' : 'Rozwiń'}</Text>
        </Pressable>
      </View>

      {open && (
        <View style={styles.body}>
          <Text style={styles.label}>Opis</Text>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            multiline
            placeholder="Wpisz własny opis..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={[styles.input, styles.inputBig]}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Instrukcja</Text>
          <TextInput
            value={instruction}
            onChangeText={onChangeInstruction}
            multiline
            placeholder="Wpisz własną instrukcję..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={[styles.input, styles.inputBig]}
            textAlignVertical="top"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { color: 'white', fontSize: 19, fontWeight: '800' },
  toggleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    backgroundColor: 'rgba(120,200,255,0.14)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleText: { color: '#AEE1FF', fontSize: 14, fontWeight: '700' },
  body: { marginTop: 12 },
  label: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.18)',
    backgroundColor: 'rgba(7,24,38,0.6)',
    borderRadius: 12,
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  inputBig: { minHeight: 90 },
});
