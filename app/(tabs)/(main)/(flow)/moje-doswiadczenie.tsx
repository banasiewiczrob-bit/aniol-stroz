import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackButton } from "@/components/BackButton";
import { useEffect, useRef, useState } from "react";
import { TYPE } from "@/styles/typography";
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const KEY = "single_note_v1";
const RECIPIENT_EMAIL = "info@aniolstroz.com.pl";

export default function MojeDoswiadczenieScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved != null) {
          setText(saved);
          lastSaved.current = saved;
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveNow = async (value: string) => {
    if (!loaded) return;
    if (value === lastSaved.current) return;
    try {
      await AsyncStorage.setItem(KEY, value);
      lastSaved.current = value;
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveNow(text);
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [text, loaded]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      void saveNow(text);
    });
    return () => sub.remove();
  }, [text, loaded]);

  const handleSendToRobert = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("Brak treści", "Najpierw wpisz swoje doświadczenie.");
      return;
    }

    await saveNow(text);

    const today = new Date().toLocaleDateString("pl-PL");
    const subject = `Moje doświadczenie (${today})`;
    const body = `Data: ${today}\n\n${trimmed}`;
    const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canMail = await Linking.canOpenURL(mailtoUrl);
      if (canMail) {
        await Linking.openURL(mailtoUrl);
        return;
      }

      await Share.share({
        message: `${subject}\n\n${body}`,
      });
    } catch {
      Alert.alert("Błąd wysyłki", "Nie udało się otworzyć wysyłki. Spróbuj ponownie.");
    }
  };

  const toggleDetails = () => {
    setDetailsOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 180);
      }
      return next;
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B1B2B" }}
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
          paddingBottom: Math.max(18, insets.bottom + 12),
        }}
      >
        <Text style={{ ...TYPE.bodyStrong, color: "rgba(255,255,255,0.92)", marginTop: 10 }}>
          Podziel się swoim doświadczeniem zdrowienia.
        </Text>

        <View
          style={{
            marginTop: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(120,200,255,0.22)",
            backgroundColor: "rgba(255,255,255,0.05)",
            padding: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ ...TYPE.h3, color: "white" }}>Opis i instrukcja</Text>
            <Pressable
              onPress={toggleDetails}
              style={{
                borderWidth: 1,
                borderColor: "rgba(120,200,255,0.35)",
                backgroundColor: "rgba(120,200,255,0.14)",
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ ...TYPE.caption, color: "#AEE1FF" }}>{detailsOpen ? "Zwiń" : "Rozwiń"}</Text>
            </Pressable>
          </View>

          <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 12 }}>
            Co najbardziej pomaga Ci utrzymać zdrowienie na co dzień?{"\n"}
            Jakie codzienne aktywności, nawyki albo rytuały są lub były dla Ciebie ważne?{"\n\n"}
            Np.
          </Text>

          {detailsOpen && (
            <>
              <Text style={{ ...TYPE.body, color: "rgba(255,255,255,0.88)", marginTop: 10 }}>
                • medytacja{"\n"}
                • czytanie literatury zdrowieniowej{"\n"}
                • spotkania{"\n"}
                • praktykowanie wdzięczności{"\n"}
                • sport{"\n"}
                • rozmowa z drugim uzależnionym, chorym, itp.{"\n"}
                • plan dnia{"\n"}
                • coś innego?{"\n\n"}
                Jeśli masz ochotę, podziel się proszę swoim doświadczeniem.{"\n\n"}
                Chcę potem najlepsze pomysły i praktyki wbudować w aplikację, żeby pomagały kolejnym osobom na drodze zdrowienia.{"\n\n"}
                Dzięki z góry.
              </Text>
            </>
          )}
        </View>

        <Text
          style={{
            marginTop: 14,
            marginBottom: 6,
            color: "rgba(255,255,255,0.92)",
            ...TYPE.bodyStrong,
          }}
        >
          Najbardziej w zdrowieniu pomaga mi...
        </Text>

        <View
          style={{
            marginTop: 14,
            minHeight: 220,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(120,200,255,0.3)",
            backgroundColor: "rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          {!text.trim() && (
            <Text
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 12,
                left: 14,
                right: 14,
                color: "rgba(255,255,255,0.68)",
                ...TYPE.body,
              }}
            >
              Napisz tutaj swoje doświadczenie...
            </Text>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            onBlur={() => {
              void saveNow(text);
            }}
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }, 120);
            }}
            placeholder=""
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 220,
              color: "white",
              ...TYPE.body,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          />
        </View>

        <Pressable
          onPress={() => {
            void handleSendToRobert();
          }}
          style={{
            marginTop: 8,
            marginBottom: 14,
            backgroundColor: "#3b5998",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ ...TYPE.button, color: "white" }}>Wyślij moje doświadczenie.</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
