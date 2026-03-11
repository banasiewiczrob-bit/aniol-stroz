import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import { DISCORD_INVITE_URL } from '@/constants/community';
import React, { useMemo } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#061A2C';
const ACCENT_BG = 'rgba(154,199,255,0.22)';
const ACCENT_BORDER = 'rgba(154,199,255,0.55)';
const CARD_BG = 'rgba(12,38,62,0.78)';
const CARD_BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const Watermark = require('../assets/images/maly_aniol.png');

function normalizeDiscordLink(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('discord://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function WsparcieSpolecznoscDiscordScreen() {
  const link = useMemo(() => normalizeDiscordLink(DISCORD_INVITE_URL), []);
  const { swipeHintInset } = useSwipeHintInset();

  const openDiscord = async () => {
    if (!link) {
      Alert.alert(
        'Brak linku społeczności',
        'Ustaw EXPO_PUBLIC_DISCORD_INVITE_URL w konfiguracji środowiska, aby otwierać społeczność Discord.'
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(link);
      if (!canOpen) {
        Alert.alert('Nie mogę otworzyć linku', 'Sprawdź ustawienia telefonu lub poprawność linku Discord.');
        return;
      }
      await Linking.openURL(link);
    } catch (e) {
      console.error('Błąd otwierania Discord:', e);
      Alert.alert('Błąd', 'Nie udało się otworzyć społeczności Discord.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Społeczność</Text>
        <Text style={styles.subtitle}>
          Społeczność Anioł Stróż działa na Discordzie. 
          Możesz do niej dołączyć i brać udział w rozmowach, wsparciu i otrzymywać najnowsze informacje o aktualizacjach. Dołączając, zakceptuj zasady społeczności, które znajdziesz na serwerze. Zapraszam serdecznie!
        </Text>
        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <Text style={styles.cardTitle}>Poza tym, na serwerze znajdziesz:</Text>
          <Text style={styles.cardText}>• Start i zasady, żeby szybko wejść w rytm społeczności.</Text>
          <Text style={styles.cardText}>• Kanały tematyczne: historie, feedback i codzienne wsparcie.</Text>
          <Text style={styles.cardText}>• Opcjonalny kanał głosowy, gdy chcesz pogadać na żywo.</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => void openDiscord()}>
          <Text style={styles.primaryBtnText}>Otwórz Discord</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(154,199,255,0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(120,169,233,0.09)',
    bottom: 110,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: 'relative' },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: SUB, fontSize: 17, lineHeight: 25, marginBottom: 14 },
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  cardText: { color: SUB, fontSize: 14, lineHeight: 22, marginBottom: 2 },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
