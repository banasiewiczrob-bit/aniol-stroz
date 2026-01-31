import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#0B1B2B";
const BORDER = "rgba(47,164,255,0.35)";

function Tile({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
        {title}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.60)", fontSize: 20, marginTop: 6 }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text style={{ color: "white", fontSize: 44, fontWeight: "900" }}>
          Dom
        </Text>

        <View style={{ height: 16 }} />

        <Tile
          title="Dziennik uczuć"
          subtitle="Zapisz, co jest w Tobie."
          onPress={() => router.push("/dziennik-uczuc")}
        />
        <Tile
          title="Historia uczuć"
          subtitle="Zobacz poprzednie wpisy."
          onPress={() => router.push("/historia-uczuc")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}