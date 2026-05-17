import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { DailyReadToggle } from "@/components/DailyReadToggle";
import { APP_DISPLAY_NAME } from "@/constants/app";
import { TYPE } from "@/styles/typography";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useKeepAwake } from "expo-keep-awake";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

const BG = "#061A2C";
const SUB = "rgba(233,239,255,0.88)";
const Watermark = require("../assets/images/maly_aniol.png");
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://dqblnmimbqsmmzjzzrjr.supabase.co";
const AUDIO_URL = `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/app-audio/single/teksty-codzienne/to-co-najwazniejsze.m4a`;
const TEXT_SCROLL_OFFSET = 28;
const SHARE_CAPTURE_TIMEOUT_MS = 12000;
const SHARE_CALLOUT = `Pełny tekst jest do przeczytania i odsłuchania w aplikacji ${APP_DISPLAY_NAME}.`;

const TIMED_PARAGRAPHS = [
  {
    start: 3.32,
    text: "Zwolnię, kiedy tylko będę mógł. Nie wszystko muszę zrobić od razu. Cisza to też działanie.",
  },
  {
    start: 12.71,
    text: "Będę mówił o tym, co dla mnie ważne, spokojnie. Słuchał innych uważnie. Nawet jeśli się z kimś nie zgadzam, mogę usłyszeć coś ważnego.",
  },
  {
    start: 23.45,
    text: "Nie będę mierzył swojej wartości cudzą siłą, sukcesem ani celami. Każdy niesie coś, czego nie widać na pierwszy rzut oka.",
  },
  {
    start: 34.76,
    text: "Zadbam o to, co robię, nawet jeśli dziś wydaje się małe. Wszystko, co wielkie, wyrosło przecież z małych rzeczy.",
  },
  {
    start: 44.33,
    text: "Będę ostrożny, ale nie zamknę swojego serca. Nie wszystko wokół mnie jest czyste i dobre, ale dobro wciąż istnieje i nadal warto je wybierać.",
  },
  {
    start: 58.28,
    text: "Nie będę udawał kogoś, kim nie jestem. Nie muszę zasługiwać na miejsce w świecie byciem idealnym.",
  },
  {
    start: 67.19,
    text: "W relacjach poszukam prawdy i człowieka. Ciepło, lojalność i zwyczajna obecność znaczą więcej niż złudzenia.",
  },
  {
    start: 77.88,
    text: "Przyjmuję, że życie zmienia się etapami. Coś odchodzi, coś przychodzi, coś dopiero kiełkuje. Nie muszę zatrzymywać szczęścia.",
  },
  {
    start: 90.21,
    text: "Wzmacniam w sobie to, co pomaga mi wracać do stabilności, oddech, modlitwę, rozmowę, spacer, ciszę, wspólnotę, uczciwość wobec siebie.",
  },
  {
    start: 102.27,
    text: "Nie wierzę każdej czarnej myśli w mojej głowie. Zmęczenie, samotność i lęk potrafią mówić bardzo przekonująco.",
  },
  {
    start: 113.37,
    text: "Pamiętam, że należę do tego świata. Nie muszę na siłę udowadniać, że mam prawo tu być.",
  },
  {
    start: 121.41,
    text: "Robię swoje najlepiej jak potrafię dzisiaj. To wystarczy. To jest dobre.",
  },
  {
    start: 130.56,
    text: "I nawet jeśli wokół bywa chaos, rozczarowanie albo ból, wciąż istnieją rzeczy warte uwagi: dobro, piękno, bliskość, nowy początek.",
  },
  {
    start: 144.39,
    text: "Będę dla siebie trochę łagodniejszy. To jest prawdziwa siła.",
  },
];

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PlaybackKeepAwake() {
  useKeepAwake("to-co-najwazniejsze-playback");
  return null;
}

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = SHARE_CAPTURE_TIMEOUT_MS) {
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

export default function WsparcieDesiderata() {
  const insets = useSafeAreaInsets();
  const readingScrollRef = useRef<ScrollView | null>(null);
  const shareCardRef = useRef<View | null>(null);
  const paragraphOffsetsRef = useRef<Record<number, number>>({});
  const lastScrolledParagraphRef = useRef<number | null>(null);
  const [shareParagraph, setShareParagraph] = useState<string | null>(null);
  const [shareBusyIndex, setShareBusyIndex] = useState<number | null>(null);
  const audioSource = useMemo(
    () => ({
      uri: AUDIO_URL,
      name: "To, co najważniejsze",
    }),
    []
  );
  const player = useAudioPlayer(null, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const progress =
    status.duration > 0 && status.currentTime > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const durationLabel = formatTime(status.duration ?? 0);
  const positionLabel = formatTime(status.currentTime ?? 0);
  const shouldKeepAwake = status.playing || status.isBuffering;
  const activeParagraphIndex = useMemo(() => {
    const currentTime = status.currentTime ?? 0;
    let activeIndex = -1;

    for (let index = 0; index < TIMED_PARAGRAPHS.length; index += 1) {
      if (currentTime >= TIMED_PARAGRAPHS[index].start) {
        activeIndex = index;
      }
    }

    return activeIndex;
  }, [status.currentTime]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    }).catch(() => {
      // Player still works with default session settings.
    });
  }, []);

  useEffect(() => {
    player.replace(audioSource);
  }, [audioSource, player]);

  useEffect(() => {
    if (status.didJustFinish && status.duration > 0) {
      player.seekTo(0);
    }
  }, [player, status.didJustFinish, status.duration]);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    player.play();
  };

  const seekBy = (seconds: number) => {
    const nextPosition = Math.max(0, Math.min(status.duration || 0, (status.currentTime || 0) + seconds));
    player.seekTo(nextPosition);
  };

  const shareParagraphCard = async (paragraph: string, index: number) => {
    if (shareBusyIndex !== null) return;

    setShareBusyIndex(index);
    setShareParagraph(paragraph);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (!shareCardRef.current) {
        await Share.share({ message: `${paragraph}\n\n${SHARE_CALLOUT}` });
        return;
      }

      const imageUri = await withTimeout(
        captureRef(shareCardRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        }),
        "Przygotowanie planszy trwało zbyt długo."
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle: "Udostępnij akapit",
        });
        return;
      }

      await Share.share({ message: `${paragraph}\n\n${SHARE_CALLOUT}`, url: imageUri });
    } catch (error) {
      console.error("Nie udało się udostępnić akapitu:", error);
      try {
        await Share.share({ message: `${paragraph}\n\n${SHARE_CALLOUT}` });
      } catch {
        Alert.alert("Nie udało się udostępnić akapitu", "Spróbuj ponownie za chwilę.");
      }
    } finally {
      setShareBusyIndex(null);
    }
  };

  useEffect(() => {
    if (!status.playing || activeParagraphIndex < 0) return;
    if (lastScrolledParagraphRef.current === activeParagraphIndex) return;

    const paragraphOffset = paragraphOffsetsRef.current[activeParagraphIndex];
    if (typeof paragraphOffset !== "number") return;

    lastScrolledParagraphRef.current = activeParagraphIndex;
    readingScrollRef.current?.scrollTo({
      y: Math.max(0, paragraphOffset - TEXT_SCROLL_OFFSET),
      animated: true,
    });
  }, [activeParagraphIndex, status.playing]);

  return (
    <View style={styles.screen}>
      {shouldKeepAwake ? <PlaybackKeepAwake /> : null}
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>To, co najważniejsze</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="To tekst, który pomaga wrócić do spokoju, kierunku i życzliwszego spojrzenia na siebie oraz innych."
          jak="Posłuchaj albo czytaj bez pośpiechu. Wybierz jedno zdanie, które dziś chcesz mieć bliżej siebie."
        />
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerEyebrow}>Nagranie</Text>
            <Text style={styles.playerTitle}>To, co najważniejsze</Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={togglePlayback}>
            <Text style={styles.primaryBtnText}>
              {status.playing ? "Pauza" : status.isBuffering ? "Chwileczkę..." : "Odtwórz"}
            </Text>
          </Pressable>
          <View style={styles.seekRow}>
            <Pressable style={[styles.seekBtn, status.duration <= 0 && styles.buttonDisabled]} onPress={() => seekBy(-15)} disabled={status.duration <= 0}>
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
            <Pressable style={[styles.seekBtn, status.duration <= 0 && styles.buttonDisabled]} onPress={() => seekBy(15)} disabled={status.duration <= 0}>
              <Text style={styles.seekBtnText}>+15 s</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Tekst</Text>
          <Text style={styles.readingHint}>Tekst płynie razem z nagraniem, ale w każdej chwili możesz też czytać go w swoim tempie.</Text>
          <ScrollView
            ref={readingScrollRef}
            style={styles.readingScroll}
            contentContainerStyle={styles.readingScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <Text style={styles.readingTitle}>To, co najważniejsze</Text>
            {TIMED_PARAGRAPHS.map((paragraph, index) => (
              <View
                key={paragraph.text}
                onLayout={(event) => {
                  paragraphOffsetsRef.current[index] = event.nativeEvent.layout.y;
                }}
                style={[styles.paragraphWrap, activeParagraphIndex === index && styles.paragraphWrapActive]}
              >
                <View style={styles.paragraphHeader}>
                  <Text style={[styles.paragraph, activeParagraphIndex === index && styles.paragraphActive]}>
                    {paragraph.text}
                  </Text>
                  <Pressable
                    style={[styles.shareParagraphButton, shareBusyIndex === index && styles.buttonDisabled]}
                    onPress={() => void shareParagraphCard(paragraph.text, index)}
                    disabled={shareBusyIndex !== null}
                  >
                    <Text style={styles.shareParagraphButtonText}>
                      {shareBusyIndex === index ? "..." : "Udostępnij"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        <Text style={styles.note}>Ten tekst został zainspirowany Desideratą.</Text>
        <DailyReadToggle id="desiderata" />
      </ScrollView>
      <View style={styles.shareCaptureHost} pointerEvents="none">
        <View ref={shareCardRef} collapsable={false} style={styles.shareCaptureCanvas}>
          <View style={styles.shareCardGlowA} />
          <View style={styles.shareCardGlowB} />
          <Image source={Watermark} resizeMode="contain" style={styles.shareCardWatermark} />
          <View style={styles.shareCardBadge}>
            <Text style={styles.shareCardBadgeText}>{APP_DISPLAY_NAME}</Text>
          </View>
          <View style={styles.shareCardAccent} />
          <Text style={styles.shareCardEyebrow}>To, co najważniejsze</Text>
          <View style={styles.shareQuoteWrap}>
            <Text style={styles.shareQuoteMark}>“</Text>
            <Text style={styles.shareCardBody}>{shareParagraph ?? TIMED_PARAGRAPHS[0].text}</Text>
          </View>
          <View style={styles.shareCalloutWrap}>
            <Text style={styles.shareCalloutText}>{SHARE_CALLOUT}</Text>
          </View>
          <Text style={styles.shareCardFooter}>{APP_DISPLAY_NAME}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "rgba(184, 198, 255, 0.12)",
    top: -90,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(220, 229, 255, 0.1)",
    bottom: 130,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  playerCard: {
    borderWidth: 1,
    borderColor: "rgba(184, 198, 255, 0.36)",
    borderRadius: 14,
    backgroundColor: "rgba(16, 33, 62, 0.7)",
    padding: 14,
    marginBottom: 14,
  },
  playerHeader: {
    marginBottom: 12,
  },
  playerEyebrow: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.62)",
    marginBottom: 2,
  },
  playerTitle: {
    ...TYPE.bodyStrong,
    color: "white",
  },
  primaryBtn: {
    backgroundColor: "rgba(184, 198, 255, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(184, 198, 255, 0.54)",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    ...TYPE.bodyStrong,
    color: "white",
  },
  seekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  seekBtn: {
    minWidth: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(184, 198, 255, 0.32)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
    alignItems: "center",
  },
  seekBtnText: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.88)",
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  progressWrap: {
    flex: 1,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#B8C6FF",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  progressText: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.68)",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(184, 198, 255, 0.4)",
    borderRadius: 14,
    backgroundColor: "rgba(32, 42, 73, 0.54)",
    padding: 14,
    marginBottom: 14,
    overflow: "hidden",
    position: "relative",
  },
  cardAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#B8C6FF",
    marginBottom: 10,
  },
  cardTitle: {
    ...TYPE.h2,
    color: "white",
    marginBottom: 6,
  },
  readingHint: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.68)",
    marginBottom: 10,
  },
  readingScroll: {
    maxHeight: 360,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  readingScrollContent: {
    padding: 12,
    paddingBottom: 18,
  },
  readingTitle: {
    ...TYPE.bodyStrong,
    color: "white",
    marginBottom: 10,
  },
  cardWatermark: {
    position: "absolute",
    right: -22,
    bottom: -28,
    width: 150,
    height: 150,
    opacity: 0.12,
    tintColor: "white",
    transform: [{ rotate: "16deg" }],
  },
  paragraphWrap: {
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  paragraphWrapActive: {
    backgroundColor: "rgba(184, 198, 255, 0.13)",
  },
  paragraphHeader: {
    gap: 8,
  },
  paragraph: { ...TYPE.body, color: SUB },
  paragraphActive: {
    color: "white",
  },
  shareParagraphButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(184, 198, 255, 0.32)",
    backgroundColor: "rgba(184, 198, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  shareParagraphButtonText: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.9)",
    fontWeight: "800",
  },
  note: {
    ...TYPE.caption,
    color: "rgba(233,239,255,0.62)",
    marginBottom: 14,
  },
  shareCaptureHost: {
    position: "absolute",
    left: -10000,
    top: 0,
    width: 1080,
    height: 1350,
    opacity: 0.99,
  },
  shareCaptureCanvas: {
    width: 1080,
    height: 1350,
    backgroundColor: "#061A2C",
    padding: 78,
    overflow: "hidden",
    position: "relative",
    justifyContent: "space-between",
  },
  shareCardGlowA: {
    position: "absolute",
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: "rgba(184,198,255,0.2)",
    top: -120,
    right: -120,
  },
  shareCardGlowB: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(126,217,255,0.12)",
    bottom: 120,
    left: -140,
  },
  shareCardWatermark: {
    position: "absolute",
    right: -44,
    bottom: -48,
    width: 360,
    height: 360,
    opacity: 0.1,
    tintColor: "white",
    transform: [{ rotate: "16deg" }],
  },
  shareCardBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shareCardBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 28,
    fontWeight: "800",
  },
  shareCardAccent: {
    width: 96,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#B8C6FF",
    marginTop: 86,
  },
  shareCardEyebrow: {
    color: "#B8C6FF",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 22,
    letterSpacing: 1.4,
  },
  shareQuoteWrap: {
    marginTop: 58,
    paddingRight: 20,
  },
  shareQuoteMark: {
    color: "rgba(184,198,255,0.42)",
    fontSize: 112,
    lineHeight: 108,
    fontWeight: "900",
    marginBottom: -18,
  },
  shareCardBody: {
    color: "white",
    fontSize: 54,
    lineHeight: 72,
    fontWeight: "800",
  },
  shareCalloutWrap: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(184,198,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.075)",
    paddingHorizontal: 28,
    paddingVertical: 24,
    marginTop: 56,
  },
  shareCalloutText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 30,
    lineHeight: 40,
    fontWeight: "700",
  },
  shareCardFooter: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
  },
});
