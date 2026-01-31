import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";

const BG = "#071826";
const TILE_BG = "rgba(255,255,255,0.06)";
const TILE_BORDER = "rgba(120,200,255,0.25)";
const SUB = "rgba(255,255,255,0.6)";

function Tile({ title, subtitle, to }: { title: string; subtitle?: string; to: string }) {
  return (
    <Pressable
      onPress={() => router.push(to)}
      style={{
        borderRadius: 22,
        padding: 20,
        backgroundColor: TILE_BG,
        borderWidth: 1,
        borderColor: TILE_BORDER,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "900" }}>{title}</Text>
      {!!subtitle && (
        <Text style={{ marginTop: 8, color: SUB, fontSize: 16, lineHeight: 20 }}>{subtitle}</Text>
      )}
    </Pressable>
  );
}

export default function Wsparcie() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 48, fontWeight: "900", marginBottom: 14 }}>Wsparcie</Text>

      <Tile title="Modlitwa o pogodę ducha" to="/wsparcie-modlitwa" />
      <Tile title="Desiderata" to="/wsparcie-desiderata" />
      <Tile title="Program HALT" subtitle="Głodny · Rozgniewany · Samotny · Zmęczony" to="/wsparcie-halt" />
      <Tile title="24 godziny" subtitle="Właśnie dzisiaj" to="/wsparcie-24" />
      <Tile title="Siatka wsparcia" to="/wsparcie-siatka" />
      <Tile title="Kontakt ze specjalistą" to="/wsparcie-kontakt" />
    </ScrollView>
  );
}