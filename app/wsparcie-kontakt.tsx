import { BackButton, useSwipeHintInset } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { DismissKeyboardView } from "@/components/DismissKeyboardView";
import { TYPE } from "@/styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const BG = "#061A2C";
const SUB = "rgba(245,236,216,0.88)";
const MUTED = "rgba(255,255,255,0.5)";
const ACCENT = "#FFD18A";
const ACCENT_BG = "rgba(255,209,138,0.22)";
const ACCENT_BORDER = "rgba(255,209,138,0.55)";
const SOS_BG = "#E11D1D";
const SOS_BG_PRESSED = "#C41414";
const SOS_BORDER = "#FF7A7A";
const Watermark = require("../assets/images/maly_aniol.png");
const DomRehabLogo = require("../assets/images/dom-rehab-logo.png");
const SOS_CONTACT_KEY = "@sos_contact_v1";
const DOM_REHAB_CONTACTS = [
  { id: "513683660", label: "+48 513 683 660", phone: "+48513683660" },
  { id: "789055032", label: "+48 789 055 032", phone: "+48789055032" },
  { id: "789060154", label: "+48 789 060 154", phone: "+48789060154" },
] as const;
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
  const { swipeHintInset } = useSwipeHintInset();
  const [sosName, setSosName] = useState("");
  const [sosPhone, setSosPhone] = useState("");
  const [sosFormOpen, setSosFormOpen] = useState(false);
  const [domRehabExpanded, setDomRehabExpanded] = useState(false);

  useEffect(() => {
    const loadSosContact = async () => {
      try {
        const raw = await AsyncStorage.getItem(SOS_CONTACT_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { name?: string; phone?: string };
        if (parsed?.name) setSosName(parsed.name);
        if (parsed?.phone) setSosPhone(parsed.phone);
      } catch (e) {
        console.error("Błąd odczytu kontaktu S.O.S:", e);
      }
    };

    void loadSosContact();
  }, []);

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

  const pickSosFromPhoneContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Brak uprawnień", "Zezwól aplikacji na dostęp do kontaktów w ustawieniach telefonu.");
        return;
      }

      const picked = await Contacts.presentContactPickerAsync();
      if (!picked) return;

      const contact = await Contacts.getContactByIdAsync(picked.id, [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
      ]);
      const source = contact ?? picked;
      const phones = (source.phoneNumbers ?? [])
        .map((phoneItem) => phoneItem.number?.trim())
        .filter((number): number is string => Boolean(number));
      const displayName =
        source.name?.trim() ||
        [source.firstName, source.lastName].filter(Boolean).join(" ").trim() ||
        "Kontakt z telefonu";

      if (phones.length === 0) {
        Alert.alert("Brak numeru", "Wybrany kontakt nie ma numeru telefonu.");
        return;
      }

      if (phones.length === 1) {
        setSosName(displayName);
        setSosPhone(phones[0]);
        return;
      }

      Alert.alert(
        "Wybierz numer",
        displayName,
        [
          ...phones.slice(0, 6).map((number) => ({
            text: number,
            onPress: () => {
              setSosName(displayName);
              setSosPhone(number);
            },
          })),
          { text: "Anuluj", style: "cancel" as const },
        ],
        { cancelable: true }
      );
    } catch (e) {
      console.error("Błąd wyboru kontaktu S.O.S z telefonu:", e);
      Alert.alert("Błąd", "Nie udało się wybrać kontaktu z telefonu.");
    }
  };

  const saveSosContact = async () => {
    const name = sosName.trim();
    const phone = sosPhone.trim();
    const normalized = phone.replace(/[^\d+]/g, "");

    if (!name || !normalized) {
      Alert.alert("Uzupełnij dane", "Wpisz imię/nazwę i numer telefonu osoby S.O.S.");
      return;
    }

    if (normalized.length < 6) {
      Alert.alert("Nieprawidłowy numer", "Wpisz poprawny numer telefonu.");
      return;
    }

    try {
      await AsyncStorage.setItem(SOS_CONTACT_KEY, JSON.stringify({ name, phone }));
      setSosFormOpen(false);
      Alert.alert("Zapisano", "Kontakt S.O.S został zapisany.");
    } catch (e) {
      console.error("Błąd zapisu kontaktu S.O.S:", e);
      Alert.alert("Błąd", "Nie udało się zapisać kontaktu S.O.S.");
    }
  };

  const hasSosContact = sosName.trim().length > 0 && sosPhone.trim().length > 0;

  const openSosActions = () => {
    if (!hasSosContact) {
      setSosFormOpen((prev) => !prev);
      return;
    }

    Alert.alert("S.O.S", "Wybierz działanie.", [
      { text: "Dzwoń 112", onPress: () => void handleCall("112") },
      { text: `Dzwoń do: ${sosName}`, onPress: () => void handleCall(sosPhone) },
      { text: "Edytuj kontakt S.O.S", onPress: () => setSosFormOpen(true) },
      { text: "Anuluj", style: "cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <DismissKeyboardView>
        <Text style={styles.title}>Kontakt</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Ten ekran zbiera szybkie sposoby kontaktu, kiedy potrzebujesz wsparcia tu i teraz."
          jak="Jeśli sytuacja jest pilna, sięgnij po pomoc bez zwlekania. Jeśli potrzebujesz po prostu rozmowy, wybierz właściwą osobę i zadzwoń. Nie musisz zostawać z tym sam."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilne wsparcie</Text>
          <Text style={styles.sectionText}>
            Jeśli jesteś w kryzysie lub zagrożeniu zdrowia/życia, dzwoń natychmiast. Ten numer znasz.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.sosPrimary, pressed && styles.sosPrimaryPressed]}
            onPress={openSosActions}
          >
            <Text style={styles.sosPrimaryText}>SOS</Text>
          </Pressable>
          <View style={styles.card}>
            <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Kontakt S.O.S (sponsor / bliska osoba)</Text>
              {hasSosContact ? (
                <>
                  <Text style={styles.cardSubtitle}>{sosName}</Text>
                  <Text style={styles.cardPhone}>{sosPhone}</Text>
                </>
              ) : (
                <Text style={styles.cardSubtitle}>Brak zapisanego kontaktu S.O.S.</Text>
              )}
              <View style={styles.sosButtonsWrap}>
                {hasSosContact ? (
                  <Pressable style={[styles.callButton, styles.sosCallButton]} onPress={() => void handleCall(sosPhone)}>
                    <Text style={styles.callButtonText}>Zadzwoń do osoby S.O.S</Text>
                  </Pressable>
                ) : null}
                <Text style={styles.cardHint}>Aby dodać lub edytować kontakt, użyj czerwonego przycisku SOS.</Text>
              </View>
            </View>
          </View>
          {sosFormOpen ? (
            <View style={styles.card}>
              <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
              <View style={{ flex: 1 }}>
                <TextInput
                  value={sosName}
                  onChangeText={setSosName}
                  placeholder="Imię / rola (np. Sponsor A.A.)"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={styles.input}
                />
                <TextInput
                  value={sosPhone}
                  onChangeText={setSosPhone}
                  placeholder="Numer telefonu"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <View style={styles.sosButtonsWrap}>
                  <Pressable style={[styles.callButton, styles.sosPickButton]} onPress={() => void pickSosFromPhoneContacts()}>
                    <Text style={styles.callButtonText}>Wybierz z kontaktów telefonu</Text>
                  </Pressable>
                  <Pressable style={styles.callButton} onPress={() => void saveSosContact()}>
                    <Text style={styles.callButtonText}>Zapisz kontakt S.O.S</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
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

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.card, styles.domRehabToggleCard, pressed && { opacity: 0.95 }]}
            onPress={() => setDomRehabExpanded((prev) => !prev)}
          >
            <View style={styles.domRehabHeaderRow}>
              <Image source={DomRehabLogo} resizeMode="contain" style={styles.domRehabHeaderLogo} />
              <View style={styles.domRehabHeaderTextWrap}>
                <Text style={styles.cardTitle}>dom-REHAB</Text>
                <Text style={styles.domRehabOwnerName}>Robert Banasiewicz</Text>
                <Text style={styles.cardSubtitle}>Terapia stacjonarna i wsparcie</Text>
              </View>
            </View>
            <Text style={styles.domRehabToggleText}>{domRehabExpanded ? "Mniej" : "Czytaj więcej"}</Text>
          </Pressable>

          {domRehabExpanded ? (
            <View style={[styles.card, styles.domRehabCard, styles.domRehabContentCard]}>
              <Text style={styles.domRehabIntro}>Jeśli potrzebujesz terapii stacjonarnej, zadzwoń lub napisz.</Text>
              <Text style={styles.email}>info@rehab-terapia.pl</Text>
              {DOM_REHAB_CONTACTS.map((item) => (
                <View key={item.id} style={styles.domRehabContactRow}>
                  <Text style={styles.cardPhone}>{item.label}</Text>
                  <View style={styles.domRehabButtons}>
                    <Pressable style={styles.callButton} onPress={() => handleCall(item.phone)}>
                      <Text style={styles.callButtonText}>Zadzwoń</Text>
                    </Pressable>
                    <Pressable style={[styles.callButton, styles.domRehabSmsButton]} onPress={() => handleSms(item.phone)}>
                      <Text style={styles.callButtonText}>SMS</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        </DismissKeyboardView>
      </ScrollView>
    </KeyboardAvoidingView>
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
  sosPrimary: {
    marginTop: 12,
    backgroundColor: SOS_BG,
    borderColor: SOS_BORDER,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sosPrimaryPressed: {
    backgroundColor: SOS_BG_PRESSED,
  },
  sosPrimaryText: { ...TYPE.button, color: "white", fontSize: 24, letterSpacing: 1.2, fontWeight: "900" },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "white",
    ...TYPE.bodySmall,
  },
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
  cardHint: { ...TYPE.caption, color: MUTED, marginTop: 6 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  sosButtonsWrap: { marginTop: 10, gap: 8 },
  callButton: {
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sosCallButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  sosPickButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  callButtonText: { ...TYPE.caption, color: "white" },
  smsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smsButtonText: { ...TYPE.caption, color: ACCENT },
  email: { ...TYPE.bodyStrong, color: "white", marginTop: 8 },
  note: { ...TYPE.caption, color: MUTED, marginTop: 4 },
  domRehabToggleCard: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  domRehabHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  domRehabHeaderLogo: {
    width: 56,
    height: 56,
  },
  domRehabHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  domRehabOwnerName: {
    ...TYPE.bodyStrong,
    color: "white",
    marginTop: 2,
    flexShrink: 1,
  },
  domRehabToggleText: {
    ...TYPE.caption,
    color: ACCENT,
    fontWeight: "700",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  domRehabCard: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  domRehabContentCard: {
    marginTop: 10,
  },
  domRehabIntro: {
    ...TYPE.bodySmall,
    color: SUB,
  },
  domRehabContactRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  domRehabButtons: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  domRehabSmsButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.28)",
  },
});
