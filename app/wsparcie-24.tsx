import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { DailyReadToggle } from "@/components/DailyReadToggle";
import { TYPE } from "@/styles/typography";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#061A2C";
const SUB = "rgba(245,236,216,0.9)";
const Watermark = require("../assets/images/maly_aniol.png");

export default function Wsparcie24() {
  const insets = useSafeAreaInsets();
  const paragraphs = [
    "",
  ];

  const bullets = [
    "Właśnie dzisiaj chcę przeżyć ten dzień dobrze i nie od razu załatwić w nim problemy całego mojego życia. Spróbuję przeżyć go tak, jak nie miałbym jeszcze odwagi żyć przez resztę mego życia.",
    "Właśnie dzisiaj chcę być szczęśliwy. Zakładam, że prawdą jest „najczęściej ludzie są na tyle szczęśliwi, jak dalece postanowią nimi być”.",
    "Właśnie dzisiaj chcę dostosować się do tego, co jest, a nie próbować dostosowywać wszystkiego do moich własnych życzeń.",
    "Chcę sprostać mojemu losowi, jakikolwiek on będzie.",
    "Właśnie dzisiaj chcę ćwiczyć mój umysł. Chcę poznawać rzeczy godne poznawania. Chcę nauczyć się czegoś użytecznego. Chcę czytać coś wymagającego wysiłku, myślenia, skupienia.",
    "Właśnie dzisiaj chcę ćwiczyć moją wolę na trzy sposoby:",
    "Zrobię coś dobrego i nie wypomnę tego ani nie pochwalę się tym.",
    "Dokonam co najmniej dwu rzeczy, na które zwykle nie mam ochoty.",
    "Nie będę epatował tym, że moje uczucia zostały zranione, nie użalę się nad sobą.",
    "Właśnie dzisiaj chcę mieć plan postępowania, mogę nie trzymać się go ściśle, lecz spróbuję uchronić się od pochopności i niezdecydowania.",
    "Właśnie dzisiaj znajdę spokojną chwilę i spróbuję się odprężyć. Spojrzę wtedy na moje życie z lepszej perspektywy.",
    "Właśnie dzisiaj chcę pozbyć się obaw i cieszyć się tym, co piękne. Ufam, że dając z siebie dużo światu, dużo przez to zyskam.",
    "Właśnie dzisiaj chcę być zgodny z otoczeniem. Chcę dobrze wyglądać, być odpowiednio ubrany, mówić spokojnym tonem, być uprzejmym, nie krytykować niczego, nie wyszukiwać „dziury w całym” i nie zmieniać nikogo z wyjątkiem siebie samego.",
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
        <Text style={styles.title}>24 godziny</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="To krótki tekst na jeden dzień. Pomaga wrócić do tego, co jest na teraz, bez brania na siebie całego życia naraz."
          jak="Przeczytaj rano i wybierz 1-2 zdania na dziś. Wieczorem możesz wrócić i sprawdzić, co z tego naprawdę Ci pomogło."
        />
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.list}>
          <Image source={Watermark} resizeMode="contain" style={styles.listWatermark} />
          <View style={styles.listAccent} />
          {bullets.map((item) => (
            <View key={item} style={styles.listItem}>
              <Text style={styles.bullet}>–</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <DailyReadToggle id="wsparcie24" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255, 201, 120, 0.1)",
    top: -90,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 226, 174, 0.09)",
    bottom: 140,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  paragraph: { ...TYPE.body, color: SUB, marginBottom: 14 },
  list: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 209, 138, 0.38)",
    backgroundColor: "rgba(45, 38, 25, 0.32)",
    borderRadius: 14,
    padding: 12,
    overflow: "hidden",
    position: "relative",
  },
  listAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#FFD18A",
    marginBottom: 10,
  },
  listWatermark: {
    position: "absolute",
    right: -22,
    bottom: -26,
    width: 155,
    height: 155,
    opacity: 0.12,
    tintColor: "white",
    transform: [{ rotate: "14deg" }],
  },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  bullet: { ...TYPE.bodyStrong, color: "#FFD18A", marginRight: 8 },
  listText: { ...TYPE.body, color: SUB, flex: 1 },
});
