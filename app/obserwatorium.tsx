import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import { MenuSquareTile } from '@/components/MenuSquareTile';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useSingleNavigationPress } from '@/hooks/useSingleNavigationPress';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';

const SUB = 'rgba(255,255,255,0.88)';

type TileRoute = '/dziennik-uczucia' | '/lista-wyzwalaczy' | '/dziennik-kryzysu' | '/dziennik-wdziecznosci';

type ObservatoriumTile = {
  title: string;
  subtitle: string;
  route: TileRoute;
  visitedKey: string;
  accent: string;
  glow: string;
};

const ITEMS: ObservatoriumTile[] = [
  {
    title: 'Dziennik Uczuć',
    subtitle: 'Dwuklik dodaje uczucie, sytuację i sposób okazania.',
    route: '/dziennik-uczucia',
    visitedKey: '/dzienniki/uczucia',
    accent: '#7ED8BE',
    glow: 'rgba(126,216,190,0.26)',
  },
  {
    title: 'Lista wyzwalaczy',
    subtitle: 'Twoja prywatna lista sytuacji, miejsc i stanów podwyższonego ryzyka.',
    route: '/lista-wyzwalaczy',
    visitedKey: '/dzienniki/wyzwalacze',
    accent: '#C6D7FF',
    glow: 'rgba(198,215,255,0.24)',
  },
  {
    title: 'Dziennik Głodu/Kryzysu',
    subtitle: 'Szybki zapis napięcia, HALT i planu na najbliższe minuty.',
    route: '/dziennik-kryzysu',
    visitedKey: '/dzienniki/kryzys',
    accent: '#FF9E9E',
    glow: 'rgba(255,158,158,0.28)',
  },
  {
    title: 'Dziennik Wdzięczności',
    subtitle: 'Dodawaj własne wpisy i wracaj do nich w gorszym dniu.',
    route: '/dziennik-wdziecznosci',
    visitedKey: '/dzienniki/wdziecznosc',
    accent: '#FFD18A',
    glow: 'rgba(255,209,138,0.28)',
  },
];

export default function DziennikiHomeScreen() {
  const { height } = useWindowDimensions();
  const compact = height <= 900;
  const { swipeHintInset } = useSwipeHintInset();
  const { hasPremium, source } = usePremiumAccess();
  const { isVisited, markVisited } = useVisitedTiles();
  const { navigationLocked, runGuarded } = useSingleNavigationPress();

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
        <Text style={[styles.title, compact && styles.titleCompact]}>Obserwatorium 365</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Trzy dzienniki i lista wyzwalaczy.</Text>

        {source === 'tester_preview' ? (
          <View style={styles.testerBanner}>
            <Text style={styles.testerBannerText}>Tryb testerski premium: aktywny</Text>
          </View>
        ) : null}

        <View style={styles.instructionsCompact}>
          <Text style={styles.instructionsCompactTitle}>Opis i instrukcja</Text>
          <Text style={styles.instructionsCompactText}>Wybierz narzędzie, które najlepiej pasuje do tego, co dzieje się dziś.</Text>
        </View>
        <Text style={styles.focusLine}>Co chcesz dziś zaobserwować?</Text>

        {!hasPremium ? (
          <View style={[styles.card, compact && styles.cardCompact]}>
            <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>Ta część jest w premium</Text>
            <Text style={[styles.cardText, compact && styles.cardTextCompact]}>
              W tej sekcji znajdziesz dzienniki, listę wyzwalaczy i historię wpisów.
            </Text>
            <View style={styles.cardBullets}>
              <Text style={styles.cardBullet}>• Dziennik uczuć</Text>
              <Text style={styles.cardBullet}>• Lista wyzwalaczy</Text>
              <Text style={styles.cardBullet}>• Dziennik głodu/kryzysu</Text>
              <Text style={styles.cardBullet}>• Dziennik wdzięczności</Text>
            </View>
            <Text style={[styles.cardText, compact && styles.cardTextCompact]}>
              To miejsce ma pomóc Ci zobaczyć wzorce wcześniej, zanim dzień zacznie się rozjeżdżać.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                router.push({
                  pathname: '/dzienniki/paywall',
                  params: { backTo: '/obserwatorium' },
                })
              }
            >
              <Text style={styles.primaryBtnText}>Sprawdź premium</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.grid, styles.gridRaised]}>
            {ITEMS.map((item) => (
              <MenuSquareTile
                key={item.route}
                title={item.title}
                subtitle={item.subtitle}
                accent={item.accent}
                glow={item.glow}
                openedToday={isVisited(item.visitedKey)}
                disabled={navigationLocked}
                onPress={async () => {
                  await runGuarded(async () => {
                    await markVisited(item.visitedKey);
                    router.push({
                      pathname: item.route as any,
                      params: { backTo: '/obserwatorium' },
                    });
                  });
                }}
              />
            ))}
          </View>
        )}
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
  testerBanner: {
    backgroundColor: 'rgba(120, 200, 255, 0.18)',
    borderColor: 'rgba(120, 200, 255, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  testerBannerText: { color: '#CFEFFF', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  cardCompact: {
    padding: 10,
  },
  cardTitle: { color: 'white', fontSize: 23, lineHeight: 30, fontWeight: '700', marginBottom: 10 },
  cardTitleCompact: { fontSize: 18, lineHeight: 22, marginBottom: 8 },
  cardText: { color: 'rgba(232,245,255,0.84)', fontSize: 16, lineHeight: 23 },
  cardTextCompact: { fontSize: 14, lineHeight: 20 },
  cardBullets: {
    marginVertical: 10,
  },
  cardBullet: {
    color: 'rgba(232,245,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
