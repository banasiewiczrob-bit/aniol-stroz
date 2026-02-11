import { CoJakSection } from "@/components/CoJakSection";
import { DailyReadToggle } from "@/components/DailyReadToggle";
import { TYPE } from "@/styles/typography";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function WsparcieModlitwa() {
  const lines = [
    "Boże, użycz mi pogody ducha,",
    "abym godził się z tym, czego nie mogę zmienić,",
    "odwagi, abym zmieniał to co mogę zmienić,",
    "i mądrości, abym odróżniał jedno od drugiego.",
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Modlitwa o pogodę ducha</Text>
      <CoJakSection
        title="Opis i instrukcja"
        co="Być może znasz tę modlitwę. Być moze odmawiałeś ją już wiele razy. 
        To proste słowa porządkujące to, co mogę zmienić i czego nie mogę dziś kontrolować."
        jak="Przeczytaj powoli raz, może dwa razy. Zatrzymaj się na zdaniu, które dzisiaj najbardziej 
        do Ciebie trafia. Zaznacz na dole Przeczytałem i wróć do tego zdania w ciągu dnia, kiedy poczujesz, że potrzebujesz wsparcia."
      />
      <View style={styles.card}>
        {lines.map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
      <DailyReadToggle id="modlitwa" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 56, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.12)",
    paddingVertical: 18,
    paddingHorizontal: 16,
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
