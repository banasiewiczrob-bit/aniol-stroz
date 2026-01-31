import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const BG = "#071826";
const TILE_BG = "rgba(255,255,255,0.05)";
const TILE_BORDER = "rgba(120,200,255,0.22)";
const SUB = "rgba(255,255,255,0.65)";
const SECTION = "rgba(255,255,255,0.85)";

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
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: TILE_BG,
        borderWidth: 1,
        borderColor: TILE_BORDER,
        marginBottom: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
        {title}
      </Text>

      {!!subtitle && (
        <Text style={{ marginTop: 6, color: SUB, fontSize: 14, lineHeight: 18 }}>
          {subtitle}
        </Text>
      )}

      {disabled && (
        <Text style={{ marginTop: 6, color: SUB, fontSize: 13 }}>
          W przygotowaniu
        </Text>
      )}
    </Pressable>
  );
}

export default function Dom() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ padding: 18, paddingTop: 48 }}
    >
      {/* NAGŁÓWEK */}
      <Text
        style={{
          color: "white",
          fontSize: 36,
          fontWeight: "800",
          marginBottom: 20,
        }}
      >
        Dom
      </Text>

      {/* PODSTAWY */}
      <Tile title="Kontrakt" subtitle="Umowa z samym sobą" to="/kontrakt" />
      <Tile title="Licznik" subtitle="Start zdrowienia i rocznice" to="/licznik" />
      <Tile title="Plan dnia" subtitle="Jedna rzecz na teraz" to="/plan-dnia" />

      {/* DZIAŁ: WSPARCIE */}
      <View style={{ marginTop: 28, marginBottom: 12 }}>
        <Text
          style={{
            color: SECTION,
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          Wsparcie
        </Text>

        
        <Tile title="Teksty" subtitle="HALT · Modlitwa · Desiderata" to="/wsparcie" />
        <Tile title="Siatka wsparcia" subtitle="Ludzie i kontakty" to="/wsparcie-siatka" />
        <Tile title="Kontakt" subtitle="Gdy potrzebujesz pomocy" to="/wsparcie-kontakt" />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}