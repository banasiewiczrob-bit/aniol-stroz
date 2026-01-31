import { ScrollView, Text } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";
const MUTED = "rgba(255,255,255,0.55)";

export default function Dzienniki() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 48, fontWeight: "900", marginBottom: 14 }}>Dzienniki</Text>

      <Text style={{ color: SUB, fontSize: 16, lineHeight: 22 }}>
        Dzienniki są dostępne w wersji płatnej:
      </Text>

      <Text style={{ color: MUTED, fontSize: 16, lineHeight: 24, marginTop: 14 }}>
        • Dziennik uczuć{"\n"}
        • Dziennik głodu / kryzysu{"\n"}
        • Dziennik wdzięczności
      </Text>
    </ScrollView>
  );
}