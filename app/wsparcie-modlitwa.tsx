import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { DailyReadToggle } from "@/components/DailyReadToggle";
import { TYPE } from "@/styles/typography";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#061A2C";
const SUB = "rgba(226,248,245,0.9)";
const Watermark = require("../assets/images/maly_aniol.png");

export default function WsparcieModlitwa() {
  const insets = useSafeAreaInsets();
  const lines = [
    "Boże, użycz mi pogody ducha,",
    "abym godził się z tym, czego nie mogę zmienić,",
    "odwagi, abym zmieniał to, co mogę zmienić,",
    "i mądrości, abym odróżniał jedno od drugiego.",
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
      >
        <Text style={styles.title}>Modlitwa o pogodę ducha</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="To proste słowa, do których możesz wrócić, gdy potrzebujesz złapać granicę między tym, co możesz zmienić, a tym, czego dziś nie uniesiesz samą siłą."
          jak="Przeczytaj powoli raz albo dwa razy. Zatrzymaj się przy jednym zdaniu, które dziś Cię porządkuje, i wracaj do niego w ciągu dnia."
        />
        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={styles.cardAccent} />
          {lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
        </View>
        <DailyReadToggle id="modlitwa" />
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
    backgroundColor: "rgba(126, 200, 255, 0.1)",
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(158, 231, 216, 0.11)",
    bottom: 90,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 16 },
  card: {
    backgroundColor: "rgba(9, 37, 58, 0.82)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(158, 231, 216, 0.36)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    overflow: "hidden",
    position: "relative",
  },
  cardAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#9EE7D8",
    marginBottom: 12,
  },
  cardWatermark: {
    position: "absolute",
    right: -20,
    bottom: -26,
    width: 150,
    height: 150,
    opacity: 0.13,
    tintColor: "white",
    transform: [{ rotate: "16deg" }],
  },
  line: {
    ...TYPE.h2,
    color: SUB,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 12,
  },
});
