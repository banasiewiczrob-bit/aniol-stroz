import { BackButton } from '@/components/BackButton';
import { useScrollAnchors } from '@/hooks/useScrollAnchors';
import {
  DailyReflection,
  findDailyReflectionById,
  getInitialDailyReflection,
  loadDailyReflections,
  loadFavoriteDailyReflectionIds,
  toggleFavoriteDailyReflection,
} from '@/services/dailyReflections';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#061A2C';
const CARD = 'rgba(12,38,62,0.78)';
const BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const MUTED = 'rgba(232,245,255,0.66)';
const INITIAL_VIEW_OFFSET = 18;
const TEXT_SECTION_SCROLL_OFFSET = 18;
const TEXT_AUTO_SCROLL_MULTIPLIER = 1.2;
const SMALL_STEP_ENDING_LINE = 'I niech to będzie Twój mały krok na dziś.';
const CAPTURE_TIMEOUT_MS = 12000;
const APP_NAME = 'Anioł Stróż';
const APP_SHARE_SERIES_NAME = 'Dzień po dniu. Anioł Stróż';
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

function joinReflectionText(parts: (string | null | undefined)[]) {
  return parts.map((part) => (typeof part === 'string' ? part.trim() : '')).filter(Boolean).join('\n\n');
}

function formatSmallStepText(content: string) {
  const trimmed = content.trim();
  const normalizedEnding = SMALL_STEP_ENDING_LINE.toLowerCase().replace(/[.:,\s]+/g, ' ').trim();

  if (!trimmed) {
    return SMALL_STEP_ENDING_LINE;
  }

  const normalized = trimmed.toLowerCase().replace(/[.:,\s]+/g, ' ').trim();

  if (normalized.endsWith(normalizedEnding)) {
    return trimmed;
  }

  return `${trimmed}\n\n${SMALL_STEP_ENDING_LINE}`;
}

function buildShareCardBody(reflection: DailyReflection | null) {
  if (!reflection) return 'Kilka spokojnych zdań, do których można wracać w swoim rytmie.';

  const content = joinReflectionText([
    joinReflectionText([reflection.opening, reflection.reflection]),
    reflection.question ? `Pytanie do siebie:\n${reflection.question}` : '',
    reflection.smallStep ? `Mały krok:\n${formatSmallStepText(reflection.smallStep)}` : '',
    reflection.closing ? `Domknięcie:\n${reflection.closing}` : '',
  ]);

  const normalized = content.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return normalized || 'Kilka spokojnych zdań, do których można wracać w swoim rytmie.';
}

function buildReflectionShareMessage(reflection: DailyReflection) {
  const sections = [
    reflection.title || 'Dzisiejsza refleksja',
    joinReflectionText([reflection.opening, reflection.reflection]),
    reflection.question ? `Pytanie do siebie:\n${reflection.question}` : '',
    reflection.smallStep ? `Mały krok:\n${formatSmallStepText(reflection.smallStep)}` : '',
    reflection.closing ? `Domknięcie:\n${reflection.closing}` : '',
    `Posłuchaj w aplikacji ${APP_SHARE_SERIES_NAME}.`,
  ].filter(Boolean);

  return sections.join('\n\n');
}

function buildReflectionShareCallout() {
  return `Posłuchaj w aplikacji\n${APP_SHARE_SERIES_NAME}`;
}

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = CAPTURE_TIMEOUT_MS) {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function ReflectionPlaybackKeepAwake() {
  useKeepAwake('daily-reflection-playback');
  return null;
}

export default function RefleksjeScreen() {
  const params = useLocalSearchParams<{ reflectionId?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const readingScrollRef = useRef<ScrollView | null>(null);
  const shareCardRef = useRef<View | null>(null);
  const { scrollRef, setAnchor, scrollToAnchor, onScroll, onViewportLayout } =
    useScrollAnchors<'intro-card' | 'reading-section'>();
  const didApplyInitialOffsetRef = useRef(false);
  const [currentReflection, setCurrentReflection] = useState<DailyReflection | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readingContentHeight, setReadingContentHeight] = useState(0);
  const [readingViewportHeight, setReadingViewportHeight] = useState(0);
  const selectedReflectionId = typeof params.reflectionId === 'string' ? params.reflectionId : Array.isArray(params.reflectionId) ? params.reflectionId[0] : null;

  const audioSource = useMemo(() => {
    if (!currentReflection?.audioUrl) return null;
    return {
      uri: currentReflection.audioUrl,
      name: currentReflection.title,
    };
  }, [currentReflection?.audioUrl, currentReflection?.title]);
  const player = useAudioPlayer(null, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const readingText = joinReflectionText([currentReflection?.opening, currentReflection?.reflection]);
  const hasReadingDetails = Boolean(
    readingText || currentReflection?.question || currentReflection?.smallStep || currentReflection?.closing
  );
  const displayTitle = currentReflection?.title || 'Dzisiejsza refleksja';
  const isFavorite = currentReflection?.id ? favoriteIds.includes(currentReflection.id) : false;
  const showingSelectedReflection = Boolean(selectedReflectionId && currentReflection?.id === selectedReflectionId);
  const eyebrowLabel = showingSelectedReflection ? 'Wybrana refleksja' : 'Refleksja na dziś';
  const shareMessage = currentReflection ? buildReflectionShareMessage(currentReflection) : '';
  const shareCardBody = buildShareCardBody(currentReflection);
  const shareCardCallout = buildReflectionShareCallout();
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const canShareGraphicCard = !isExpoGo;

  const scrollToIntroCard = React.useCallback(
    (animated = false) => {
      scrollToAnchor('intro-card', {
        offset: INITIAL_VIEW_OFFSET,
        animated,
        waitForLayout: true,
      });
    },
    [scrollToAnchor]
  );

  const progress =
    status.duration > 0 && status.currentTime > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const durationLabel = formatTime(currentReflection?.durationSec ?? status.duration ?? 0);
  const positionLabel = formatTime(status.currentTime ?? 0);
  const shouldKeepAwake = Boolean(currentReflection?.audioUrl) && (status.playing || status.isBuffering);

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
    if (!readingScrollRef.current) return;
    readingScrollRef.current.scrollTo({ y: 0, animated: false });
  }, [currentReflection?.id]);

  useEffect(() => {
    if (loading || didApplyInitialOffsetRef.current) return;

    didApplyInitialOffsetRef.current = true;
    scrollToIntroCard(false);
  }, [loading, scrollToIntroCard]);

  useFocusEffect(
    React.useCallback(() => {
      didApplyInitialOffsetRef.current = false;

      const frameId = requestAnimationFrame(() => {
        if (!loading) {
          didApplyInitialOffsetRef.current = true;
          scrollToIntroCard(false);
        }
      });

      return () => {
        cancelAnimationFrame(frameId);
      };
    }, [loading, scrollToIntroCard])
  );

  useEffect(() => {
    if (!readingScrollRef.current || !hasReadingDetails || status.duration <= 0) return;

    const maxOffset = Math.max(0, readingContentHeight - readingViewportHeight);
    if (maxOffset <= 0) return;

    const nextOffset = maxOffset * Math.min(1, progress * TEXT_AUTO_SCROLL_MULTIPLIER);
    readingScrollRef.current.scrollTo({ y: nextOffset, animated: false });
  }, [hasReadingDetails, progress, readingContentHeight, readingViewportHeight, status.duration]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      try {
        const [loaded, storedFavoriteIds] = await Promise.all([
          loadDailyReflections(),
          loadFavoriteDailyReflectionIds(),
        ]);
        if (cancelled) return;

        const selected =
          findDailyReflectionById(loaded.reflections, selectedReflectionId) ??
          (await getInitialDailyReflection(loaded.reflections));
        if (cancelled) return;

        setFavoriteIds(storedFavoriteIds);
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
  }, [selectedReflectionId]);

  const refreshLibrary = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [loaded, storedFavoriteIds] = await Promise.all([
        loadDailyReflections(),
        loadFavoriteDailyReflectionIds(),
      ]);
      const selected =
        findDailyReflectionById(loaded.reflections, selectedReflectionId) ??
        (await getInitialDailyReflection(loaded.reflections));
      setFavoriteIds(storedFavoriteIds);
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
    scrollToAnchor('reading-section', {
      offset: TEXT_SECTION_SCROLL_OFFSET,
      onlyIfNeeded: true,
      bottomMargin: 240,
    });
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

  const handleToggleFavorite = async () => {
    if (!currentReflection?.id || favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      const next = await toggleFavoriteDailyReflection(currentReflection.id);
      setFavoriteIds(next);
    } finally {
      setFavoriteBusy(false);
    }
  };

  const openFavorites = () => {
    router.push('/ulubione-refleksje');
  };

  const openShareSheet = () => {
    if (!currentReflection || shareBusy) return;
    setShareSheetOpen(true);
  };

  const launchShareFlow = (runner: () => Promise<void>) => {
    setShareBusy(false);
    setTimeout(() => {
      void runner();
    }, 0);
  };

  const handleShareText = async () => {
    if (!currentReflection || shareBusy) return;
    setShareBusy(true);
    setShareSheetOpen(false);

    launchShareFlow(async () => {
      try {
        await Share.share({ message: shareMessage });
      } catch (nextError) {
        console.error('Nie udało się udostępnić tekstu refleksji:', nextError);
        Alert.alert('Nie udało się udostępnić refleksji', 'Spróbuj ponownie za chwilę.');
      }
    });
  };

  const handleShareCard = async () => {
    if (!currentReflection || shareBusy) return;
    setShareBusy(true);
    setShareSheetOpen(false);

    try {
      if (isExpoGo) {
        launchShareFlow(async () => {
          try {
            await Share.share({ message: shareMessage });
          } catch (nextError) {
            console.error('Nie udało się udostępnić refleksji w Expo Go:', nextError);
            Alert.alert('Nie udało się udostępnić refleksji', 'Spróbuj ponownie za chwilę.');
          }
        });
        return;
      }

      if (!shareCardRef.current) {
        launchShareFlow(async () => {
          try {
            await Share.share({ message: shareMessage });
          } catch (nextError) {
            console.error('Nie udało się udostępnić tekstu refleksji:', nextError);
            Alert.alert('Nie udało się udostępnić refleksji', 'Spróbuj ponownie za chwilę.');
          }
        });
        return;
      }

      const imageUri = await withTimeout(
        captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        }),
        'Przygotowanie karty trwało zbyt długo.'
      );

      launchShareFlow(async () => {
        try {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(imageUri, {
              mimeType: 'image/png',
              UTI: 'public.png',
              dialogTitle: 'Udostępnij refleksję',
            });
            return;
          }

          await Share.share({ message: shareMessage, url: imageUri });
        } catch (nextError) {
          console.error('Nie udało się udostępnić karty refleksji:', nextError);
          try {
            await Share.share({ message: shareMessage });
          } catch {
            Alert.alert('Nie udało się udostępnić refleksji', 'Spróbuj ponownie za chwilę.');
          }
        }
      });
    } catch (nextError) {
      setShareBusy(false);
      console.error('Nie udało się przygotować karty refleksji:', nextError);
      launchShareFlow(async () => {
        try {
          await Share.share({ message: shareMessage });
        } catch {
          Alert.alert('Nie udało się udostępnić refleksji', 'Spróbuj ponownie za chwilę.');
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      {shouldKeepAwake ? <ReflectionPlaybackKeepAwake /> : null}
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton showSwipeHint={false} />
      <Modal transparent animationType="fade" visible={shareSheetOpen} onRequestClose={() => setShareSheetOpen(false)}>
        <View style={styles.shareSheetBackdrop}>
          <Pressable style={styles.shareSheetDismissArea} onPress={() => setShareSheetOpen(false)} />
          <View style={[styles.shareSheet, { paddingBottom: Math.max(18, insets.bottom + 4) }]}>
            <View style={styles.shareSheetHandle} />
            <Text style={styles.shareSheetTitle}>Udostępnij refleksję</Text>
            <Text style={styles.shareSheetSubtitle}>
              {canShareGraphicCard
                ? 'Wybierz spokojniejszą formę: gotowy tekst do wysłania albo kartę graficzną.'
                : 'Możesz wysłać gotowy tekst refleksji do wybranej osoby lub aplikacji.'}
            </Text>
            <Pressable style={styles.shareSheetOption} onPress={handleShareText} disabled={shareBusy}>
              <View style={[styles.shareSheetIconWrap, { backgroundColor: 'rgba(120,200,255,0.14)' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#78C8FF" />
              </View>
              <View style={styles.shareSheetTextWrap}>
                <Text style={styles.shareSheetOptionTitle}>Wyślij jako tekst</Text>
                <Text style={styles.shareSheetOptionBody}>Dobre do SMS-a, maila i komunikatorów.</Text>
              </View>
            </Pressable>
            {canShareGraphicCard ? (
              <Pressable style={styles.shareSheetOption} onPress={handleShareCard} disabled={shareBusy}>
                <View style={[styles.shareSheetIconWrap, { backgroundColor: 'rgba(255,180,199,0.14)' }]}>
                  <Ionicons name="image-outline" size={20} color="#FFB4C7" />
                </View>
                <View style={styles.shareSheetTextWrap}>
                  <Text style={styles.shareSheetOptionTitle}>Udostępnij kartę</Text>
                  <Text style={styles.shareSheetOptionBody}>Estetyczna plansza z fragmentem refleksji i zaproszeniem do odsłuchu w aplikacji.</Text>
                </View>
              </Pressable>
            ) : null}
            <Pressable style={styles.shareSheetClose} onPress={() => setShareSheetOpen(false)} disabled={shareBusy}>
              <Text style={styles.shareSheetCloseText}>Na razie zostaję tutaj</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ScrollView
        ref={scrollRef}
        onLayout={onViewportLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Codzienne refleksje</Text>
        <Text style={styles.subtitle}>
          Na dziś czeka tu jedna refleksja. Możesz jej posłuchać, spokojnie przeczytać tekst i wracać do niego w swoim rytmie przez cały dzień.
        </Text>

        <View style={styles.card} onLayout={setAnchor('intro-card')}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#8FAFD3' }]} />
          <View style={styles.titleRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>{eyebrowLabel}</Text>
              <Text style={styles.cardTitle}>{displayTitle}</Text>
            </View>
            {currentReflection ? (
              <Pressable
                style={[styles.favoriteIconButton, isFavorite && styles.favoriteIconButtonActive, favoriteBusy && styles.buttonDisabled]}
                onPress={handleToggleFavorite}
                disabled={favoriteBusy}
              >
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color="#FF7A90" />
              </Pressable>
            ) : null}
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#78C8FF" />
              <Text style={styles.loadingText}>Przygotowuję dzisiejszą refleksję...</Text>
            </View>
          ) : currentReflection ? (
            <>
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

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.secondaryBtn, favoriteBusy && styles.buttonDisabled]}
                  onPress={handleToggleFavorite}
                  disabled={favoriteBusy}
                >
                  <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color="#FF7A90" />
                  <Text style={styles.secondaryBtnText}>{isFavorite ? 'W ulubionych' : 'Dodaj do ulubionych'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={openFavorites}>
                  <Ionicons name="list-outline" size={18} color="#B8C6FF" />
                  <Text style={styles.secondaryBtnText}>Ulubione refleksje</Text>
                </Pressable>
                {!isExpoGo ? (
                  <Pressable style={[styles.secondaryBtn, shareBusy && styles.buttonDisabled]} onPress={openShareSheet} disabled={shareBusy}>
                    <Ionicons name="share-social-outline" size={18} color="#9EE7D8" />
                    <Text style={styles.secondaryBtnText}>{shareBusy ? 'Chwileczkę...' : 'Udostępnij'}</Text>
                  </Pressable>
                ) : null}
              </View>
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

        <View style={styles.card} onLayout={setAnchor('reading-section')}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={[styles.cardAccent, { backgroundColor: '#B8C6FF' }]} />
          <Text style={styles.cardTitle}>Tekst refleksji</Text>
          {currentReflection ? (
            <>
              {hasReadingDetails ? (
                <>
                  <Text style={styles.readingHint}>Tekst płynie razem z nagraniem, ale w każdej chwili możesz też czytać go w swoim tempie.</Text>
                  <ScrollView
                    ref={readingScrollRef}
                    style={styles.readingScroll}
                    contentContainerStyle={styles.readingScrollContent}
                    onLayout={(event) => setReadingViewportHeight(event.nativeEvent.layout.height)}
                    onContentSizeChange={(_, height) => setReadingContentHeight(height)}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <Text style={styles.reflectionTitle}>{displayTitle}</Text>
                    {readingText ? <Text style={styles.readingText}>{readingText}</Text> : null}
                    <ReflectionTextBlock label="Pytanie do siebie" content={currentReflection.question} accent="#FFB4C7" />
                    <ReflectionTextBlock label="Mały krok" content={formatSmallStepText(currentReflection.smallStep)} accent="#9EE7D8" />
                    <ReflectionTextBlock label="Domknięcie" content={currentReflection.closing} accent="#B8C6FF" />
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={styles.reflectionTitle}>{displayTitle}</Text>
                  <Text style={styles.cardText}>
                    Tekst tej refleksji dołączy tu razem z jej pełnym zapisem. Na ten moment możesz spokojnie zostać przy samym słuchaniu.
                  </Text>
                </>
              )}
            </>
          ) : (
            <Text style={styles.cardText}>Po pobraniu refleksji cały tekst pojawi się tutaj, żeby można było wracać do niego także bez słuchania.</Text>
          )}
        </View>
      </ScrollView>
      {currentReflection ? (
        <View style={styles.shareCaptureHost} pointerEvents="none">
          <View ref={shareCardRef} collapsable={false} style={styles.shareCaptureCanvas}>
            <View style={styles.shareCardGlowA} />
            <View style={styles.shareCardGlowB} />
            <Image source={Watermark} resizeMode="contain" style={styles.shareCardWatermark} />
            <View style={styles.shareCardTopRow}>
              <View style={styles.shareCardBadge}>
                <Text style={styles.shareCardBadgeText}>{APP_NAME}</Text>
              </View>
              <View style={styles.shareCardListenBadge}>
                <Text style={styles.shareCardListenBadgeText}>
                  {currentReflection.audioUrl ? 'Do odsłuchania w aplikacji' : 'Dostępne w aplikacji'}
                </Text>
              </View>
            </View>
            <View style={styles.shareCardAccent} />
            <Text style={styles.shareCardEyebrow}>Codzienna refleksja</Text>
            <Text style={styles.shareCardTitle}>{displayTitle}</Text>
            <View style={styles.shareQuoteWrap}>
              <Text style={styles.shareQuoteMark}>“</Text>
              <Text style={styles.shareCardBody}>{shareCardBody}</Text>
            </View>
            <View style={styles.shareCalloutWrap}>
              <Text style={styles.shareCalloutText}>{shareCardCallout}</Text>
            </View>
            <Text style={styles.shareCardFooter}>{APP_SHARE_SERIES_NAME}</Text>
          </View>
        </View>
      ) : null}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
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
  favoriteIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favoriteIconButtonActive: {
    backgroundColor: 'rgba(255,122,144,0.12)',
    borderColor: 'rgba(255,122,144,0.28)',
  },
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
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
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  shareSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,11,19,0.58)',
    justifyContent: 'flex-end',
  },
  shareSheetDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  shareSheet: {
    backgroundColor: '#0A2439',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.18)',
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  shareSheetHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  shareSheetTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  shareSheetSubtitle: {
    color: SUB,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  shareSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    marginBottom: 10,
  },
  shareSheetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSheetTextWrap: {
    flex: 1,
  },
  shareSheetOptionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  shareSheetOptionBody: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  shareSheetClose: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 2,
  },
  shareSheetCloseText: {
    color: '#B8C6FF',
    fontSize: 15,
    fontWeight: '700',
  },
  readingBlock: {
    marginTop: 10,
  },
  readingHint: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  readingScroll: {
    maxHeight: 320,
  },
  readingScrollContent: {
    paddingBottom: 12,
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
  reflectionTitle: {
    color: 'white',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 10,
  },
  shareCaptureHost: {
    position: 'absolute',
    left: -4000,
    top: 0,
    width: 1080,
  },
  shareCaptureCanvas: {
    width: 1080,
    backgroundColor: BG,
    paddingHorizontal: 52,
    paddingTop: 52,
    paddingBottom: 56,
    overflow: 'hidden',
    position: 'relative',
  },
  shareCardGlowA: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(120,200,255,0.14)',
    top: -160,
    right: -140,
  },
  shareCardGlowB: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: 'rgba(184,198,255,0.12)',
    bottom: -180,
    left: -150,
  },
  shareCardWatermark: {
    position: 'absolute',
    right: -24,
    bottom: -12,
    width: 360,
    height: 360,
    opacity: 0.06,
    tintColor: 'white',
    transform: [{ rotate: '14deg' }],
  },
  shareCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  shareCardBadge: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  shareCardBadgeText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  shareCardListenBadge: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(158,231,216,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(158,231,216,0.24)',
  },
  shareCardListenBadgeText: {
    color: '#9EE7D8',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  shareCardAccent: {
    width: 132,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#78C8FF',
    marginBottom: 22,
  },
  shareCardEyebrow: {
    color: '#9EE7D8',
    fontSize: 24,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 16,
  },
  shareCardTitle: {
    color: 'white',
    fontSize: 60,
    lineHeight: 72,
    fontWeight: '800',
    marginBottom: 28,
    maxWidth: 860,
  },
  shareQuoteWrap: {
    position: 'relative',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(5,17,28,0.42)',
    paddingTop: 42,
    paddingRight: 34,
    paddingBottom: 34,
    paddingLeft: 34,
    marginBottom: 26,
  },
  shareQuoteMark: {
    position: 'absolute',
    top: 8,
    left: 20,
    color: 'rgba(120,200,255,0.28)',
    fontSize: 82,
    lineHeight: 82,
    fontWeight: '800',
  },
  shareCardBody: {
    color: 'rgba(232,245,255,0.94)',
    fontSize: 30,
    lineHeight: 44,
  },
  shareCalloutWrap: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.24)',
    backgroundColor: 'rgba(120,200,255,0.08)',
    padding: 24,
  },
  shareCalloutText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '800',
  },
  shareCardFooter: {
    color: 'rgba(232,245,255,0.64)',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 28,
  },
});
