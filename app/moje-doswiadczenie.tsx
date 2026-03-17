import { BackButton } from "@/components/BackButton";
import { DEFAULT_APP_SETTINGS, loadAppSettings, saveAppSettings } from "@/hooks/useAppSettings";
import {
  buildBadgeShareMessage,
  fetchContributorProgress,
  getContributionBadgeDefinition,
  getOrCreateContributorId,
  type ContributorBadgeCode,
  type ContributorProgress,
} from "@/services/experienceCommunity";
import { deleteExperienceSubmission, submitExperienceSubmission } from "@/services/experienceSubmissions";
import { pobierzWspolneSposoby, type WspolnySposob } from "@/services/wspolnaBazaDoswiadczen";
import { TYPE } from "@/styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Checkbox from "expo-checkbox";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAFT_KEY = "single_note_v1";
const METHODS_KEY = "recovery_support_methods_v1";
const ACCENT = "#FFD18A";
const ACCENT_BG = "rgba(255,209,138,0.22)";
const ACCENT_BORDER = "rgba(255,209,138,0.55)";
const COMMUNITY_ACCENT = "#8ED9C5";
const COMMUNITY_ACCENT_BG = "rgba(142,217,197,0.18)";
const COMMUNITY_ACCENT_BORDER = "rgba(142,217,197,0.42)";
const Watermark = require("../assets/images/maly_aniol.png");
const BADGE_IMAGES: Record<ContributorBadgeCode, number> = {
  pierwszy_wklad: require("../assets/images/odznaki/pierwszy_wklad.png"),
  cicha_pomoc: require("../assets/images/odznaki/cicha_pomoc.png"),
  wspoltworca_bazy_doswiadczen: require("../assets/images/odznaki/wspoltworca_bazy_doswiadczen.png"),
  staly_wklad: require("../assets/images/odznaki/staly_wklad.png"),
  tworze_przestrzen_wsparcia: require("../assets/images/odznaki/tworze_przestrzen_wsparcia.png"),
};

type RecoveryMethod = {
  id: string;
  text: string;
  createdAt: string;
  sharedToCommunityAt?: string;
};

function parseMethods(raw: string | null): RecoveryMethod[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Partial<RecoveryMethod>;
        if (typeof entry.id !== "string" || typeof entry.text !== "string" || typeof entry.createdAt !== "string") {
          return [];
        }
        return [
          {
            id: entry.id,
            text: entry.text,
            createdAt: entry.createdAt,
            sharedToCommunityAt: typeof entry.sharedToCommunityAt === "string" ? entry.sharedToCommunityAt : undefined,
          },
        ];
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function getMethodsLabel(count: number) {
  if (count === 1) return "1 sprawdzony sposób";

  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} sprawdzone sposoby`;
  }

  return `${count} sprawdzonych sposobów`;
}

function getApprovedEntriesLabel(count: number) {
  if (count === 1) return "1 zaakceptowany wpis";

  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} zaakceptowane wpisy`;
  }

  return `${count} zaakceptowanych wpisów`;
}

function getBadgeShareCardCopy(
  badgeCode: ContributorBadgeCode,
  approvedCount: number,
  variant: "soft" | "detailed",
) {
  const approvedLabel = getApprovedEntriesLabel(approvedCount);

  switch (badgeCode) {
    case "pierwszy_wklad":
      return variant === "detailed"
        ? {
            headline: "Mój pierwszy wpis jest już częścią wspólnej bazy wsparcia.",
            detail: `To już ${approvedLabel}, który może pomóc też komuś innemu.`,
          }
        : {
            headline: "Dzielę się pierwszym krokiem, który mi pomógł.",
            detail: "",
          };
    case "cicha_pomoc":
      return variant === "detailed"
        ? {
            headline: "Moje doświadczenia zaczynają po cichu wspierać innych.",
            detail: `Mam już ${approvedLabel} we wspólnej bazie.`,
          }
        : {
            headline: "Po cichu dokładam coś dobrego dla innych.",
            detail: "",
          };
    case "wspoltworca_bazy_doswiadczen":
      return variant === "detailed"
        ? {
            headline: "Współtworzę bazę doświadczeń, która może naprawdę pomagać.",
            detail: `Mam już ${approvedLabel} we wspólnej bazie.`,
          }
        : {
            headline: "Razem z innymi tworzę miejsce realnego wsparcia.",
            detail: "",
          };
    case "staly_wklad":
      return variant === "detailed"
        ? {
            headline: "Moja regularność buduje dla innych coś naprawdę wartościowego.",
            detail: `Mam już ${approvedLabel} we wspólnej bazie.`,
          }
        : {
            headline: "Regularnie dokładam coś, co może komuś pomóc.",
            detail: "",
          };
    case "tworze_przestrzen_wsparcia":
      return variant === "detailed"
        ? {
            headline: "Z moich doświadczeń rośnie przestrzeń, która może dawać nadzieję.",
            detail: `Mam już ${approvedLabel} we wspólnej bazie.`,
          }
        : {
            headline: "Pomagam tworzyć bezpieczną przestrzeń dla innych.",
            detail: "",
          };
    default:
      return {
        headline: "",
        detail: "",
      };
  }
}

function formatSavedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pl-PL");
}

export default function MojeDoswiadczenieScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [methods, setMethods] = useState<RecoveryMethod[]>([]);
  const [feedback, setFeedback] = useState("");
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  const [shareConsentDraft, setShareConsentDraft] = useState(false);
  const [shareConsentSaved, setShareConsentSaved] = useState(DEFAULT_APP_SETTINGS.privacyConsentSharedExperience);
  const [contributorId, setContributorId] = useState<string | null>(null);
  const [contributionProgress, setContributionProgress] = useState<ContributorProgress>({
    approvedCount: 0,
    pendingCount: 0,
    badges: [],
  });
  const [, setContributionLoading] = useState(false);
  const [badgeShareSheetOpen, setBadgeShareSheetOpen] = useState(false);
  const [selectedBadgeCode, setSelectedBadgeCode] = useState<ContributorBadgeCode | null>(null);
  const [badgeShareVariant, setBadgeShareVariant] = useState<"soft" | "detailed">("soft");
  const [communityIdeasOpen, setCommunityIdeasOpen] = useState(false);
  const [communityIdeasLoading, setCommunityIdeasLoading] = useState(false);
  const [communityIdeasLoaded, setCommunityIdeasLoaded] = useState(false);
  const [communityIdeasError, setCommunityIdeasError] = useState("");
  const [communityIdeas, setCommunityIdeas] = useState<WspolnySposob[]>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");
  const scrollRef = useRef<ScrollView>(null);
  const shareCardRef = useRef<View>(null);
  const composerY = useRef(0);
  const sharingSectionY = useRef(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [savedDraft, savedMethods, settings, nextContributorId] = await Promise.all([
          AsyncStorage.getItem(DRAFT_KEY),
          AsyncStorage.getItem(METHODS_KEY),
          loadAppSettings(),
          getOrCreateContributorId(),
        ]);

        if (!active) return;

        if (savedDraft != null) {
          setText(savedDraft);
          lastSaved.current = savedDraft;
        }
        setMethods(parseMethods(savedMethods));
        setShareConsentSaved(settings.privacyConsentSharedExperience);
        setContributorId(nextContributorId);
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!contributorId) return;

    let active = true;
    setContributionLoading(true);

    void (async () => {
      try {
        const nextProgress = await fetchContributorProgress(contributorId);
        if (active) {
          setContributionProgress(nextProgress);
        }
      } catch (error) {
        console.error("Błąd pobierania wkładu użytkownika:", error);
      } finally {
        if (active) {
          setContributionLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [contributorId]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setFeedback("");
    }, 2800);
  };

  const saveDraftNow = async (value: string) => {
    if (!loaded) return;
    if (value === lastSaved.current) return;

    try {
      await AsyncStorage.setItem(DRAFT_KEY, value);
      lastSaved.current = value;
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (!loaded) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraftNow(text);
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [text, loaded]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      void saveDraftNow(text);
    });
    return () => sub.remove();
  }, [text, loaded]);

  const persistSharedExperienceConsent = async () => {
    if (shareConsentSaved) return true;
    if (!shareConsentDraft) return false;

    const settings = await loadAppSettings();
    const nextSettings = { ...settings, privacyConsentSharedExperience: true };
    await saveAppSettings(nextSettings);
    setShareConsentSaved(true);
    return true;
  };

  const toggleMethodSelection = (id: string) => {
    setSelectedMethodIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleSaveMethod = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("Brak treści", "Najpierw zapisz jedną konkretną rzecz, która Ci pomaga.");
      return;
    }

    const nextMethod: RecoveryMethod = {
      id: `${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const previousText = text;
    const previousMethods = methods;
    const nextMethods = [nextMethod, ...methods];

    if (saveTimer.current) clearTimeout(saveTimer.current);

    setMethods(nextMethods);
    setText("");

    try {
      await Promise.all([
        AsyncStorage.setItem(METHODS_KEY, JSON.stringify(nextMethods)),
        AsyncStorage.setItem(DRAFT_KEY, ""),
      ]);
      lastSaved.current = "";
      showFeedback(
        nextMethods.length === 1
          ? "Zapisane. To jest początek Twojej prywatnej listy wsparcia."
          : `Zapisane. Masz już ${getMethodsLabel(nextMethods.length)}.`,
      );
    } catch {
      setMethods(previousMethods);
      setText(previousText);
      Alert.alert("Błąd zapisu", "Nie udało się zapisać tej pozycji. Spróbuj ponownie.");
    }
  };

  const handleSubmitSelectedMethods = async () => {
    const selectedMethods = methods.filter((item) => selectedMethodIds.includes(item.id) && !item.sharedToCommunityAt);

    if (selectedMethods.length === 0) {
      Alert.alert("Wybierz wpisy", "Zaznacz przynajmniej jeden wpis, który chcesz przekazać do wspólnej bazy sposobów.");
      return;
    }

    if (!shareConsentSaved && !shareConsentDraft) {
      Alert.alert(
        "Potwierdź zasady udostępniania",
        "Jeśli chcesz przekazać wpisy anonimowo do wspólnej bazy doświadczeń, najpierw zaznacz potwierdzenie pod wyjaśnieniem."
      );
      setSharingOpen(true);
      return;
    }

    try {
      const nextContributorId = contributorId ?? (await getOrCreateContributorId());
      if (!contributorId) {
        setContributorId(nextContributorId);
      }

      if (!shareConsentSaved && shareConsentDraft) {
        await persistSharedExperienceConsent();
      }

      const results = await Promise.allSettled(
        selectedMethods.map((item) =>
          submitExperienceSubmission({
            content: item.text.trim(),
            contributorId: nextContributorId,
            clientEntryId: item.id,
          }),
        ),
      );

      const successfulIds = selectedMethods
        .filter((_, index) => results[index]?.status === "fulfilled")
        .map((item) => item.id);

      const failedCount = results.length - successfulIds.length;

      if (successfulIds.length > 0) {
        const sharedAt = new Date().toISOString();
        const nextMethods = methods.map((item) =>
          successfulIds.includes(item.id) ? { ...item, sharedToCommunityAt: sharedAt } : item,
        );

        setMethods(nextMethods);
        setSelectedMethodIds((current) => current.filter((id) => !successfulIds.includes(id)));
        await AsyncStorage.setItem(METHODS_KEY, JSON.stringify(nextMethods));

        setContributionLoading(true);
        try {
          const nextProgress = await fetchContributorProgress(nextContributorId);
          setContributionProgress(nextProgress);
        } catch (error) {
          console.error("Błąd odświeżenia wkładu użytkownika:", error);
        } finally {
          setContributionLoading(false);
        }
      }

      if (successfulIds.length > 0 && failedCount === 0) {
        showFeedback(
          successfulIds.length === 1
            ? "Wpis został przekazany anonimowo do przeglądu."
            : `Przekazałem anonimowo ${successfulIds.length} wpisy do przeglądu.`,
        );
        return;
      }

      if (successfulIds.length > 0) {
        showFeedback(
          `Przekazałem anonimowo ${successfulIds.length} wpisy. ${failedCount} nie udało się wysłać w tej chwili.`,
        );
        return;
      }

      Alert.alert("Nie udało się wysłać", "Spróbuj ponownie za chwilę.");
    } catch (error) {
      console.error("Błąd anonimowego przekazania doświadczeń:", error);
      Alert.alert("Nie udało się wysłać", "Spróbuj ponownie za chwilę.");
    }
  };

  const handleOpenBadgeShareSheet = (badgeCode: ContributorBadgeCode) => {
    setSelectedBadgeCode(badgeCode);
    setBadgeShareSheetOpen(true);
  };

  const handleShareBadge = async (variant: "soft" | "detailed") => {
    if (!selectedBadgeCode) return;

    try {
      await Share.share({
        message: buildBadgeShareMessage(selectedBadgeCode, contributionProgress.approvedCount, variant),
      });
    } catch {
      Alert.alert("Nie udało się udostępnić", "Spróbuj ponownie za chwilę.");
    } finally {
      setBadgeShareSheetOpen(false);
    }
  };

  const handleDeleteMethod = (id: string) => {
    const target = methods.find((item) => item.id === id);
    if (!target) return;

    Alert.alert("Usunąć wpis?", "Ta pozycja zniknie z Twojej listy sprawdzonych sposobów.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => {
          void (async () => {
            const previousMethods = methods;
            const previousSelectedIds = selectedMethodIds;
            const previousProgress = contributionProgress;
            const nextMethods = methods.filter((item) => item.id !== id);
            setMethods(nextMethods);
            setSelectedMethodIds((current) => current.filter((itemId) => itemId !== id));

            try {
              if (target.sharedToCommunityAt) {
                if (!contributorId) {
                  throw new Error("Brak identyfikatora anonimowego wkładu.");
                }

                await deleteExperienceSubmission({
                  contributorId,
                  clientEntryId: target.id,
                });

                try {
                  const nextProgress = await fetchContributorProgress(contributorId);
                  setContributionProgress(nextProgress);
                } catch (error) {
                  console.error("Błąd odświeżenia wkładu po usunięciu wpisu:", error);
                }
              }

              await AsyncStorage.setItem(METHODS_KEY, JSON.stringify(nextMethods));
              showFeedback(
                target.sharedToCommunityAt
                  ? "Usunięto wpis z Twojej listy i z bazy doświadczeń."
                  : "Usunięto wpis z Twojej listy.",
              );
            } catch {
              setMethods(previousMethods);
              setSelectedMethodIds(previousSelectedIds);
              setContributionProgress(previousProgress);
              Alert.alert("Błąd zapisu", "Nie udało się usunąć wpisu. Spróbuj ponownie.");
            }
          })();
        },
      },
    ]);
  };

  const toggleDetails = () => {
    setDetailsOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }, 180);
      }
      return next;
    });
  };

  const openSharingSelector = () => {
    setSharingOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, composerY.current + sharingSectionY.current - 12),
            animated: true,
          });
        }, 120);
      }
      return next;
    });
  };

  const summaryText =
    methods.length === 0
      ? "Na początek zapisz 2-3 małe rzeczy, które pomagają Ci wrócić do równowagi."
      : `Masz już ${getMethodsLabel(methods.length)}. W trudniejszym momencie nie musisz zaczynać od zera.`;
  const communitySummaryText =
    communityIdeasLoaded && communityIdeas.length > 0
      ? "Anonimowe wpisy ze wspólnej bazy, które możesz dodać do swojej listy."
      : "Anonimowe, zaakceptowane wpisy ze wspólnej bazy doświadczeń.";
  const latestBadgeAward = contributionProgress.badges[0] ?? null;
  const latestBadge = latestBadgeAward ? getContributionBadgeDefinition(latestBadgeAward.badgeCode) : null;
  const selectedBadge = selectedBadgeCode ? getContributionBadgeDefinition(selectedBadgeCode) : null;
  const latestBadgeImage = latestBadge ? BADGE_IMAGES[latestBadge.code] : null;
  const selectedBadgeImage = selectedBadge ? BADGE_IMAGES[selectedBadge.code] : null;
  const shareCardCopy = selectedBadge
    ? getBadgeShareCardCopy(selectedBadge.code, contributionProgress.approvedCount, badgeShareVariant)
    : { headline: "", detail: "" };
  const hasContributionBadge = Boolean(latestBadge && latestBadgeAward);

  const pokazKrotkiKomunikat = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 2600);
  };

  const czySposobJuzJestNaLiscie = (value: string) => {
    const normalized = value.trim().toLocaleLowerCase("pl-PL");
    return methods.some((item) => item.text.trim().toLocaleLowerCase("pl-PL") === normalized);
  };

  const zaladujWspolneSposoby = async () => {
    if (communityIdeasLoading) return;

    try {
      setCommunityIdeasLoading(true);
      setCommunityIdeasError("");
      const nextIdeas = await pobierzWspolneSposoby();
      setCommunityIdeas(nextIdeas);
      setCommunityIdeasLoaded(true);
    } catch (error) {
      console.error("Błąd pobierania wspólnej bazy doświadczeń:", error);
      setCommunityIdeasError("Nie udało się pobrać wpisów. Spróbuj ponownie za chwilę.");
    } finally {
      setCommunityIdeasLoading(false);
    }
  };

  const przelaczWspolneSposoby = () => {
    setCommunityIdeasOpen((prev) => {
      const next = !prev;
      if (next && !communityIdeasLoaded && !communityIdeasLoading) {
        void zaladujWspolneSposoby();
      }
      return next;
    });
  };

  const dodajWspolnySposobDoListy = async (entry: WspolnySposob) => {
    if (czySposobJuzJestNaLiscie(entry.tresc)) {
      pokazKrotkiKomunikat("Ten sposób masz już na swojej liście.");
      return;
    }

    const nextMethods = [
      {
        id: `wspolna_baza_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        text: entry.tresc,
        createdAt: new Date().toISOString(),
      },
      ...methods,
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    try {
      setMethods(nextMethods);
      await AsyncStorage.setItem(METHODS_KEY, JSON.stringify(nextMethods));
      pokazKrotkiKomunikat(`Dodano do Twojej listy. Masz już ${getMethodsLabel(nextMethods.length)}.`);
    } catch (error) {
      console.error("Błąd dodawania sposobu ze wspólnej bazy:", error);
      pokazKrotkiKomunikat("Nie udało się dodać wpisu do Twojej listy.");
    }
  };

  const handleShareBadgeCard = async (variant: "soft" | "detailed") => {
    if (!selectedBadge) return;

    try {
      setBadgeShareVariant(variant);
      await new Promise((resolve) => setTimeout(resolve, 120));

      const shareText = buildBadgeShareMessage(selectedBadge.code, contributionProgress.approvedCount, variant);
      let sharedAsImage = false;

      if (shareCardRef.current) {
        const uri = await captureRef(shareCardRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: "Udostępnij odznakę",
          });
          sharedAsImage = true;
        }
      }

      if (!sharedAsImage) {
        await Share.share({
          message: shareText,
        });
      }

      setBadgeShareSheetOpen(false);
    } catch (error) {
      console.error("Błąd udostępniania odznaki:", error);
      Alert.alert("Nie udało się udostępnić odznaki", "Spróbuj ponownie za chwilę.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#061A2C" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <BackButton />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: Math.max(64, insets.bottom + 40),
        }}
      >
        <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(255,209,138,0.1)", top: -70, right: -88 }} />
        <View style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,226,174,0.09)", bottom: 110, left: -80 }} />

        <Text style={{ ...TYPE.h1, color: "white", marginTop: 10, marginBottom: 6 }}>
          Napisz, co Ci pomaga
        </Text>
        {hasContributionBadge && latestBadge && latestBadgeAward ? (
          <Pressable
            onPress={() => handleOpenBadgeShareSheet(latestBadge.code)}
            style={{
              marginTop: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: ACCENT_BORDER,
              backgroundColor: "rgba(12,38,62,0.82)",
              padding: 14,
              overflow: "hidden",
            }}
          >
            <Image
              source={Watermark}
              resizeMode="contain"
              style={{
                position: "absolute",
                right: -18,
                bottom: -22,
                width: 120,
                height: 120,
                opacity: 0.11,
                tintColor: "white",
                transform: [{ rotate: "16deg" }],
              }}
            />
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Twoja odznaka</Text>
              <Text style={{ ...TYPE.caption, color: ACCENT }}>Dotknij, aby otworzyć</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 }}>
              {latestBadgeImage ? (
                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 28,
                    borderWidth: 1.5,
                    borderColor: ACCENT_BORDER,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    padding: 8,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={latestBadgeImage}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%", borderRadius: 20 }}
                  />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPE.bodyStrong, color: ACCENT }}>{latestBadge.title}</Text>
                <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.82)", marginTop: 8 }}>
                  {latestBadge.description}
                </Text>
                <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.62)", marginTop: 10 }}>
                  Przyznano {formatSavedDate(latestBadgeAward.awardedAt)}
                </Text>
              </View>
            </View>
          </Pressable>
        ) : null}
        <View
          style={{
            marginTop: hasContributionBadge ? 10 : 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: ACCENT_BORDER,
            backgroundColor: "rgba(12,38,62,0.78)",
            padding: 12,
            overflow: "hidden",
          }}
        >
          <Image source={Watermark} resizeMode="contain" style={{ position: "absolute", right: -18, bottom: -20, width: 120, height: 120, opacity: 0.11, tintColor: "white", transform: [{ rotate: "16deg" }] }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ ...TYPE.h3, color: "white" }}>Opis i instrukcja</Text>
            <Pressable
              onPress={toggleDetails}
              style={{
                borderWidth: 1,
                borderColor: ACCENT_BORDER,
                backgroundColor: ACCENT_BG,
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ ...TYPE.caption, color: ACCENT }}>{detailsOpen ? "Mniej" : "Czytaj więcej"}</Text>
            </Pressable>
          </View>

          {detailsOpen ? (
            <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 12 }}>
              To jest Twoja prywatna lista sprawdzonych sposobów.
              {"\n\n"}
              Gdy przyjdzie trudniejszy moment, łatwiej wrócisz do sparwdzonych rozwiązań.
            </Text>
          ) : null}

          {detailsOpen && (
            <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 10 }}>
              Opisz konkretnie, wszystko co Ci dziś pomogło. Im prostszy i bardziej konkretny opis, tym lepiej. Unikaj ogólnych haseł typu "wsparcie od bliskich" albo "zdrowe nawyki". Skup się na tym, co naprawdę zrobiłeś lub co naprawdę Ci pomogło, nawet jeśli to było coś bardzo prostego.
              {"\n\n"}
              Np.
              {"\n"}
              • spacer bez telefonu
              {"\n"}
              • telefon do zaufanej osoby
              {"\n"}
              • spotkanie online lub meeting
              {"\n"}
              • modlitwa albo medytacja
              {"\n"}
              • zimny prysznic
              {"\n"}
              • plan na najbliższą godzinę
              {"\n\n"}
              Te wpisy zostają u Ciebie w aplikacji. To ma być Twoja własna baza rzeczy, które realnie działają.
            </Text>
          )}
        </View>

        <View
          onLayout={(event) => {
            composerY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text
            style={{
              marginTop: 16,
              marginBottom: 6,
              color: "rgba(255,255,255,0.92)",
              ...TYPE.bodyStrong,
            }}
          >
            Mój sposób w jaki dziś sobie poradziłem w sytuacji dla mnie trudnej to...
          </Text>

          <View
            style={{
              marginTop: 8,
              minHeight: 180,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: ACCENT_BORDER,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              onBlur={() => {
                void saveDraftNow(text);
              }}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: Math.max(0, composerY.current - 12), animated: true });
                }, 120);
              }}
              placeholder="Np. 15 minut spaceru, telefon do sponsora, modlitwa, meeting, oddech 4-6..."
              placeholderTextColor="rgba(255,255,255,0.55)"
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 180,
                color: "white",
                ...TYPE.body,
                paddingVertical: 12,
                paddingHorizontal: 14,
              }}
            />
          </View>

          <Pressable
            disabled={!loaded || !text.trim()}
            onPress={() => {
              void handleSaveMethod();
            }}
            style={{
              marginTop: 10,
              marginBottom: 10,
              backgroundColor: !loaded || !text.trim() ? "rgba(255,255,255,0.08)" : ACCENT_BG,
              borderWidth: 1,
              borderColor: !loaded || !text.trim() ? "rgba(255,255,255,0.12)" : ACCENT_BORDER,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ ...TYPE.button, color: !loaded || !text.trim() ? "rgba(255,255,255,0.55)" : "white" }}>
              Zapisz do mojej listy sposobów
            </Text>
          </Pressable>

          <View
            style={{ marginTop: 12 }}
            onLayout={(event) => {
              sharingSectionY.current = event.nativeEvent.layout.y;
            }}
          >
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: ACCENT_BORDER,
                backgroundColor: "rgba(12,38,62,0.78)",
                padding: 14,
                overflow: "hidden",
              }}
            >
              <Image
                source={Watermark}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  right: -18,
                  bottom: -22,
                  width: 120,
                  height: 120,
                  opacity: 0.11,
                  tintColor: "white",
                  transform: [{ rotate: "16deg" }],
                }}
              />
              <Pressable onPress={openSharingSelector}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Możesz także pomóc innym...</Text>
                    <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.72)", marginTop: 4 }}>
                      Anonimowo, bezpiecznie we wspólnej bazie....
                    </Text>
                  </View>
                  <Text style={{ ...TYPE.caption, color: ACCENT, fontWeight: "700" }}>{sharingOpen ? "Zwiń" : "Wybierz wpisy"}</Text>
                </View>
              </Pressable>

            {sharingOpen ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.82)" }}>
                  Zaznacz wpisy i wyślij je anonimowo.
                </Text>

                {shareConsentSaved ? (
                  <View
                    style={{
                      marginTop: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(176,236,201,0.42)",
                      backgroundColor: "rgba(74,139,105,0.18)",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ ...TYPE.caption, color: "#F3FFF8" }}>
                      Masz już zapisaną zgodę na anonimowe przekazywanie wpisów. Nadal decydujesz osobno przy każdym wpisie.
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <Checkbox
                      value={shareConsentDraft}
                      onValueChange={setShareConsentDraft}
                      color={shareConsentDraft ? ACCENT : undefined}
                      style={{ marginTop: 2 }}
                    />
                    <Pressable style={{ flex: 1 }} onPress={() => setShareConsentDraft((prev) => !prev)}>
                      <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.82)", lineHeight: 20 }}>
                        Rozumiem, że wysyłam anonimowo tylko zaznaczone wpisy i bez danych osobowych.
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={() => router.push("/polityka-prywatnosci")}
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.18)",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{ ...TYPE.caption, color: "white" }}>Polityka prywatności</Text>
                </Pressable>
                {methods.length > 0 ? (
                  <>
                    <Text style={{ ...TYPE.bodyStrong, color: "white", marginTop: 16 }}>
                      Wybierz wpisy, którymi chcesz się podzielić z innymi użytkownikami. Każdy wpis zostanie przekazany anonimowo do przeglądu, ale nadal pozostanie u Ciebie w aplikacji. Jeśli wpis został już przekazany, zobaczysz informację pod nim i nie będzie można go ponownie zaznaczyć. Możesz też bez problemu usunąć każdy wpis ze swojej listy - wtedy zniknie on też z bazy doświadczeń, jeśli wcześniej był tam przekazany.
                    </Text>

                    <View style={{ marginTop: 10, gap: 10 }}>
                      {methods.map((item) => {
                        const isShared = Boolean(item.sharedToCommunityAt);
                        const isSelected = selectedMethodIds.includes(item.id);

                        return (
                          <Pressable
                            key={item.id}
                            disabled={isShared}
                            onPress={() => {
                              if (!isShared) toggleMethodSelection(item.id);
                            }}
                            style={{
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: isSelected ? ACCENT_BORDER : "rgba(255,255,255,0.12)",
                              backgroundColor: isSelected ? ACCENT_BG : "rgba(255,255,255,0.05)",
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              opacity: isShared ? 0.68 : 1,
                              flexDirection: "row",
                              alignItems: "flex-start",
                              gap: 10,
                            }}
                          >
                            <Checkbox
                              value={isShared || isSelected}
                              onValueChange={() => {
                                if (!isShared) toggleMethodSelection(item.id);
                              }}
                              disabled={isShared}
                              color={isSelected || isShared ? ACCENT : undefined}
                              style={{ marginTop: 2 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={{ ...TYPE.body, color: "white" }}>{item.text}</Text>
                              <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.72)", marginTop: 6 }}>
                                {isShared ? "Ten wpis został już przekazany do przeglądu." : "Ten wpis pozostaje anonimowy."}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      disabled={selectedMethodIds.length === 0}
                      onPress={() => {
                        void handleSubmitSelectedMethods();
                      }}
                      style={{
                        marginTop: 14,
                        backgroundColor: selectedMethodIds.length === 0 ? "rgba(255,255,255,0.08)" : ACCENT_BG,
                        borderWidth: 1,
                        borderColor: selectedMethodIds.length === 0 ? "rgba(255,255,255,0.12)" : ACCENT_BORDER,
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          ...TYPE.button,
                          color: selectedMethodIds.length === 0 ? "rgba(255,255,255,0.55)" : "white",
                        }}
                      >
                        Wyślij do bazy sposobów
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.72)", marginTop: 16 }}>
                    Najpierw zapisz u siebie przynajmniej jeden sposób. Potem tutaj wybierzesz, co chcesz przekazać innym.
                  </Text>
                )}
              </View>
            ) : null}
            </View>
          </View>

          {!!feedback && (
            <Text style={{ ...TYPE.caption, color: ACCENT, marginTop: -2, marginBottom: 8 }}>
              {feedback}
            </Text>
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COMMUNITY_ACCENT_BORDER,
              backgroundColor: "rgba(8,40,52,0.82)",
              padding: 14,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -26,
                right: -18,
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: "rgba(142,217,197,0.1)",
              }}
            />
            <Image
              source={Watermark}
              resizeMode="contain"
              style={{
                position: "absolute",
                right: -18,
                bottom: -20,
                width: 120,
                height: 120,
                opacity: 0.11,
                tintColor: COMMUNITY_ACCENT,
                transform: [{ rotate: "16deg" }],
              }}
            />
            <Pressable onPress={przelaczWspolneSposoby}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Co pomaga innym</Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: COMMUNITY_ACCENT_BORDER,
                      backgroundColor: COMMUNITY_ACCENT_BG,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ ...TYPE.caption, color: COMMUNITY_ACCENT }}>Wspólna baza inspiracji</Text>
                  </View>
                </View>
                <Text style={{ ...TYPE.caption, color: COMMUNITY_ACCENT }}>{communityIdeasOpen ? "Mniej" : "Czytaj więcej"}</Text>
              </View>
              <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)", marginTop: 6 }}>
                {communitySummaryText}
              </Text>
            </Pressable>

            {communityIdeasOpen ? (
              <View
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: "rgba(142,217,197,0.14)",
              }}
            >
              <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)", marginBottom: 14 }}>
                To anonimowe, zaakceptowane wpisy ze wspólnej bazy. Jeśli coś do Ciebie pasuje, możesz dodać to do swojej listy.
              </Text>

              {communityIdeasLoading ? (
                <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)" }}>Ładuję wpisy...</Text>
              ) : communityIdeasError ? (
                <View>
                  <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)" }}>{communityIdeasError}</Text>
                  <Pressable
                    onPress={() => {
                      void zaladujWspolneSposoby();
                    }}
                    style={{
                      marginTop: 12,
                      alignSelf: "flex-start",
                      borderWidth: 1,
                      borderColor: COMMUNITY_ACCENT_BORDER,
                      borderRadius: 999,
                      backgroundColor: COMMUNITY_ACCENT_BG,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                    }}
                  >
                    <Text style={{ ...TYPE.caption, color: "white" }}>Spróbuj ponownie</Text>
                  </Pressable>
                </View>
              ) : communityIdeas.length === 0 ? (
                <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)" }}>
                  Na razie nie ma tu jeszcze zaakceptowanych wpisów.
                </Text>
              ) : (
                communityIdeas.map((item, index) => {
                  const alreadySaved = czySposobJuzJestNaLiscie(item.tresc);

                  return (
                    <View
                      key={item.id}
                      style={{
                        paddingTop: index === 0 ? 0 : 12,
                        marginTop: index === 0 ? 0 : 12,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: "rgba(255,255,255,0.09)",
                      }}
                    >
                      <Text style={{ ...TYPE.bodyStrong, color: "white" }}>{item.tresc}</Text>
                      <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                        {item.dodanoO ? `Dodano do bazy ${formatSavedDate(item.dodanoO)}` : "Anonimowy wpis ze wspólnej bazy"}
                      </Text>
                      <Pressable
                        disabled={alreadySaved}
                        onPress={() => {
                          void dodajWspolnySposobDoListy(item);
                        }}
                        style={{
                          marginTop: 12,
                          alignSelf: "flex-start",
                          borderWidth: 1,
                          borderColor: alreadySaved ? "rgba(255,255,255,0.14)" : COMMUNITY_ACCENT_BORDER,
                          borderRadius: 999,
                          backgroundColor: alreadySaved ? "rgba(255,255,255,0.05)" : COMMUNITY_ACCENT_BG,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                        }}
                      >
                        <Text style={{ ...TYPE.caption, color: alreadySaved ? "rgba(255,255,255,0.52)" : COMMUNITY_ACCENT }}>
                          {alreadySaved ? "Już masz na liście" : "Dodaj do mojej listy"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Pressable
            onPress={() => setMethodsOpen((prev) => !prev)}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: ACCENT_BORDER,
              backgroundColor: "rgba(12,38,62,0.62)",
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Moje sprawdzone sposoby</Text>
              <Text style={{ ...TYPE.caption, color: ACCENT }}>{methodsOpen ? "Mniej" : "Czytaj więcej"}</Text>
            </View>
            <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)", marginTop: 6 }}>
              {summaryText}
            </Text>
          </Pressable>

          {methodsOpen ? (
            <View
              style={{
                marginTop: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: ACCENT_BORDER,
                backgroundColor: "rgba(12,38,62,0.78)",
                padding: 14,
                overflow: "hidden",
              }}
            >
              <Image
                source={Watermark}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  right: -18,
                  bottom: -22,
                  width: 120,
                  height: 120,
                  opacity: 0.11,
                  tintColor: "white",
                  transform: [{ rotate: "16deg" }],
                }}
              />
              {methods.length === 0 ? (
                <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)" }}>
                  Na razie nie masz tu żadnego wpisu.
                </Text>
              ) : (
                methods.map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      paddingTop: index === 0 ? 0 : 12,
                      marginTop: index === 0 ? 0 : 12,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: "rgba(255,255,255,0.09)",
                    }}
                  >
                    <Text style={{ ...TYPE.bodyStrong, color: "white" }}>{item.text}</Text>
                    <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.6)" }}>
                        Dodano {formatSavedDate(item.createdAt)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          handleDeleteMethod(item.id);
                        }}
                        style={{
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.18)",
                          borderRadius: 999,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.78)" }}>Usuń</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={badgeShareSheetOpen}
        onRequestClose={() => setBadgeShareSheetOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(2,8,18,0.56)",
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setBadgeShareSheetOpen(false)} />
          <View
            style={{
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "#0D2236",
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: Math.max(insets.bottom + 18, 28),
            }}
          >
            <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Udostępnij odznakę</Text>
            <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)", marginTop: 10 }}>
              Udostępnisz tylko odznakę, bez treści wpisów.
            </Text>

            {selectedBadge ? (
              <View
                style={{
                  marginTop: 16,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: ACCENT_BORDER,
                  backgroundColor: "#0A2136",
                  padding: 18,
                  overflow: "hidden",
                }}
              >
                <View
                  ref={shareCardRef}
                  collapsable={false}
                  style={{
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    backgroundColor: "#0E2942",
                    padding: 18,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -36,
                      right: -28,
                      width: 124,
                      height: 124,
                      borderRadius: 62,
                      backgroundColor: "rgba(255,209,138,0.12)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: -52,
                      left: -28,
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  />
                  <Image
                    source={Watermark}
                    style={{
                      position: "absolute",
                      right: -10,
                      bottom: -8,
                      width: 82,
                      height: 82,
                      opacity: 0.12,
                    }}
                    resizeMode="contain"
                  />
                  <Text style={{ ...TYPE.caption, color: "rgba(255,255,255,0.66)" }}>Anioł Stróż</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 14 }}>
                    {selectedBadgeImage ? (
                      <View
                        style={{
                          width: 112,
                          height: 112,
                          borderRadius: 28,
                          borderWidth: 1.5,
                          borderColor: ACCENT_BORDER,
                          backgroundColor: "rgba(255,255,255,0.08)",
                          padding: 8,
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={selectedBadgeImage}
                          resizeMode="cover"
                          style={{ width: "100%", height: "100%", borderRadius: 20 }}
                        />
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...TYPE.bodyStrong, color: "white" }}>{selectedBadge.title}</Text>
                      <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.76)", marginTop: 8 }}>
                        {shareCardCopy.headline}
                      </Text>
                      {shareCardCopy.detail ? (
                        <Text style={{ ...TYPE.caption, color: ACCENT, marginTop: 12 }}>
                          {shareCardCopy.detail}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                void handleShareBadgeCard("soft");
              }}
              style={{
                marginTop: 18,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: ACCENT_BORDER,
                backgroundColor: ACCENT_BG,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ ...TYPE.button, color: "white" }}>Wersja dyskretna</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void handleShareBadgeCard("detailed");
              }}
              style={{
                marginTop: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.05)",
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ ...TYPE.button, color: "white" }}>Wersja z liczbą wkładu</Text>
            </Pressable>

            <Pressable
              onPress={() => setBadgeShareSheetOpen(false)}
              style={{
                marginTop: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "transparent",
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ ...TYPE.button, color: "rgba(255,255,255,0.74)" }}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
