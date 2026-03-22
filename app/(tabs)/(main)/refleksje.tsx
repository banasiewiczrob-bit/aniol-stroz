import { BackButton } from '@/components/BackButton';
import { DailyReflection, getInitialDailyReflection, loadDailyReflections } from '@/services/dailyReflections';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#061A2C';
const CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const MUTED = 'rgba(232,245,255,0.66)';
const Watermark = require('../../../assets/images/maly_aniol.png');

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function ReflectionTextBlock({
  label,
  content,
  accent,
}: {
  label: string;
  content: string;
  accent: string;
}) {
  if (!content) return null;
  return (
    <View style={styles.readingBlock}>
      <Text style={[styles.readingLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.readingText}>{content}</Text>
    </View>
  );
}

export default function RefleksjeScreen() {
  const insets = useSafeAreaInsets();
  const [currentReflection, setCurrentReflection] = useState<DailyReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioSource = useMemo(() => {
    if (!currentReflection?.audioUrl) return null;
    return {
      uri: currentReflection.audioUrl,
      name: currentReflection.title,
    };
  }, [currentReflection?.audioUrl, currentReflection?.title]);
  const player = useAudioPlayer(null, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const progress =
    status.duration > 0 && status.currentTime > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const durationLabel = formatTime(currentReflection?.durationSec ?? status.duration ?? 0);
  const positionLabel = formatTime(status.currentTime ?? 0);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {
      // Player still works with default session settings.
    });
  }, []);

  useEffect(() => {
    player.pause();
    if (!audioSource) return;
    player.replace(audioSource);
  }, [audioSource, player]);

  useEffect(() => {
    if (status.didJustFinish && status.duration > 0) {
      player.seekTo(0);
    }
  }, [player, status.didJustFinish, status.duration]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await loadDailyReflections();
        if (cancelled) return;

        const selected = await getInitialDailyReflection(loaded.reflections);
        if (cancelled) return;

        setCurrentReflection(selected);
        if (!selected) {
          setError('Dzisiejsza refleksja jeszcze się układa. Zajrzyj tu za chwilę.');
        }
      } catch (nextError) {
        if (cancelled) return;
        setCurrentReflection(null);
        console.error('Nie udało się przygotować dzisiejszej refleksji:', nextError);
        setError('Dzisiejsza refleksja jeszcze do Ciebie nie dotarła. Spróbuj ponownie za chwilę.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshLibrary = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const loaded = await loadDailyReflections();
      const selected = await getInitialDailyReflection(loaded.reflections);
      setCurrentReflection(selected);
      if (!selected) {
        setError('Dzisiejsza refleksja jeszcze się układa. Zajrzyj tu za chwilę.');
      }
    } catch (nextError) {
      console.error('Nie udało się odświeżyć dzisiejszej refleksji:', nextError);
      setError('Jeszcze chwila. Spróbuj ponownie za moment.');
    } finally {
      setRefreshing(false);
    }
  };

  const togglePlayback = () => {
    if (!currentReflection?.audioUrl) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.duration > 0 && status.currentTime >= status.duration - 0.25) {
      player.seekTo(0);
    }
    player.play();
  };

  const seekBy = (deltaSeconds: number) => {
    if (!status.duration || status.duration <= 0) return;
    const nextTime = Math.min(Math.max(0, status.currentTime + deltaSeconds), status.duration);
    player.seekTo(nextTime);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Codzienne refleksje</Text>
        <Text style={styles.subtitle}>
          Na dziś czeka tu jedna refleksja. Możesz jej posłuchać, spokojnie przeczytać tekst i wracać do niego w swoim rytmie przez cały dzień.
        </Text>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#8FAFD3' }]} />
          <Text style={styles.eyebrow}>Refleksja na dziś</Text>
          <Text style={styles.cardTitle}>{currentReflection?.title ?? 'Dzisiejsza refleksja'}</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#78C8FF" />
              <Text style={styles.loadingText}>Przygotowuję dzisiejszą refleksję...</Text>
            </View>
          ) : currentReflection ? (
            <>
              <Text style={styles.cardText}>
                {currentReflection.opening ||
                  currentReflection.reflection ||
                  'Treść dzisiejszej refleksji pojawi się tutaj za chwilę.'}
              </Text>

              <View style={styles.playerRow}>
                <Pressable
                  style={[styles.primaryBtn, !currentReflection.audioUrl && styles.buttonDisabled]}
                  onPress={togglePlayback}
                  disabled={!currentReflection.audioUrl}
                >
                  <Text style={styles.primaryBtnText}>
                    {!currentReflection.audioUrl
                      ? 'Nagranie w przygotowaniu'
                      : status.playing
                        ? 'Pauza'
                        : status.isBuffering
                          ? 'Chwileczkę...'
                          : 'Odtwórz'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.seekRow}>
                <Pressable
                  style={[styles.seekBtn, (!currentReflection.audioUrl || status.duration <= 0) && styles.buttonDisabled]}
                  onPress={() => seekBy(-15)}
                  disabled={!currentReflection.audioUrl || status.duration <= 0}
                >
                  <Text style={styles.seekBtnText}>-15 s</Text>
                </Pressable>
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>{positionLabel}</Text>
                    <Text style={styles.progressText}>{durationLabel}</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.seekBtn, (!currentReflection.audioUrl || status.duration <= 0) && styles.buttonDisabled]}
                  onPress={() => seekBy(15)}
                  disabled={!currentReflection.audioUrl || status.duration <= 0}
                >
                  <Text style={styles.seekBtnText}>+15 s</Text>
                </Pressable>
              </View>

              {durationLabel !== '0:00' ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaChip}>Nagranie: {durationLabel}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.cardText}>{error ?? 'Dzisiejsza refleksja pojawi się tutaj, gdy będzie już gotowa.'}</Text>
              <Pressable style={styles.primaryBtn} onPress={refreshLibrary} disabled={refreshing}>
                <Text style={styles.primaryBtnText}>{refreshing ? 'Chwileczkę...' : 'Spróbuj ponownie'}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#B8C6FF' }]} />
          <Text style={styles.cardTitle}>Tekst do przeczytania</Text>
          {currentReflection ? (
            <>
              <ReflectionTextBlock label="Zdanie otwarcia" content={currentReflection.opening} accent="#A6E2FF" />
              <ReflectionTextBlock label="Krótka refleksja" content={currentReflection.reflection} accent="#FFD18A" />
              <ReflectionTextBlock label="Pytanie do siebie" content={currentReflection.question} accent="#FFB4C7" />
              <ReflectionTextBlock label="Mały krok" content={currentReflection.smallStep} accent="#9EE7D8" />
              <ReflectionTextBlock label="Domknięcie" content={currentReflection.closing} accent="#B8C6FF" />
            </>
          ) : (
            <Text style={styles.cardText}>Po pobraniu refleksji cały tekst pojawi się tutaj, żeby można było wracać do niego także bez słuchania.</Text>
          )}
        </View>
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
    backgroundColor: 'rgba(184, 198, 255, 0.1)',
    bottom: 100,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: 'relative' },
  title: { color: 'white', fontSize: 38, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: SUB, fontSize: 18, lineHeight: 26, marginBottom: 18 },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  eyebrow: {
    color: '#78C8FF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  cardWatermark: {
    position: 'absolute',
    right: -22,
    bottom: -28,
    width: 140,
    height: 140,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardTitle: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  cardText: { color: SUB, fontSize: 17, lineHeight: 24 },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  loadingText: {
    color: SUB,
    fontSize: 16,
  },
  playerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  buttonDisabled: {
    opacity: 0.45,
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  seekBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  seekBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  progressWrap: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#78C8FF',
  },
  progressLabels: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
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
  readingBlock: {
    marginTop: 10,
  },
  readingLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  readingText: {
    color: SUB,
    fontSize: 17,
    lineHeight: 25,
  },
});
