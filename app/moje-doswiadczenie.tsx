import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackButton } from "@/components/BackButton";
import { TYPE } from "@/styles/typography";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAFT_KEY = "single_note_v1";
const METHODS_KEY = "recovery_support_methods_v1";
const ACCENT = "#FFC7D9";
const ACCENT_BG = "rgba(255,199,217,0.22)";
const ACCENT_BORDER = "rgba(255,199,217,0.55)";
const Watermark = require("../assets/images/maly_aniol.png");

type RecoveryMethod = {
  id: string;
  text: string;
  createdAt: string;
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
        return [{ id: entry.id, text: entry.text, createdAt: entry.createdAt }];
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

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");
  const scrollRef = useRef<ScrollView>(null);
  const composerY = useRef(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [savedDraft, savedMethods] = await Promise.all([
          AsyncStorage.getItem(DRAFT_KEY),
          AsyncStorage.getItem(METHODS_KEY),
        ]);

        if (!active) return;

        if (savedDraft != null) {
          setText(savedDraft);
          lastSaved.current = savedDraft;
        }
        setMethods(parseMethods(savedMethods));
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
            const nextMethods = methods.filter((item) => item.id !== id);
            setMethods(nextMethods);

            try {
              await AsyncStorage.setItem(METHODS_KEY, JSON.stringify(nextMethods));
              showFeedback("Usunięto wpis z Twojej listy.");
            } catch {
              setMethods(previousMethods);
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

  const summaryText =
    methods.length === 0
      ? "Na początek zapisz 2-3 małe rzeczy, które pomagają Ci wrócić do równowagi."
      : `Masz już ${getMethodsLabel(methods.length)}. W trudniejszym momencie nie musisz zaczynać od zera.`;

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
        <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(255,199,217,0.1)", top: -70, right: -88 }} />
        <View style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(184,198,255,0.09)", bottom: 110, left: -80 }} />

        <Text style={{ ...TYPE.bodyStrong, color: "rgba(255,255,255,0.92)", marginTop: 10 }}>
          Zapisuj to, co naprawdę pomaga Ci wrócić do równowagi.
        </Text>

        <View
          style={{
            marginTop: 14,
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
            <Text style={{ ...TYPE.h3, color: "white" }}>Po co to robić?</Text>
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
              <Text style={{ ...TYPE.caption, color: ACCENT }}>{detailsOpen ? "Zwiń" : "Rozwiń"}</Text>
            </Pressable>
          </View>

          <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 12 }}>
            To jest Twoja prywatna lista sprawdzonych sposobów.
            {"\n\n"}
            Gdy przyjdzie trudniejszy moment, łatwiej wrócisz do konkretów zamiast szukać wszystkiego od zera.
          </Text>

          {detailsOpen && (
            <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 10 }}>
              Pisz krótko i konkretnie. Jedna rzecz na jeden wpis.
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
          style={{
            marginTop: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.09)",
            backgroundColor: "rgba(255,255,255,0.05)",
            padding: 14,
          }}
        >
          <Text style={{ ...TYPE.caption, color: ACCENT, letterSpacing: 0.3 }}>Twoja lista wsparcia</Text>
          <Text style={{ ...TYPE.bodyStrong, color: "white", marginTop: 6 }}>{summaryText}</Text>
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
            Jedna rzecz, która pomaga mi dzisiaj
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
              Zapisz do mojej listy
            </Text>
          </Pressable>

          {!!feedback && (
            <Text style={{ ...TYPE.caption, color: ACCENT, marginTop: -2, marginBottom: 8 }}>
              {feedback}
            </Text>
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={{ ...TYPE.bodyStrong, color: "white" }}>Moje sprawdzone sposoby</Text>
          <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)", marginTop: 6 }}>
            Wracaj tu, kiedy potrzebujesz przypomnieć sobie, co już wcześniej zadziałało.
          </Text>

          {methods.length === 0 ? (
            <View
              style={{
                marginTop: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.04)",
                padding: 14,
              }}
            >
              <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.78)" }}>
                Na razie nie masz tu żadnego wpisu. Zacznij od jednej małej rzeczy, która pomaga Ci przetrwać trudniejszy moment.
              </Text>
            </View>
          ) : (
            methods.map((item) => (
              <View
                key={item.id}
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: ACCENT_BORDER,
                  backgroundColor: "rgba(12,38,62,0.62)",
                  padding: 14,
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
