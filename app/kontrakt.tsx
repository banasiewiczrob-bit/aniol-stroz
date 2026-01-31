import { ScrollView, Text } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function Kontrakt() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 48, fontWeight: "900", marginBottom: 14 }}>Kontrakt</Text>

      <Text style={{ color: SUB, fontSize: 16, lineHeight: 22 }}>
        Ten ekran będzie miejscem na Twój kontrakt „sam ze sobą”.
        {"\n\n"}
        Na razie: wersja techniczna. Treść i checkboxy dodamy jako osobny krok.
      </Text>
    </ScrollView>
  );
}