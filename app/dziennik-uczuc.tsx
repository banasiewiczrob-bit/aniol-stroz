import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#0B1B2B";
const KEY = "feelings_entries_v1";

const FEELINGS = ["Złość", "Wstyd", "Strach", "Smutek", "Poczucie winy", "Samotność", "Radość"] as const;

type Entry = {
  id: string;
  createdAt: string;
  feeling: string;
  note: string;
};

export default function DziennikUczuc() {
  const [feeling, setFeeling] = useState<string>(FEELINGS[0]);
  const [note, setNote] = useState("");

  const canSave = useMemo(() => note.trim().length >= 1, [note]);

  const save = async () => {
    const now = new Date();
    const entry: Entry = {
      id: String(now.getTime()),
      createdAt: now.toISOString(),
      feeling,
      note: note.trim(),
    };

    const raw = await AsyncStorage.getItem(KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));

    Keyboard.dismiss();
    router.push("/historia-uczuc");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
          >
            <Text style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 2, fontSize: 12 }}>
              DZIENNIK UCZUĆ
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.96)", fontSize: 28, fontWeight: "900", marginTop: 10 }}>
              Co jest w Tobie?
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 16, marginBottom: 8 }}>
              Wybierz uczucie:
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {FEELINGS.map((f) => {
                const active = f === feeling;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFeeling(f)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(47,164,255,0.45)",
                      backgroundColor: active ? "rgba(47,164,255,0.18)" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "800" }}>{f}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 18, marginBottom: 8 }}>
              Jedno zdanie:
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Np. Jestem spięty i mam ochotę uciec."
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              style={{
                minHeight: 120,
                color: "rgba(255,255,255,0.92)",
                borderWidth: 1,
                borderColor: "rgba(47,164,255,0.30)",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 14,
                lineHeight: 20,
                textAlignVertical: "top",
              }}
            />

            <Pressable
              onPress={save}
              disabled={!canSave}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: "center",
                backgroundColor: canSave ? "rgba(47,164,255,0.22)" : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(47,164,255,0.45)",
                opacity: canSave ? 1 : 0.6,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 16 }}>
                Zapisz
              </Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}