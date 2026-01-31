import { ScrollView, Text } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function WsparcieKontakt() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18, paddingTop: 56 }}>
      <Text style={{ color: "white", fontSize: 44, fontWeight: "900", marginBottom: 14 }}>
        Kontakt ze specjalistą
      </Text>
      <Text style={{ color: SUB, fontSize: 16, lineHeight: 22 }}>
        Tu wstawimy Twoje numery i opis. Na razie: ekran stabilny.
      </Text>
    </ScrollView>
  );
}