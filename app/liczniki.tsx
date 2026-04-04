import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import { MenuSquareTile } from '@/components/MenuSquareTile';
import { useSingleNavigationPress } from '@/hooks/useSingleNavigationPress';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';

type CounterRoute = '/licznik' | '/licznik-strat';

type TileItem = {
  title: string;
  subtitle: string;
  to: CounterRoute;
  accent: string;
  glow: string;
};

const ITEMS: TileItem[] = [
  {
    title: 'Licznik zdrowienia',
    subtitle: 'Data startu, rocznice i Twoje odznaki.',
    to: '/licznik',
    accent: '#9EF3C7',
    glow: 'rgba(158,243,199,0.28)',
  },
  {
    title: 'Odrabianie strat',
    subtitle: 'Koszt kryzysu i to, co krok po kroku odzyskujesz.',
    to: '/licznik-strat',
    accent: '#FFD18A',
    glow: 'rgba(255,209,138,0.28)',
  },
];

export default function LicznikiScreen() {
  const { isVisited, markVisited } = useVisitedTiles();
  const { navigationLocked, runGuarded } = useSingleNavigationPress();
  const { height } = useWindowDimensions();
  const { swipeHintInset } = useSwipeHintInset();
  const compact = height <= 900;

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          { paddingBottom: compact ? Math.max(48, swipeHintInset + 12) : Math.max(56, swipeHintInset + 18) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, compact && styles.titleCompact]}>Liczniki</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          Dwa miejsca, które pomagają zobaczyć drogę zdrowienia i realnie odzyskiwać to, co zostało nadwyrężone.
        </Text>

        <View style={styles.instructionsCompact}>
          <Text style={styles.instructionsCompactTitle}>Opis i instrukcja</Text>
          <Text style={styles.instructionsCompactText}>Wybierz licznik, do którego chcesz teraz wejść.</Text>
        </View>
        <Text style={styles.focusLine}>Od czego chcesz dziś zacząć?</Text>

        <View style={[styles.grid, styles.gridRaised]}>
          {ITEMS.map((item) => (
            <MenuSquareTile
              key={item.to}
              title={item.title}
              subtitle={item.subtitle}
              accent={item.accent}
              glow={item.glow}
              openedToday={isVisited(item.to)}
              disabled={navigationLocked}
              onPress={async () => {
                await runGuarded(async () => {
                  await markVisited(item.to);
                  router.push({
                    pathname: item.to as any,
                    params: { backTo: '/liczniki' },
                  });
                });
              }}
            />
          ))}
        </View>
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
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  contentCompact: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: { color: 'white', fontSize: 34, fontWeight: '900', marginBottom: 4, letterSpacing: 0.2 },
  titleCompact: { fontSize: 30 },
  subtitle: {
    color: 'rgba(232,245,255,0.86)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 8,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 6,
  },
  instructionsCompact: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  instructionsCompactTitle: { color: 'white', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  instructionsCompactText: { color: 'rgba(232,245,255,0.82)', fontSize: 13, lineHeight: 18 },
  focusLine: {
    color: 'rgba(222,240,255,0.92)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  gridRaised: {
    marginTop: 4,
  },
});
