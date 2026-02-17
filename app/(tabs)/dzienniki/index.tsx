import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { getLocalDateKey, todayDateKey } from '@/constants/calendar';
import type {
  CravingJournalEntry,
  EmotionJournalEntry,
  GratitudeJournalEntry,
} from '@/constants/journals';
import { loadDaySnapshot, loadRangeSnapshot } from '@/hooks/useRecoveryCalendarSync';
import { subscribeSync } from '@/hooks/recoverySyncEvents';
import { listRecentJournalEntriesByType } from '@/hooks/useJournals';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  const [loading, setLoading] = useState(true);
  const [recentEmotion, setRecentEmotion] = useState<EmotionJournalEntry[]>([]);
  const [recentCraving, setRecentCraving] = useState<CravingJournalEntry[]>([]);
  const [recentGratitude, setRecentGratitude] = useState<GratitudeJournalEntry[]>([]);
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const [weekBalance, setWeekBalance] = useState<number | null>(null);
  const [weekCraving, setWeekCraving] = useState(0);

  const loadRecent = useCallback(async () => {
    if (!hasPremium) {
      setTodayScore(null);
      setWeekBalance(null);
      setWeekCraving(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const todayKey = todayDateKey();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      const weekStartKey = getLocalDateKey(weekStart);

      const [emotion, craving, gratitude, todaySnapshot, weekSnapshot] = await Promise.all([
        listRecentJournalEntriesByType('emotion', 3),
        listRecentJournalEntriesByType('craving', 3),
        listRecentJournalEntriesByType('gratitude', 3),
        loadDaySnapshot(todayKey),
        loadRangeSnapshot(weekStartKey, todayKey),
      ]);
      setRecentEmotion(emotion as EmotionJournalEntry[]);
      setRecentCraving(craving as CravingJournalEntry[]);
      setRecentGratitude(gratitude as GratitudeJournalEntry[]);
      setTodayScore(todaySnapshot.plan.doneCount + todaySnapshot.texts.readCount - todaySnapshot.plan.haltCount * 2);
      setWeekBalance(weekSnapshot.trend.averageDailyBalance);
      setWeekCraving(weekSnapshot.totals.cravingCount);
    } finally {
      setLoading(false);
    }
  }, [hasPremium]);

  useEffect(() => {
    if (!hasPremium) return;
    return subscribeSync(() => {
      void loadRecent();
    });
  }, [hasPremium, loadRecent]);

  useFocusEffect(
    useCallback(() => {
      void loadRecent();
    }, [loadRecent])
  );

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

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ostatnie wpisy</Text>
              {todayScore !== null || weekBalance !== null ? (
                <View style={styles.syncCard}>
                  <Text style={styles.syncTitle}>Synchronizacja dnia</Text>
                  {todayScore !== null ? <Text style={styles.syncText}>Bilans dziś: {todayScore}</Text> : null}
                  {weekBalance !== null ? <Text style={styles.syncText}>Śr. bilans 7 dni: {weekBalance}</Text> : null}
                  <Text style={styles.syncText}>Wpisy kryzysu 7 dni: {weekCraving}</Text>
                </View>
              ) : null}
              {loading ? <Text style={styles.cardText}>Ładowanie wpisów...</Text> : null}

              {!loading ? (
                <>
                  <Text style={styles.sectionHeader}>Dziennik Uczuć</Text>
                  {recentEmotion.length === 0 ? (
                    <Text style={styles.cardText}>Brak wpisów.</Text>
                  ) : (
                    recentEmotion.map((entry) => (
                      <View key={entry.id} style={styles.entryRow}>
                        <Text style={styles.entryTitle}>
                          {entry.baseEmotion} {'->'} {entry.detailEmotion} ({entry.intensity}/10)
                        </Text>
                        <Text style={styles.entryMeta}>{formatDate(entry.createdAt)}</Text>
                      </View>
                    ))
                  )}

                  <Text style={styles.sectionHeader}>Dziennik Głodu/Kryzysu</Text>
                  {recentCraving.length === 0 ? (
                    <Text style={styles.cardText}>Brak wpisów.</Text>
                  ) : (
                    recentCraving.map((entry) => (
                      <View key={entry.id} style={styles.entryRow}>
                        <Text style={styles.entryTitle}>
                          Napięcie: {entry.urgeBefore}/10
                          {entry.urgeAfter !== null ? ` -> ${entry.urgeAfter}/10` : ''}
                        </Text>
                        <Text style={styles.entryMeta}>{formatDate(entry.createdAt)}</Text>
                      </View>
                    ))
                  )}

                  <Text style={styles.sectionHeader}>Dziennik Wdzięczności</Text>
                  {recentGratitude.length === 0 ? (
                    <Text style={styles.cardText}>Brak wpisów.</Text>
                  ) : (
                    recentGratitude.map((entry) => (
                      <View key={entry.id} style={styles.entryRow}>
                        <Text style={styles.entryTitle}>{entry.item || '(bez treści)'}</Text>
                        {entry.note ? <Text style={styles.entryMeta}>{entry.note}</Text> : null}
                        <Text style={styles.entryMeta}>{formatDate(entry.createdAt)}</Text>
                      </View>
                    ))
                  )}
                </>
              ) : null}
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
  syncCard: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.28)',
    backgroundColor: 'rgba(120,200,255,0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  syncTitle: { color: '#D7EFFF', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  syncText: { color: 'rgba(255,255,255,0.86)', fontSize: 13, lineHeight: 20 },
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
  sectionHeader: {
    color: '#CFEFFF',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginTop: 14,
  },
  entryRow: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 7,
  },
  entryTitle: { color: 'white', fontSize: 18, lineHeight: 24, fontWeight: '600' },
  entryMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, marginTop: 3 },
});
