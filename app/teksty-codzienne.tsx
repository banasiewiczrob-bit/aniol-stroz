import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { useSingleNavigationPress } from '@/hooks/useSingleNavigationPress';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';
import { SECTION_TILE } from '@/styles/sectionTiles';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG_CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(255,255,255,0.72)';
const Watermark = require('../assets/images/maly_aniol.png');

type RoutePath =
  | '/wsparcie-modlitwa'
  | '/wsparcie-24'
  | '/wsparcie-halt'
  | '/wsparcie-12-krokow'
  | '/wsparcie-desiderata';

type TileItem = {
  title: string;
  subtitle: string;
  to: RoutePath;
  accent: string;
  glow: string;
};

const items: TileItem[] = [
  {
    title: 'Modlitwa o pogodę ducha',
    subtitle: 'Kilka zwykłych słów',
    to: '/wsparcie-modlitwa',
    accent: '#9EE7D8',
    glow: 'rgba(158,231,216,0.28)',
  },
  {
    title: 'Właśnie dzisiaj',
    subtitle: 'Program na 24 godziny',
    to: '/wsparcie-24',
    accent: '#FFD18A',
    glow: 'rgba(255,209,138,0.28)',
  },
  {
    title: 'HALT',
    subtitle: 'Cztery ważne sprawy',
    to: '/wsparcie-halt',
    accent: '#FF9E9E',
    glow: 'rgba(255,158,158,0.28)',
  },
  {
    title: '12 kroków',
    subtitle: 'AA, NA, Al-Anon, SLAA i wersja uniwersalna',
    to: '/wsparcie-12-krokow',
    accent: '#8FAFD3',
    glow: 'rgba(143,175,211,0.28)',
  },
  {
    title: 'Desiderata',
    subtitle: 'Tekst do codziennego czytania',
    to: '/wsparcie-desiderata',
    accent: '#B8C6FF',
    glow: 'rgba(184,198,255,0.28)',
  },
];

function SectionTile({
  title,
  subtitle,
  to,
  accent,
  glow,
  openedToday,
  onOpen,
  compact,
  disabled,
}: TileItem & { openedToday: boolean; onOpen: (to: RoutePath) => void; compact: boolean; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        compact && styles.tileCompact,
        { borderColor: accent },
        openedToday && styles.tileOpened,
        openedToday && { backgroundColor: glow },
        pressed && styles.tilePressed,
      ]}
      onPress={() => onOpen(to)}
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

export default function TekstyCodzienneScreen() {
  const { isVisited, markVisited } = useVisitedTiles();
  const { navigationLocked, runGuarded } = useSingleNavigationPress();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height <= 900;

  return (
    <BackgroundWrapper>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          { paddingBottom: Math.max(140, insets.bottom + 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <Text style={[styles.title, compact && styles.titleCompact]}>Teksty codzienne</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Wybierz tekst i przejdź dalej.</Text>

        <View style={[styles.card, compact && styles.cardCompact]}>
          {items.map((item) => (
            <SectionTile
              key={item.title}
              {...item}
              compact={compact}
              openedToday={isVisited(item.to)}
              onOpen={async (to) => {
                await runGuarded(async () => {
                  await markVisited(to);
                  router.push({
                    pathname: to as any,
                    params: { backTo: '/teksty-codzienne' },
                  });
                });
              }}
              disabled={navigationLocked}
            />
          ))}
        </View>
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
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(118, 214, 255, 0.1)',
    top: -80,
    right: -80,
  },
  bgOrbB: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 208, 149, 0.08)',
    bottom: 120,
    left: -70,
  },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: 'rgba(232,245,255,0.84)', fontSize: 20, lineHeight: 28, marginBottom: 18 },
  titleCompact: { fontSize: 28, marginBottom: 4 },
  subtitleCompact: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
  },
  cardCompact: {
    padding: 8,
  },
  tile: {
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 12,
    minHeight: SECTION_TILE.regular.minHeight,
    paddingVertical: SECTION_TILE.regular.paddingVertical,
    paddingHorizontal: SECTION_TILE.regular.paddingHorizontal,
    marginBottom: SECTION_TILE.regular.marginBottom,
    overflow: 'hidden',
    position: 'relative',
  },
  tileCompact: {
    width: '100%',
    minHeight: SECTION_TILE.compact.minHeight,
    paddingVertical: SECTION_TILE.compact.paddingVertical,
    paddingHorizontal: SECTION_TILE.compact.paddingHorizontal,
    marginBottom: SECTION_TILE.compact.marginBottom,
  },
  tileOpened: {
    borderColor: 'rgba(222,244,255,0.98)',
    borderWidth: 2,
  },
  tilePressed: { opacity: 0.92, transform: [{ scale: 0.994 }] },
  tileGlow: {
    position: 'absolute',
    width: SECTION_TILE.regular.glowSize,
    height: SECTION_TILE.regular.glowSize,
    borderRadius: SECTION_TILE.regular.glowRadius,
    top: SECTION_TILE.regular.glowTop,
    right: SECTION_TILE.regular.glowRight,
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
    right: SECTION_TILE.regular.watermarkRight,
    bottom: SECTION_TILE.regular.watermarkBottom,
    width: SECTION_TILE.regular.watermarkWidth,
    height: SECTION_TILE.regular.watermarkHeight,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  tileTitle: { color: 'white', fontSize: SECTION_TILE.regular.titleFontSize, lineHeight: SECTION_TILE.regular.titleLineHeight, fontWeight: '700' },
  tileSubtitle: {
    color: 'rgba(235,245,255,0.82)',
    fontSize: SECTION_TILE.regular.subtitleFontSize,
    lineHeight: SECTION_TILE.regular.subtitleLineHeight,
    marginTop: SECTION_TILE.regular.subtitleMarginTop,
    fontWeight: '500',
  },
  tileTitleCompact: { fontSize: SECTION_TILE.compact.titleFontSize, lineHeight: SECTION_TILE.compact.titleLineHeight },
  tileSubtitleCompact: {
    fontSize: SECTION_TILE.compact.subtitleFontSize,
    lineHeight: SECTION_TILE.compact.subtitleLineHeight,
    marginTop: SECTION_TILE.compact.subtitleMarginTop,
  },
});
