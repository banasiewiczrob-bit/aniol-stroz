import { BackButton } from '@/components/BackButton';
import { DailyReadToggle } from '@/components/DailyReadToggle';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#061A2C';
const CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const Watermark = require('../../../assets/images/maly_aniol.png');

export default function RefleksjeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Codzienne refleksje</Text>
        <Text style={styles.subtitle}>
          Jedna refleksja na każdy dzień kalendarzowy. Wszyscy uczestnicy danego dnia słuchają tego samego nagrania.
        </Text>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#8FAFD3' }]} />
          <Text style={styles.cardTitle}>Dzisiejsza refleksja</Text>
          <Text style={styles.cardText}>Tutaj będzie odtwarzane nagranie przypisane do dzisiejszej daty.</Text>
          <Pressable style={styles.primaryBtn} disabled>
            <Text style={styles.primaryBtnText}>Odtwórz refleksję (wkrótce)</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#B8C6FF' }]} />
          <Text style={styles.cardTitle}>Archiwum 365</Text>
          <Text style={styles.cardText}>Tu pojawi się kalendarz refleksji z podziałem na daty i odsłuch nagrań.</Text>
        </View>

        <DailyReadToggle id="refleksje" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(118, 214, 255, 0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(184, 198, 255, 0.1)',
    bottom: 100,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: 'relative' },
  title: { color: 'white', fontSize: 38, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: SUB, fontSize: 18, lineHeight: 26, marginBottom: 18 },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  cardWatermark: {
    position: 'absolute',
    right: -22,
    bottom: -28,
    width: 140,
    height: 140,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardTitle: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  cardText: { color: SUB, fontSize: 17, lineHeight: 24 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
