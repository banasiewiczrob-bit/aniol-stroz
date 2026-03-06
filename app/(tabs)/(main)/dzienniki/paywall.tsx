import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const SUB = 'rgba(255,255,255,0.72)';

export default function DziennikiPaywallScreen() {
  const { hasPremium, source } = usePremiumAccess();

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dzienniki Premium</Text>
        <Text style={styles.subtitle}>Obserwatorium 365: codzienna praca własna i historia postępów.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Co odblokowuje premium</Text>
          <Text style={styles.cardText}>• Dziennik uczuć</Text>
          <Text style={styles.cardText}>• Dziennik głodu/kryzysu</Text>
          <Text style={styles.cardText}>• Dziennik wdzięczności</Text>
          <Text style={styles.cardText}>• Historia i insighty 7/30 dni</Text>
        </View>

        {source === 'tester_preview' && hasPremium ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Tryb testerski aktywny: dostęp premium jest odblokowany.</Text>
          </View>
        ) : (
          <View style={styles.bannerMuted}>
            <Text style={styles.bannerMutedText}>Docelowo tutaj podpinamy finalny zakup premium.</Text>
          </View>
        )}

        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/dzienniki')}>
          <Text style={styles.primaryBtnText}>{hasPremium ? 'Przejdź do dzienników' : 'Wróć'}</Text>
        </Pressable>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { color: 'white', fontSize: 33, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 16, lineHeight: 24, marginBottom: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardText: { color: SUB, fontSize: 15, lineHeight: 22 },
  banner: {
    backgroundColor: 'rgba(120,200,255,0.18)',
    borderColor: 'rgba(120,200,255,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  bannerText: { color: '#CFEFFF', fontSize: 14, fontWeight: '700' },
  bannerMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  bannerMutedText: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
