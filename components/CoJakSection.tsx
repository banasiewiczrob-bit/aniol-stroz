import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

export function CoJakSection({
  co,
  jak,
  title = 'Opis i instrukcja',
}: {
  co: string;
  jak: string;
  title?: string;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
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
          <Text style={styles.sectionTitle}>Co?</Text>
          <Text style={styles.text}>{co}</Text>

          <Text style={styles.sectionTitle}>Jak?</Text>
          <Text style={styles.text}>{jak}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  body: { marginTop: 12, gap: 6 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 },
  text: { color: 'rgba(255,255,255,0.74)', fontSize: 18, lineHeight: 27 },
});
