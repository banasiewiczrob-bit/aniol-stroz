import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

type TileProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

function JournalTile({ title, subtitle, onPress }: TileProps) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function DziennikiHomeScreen() {
  const { hasPremium, source } = usePremiumAccess();

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Obserwatorium 365</Text>
        <Text style={styles.subtitle}>Trzy oddzielne dzienniki do pracy własnej.</Text>

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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dostęp premium wymagany</Text>
            <Text style={styles.cardText}>Ta sekcja będzie dostępna po odblokowaniu wersji premium.</Text>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Wybierz dziennik</Text>
              <JournalTile
                title="Dziennik Uczuć"
                subtitle="Rozpoznaj emocję i zapisz, co się dzieje."
                onPress={() =>
                  router.push({
                    pathname: '/dzienniki/uczucia',
                    params: { backTo: '/dzienniki' },
                  })
                }
              />
              <JournalTile
                title="Dziennik Głodu/Kryzysu"
                subtitle="Szybki zapis napięcia, HALT i plan 15 minut."
                onPress={() =>
                  router.push({
                    pathname: '/dzienniki/kryzys',
                    params: { backTo: '/dzienniki' },
                  })
                }
              />
              <JournalTile
                title="Dziennik Wdzięczności"
                subtitle="Dodawaj dowolną liczbę wpisów wdzięczności każdego dnia."
                onPress={() =>
                  router.push({
                    pathname: '/dzienniki/wdziecznosc',
                    params: { backTo: '/dzienniki' },
                  })
                }
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
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { color: 'white', fontSize: 38, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: SUB, fontSize: 20, lineHeight: 28, marginBottom: 20 },
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
  cardTitle: { color: 'white', fontSize: 23, lineHeight: 30, fontWeight: '700', marginBottom: 10 },
  cardText: { color: SUB, fontSize: 18, lineHeight: 26 },
  tile: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tileTitle: { color: 'white', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  tileSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 19, lineHeight: 26, marginTop: 4, fontWeight: '500' },
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
