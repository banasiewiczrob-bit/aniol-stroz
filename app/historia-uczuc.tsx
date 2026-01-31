import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#0B1B2B";
const KEY = "feelings_entries_v1";

type Entry = {
  id: string;
  createdAt: string;
  feeling: string;
  note: string;
};

export default function HistoriaUczuc() {
  const [items, setItems] = useState<Entry[]>([]);

  const load = async () => {
    const raw = await AsyncStorage.getItem(KEY);
    setItems(raw ? JSON.parse(raw) : []);
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem(KEY);
    setItems([]);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 2, fontSize: 12 }}>HISTORIA</Text>
        <Text style={{ color: "rgba(255,255,255,0.96)", fontSize: 28, fontWeight: "900", marginTop: 10 }}>
          Dziennik uczuć
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          <Pressable
            onPress={load}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>Odśwież</Text>
          </Pressable>

          <Pressable
            onPress={clearAll}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "800" }}>Wyczyść</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          {items.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.55)", lineHeight: 22 }}>
              Jeszcze nic tu nie ma. Zrób pierwszy wpis.
            </Text>
          ) : (
            items.map((e) => (
              <View
                key={e.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(47,164,255,0.28)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "900", fontSize: 16 }}>
                  {e.feeling}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 6 }}>
                  {new Date(e.createdAt).toLocaleString()}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10, lineHeight: 20 }}>
                  {e.note}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}