import { CoJakSection } from "@/components/CoJakSection";
import { TYPE } from "@/styles/typography";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";
const MUTED = "rgba(255,255,255,0.5)";
const HOTLINES = [
  {
    id: "116111",
    name: "116 111 - Telefon Zaufania dla Dzieci i Młodzieży",
    phone: "116111",
    details: "Bezpłatny, 7 dni w tygodniu (zazwyczaj 12:00-02:00), pomoc online 24/7.",
  },
  {
    id: "116123",
    name: "116 123 - Kryzysowy Telefon Zaufania dla Dorosłych",
    phone: "116123",
    details: "Bezpłatne wsparcie psychologiczne dla osób w kryzysie emocjonalnym, 24/7.",
  },
  {
    id: "800702222",
    name: "800 70 2222 - Centrum Wsparcia dla Osób w Stanie Kryzysu Psychicznego",
    phone: "800702222",
    details: "Bezpłatna, całodobowa infolinia.",
  },
  {
    id: "800121212",
    name: "800 12 12 12 - Dziecięcy Telefon Zaufania Rzecznika Praw Dziecka",
    phone: "800121212",
    details: "Czynny 24/7.",
  },
  {
    id: "224848801",
    name: "22 484 88 01 - Antydepresyjny Telefon Zaufania (Fundacja ITAKA)",
    phone: "224848801",
    details: "Poniedziałki, środy i piątki, godz. 15:00-20:00.",
  },
  {
    id: "800120002",
    name: "800 120 002 - Niebieska Linia",
    phone: "800120002",
    details: "Ogólnopolskie Pogotowie dla Ofiar Przemocy w Rodzinie, czynne 24/7.",
  },
] as const;

export default function WsparcieKontakt() {
  const handleCall = async (phone: string) => {
    const normalized = phone.replace(/[^\d+]/g, "");
    const telPromptUrl = `telprompt:${normalized}`;
    const telUrl = `tel:${normalized}`;

    try {
      const canPrompt = await Linking.canOpenURL(telPromptUrl);
      if (canPrompt) {
        await Linking.openURL(telPromptUrl);
        return;
      }

      const canTel = await Linking.canOpenURL(telUrl);
      if (canTel) {
        await Linking.openURL(telUrl);
        return;
      }

      Alert.alert(
        "Nie można wykonać połączenia",
        "Na tym urządzeniu nie da się uruchomić połączenia telefonicznego. Sprawdź na realnym telefonie."
      );
    } catch {
      Alert.alert(
        "Błąd połączenia",
        "Nie udało się otworzyć wybierania numeru. Spróbuj ponownie na realnym telefonie."
      );
    }
  };

  const handleSms = (phone: string) => {
    const normalized = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`sms:${normalized}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Kontakt</Text>
      <CoJakSection
        title="Opis i instrukcja"
        co="Ten ekran daje szybki dostęp do kontaktu, gdy potrzebujesz wsparcia tu i teraz."
        jak="Wybierz odpowiedniego człowieka i działaj od razu. W kryzysie użyj pilnego wsparcia 
        bez zwlekania. Jeśli czujesz, że potrzebujesz rozmowy — sięgnij po pomoc. Nie musisz być sam."
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pilne wsparcie</Text>
        <Text style={styles.sectionText}>
          Jeśli jesteś w kryzysie lub zagrożeniu zdrowia/życia, dzwoń natychmiast. Ten numer znasz.
        </Text>
        <Pressable style={styles.ctaPrimary} onPress={() => handleCall("112")}>
          <Text style={styles.ctaPrimaryText}>Zadzwoń 112</Text>
        </Pressable>
      </View>
<View style={styles.section}>
        <Text style={styles.sectionTitle}>Pamiętaj: Twoja Siatka Wsparcia to najlepsze rozwiązanie. </Text>
        <Text style={styles.sectionText}>
          Najszybciej pomoże rozmowa z kimś, kto Cię zna. Dodaj osoby w zakładce „Siatka wsparcia” Nie czekaj a będziesz w potrzebie. Dzwoń do ludzi w stałych porach..
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontakt z Aniołem</Text>
        <Text style={styles.sectionText}>
          Jeśli chcesz się skontaktować, napisz:
        </Text>
        <Text style={styles.email}>info@aniolstroz.com.pl</Text>
        <Text style={styles.note}>
        Odpowiadam na wszystkie wiadomości, ale może to zająć trochę czasu. 
        Nie zostawiam wiadomości bez odpowiedzi.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wsparcie telefoniczne</Text>
        <Text style={styles.sectionText}>
          Możesz zadzwonić do wybranej osoby lub specjalisty.
        </Text>
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Robert Banasiewicz</Text>
            <Text style={styles.cardSubtitle}>Twórca Anioła Stróża — terapeuta, pedagog</Text>
            <Text style={styles.cardPhone}>+48 513683660</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable style={styles.callButton} onPress={() => handleCall("+48513683660")}>
              <Text style={styles.callButtonText}>Zadzwoń</Text>
            </Pressable>
            <Pressable style={styles.smsButton} onPress={() => handleSms("+48513683660")}>
              <Text style={styles.smsButtonText}>SMS</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Numery pomocowe</Text>
        {HOTLINES.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.details}</Text>
              <Text style={styles.cardPhone}>{item.phone}</Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.callButton} onPress={() => handleCall(item.phone)}>
                <Text style={styles.callButtonText}>Zadzwoń</Text>
              </Pressable>
            </View>
          </View>
        ))}
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
