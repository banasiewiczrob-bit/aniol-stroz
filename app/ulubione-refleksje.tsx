import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import {
  DailyReflection,
  listFavoriteDailyReflections,
  loadDailyReflections,
  loadFavoriteDailyReflectionIds,
  toggleFavoriteDailyReflection,
} from '@/services/dailyReflections';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#061A2C';
const CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const MUTED = 'rgba(232,245,255,0.66)';

function buildPreview(reflection: DailyReflection) {
  const text = [reflection.opening, reflection.reflection].map((item) => item.trim()).filter(Boolean).join(' ');
  if (text.length <= 140) return text;
  return `${text.slice(0, 137).trim()}...`;
}

export default function UlubioneRefleksjeScreen() {
  const { swipeHintInset } = useSwipeHintInset();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DailyReflection[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const [loaded, favoriteIds] = await Promise.all([
        loadDailyReflections(),
        loadFavoriteDailyReflectionIds(),
      ]);
      setItems(listFavoriteDailyReflections(loaded.reflections, favoriteIds));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites])
  );

  const handleOpenReflection = (reflectionId: string) => {
    router.push({
      pathname: '/refleksje',
      params: { reflectionId },
    });
  };

  const handleToggleFavorite = async (reflectionId: string) => {
    if (removingId) return;
    setRemovingId(reflectionId);
    try {
      const nextIds = await toggleFavoriteDailyReflection(reflectionId);
      setItems((current) => listFavoriteDailyReflections(current, nextIds).filter((item) => nextIds.includes(item.id)));
      await loadFavorites();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ulubione refleksje</Text>
        <Text style={styles.subtitle}>Tutaj wracasz do tych refleksji, które chcesz mieć bliżej i odsłuchiwać w dowolnym momencie.</Text>

        <View style={styles.instructionsCompact}>
          <Text style={styles.instructionsCompactTitle}>Opis i instrukcja</Text>
          <Text style={styles.instructionsCompactText}>Dotknij refleksji, aby ją otworzyć. Serduszkiem możesz ją w każdej chwili usunąć z ulubionych.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#78C8FF" />
            <Text style={styles.loadingText}>Przygotowuję Twoje ulubione refleksje...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nie ma tu jeszcze zapisanych refleksji</Text>
            <Text style={styles.emptyText}>Kiedy dotkniesz serduszka przy odsłuchiwanej refleksji, pojawi się tutaj i będzie można do niej wracać w dowolnym momencie.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable key={item.id} style={styles.card} onPress={() => handleOpenReflection(item.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title || 'Dzisiejsza refleksja'}</Text>
                  <Pressable
                    style={[styles.favoriteButton, removingId === item.id && styles.favoriteButtonDisabled]}
                    onPress={(event) => {
                      event.stopPropagation();
                      void handleToggleFavorite(item.id);
                    }}
                    disabled={removingId === item.id}
                  >
                    <Ionicons name="heart" size={20} color="#FF7A90" />
                  </Pressable>
                </View>
                <Text style={styles.cardText}>{buildPreview(item) || 'Ta refleksja czeka tu na Twój powrót.'}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.metaChip}>Otwórz refleksję</Text>
                  {item.durationSec ? <Text style={styles.metaChip}>Nagranie: {Math.floor(item.durationSec / 60)}:{String(item.durationSec % 60).padStart(2, '0')}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
    backgroundColor: 'rgba(255, 199, 217, 0.1)',
    bottom: 100,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18 },
  title: { color: 'white', fontSize: 34, fontWeight: '900', marginBottom: 4, letterSpacing: 0.2 },
  subtitle: {
    color: SUB,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 8,
  },
  instructionsCompact: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  instructionsCompactTitle: { color: 'white', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  instructionsCompactText: { color: 'rgba(232,245,255,0.82)', fontSize: 13, lineHeight: 18 },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  loadingText: {
    color: SUB,
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: SUB,
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  favoriteButtonDisabled: {
    opacity: 0.5,
  },
  cardText: {
    color: SUB,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
});
