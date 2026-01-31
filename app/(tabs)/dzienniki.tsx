import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#0B1B2B";

export default function Dzienniki() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 2, fontSize: 12 }}>
          DZIENNIKI
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.96)",
            fontSize: 28,
            fontWeight: "900",
            marginTop: 10,
            marginBottom: 24,
          }}
        >
          Od czego chcesz dziś zacząć?
        </Text>

        <Pressable
          onPress={() => router.push("/(tabs)/dziennik-uczuc")}
          style={{
            padding: 18,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(47,164,255,0.45)",
            backgroundColor: "rgba(47,164,255,0.12)",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
            Dziennik uczuć
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            Zapisz, co jest w Tobie dzisiaj.
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}