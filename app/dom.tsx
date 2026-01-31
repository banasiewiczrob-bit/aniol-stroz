import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const BG = "#071826";
const TILE_BG = "rgba(255,255,255,0.06)";
const TILE_BORDER = "rgba(120,200,255,0.25)";
const SUB = "rgba(255,255,255,0.6)";

function Tile({
  title,
  subtitle,
  to,
  disabled,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled && to) router.push(to);
      }}
      style={{
        borderRadius: 22,
        padding: 20,
        backgroundColor: TILE_BG,
        borderWidth: 1,
        borderColor: TILE_BORDER,
        marginBottom: 16,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text style={{ color: "white", fontSize: 32, fontWeight: "900" }}>{title}</Text>

      {!!subtitle && (
        <Text style={{ marginTop: 8, color: SUB, fontSize: 16, lineHeight: 20 }}>{subtitle}</Text>
      )}

      {disabled && (
        <Text style={{ marginTop: 10, color: SUB, fontSize: 14, letterSpacing: 1 }}>
          W przygotowaniu (wersja płatna)
        </Text>
      )}
    </Pressable>
  );
}

export default function Dom() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 54, fontWeight: "900", marginBottom: 18 }}>Dom</Text>

      <Tile title="Kontrakt" subtitle="Umowa z samym sobą" to="/kontrakt" />
      <Tile title="Licznik" subtitle="Start zdrowienia + rocznice" to="/licznik" />
      <Tile title="Plan dnia" subtitle="Jedna rzecz na raz" to="/plan-dnia" />

      <Tile
        title="Dzienniki"
        subtitle="Uczucia · Głód/Kryzys · Wdzięczność"
        to="/dzienniki"
        disabled={true}
      />

      <Tile title="Wsparcie" subtitle="Teksty + kontakt + siatka" to="/wsparcie" />

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}