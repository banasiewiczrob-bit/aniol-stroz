import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TYPE } from "@/styles/typography";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";
const MUTED = "rgba(255,255,255,0.5)";

export default function WsparcieKontakt() {
  const handleCall = (phone: string) => {
    const normalized = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${normalized}`);
  };

  const handleSms = (phone: string) => {
    const normalized = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`sms:${normalized}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Kontakt</Text>
      <Text style={styles.subtitle}>
        Jeśli czujesz, że potrzebujesz rozmowy — sięgnij po pomoc. Nie musisz być sam.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pilne wsparcie</Text>
        <Text style={styles.sectionText}>
          Jeśli jesteś w kryzysie lub zagrożeniu zdrowia/życia, dzwoń natychmiast.
        </Text>
        <Pressable style={styles.ctaPrimary} onPress={() => handleCall("112")}>
          <Text style={styles.ctaPrimaryText}>Zadzwoń 112</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wsparcie telefoniczne</Text>
        <Text style={styles.sectionText}>
          Możesz zadzwonić do wybranej osoby lub specjalisty.
        </Text>
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Twoja osoba wsparcia</Text>
            <Text style={styles.cardSubtitle}>Wpisz tutaj swoją osobę / sponsora</Text>
            <Text style={styles.cardPhone}>+48 000 000 000</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable style={styles.callButton} onPress={() => handleCall("+48000000000")}>
              <Text style={styles.callButtonText}>Zadzwoń</Text>
            </Pressable>
            <Pressable style={styles.smsButton} onPress={() => handleSms("+48000000000")}>
              <Text style={styles.smsButtonText}>SMS</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Ogólnopolska linia wsparcia</Text>
            <Text style={styles.cardSubtitle}>Przykładowy numer — wpisz właściwy</Text>
            <Text style={styles.cardPhone}>800 000 000</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable style={styles.callButton} onPress={() => handleCall("800000000")}>
              <Text style={styles.callButtonText}>Zadzwoń</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Twoja Siatka Wsparcia</Text>
        <Text style={styles.sectionText}>
          Najszybciej pomoże rozmowa z kimś, kto Cię zna. Dodaj osoby w zakładce „Siatka wsparcia”.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontakt z nami</Text>
        <Text style={styles.sectionText}>
          Jeśli chcesz się z nami skontaktować, napisz:
        </Text>
        <Text style={styles.email}>kontakt@aniolstroz.pl</Text>
        <Text style={styles.note}>
          (Adres jest przykładowy — podmień na swój.)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 56, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 10 },
  subtitle: { ...TYPE.body, color: SUB, marginBottom: 22 },
  section: { marginBottom: 22 },
  sectionTitle: { ...TYPE.h3, color: "white", marginBottom: 8 },
  sectionText: { ...TYPE.bodySmall, color: SUB },
  ctaPrimary: {
    marginTop: 12,
    backgroundColor: "rgba(255, 100, 100, 0.2)",
    borderColor: "rgba(255, 100, 100, 0.6)",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPrimaryText: { ...TYPE.button, color: "white" },
  card: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.15)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: { ...TYPE.bodyStrong, color: "white" },
  cardSubtitle: { ...TYPE.caption, color: MUTED, marginTop: 4 },
  cardPhone: { ...TYPE.bodySmall, color: "white", marginTop: 8 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  callButton: {
    backgroundColor: "#3b5998",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  callButtonText: { ...TYPE.caption, color: "white" },
  smsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smsButtonText: { ...TYPE.caption, color: "rgba(120, 200, 255, 0.9)" },
  email: { ...TYPE.bodyStrong, color: "white", marginTop: 8 },
  note: { ...TYPE.caption, color: MUTED, marginTop: 4 },
});
