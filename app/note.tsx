import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { TYPE } from "@/styles/typography";

const KEY = "single_note_v1";

export default function NoteScreen() {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");

  // wczytaj zapis
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

  // funkcja zapisu natychmiastowego
  const saveNow = async (value: string) => {
    if (!loaded) return;
    if (value === lastSaved.current) return;
    try {
      await AsyncStorage.setItem(KEY, value);
      lastSaved.current = value;
    } catch {
      // cisza
    }
  };

  // autosave po krótkiej przerwie w pisaniu
  useEffect(() => {
    if (!loaded) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNow(text);
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [text, loaded]);

  // zapis, gdy chowasz klawiaturę
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      saveNow(text);
    });
    return () => sub.remove();
  }, [text, loaded]);

  // zapis przy wyjściu z ekranu
  const handleBack = async () => {
    await saveNow(text);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B1B2B" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18 }}>
        <Pressable onPress={handleBack} style={{ paddingVertical: 10 }}>
          <Text style={{ ...TYPE.bodySmall, color: "rgba(255,255,255,0.85)" }}>←</Text>
        </Pressable>

        <Text
          style={{
            ...TYPE.bodyStrong,
            color: "rgba(255,255,255,0.92)",
            marginTop: 10,
          }}
        >
          Nie musisz tego porządkować.
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={() => saveNow(text)}
          placeholder="Napisz, co teraz jest."
          placeholderTextColor="rgba(255,255,255,0.45)"
          multiline
          autoFocus
          textAlignVertical="top"
          style={{
            ...TYPE.body,
            marginTop: 14,
            flex: 1,
            color: "rgba(255,255,255,0.92)",
            paddingVertical: 12,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
