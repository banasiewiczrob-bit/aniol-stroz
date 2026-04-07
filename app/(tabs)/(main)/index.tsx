import { BackButton } from '@/components/BackButton';
import { SOFT_BADGE_BG, SOFT_BADGE_BORDER, SOFT_BADGE_TEXT } from '@/constants/ui';
import { loadAppSettings, saveAppSettings, subscribeAppSettingsChanges } from '@/hooks/useAppSettings';
import {
  loadPendingIntelligentSupportSuggestion,
  markIntelligentSupportSuggestionHandled,
  type IntelligentSupportSuggestion,
} from '@/hooks/useIntelligentSupportEngine';
import { usePendingTasksBadge } from '@/hooks/usePendingTasksBadge';
import { useSingleNavigationPress } from '@/hooks/useSingleNavigationPress';
import { useVisitedTiles } from '@/hooks/useVisitedTiles';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const BG = '#061A2C';
const TILE_BG = 'rgba(12,38,62,0.78)';
const TILE_BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(255,255,255,0.88)';

const Watermark = require('../../assets/images/maly_aniol.png');

type RoutePath =
  | '/kontrakt'
  | '/liczniki'
  | '/licznik'
  | '/plan-dnia'
  | '/teksty-codzienne'
  | '/obserwatorium'
  | '/wsparcie';

type DashboardTile = {
  title: string;
  subtitle?: string;
  to: RoutePath;
  accent: string;
  glow: string;
};

const allTiles: DashboardTile[] = [
  { title: 'Kontrakt', subtitle: 'Umowa z samym sobą', to: '/kontrakt', accent: '#7ED9FF', glow: 'rgba(126,217,255,0.33)' },
  { title: 'Liczniki', subtitle: 'Zdrowienie i odrabianie strat', to: '/liczniki', accent: '#9EF3C7', glow: 'rgba(158,243,199,0.3)' },
  { title: 'Plan dnia', subtitle: 'Plan i HALT', to: '/plan-dnia', accent: '#FFD18A', glow: 'rgba(255,209,138,0.28)' },
  { title: 'Teksty codzienne', subtitle: 'Modlitwa, HALT, 12 kroków i inne teksty', to: '/teksty-codzienne', accent: '#C6B9FF', glow: 'rgba(198,185,255,0.28)' },
  { title: 'Obserwatorium 365', subtitle: 'Dzienniki', to: '/obserwatorium', accent: '#9AC7FF', glow: 'rgba(154,199,255,0.3)' },
  { title: 'Wsparcie', subtitle: 'Siatka, społeczność, kontakt', to: '/wsparcie', accent: '#FFC7D9', glow: 'rgba(255,199,217,0.28)' },
];

function SquareTile({
  title,
  subtitle,
  to,
  accent,
  glow,
  openedToday,
  onOpen,
  badgeCount,
  disabled,
}: DashboardTile & { openedToday: boolean; onOpen: (to: RoutePath) => void; badgeCount?: number; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onOpen(to)}
      style={({ pressed }) => [
        styles.squareTile,
        { borderColor: accent },
        openedToday && styles.squareTileOpened,
        openedToday && { backgroundColor: glow },
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.tileGlow, { backgroundColor: glow }]} />
      <Image source={Watermark} resizeMode="contain" style={styles.tileWatermark} />
      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}
      <View style={styles.tileContent}>
        <View style={[styles.tileAccent, { backgroundColor: accent }]} />
        <Text
          style={styles.squareTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={styles.squareSubtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Dom() {
  const { isVisited, markVisited } = useVisitedTiles();
  const { navigationLocked, runGuarded } = useSingleNavigationPress();
  const [badgeIndicatorsEnabled, setBadgeIndicatorsEnabled] = useState(false);
  const pendingTasksBadge = usePendingTasksBadge(badgeIndicatorsEnabled);
  const { height } = useWindowDimensions();
  const compact = height <= 900;
  const [supportPromptVisible, setSupportPromptVisible] = useState(false);
  const [supportPromptSubtle, setSupportPromptSubtle] = useState(false);
  const [supportNudge, setSupportNudge] = useState<IntelligentSupportSuggestion | null>(null);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const settings = await loadAppSettings();
      if (mounted) {
        setBadgeIndicatorsEnabled(settings.badgeIndicatorsEnabled);
      }
    };
    void refresh();
    const unsubscribe = subscribeAppSettingsChanges((settings) => {
      setBadgeIndicatorsEnabled(settings.badgeIndicatorsEnabled);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const settings = await loadAppSettings();
      if (settings.intelligentSupportEnabled) return;
      const now = new Date();
      const nextAtRaw = settings.intelligentSupportPromptNextAt;
      let subtlePrompt = false;
      if (typeof nextAtRaw === 'string') {
        const nextAt = new Date(nextAtRaw);
        if (!Number.isNaN(nextAt.getTime())) {
          if (nextAt.getTime() > now.getTime()) {
            return;
          }
          subtlePrompt = true;
        }
      }
      if (mounted) {
        setSupportPromptSubtle(subtlePrompt);
        setSupportPromptVisible(true);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [settings, suggestion] = await Promise.all([loadAppSettings(), loadPendingIntelligentSupportSuggestion()]);
      if (!mounted) return;
      if (!settings.intelligentSupportEnabled) {
        setSupportNudge(null);
        return;
      }
      setSupportNudge(suggestion && suggestion.status === 'new' ? suggestion : null);
    };
    void refresh();
    const unsubscribe = subscribeAppSettingsChanges(() => {
      void refresh();
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const closeSupportPromptFor30Days = useCallback(async () => {
    const settings = await loadAppSettings();
    const nextAt = new Date();
    nextAt.setDate(nextAt.getDate() + 30);
    await saveAppSettings({
      ...settings,
      intelligentSupportEnabled: false,
      intelligentSupportPromptNextAt: nextAt.toISOString(),
    });
    setSupportPromptVisible(false);
  }, []);

  const enableIntelligentSupport = useCallback(async () => {
    const settings = await loadAppSettings();
    await saveAppSettings({
      ...settings,
      intelligentSupportEnabled: true,
      intelligentSupportPromptNextAt: null,
    });
    setSupportPromptVisible(false);
    router.push({
      pathname: '/ustawienia',
      params: { openSection: 'intelligentSupport', backTo: '/(tabs)' },
    });
  }, []);

  const handleOpenTile = useCallback(async (to: RoutePath) => {
    await runGuarded(async () => {
      await markVisited(to);
      const swipeRoutes: RoutePath[] = ['/kontrakt', '/liczniki', '/licznik', '/plan-dnia', '/teksty-codzienne', '/obserwatorium', '/wsparcie'];
      const navTarget = {
        pathname: to as any,
        params: { backTo: '/(tabs)' },
      };

      if (swipeRoutes.includes(to)) {
        router.push(navTarget);
        return;
      }

      router.replace(navTarget);
    });
  }, [markVisited, runGuarded]);

  const handleSupportNudgeDone = useCallback(async () => {
    if (!supportNudge) return;
    await markIntelligentSupportSuggestionHandled('done');
    setSupportNudge(null);
    router.push({
      pathname: supportNudge.ctaPrimaryRoute as any,
      params: { backTo: '/(tabs)' },
    });
  }, [supportNudge]);

  const handleSupportNudgeAlternative = useCallback(async () => {
    if (!supportNudge?.ctaSecondaryRoute) return;
    await markIntelligentSupportSuggestionHandled('done');
    setSupportNudge(null);
    router.push({
      pathname: supportNudge.ctaSecondaryRoute as any,
      params: { backTo: '/(tabs)' },
    });
  }, [supportNudge]);

  const handleSupportNudgePostpone = useCallback(async () => {
    await markIntelligentSupportSuggestionHandled('postponed');
    setSupportNudge(null);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton showSwipeHint={false} />
      <View style={[styles.content, compact && styles.contentCompact, Platform.OS === 'web' && styles.contentWeb]}>
        <View>
          <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Dom</Text>
          <Text style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>
            To miejsce, gdzie wszystko się zaczyna.
          </Text>

          <View style={styles.instructionsCompact}>
            <Text style={styles.instructionsCompactTitle}>Opis i instrukcja</Text>
            <Text style={styles.instructionsCompactText}>
              Wybierz kafel i przejdź dalej.
            </Text>
          </View>
          <Text style={styles.focusLine}>Od czego chcesz zacząć dzisiaj?</Text>

        </View>

        <View style={[styles.grid, styles.gridRaised, Platform.OS === 'web' && styles.gridWeb]}>
          {allTiles.map((item) => (
            <SquareTile
              key={item.title}
              {...item}
              openedToday={isVisited(item.to)}
              onOpen={handleOpenTile}
              disabled={navigationLocked}
              badgeCount={
                !badgeIndicatorsEnabled
                  ? 0
                  : item.to === '/plan-dnia'
                    ? [pendingTasksBadge.missingPlan, pendingTasksBadge.missingSummary].filter(Boolean).length
                    : item.to === '/obserwatorium'
                      ? pendingTasksBadge.missingEmotionEntry
                        ? 1
                        : 0
                      : item.to === '/teksty-codzienne'
                        ? pendingTasksBadge.missingDailyTextsCount
                        : item.to === '/wsparcie'
                          ? pendingTasksBadge.missingSupportContact
                            ? 1
                            : 0
                          : 0
              }
            />
          ))}
        </View>
      </View>

      <Modal visible={supportPromptVisible} transparent animationType="fade" onRequestClose={() => setSupportPromptVisible(false)}>
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>
              {supportPromptSubtle
                ? 'Jeśli chcesz, aplikacja może reagować na trudniejsze dni.'
                : 'Czy chcesz, aby aplikacja reagowała na Twój rytm?'}
            </Text>
            {supportPromptSubtle ? (
              <Text style={styles.promptText}>To opcjonalne wsparcie. Możesz je włączyć lub zostawić wyłączone.</Text>
            ) : (
              <>
                <Text style={styles.promptText}>Gdy kilka dni będzie trudniejszych, aplikacja może delikatnie przypomnieć o zatrzymaniu.</Text>
                <Text style={styles.promptText}>Możesz to wyłączyć w każdej chwili.</Text>
              </>
            )}
            <Pressable style={styles.promptPrimary} onPress={() => void enableIntelligentSupport()}>
              <Text style={styles.promptPrimaryText}>Włącz inteligentne wsparcie</Text>
            </Pressable>
            <Pressable style={styles.promptSecondary} onPress={() => void closeSupportPromptFor30Days()}>
              <Text style={styles.promptSecondaryText}>Na razie bez tego</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!supportPromptVisible && Boolean(supportNudge)}
        transparent
        animationType="fade"
        onRequestClose={() => void handleSupportNudgePostpone()}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Jedna rzecz na teraz</Text>
            <Text style={styles.promptText}>{supportNudge?.message}</Text>
            <Pressable style={styles.promptPrimary} onPress={() => void handleSupportNudgeDone()}>
              <Text style={styles.promptPrimaryText}>Zacznij od tego</Text>
            </Pressable>
            {supportNudge?.ctaSecondaryRoute ? (
              <Pressable style={styles.promptSecondary} onPress={() => void handleSupportNudgeAlternative()}>
                <Text style={styles.promptSecondaryText}>Wybierz inną opcję</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.promptSecondary} onPress={() => void handleSupportNudgePostpone()}>
              <Text style={styles.promptSecondaryText}>Później</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(118, 214, 255, 0.12)',
    top: -70,
    right: -80,
  },
  bgOrbB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 208, 149, 0.09)',
    bottom: 110,
    left: -90,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  contentCompact: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  contentWeb: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerTitle: { color: 'white', fontSize: 34, fontWeight: '900', marginBottom: 4, letterSpacing: 0.2 },
  headerTitleCompact: { fontSize: 30 },
  headerSubtitle: {
    color: 'rgba(232,245,255,0.86)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 8,
  },
  headerSubtitleCompact: {
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
  gridWeb: {
    rowGap: 12,
    columnGap: 12,
  },
  gridRaised: {
    marginTop: 4,
  },
  squareTile: {
    width: '48.5%',
    minHeight: 126,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 11,
    backgroundColor: TILE_BG,
    borderWidth: 1.5,
    borderColor: TILE_BORDER,
    overflow: 'hidden',
    position: 'relative',
  },
  squareTileOpened: {
    borderColor: 'rgba(222, 244, 255, 0.98)',
    borderWidth: 2,
  },
  tilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.988 }],
  },
  tileGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -40,
    top: -28,
    opacity: 0.5,
  },
  tileWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: 'white',
    transform: [{ rotate: '15deg' }],
  },
  tileBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: SOFT_BADGE_BG,
    borderWidth: 1,
    borderColor: SOFT_BADGE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    zIndex: 4,
  },
  tileBadgeText: {
    color: SOFT_BADGE_TEXT,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,10,20,0.72)',
    justifyContent: 'center',
    padding: 18,
  },
  promptCard: {
    backgroundColor: 'rgba(12,38,62,0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.35)',
    padding: 16,
  },
  promptTitle: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 10, lineHeight: 28 },
  promptText: { color: 'rgba(232,245,255,0.9)', fontSize: 16, lineHeight: 23, marginBottom: 8 },
  promptPrimary: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
    backgroundColor: 'rgba(120,200,255,0.22)',
    alignItems: 'center',
    paddingVertical: 12,
  },
  promptPrimaryText: { color: 'white', fontSize: 15, fontWeight: '800' },
  promptSecondary: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    paddingVertical: 11,
  },
  promptSecondaryText: { color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: '700' },
  tileAccent: {
    width: 34,
    height: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  tileContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  squareTitle: { color: 'white', fontSize: 19, lineHeight: 24, fontWeight: '700' },
  squareSubtitle: {
    marginTop: 4,
    color: SUB,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
});
