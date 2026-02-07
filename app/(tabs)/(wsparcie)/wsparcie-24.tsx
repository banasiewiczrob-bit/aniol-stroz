import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TYPE } from "@/styles/typography";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function Wsparcie24() {
  const paragraphs = [
    "To spis kilku prostych działań, czynności, które skupią Cię na czymś najważniejszym, na „Tu i teraz”. Bo chodzi o to, aby robić jedną rzecz na raz i żyć jeden dzień na raz. Wiem, że to trudne, prawdopodobnie nie masz zbyt dużo doświadczeń w „Tu i teraz”, też nie miałem. Wszystko możesz zmienić. Zacznij już dziś. Ułóż plan na dziś i działaj.",
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
    "Nie będę epatował ty, że moje uczucia zostały zranione, nie użalę się na sobą.",
    "Właśnie dzisiaj chcę mieć plan postępowania, mogę nie trzymać się go ściśle, lecz spróbuję uchronić się od pochopności i niezdecydowania.",
    "Właśnie dzisiaj znajdę spokojną chwilę i spróbuję się odprężyć. Spojrzę wtedy na moje życie z lepszej perspektywy.",
    "Właśnie dzisiaj chcę pozbyć się obaw i cieszyć się tym, co piękne. Ufam, że dając z siebie dużo światu, dużo przez to zyskam.",
    "Właśnie dzisiaj chcę być zgodny z otoczeniem. Chcę dobrze wyglądać, być odpowiednio ubrany, mówić spokojnym tonem, być uprzejmym, nie krytykować niczego, nie wyszukiwać „dziury w całym” i nie zmieniać nikogo z wyjątkiem siebie samego.",
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>24 godziny</Text>
      {paragraphs.map((paragraph) => (
        <Text key={paragraph} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      <View style={styles.separator} />

      <View style={styles.list}>
        {bullets.map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.bullet}>–</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 56, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  paragraph: { ...TYPE.body, color: SUB, marginBottom: 14 },
  list: { marginTop: 6 },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  bullet: { ...TYPE.bodyStrong, color: SUB, marginRight: 8 },
  listText: { ...TYPE.body, color: SUB, flex: 1 },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
});
