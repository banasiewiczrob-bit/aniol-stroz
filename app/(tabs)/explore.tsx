import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function ExploreScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B1B2B",
        paddingHorizontal: 20,
        paddingTop: 24,
      }}
    >
      {/* ZATRZYMAJ SIĘ */}
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Zatrzymaj się
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Nie musisz nic robić.
        </Text>
      </View>

      {/* ZAPISZ */}
      <Pressable
        onPress={() => router.push("/note")}
        style={{
          paddingVertical: 18,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          Zapisz jedną myśl
        </Text>
      </Pressable>

      {/* PRZYPOMNIJ SOBIE */}
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Przypomnij sobie
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Decyzja już zapadła. Reszta to hałas.
        </Text>
      </View>

      {/* KONTAKT */}
      <View>
        <Text
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Kontakt
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Gdy jest naprawdę ciężko.
        </Text>
      </View>
    </View>
  );
}