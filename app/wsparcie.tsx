import { router } from 'expo-router';
import { CoJakSection } from '@/components/CoJakSection';
import { BackButton } from '@/components/BackButton';
import { useSingleNavigationPress } from '@/hooks/useSingleNavigationPress';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';
import { SECTION_TILE } from '@/styles/sectionTiles';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const Watermark = require('../assets/images/maly_aniol.png');

type SupportRoute = {
  title: string;
  subtitle: string;
  accent: string;
  glow: string;
  route:
    | '/wsparcie-24'
    | '/wsparcie-12-krokow'
    | '/wsparcie-desiderata'
    | '/wsparcie-halt'
    | '/wsparcie-kontakt'
    | '/wsparcie-modlitwa'
    | '/wsparcie-siatka'
    | '/moje-doswiadczenie'
    | '/wsparcie-spolecznosc';
};

const ITEMS: SupportRoute[] = [
  { title: 'Siatka wsparcia', subtitle: 'Twoje kontakty pomocowe', accent: '#9EF3C7', glow: 'rgba(158,243,199,0.28)', route: '/wsparcie-siatka' },
  { title: 'Społeczność', subtitle: 'Discord i grupy wsparcia', accent: '#9AC7FF', glow: 'rgba(154,199,255,0.28)', route: '/wsparcie-spolecznosc' },
  { title: 'Kontakt', subtitle: 'Numery i szybkie akcje', accent: '#FFD18A', glow: 'rgba(255,209,138,0.28)', route: '/wsparcie-kontakt' },
  { title: 'Napisz, co Ci pomaga', subtitle: 'Twoja lista sprawdzonych sposobów', accent: '#FFC7D9', glow: 'rgba(255,199,217,0.28)', route: '/moje-doswiadczenie' },
];

export default function WsparcieScreen() {
  const { height } = useWindowDimensions();
  const compact = height <= 900;
  const { isVisited, markVisited } = useVisitedTiles();
  const { navigationLocked, runGuarded } = useSingleNavigationPress();

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
        <Text style={[styles.title, compact && styles.titleCompact]}>Wsparcie</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="To baza treści i narzędzi pomocowych, do których możesz wracać codziennie."
          jak="Wybierz materiał, który teraz najbardziej Cię wspiera. Pracuj krok po kroku, bez pośpiechu."
        />
        <Text style={[styles.subtext, compact && styles.subtextCompact]}>Wybierz materiał, z którego chcesz teraz skorzystać.</Text>

        {ITEMS.map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [
              styles.card,
              compact && styles.cardCompact,
              { borderColor: item.accent },
              isVisited(item.route) && styles.cardOpened,
              isVisited(item.route) && { backgroundColor: item.glow },
              pressed && styles.cardPressed,
            ]}
            disabled={navigationLocked}
            onPress={async () => {
              await runGuarded(async () => {
                await markVisited(item.route);
                router.push({
                  pathname: item.route as any,
                  params: { backTo: '/wsparcie' },
                });
              });
            }}
          >
            <View style={[styles.cardGlow, { backgroundColor: item.glow }]} />
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <View style={[styles.cardAccent, { backgroundColor: item.accent }]} />
            <View>
              <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardSubtitle, compact && styles.cardSubtitleCompact]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <Text style={[styles.arrow, compact && styles.arrowCompact]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061A2C' },
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
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 30 },
  contentCompact: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  title: { color: 'white', fontSize: 39, fontWeight: '900', marginBottom: 10 },
  titleCompact: { fontSize: 34, marginBottom: 6 },
  subtext: { color: 'rgba(232,245,255,0.84)', fontSize: 18, lineHeight: 26, marginBottom: 20 },
  subtextCompact: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  card: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    minHeight: SECTION_TILE.regular.minHeight,
    paddingVertical: SECTION_TILE.regular.paddingVertical,
    paddingHorizontal: SECTION_TILE.regular.paddingHorizontal,
    marginBottom: SECTION_TILE.regular.marginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  cardCompact: {
    minHeight: SECTION_TILE.compact.minHeight,
    paddingVertical: SECTION_TILE.compact.paddingVertical,
    paddingHorizontal: SECTION_TILE.compact.paddingHorizontal,
    marginBottom: SECTION_TILE.compact.marginBottom,
    borderRadius: 12,
  },
  cardOpened: {
    borderColor: 'rgba(222,244,255,0.98)',
    borderWidth: 2,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.992 }] },
  cardGlow: {
    position: 'absolute',
    width: SECTION_TILE.regular.glowSize,
    height: SECTION_TILE.regular.glowSize,
    borderRadius: SECTION_TILE.regular.glowRadius,
    top: SECTION_TILE.regular.glowTop,
    right: SECTION_TILE.regular.glowRight,
    opacity: 0.5,
  },
  cardAccent: {
    position: 'absolute',
    left: 14,
    top: 12,
    width: 36,
    height: 3,
    borderRadius: 999,
  },
  cardWatermark: {
    position: 'absolute',
    right: SECTION_TILE.regular.watermarkRight,
    bottom: SECTION_TILE.regular.watermarkBottom,
    width: SECTION_TILE.regular.watermarkWidth,
    height: SECTION_TILE.regular.watermarkHeight,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardTitle: { color: 'white', fontSize: SECTION_TILE.regular.titleFontSize, lineHeight: SECTION_TILE.regular.titleLineHeight, fontWeight: '700' },
  cardTitleCompact: { fontSize: SECTION_TILE.compact.titleFontSize, lineHeight: SECTION_TILE.compact.titleLineHeight },
  cardSubtitle: {
    color: 'rgba(235,245,255,0.82)',
    fontSize: SECTION_TILE.regular.subtitleFontSize,
    lineHeight: SECTION_TILE.regular.subtitleLineHeight,
    marginTop: SECTION_TILE.regular.subtitleMarginTop,
  },
  cardSubtitleCompact: {
    fontSize: SECTION_TILE.compact.subtitleFontSize,
    lineHeight: SECTION_TILE.compact.subtitleLineHeight,
    marginTop: SECTION_TILE.compact.subtitleMarginTop,
  },
  arrow: { color: '#78C8FF', fontSize: 31, fontWeight: '700' },
  arrowCompact: { fontSize: 24 },
});
