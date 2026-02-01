import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const BG = "#071826";
const TILE_BG = "rgba(255,255,255,0.05)";
const TILE_BORDER = "rgba(120,200,255,0.22)";
const SUB = "rgba(255,255,255,0.65)";
const SECTION = "rgba(255,255,255,0.85)";

// Poprawiona ścieżka - wychodzimy z (tabs) do app, potem do assets
const Watermark = require("../assets/images/maly_aniol.png");

function Tile({ title, subtitle, to, disabled }: { title: string; subtitle?: string; to?: string; disabled?: boolean; }) {
  return (
    <Pressable
      onPress={() => { if (!disabled && to) router.push(to as any); }}
      style={({ pressed }) => [
        {
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: TILE_BG,
          borderWidth: 2,
          borderColor: TILE_BORDER,
          marginBottom: 12,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          overflow: "hidden",
          position: "relative",
          minHeight: 85,
        },
      ]}
    >
      <Image
        source={Watermark}
        style={{
          position: "absolute",
          right: -15,
          bottom: -15,
          width: 80,
          height: 80,
          opacity: 0.07,
          tintColor: "white",
          transform: [{ rotate: "15deg" }],
        }}
      />
      <View style={{ zIndex: 2 }}>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>{title}</Text>
        {!!subtitle && (
          <Text style={{ marginTop: 6, color: SUB, fontSize: 14, lineHeight: 19, width: '80%' }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function Dom() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 78 }}>
      <Text style={styles.headerTitle}>Dom</Text>
      <Text style={styles.headerSubtitle}>
        ...to miejsce gdzie wszystko się zaczyna.{"\n"}
        Znajdziesz tu podstawowe narzędzia potrzebne w Twojej podróży ku zdrowieniu.
        A ja jestem tutaj, aby Cię wspierać na każdym etapie tej drogi.
      </Text>

      <Tile title="Kontrakt" subtitle="Umowa z samym sobą" to="/kontrakt" />
      <Tile title="Licznik zdrowienia" subtitle="Start zdrowienia i rocznice" to="/licznik" />
      <Tile title="Plan dnia" subtitle="Jedna rzecz na teraz" to="/plan-dnia" />

      <View style={{ marginTop: 28, marginBottom: 12 }}>
        <Text style={styles.sectionTitle}>Wsparcie</Text>
        <Tile title="Modlitwa o pogodę ducha" subtitle="kilka zwykłych słów" to="/wsparcie" />
        <Tile title="HALT" subtitle="Cztery ważne sprawy" to="/wsparcie" />
        <Tile title="Właśnie dzisiaj" subtitle="program na 24 godziny" to="/wsparcie" />
        <Tile title="Siatka wsparcia" subtitle="Ludzie i kontakty" to="/wsparcie-siatka" />
        <Tile title="Kontakt" subtitle="Gdy potrzebujesz pomocy" to="/wsparcie-kontakt" />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { color: "white", fontSize: 32, fontWeight: "800", marginBottom: 16 },
  headerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 24, fontWeight: "400", marginBottom: 40 },
  sectionTitle: { color: SECTION, fontSize: 22, fontWeight: "700", marginBottom: 16 },
});