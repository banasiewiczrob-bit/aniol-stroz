import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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
  icon: keyof typeof Ionicons.glyphMap;
};

const items: TileItem[] = [
  {
    title: 'Modlitwa o pogodę ducha',
    subtitle: 'Kilka zwykłych słów',
    to: '/wsparcie-modlitwa',
    accent: '#9EE7D8',
    glow: 'rgba(158,231,216,0.28)',
    icon: 'water-outline',
  },
  {
    title: 'Właśnie dzisiaj',
    subtitle: 'Program na 24 godziny',
    to: '/wsparcie-24',
    accent: '#FFD18A',
    glow: 'rgba(255,209,138,0.28)',
    icon: 'sunny-outline',
  },
  {
    title: 'HALT',
    subtitle: 'Cztery ważne sprawy',
    to: '/wsparcie-halt',
    accent: '#FF9E9E',
    glow: 'rgba(255,158,158,0.28)',
    icon: 'pulse-outline',
  },
  {
    title: '12 kroków',
    subtitle: 'AA, NA, Al-Anon, SLAA i wersja uniwersalna',
    to: '/wsparcie-12-krokow',
    accent: '#8FAFD3',
    glow: 'rgba(143,175,211,0.28)',
    icon: 'library-outline',
  },
  {
    title: 'Desiderata',
    subtitle: 'Tekst do codziennego czytania',
    to: '/wsparcie-desiderata',
    accent: '#B8C6FF',
    glow: 'rgba(184,198,255,0.28)',
    icon: 'moon-outline',
  },
];

function SectionTile({
  title,
  subtitle,
  to,
  accent,
  glow,
  icon,
  openedToday,
  onOpen,
  compact,
}: TileItem & { openedToday: boolean; onOpen: (to: RoutePath) => void; compact: boolean }) {
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
      onPress={() => onOpen(to)}
    >
      <View style={[styles.tileGlow, { backgroundColor: glow }]} />
      <Image source={Watermark} resizeMode="contain" style={styles.tileWatermark} />
      <View style={styles.tileTopRow}>
        <View style={[styles.tileAccent, { backgroundColor: accent }]} />
        <View style={[styles.iconBadge, compact && styles.iconBadgeCompact, { borderColor: accent, backgroundColor: glow }]}>
          <Ionicons name={icon} size={compact ? 16 : 18} color={accent} />
        </View>
      </View>
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
  const { height } = useWindowDimensions();
  const compact = height <= 900;

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
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
                await markVisited(to);
                router.push({
                  pathname: to as any,
                  params: { backTo: '/teksty-codzienne' },
                });
              }}
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
    padding: 12,
  },
  cardCompact: {
    padding: 6,
    gap: 6,
  },
  tile: {
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  tileCompact: {
    width: '100%',
    minHeight: 92,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 0,
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
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
  tileSubtitle: { color: 'rgba(235,245,255,0.84)', fontSize: 19, lineHeight: 26, marginTop: 6, fontWeight: '500' },
  tileTitleCompact: { fontSize: 16, lineHeight: 19 },
  tileSubtitleCompact: { fontSize: 11, lineHeight: 14, marginTop: 2 },
});
