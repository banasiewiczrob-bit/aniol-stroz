import { ScrollView, Text } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function Licznik() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 48, fontWeight: "900", marginBottom: 14 }}>Licznik</Text>

      <Text style={{ color: SUB, fontSize: 16, lineHeight: 22 }}>
        Tu będzie ustawienie daty startu, liczenie dni oraz rocznice/nagrody.
        {"\n\n"}
        Na razie: ekran stabilny, bez logiki.
      </Text>
    </ScrollView>
  );
}