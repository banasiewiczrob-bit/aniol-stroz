import { ScrollView, Text } from "react-native";
import { TYPE } from "@/styles/typography";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";
const MUTED = "rgba(255,255,255,0.55)";

export default function Dzienniki() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ ...TYPE.display, color: "white", marginBottom: 14 }}>Dzienniki</Text>

      <Text style={{ ...TYPE.body, color: SUB }}>
        Dzienniki są dostępne w wersji płatnej:
      </Text>

      <Text style={{ ...TYPE.body, color: MUTED, marginTop: 14 }}>
        • Dziennik uczuć{"\n"}
        • Dziennik głodu / kryzysu{"\n"}
        • Dziennik wdzięczności
      </Text>
    </ScrollView>
  );
}
