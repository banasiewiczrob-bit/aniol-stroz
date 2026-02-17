import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import { DailyReadToggle } from "@/components/DailyReadToggle";
import { TYPE } from "@/styles/typography";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";

export default function WsparcieDesiderata() {
  const paragraphs = [
    "Krocz spokojnie wśród zgiełku i pośpiechu - pamiętaj jaki pokój może być w ciszy.",
    "Tak dalece jak to możliwe nie wyrzekając się siebie, bądź w dobrych stosunkach z innymi ludźmi.",
    "Prawdę swą głoś spokojnie i jasno, słuchaj też tego co mówią inni, nawet głupcy i ignoranci, oni też mają swoją opowieść.",
    "Jeśli porównujesz się z innymi możesz stać się próżny lub zgorzkniały, albowiem zawsze będą lepsi i gorsi od ciebie.",
    "Ciesz się zarówno swymi osiągnięciami jak i planami.",
    "Wykonuj z sercem swą pracę, jakakolwiek by była skromna. Jest ona trwałą wartością w zmiennych kolejach losu.",
    "Zachowaj ostrożność w swych przedsięwzięciach - świat bowiem pełen jest oszustwa.",
    "Lecz niech ci to nie przesłania prawdziwej cnoty, wielu ludzi dąży do wzniosłych ideałów i wszędzie życie pełne jest heroizmu.",
    "Bądź sobą, a zwłaszcza nie zwalczaj uczuć: nie bądź cyniczny wobec miłości, albowiem w obliczu wszelkiej oschłości i rozczarowań jest ona wieczna jak trawa.",
    "Przyjmuj pogodnie to co lata niosą, bez goryczy wyrzekając się przymiotów młodości.",
    "Rozwijaj siłę ducha by w nagłym nieszczęściu mogła być tarczą dla ciebie. Lecz nie dręcz się tworami wyobraźni.",
    "Wiele obaw rodzi się ze znużenia i samotności.",
    "Jesteś dzieckiem wszechświata, nie mniej niż gwiazdy i drzewa, masz prawo być tutaj i czy jest to dla ciebie jasne czy nie, nie wątp, że wszechświat jest taki jaki być powinien.",
    "Tak więc bądź w pokoju z Bogiem, cokolwiek myślisz i czymkolwiek się zajmujesz i jakiekolwiek są twe pragnienia: w zgiełku ulicznym, zamęcie życia, zachowaj pokój ze swą duszą.",
    "Z całym swym zakłamaniem, znojem i rozwianymi marzeniami ciągle jeszcze ten świat jest piękny. Bądź uważny, staraj się być szczęśliwy.",
  ];

  return (
    <View style={styles.screen}>
      <BackButton />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Desiderata</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Kolejny znany Ci zapewne tekst. Desiderata. To słowa do codziennego wzmacniania spokoju, 
          pokory i życzliwego podejścia do siebie oraz innych."
          jak="Czytaj bez pośpiechu, akapit po akapicie. 
          Zaznacz w głowie jedno zdanie, które chcesz dziś wprowadzić w życie. Zaznacz na dole Przeczytałem."
        />
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
        <DailyReadToggle id="desiderata" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  paragraph: { ...TYPE.body, color: SUB, marginBottom: 14 },
});
