import { ScrollView, Text } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function WsparcieDesiderata() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 44, fontWeight: "900", marginBottom: 14 }}>Desiderata</Text>
      <Text style={{ color: SUB, fontSize: 16, lineHeight: 22 }}>
        Treść dodamy w kolejnym kroku.
      </Text>
    </ScrollView>
  );
}