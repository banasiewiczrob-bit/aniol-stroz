import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const Watermark = require('../assets/images/maly_aniol.png');

type TileProps = {
  title: string;
  subtitle: string;
  accent: string;
  glow: string;
  openedToday: boolean;
  onPress: () => void;
  compact: boolean;
};

function JournalTile({ title, subtitle, accent, glow, openedToday, onPress, compact }: TileProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        compact && styles.tileCompact,
        { borderColor: accent },
        openedToday && styles.tileOpened,
        openedToday && { backgroundColor: glow },
        pressed && styles.tilePressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.tileGlow, { backgroundColor: glow }]} />
      <Image source={Watermark} resizeMode="contain" style={styles.tileWatermark} />
      <View style={[styles.tileAccent, { backgroundColor: accent }]} />
      <Text style={[styles.tileTitle, compact && styles.tileTitleCompact]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.tileSubtitle, compact && styles.tileSubtitleCompact]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function DziennikiHomeScreen() {
  const { height } = useWindowDimensions();
  const compact = height <= 900;
  const { hasPremium, source } = usePremiumAccess();
  const { isVisited, markVisited } = useVisitedTiles();

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <Text style={[styles.title, compact && styles.titleCompact]}>Obserwatorium 365</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Trzy oddzielne dzienniki do pracy własnej.</Text>

        {source === 'tester_preview' ? (
          <View style={styles.testerBanner}>
            <Text style={styles.testerBannerText}>Tryb testerski premium: aktywny</Text>
          </View>
        ) : null}

        <CoJakSection
          title="Opis i instrukcja"
          co="Tutaj masz trzy oddzielne dzienniki: Dziennik Uczuć, Dziennik Głodu/Kryzysu i Dziennik Wdzięczności."
          jak="Wybierz dziennik zgodnie z sytuacją. Uczucia na bieżąco, Kryzys gdy rośnie napięcie, Wdzięczność wieczorem."
        />

        {!hasPremium ? (
          <View style={[styles.card, compact && styles.cardCompact]}>
            <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>Dostęp premium wymagany</Text>
            <Text style={[styles.cardText, compact && styles.cardTextCompact]}>Ta sekcja będzie dostępna po odblokowaniu wersji premium.</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                router.push({
                  pathname: '/dzienniki/paywall',
                  params: { backTo: '/dzienniki' },
                })
              }
            >
              <Text style={styles.primaryBtnText}>Zobacz premium</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.card, compact && styles.cardCompact]}>
              <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>Wybierz dziennik</Text>
              <JournalTile
                title="Dziennik Uczuć"
                subtitle="Rozpoznaj emocję i zapisz, co się dzieje."
                accent="#9AC7FF"
                glow="rgba(154,199,255,0.28)"
                compact={compact}
                openedToday={isVisited('/dzienniki/uczucia')}
                onPress={async () => {
                  await markVisited('/dzienniki/uczucia');
                  router.push({
                    pathname: '/dziennik-uczucia',
                    params: { backTo: '/obserwatorium' },
                  });
                }}
              />
              <JournalTile
                title="Dziennik Głodu/Kryzysu"
                subtitle="Szybki zapis napięcia, HALT i plan 15 minut."
                accent="#FF9E9E"
                glow="rgba(255,158,158,0.28)"
                compact={compact}
                openedToday={isVisited('/dzienniki/kryzys')}
                onPress={async () => {
                  await markVisited('/dzienniki/kryzys');
                  router.push({
                    pathname: '/dziennik-kryzysu',
                    params: { backTo: '/obserwatorium' },
                  });
                }}
              />
              <JournalTile
                title="Dziennik Wdzięczności"
                subtitle="Dodawaj dowolną liczbę wpisów wdzięczności każdego dnia."
                accent="#FFD18A"
                glow="rgba(255,209,138,0.28)"
                compact={compact}
                openedToday={isVisited('/dzienniki/wdziecznosc')}
                onPress={async () => {
                  await markVisited('/dzienniki/wdziecznosc');
                  router.push({
                    pathname: '/dziennik-wdziecznosci',
                    params: { backTo: '/obserwatorium' },
                  });
                }}
              />
            </View>

          </>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: 'relative' },
  contentCompact: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
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
    backgroundColor: 'rgba(255, 208, 149, 0.08)',
    bottom: 110,
    left: -80,
  },
  title: { color: 'white', fontSize: 38, fontWeight: '800', marginBottom: 10 },
  titleCompact: { fontSize: 30, marginBottom: 4 },
  subtitle: { color: SUB, fontSize: 20, lineHeight: 28, marginBottom: 20 },
  subtitleCompact: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  testerBanner: {
    backgroundColor: 'rgba(120, 200, 255, 0.18)',
    borderColor: 'rgba(120, 200, 255, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  testerBannerText: { color: '#CFEFFF', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardCompact: {
    padding: 8,
    marginBottom: 8,
  },
  cardTitle: { color: 'white', fontSize: 23, lineHeight: 30, fontWeight: '700', marginBottom: 10 },
  cardTitleCompact: { fontSize: 16, lineHeight: 20, marginBottom: 6 },
  cardText: { color: SUB, fontSize: 18, lineHeight: 26 },
  cardTextCompact: { fontSize: 12, lineHeight: 16 },
  tile: {
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  tileCompact: {
    minHeight: 92,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 6,
  },
  tileOpened: {
    borderColor: 'rgba(222,244,255,0.98)',
    borderWidth: 2,
  },
  tilePressed: { opacity: 0.92, transform: [{ scale: 0.994 }] },
  tileGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -35,
    right: -28,
    opacity: 0.5,
  },
  tileAccent: {
    width: 42,
    height: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  tileWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 125,
    height: 125,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  tileTitle: { color: 'white', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  tileTitleCompact: { fontSize: 16, lineHeight: 19 },
  tileSubtitle: { color: 'rgba(235,245,255,0.84)', fontSize: 19, lineHeight: 26, marginTop: 6, fontWeight: '500' },
  tileSubtitleCompact: { fontSize: 11, lineHeight: 14, marginTop: 2 },
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
