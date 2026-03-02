import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { TYPE } from "@/styles/typography";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const BG = "#061A2C";
const SUB = "rgba(245,236,216,0.88)";
const MUTED = "rgba(255,255,255,0.5)";
const ACCENT = "#FFD18A";
const ACCENT_BG = "rgba(255,209,138,0.22)";
const ACCENT_BORDER = "rgba(255,209,138,0.55)";
const Watermark = require("../assets/images/maly_aniol.png");
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
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>Pamiętaj: Twoja siatka wsparcia to najlepsze rozwiązanie.</Text>
          <Text style={styles.sectionText}>
            Najszybciej pomoże rozmowa z kimś, kto Cię zna. Dodaj osoby w zakładce „Siatka wsparcia”. Nie czekaj, aż będziesz w potrzebie. Dzwoń do ludzi w stałych porach.
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
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
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
              <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,209,138,0.1)",
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,226,174,0.09)",
    bottom: 110,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: "relative" },
  title: { ...TYPE.h1, color: "white", marginBottom: 10 },
  subtitle: { ...TYPE.body, color: SUB, marginBottom: 22 },
  section: { marginBottom: 22 },
  sectionTitle: { ...TYPE.h3, color: "white", marginBottom: 8 },
  sectionText: { ...TYPE.bodySmall, color: SUB },
  ctaPrimary: {
    marginTop: 12,
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPrimaryText: { ...TYPE.button, color: "white" },
  card: {
    marginTop: 14,
    backgroundColor: "rgba(12,38,62,0.78)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardWatermark: {
    position: "absolute",
    right: -18,
    bottom: -22,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: "white",
    transform: [{ rotate: "16deg" }],
  },
  cardTitle: { ...TYPE.bodyStrong, color: "white" },
  cardSubtitle: { ...TYPE.caption, color: MUTED, marginTop: 4 },
  cardPhone: { ...TYPE.bodySmall, color: "white", marginTop: 8 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  callButton: {
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  callButtonText: { ...TYPE.caption, color: "white" },
  smsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smsButtonText: { ...TYPE.caption, color: ACCENT },
  email: { ...TYPE.bodyStrong, color: "white", marginTop: 8 },
  note: { ...TYPE.caption, color: MUTED, marginTop: 4 },
});
