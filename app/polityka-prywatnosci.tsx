import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#061A2C';
const SUB = 'rgba(232,245,255,0.84)';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function PolitykaPrywatnosciScreen() {
  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Polityka prywatności</Text>
        <Text style={styles.meta}>Anioł Stróż</Text>
        <Text style={styles.meta}>Data wejścia w życie: 17 marca 2026</Text>

        <Section title="1. Zakres danych">
          <Text style={styles.text}>
            Aplikacja przetwarza dane wprowadzane przez użytkownika, w szczególności wpisy dzienników, plan dnia,
            ustawienia i preferencje. Aplikacja może także przetwarzać podstawowe dane techniczne urządzenia,
            wymagane do działania funkcji mobilnych.
          </Text>
        </Section>

        <Section title="2. Dane lokalne i dane przekazywane dobrowolnie">
          <Text style={styles.text}>
            Większość danych użytkownika pozostaje lokalnie na urządzeniu. Dotyczy to w szczególności prywatnych wpisów,
            planu dnia i ustawień. Wyjątkiem jest sytuacja, w której użytkownik sam zdecyduje się anonimowo przekazać
            wybrany wpis do wspólnej bazy doświadczeń.
          </Text>
        </Section>

        <Section title="3. Anonimowe udostępnianie doświadczeń">
          <Text style={styles.text}>
            Jeśli użytkownik wybierze opcję anonimowego udostępnienia wpisu, do chmury trafia wyłącznie treść tego
            konkretnego wpisu oraz techniczne informacje niezbędne do jego obsługi. Taki wpis jest przeznaczony do
            przeglądu i może zostać wykorzystany do budowy wspólnej bazy doświadczeń dla innych użytkowników aplikacji.
          </Text>
        </Section>

        <Section title="4. Cel przetwarzania">
          <Text style={styles.text}>
            Dane są przetwarzane w celu działania aplikacji, zapisu postępów, personalizacji ustawień oraz realizacji
            przypomnień i powiadomień, jeśli użytkownik udzieli odpowiedniej zgody. Anonimowo przekazane wpisy mogą być
            dodatkowo wykorzystywane do tworzenia bezpiecznej, moderowanej bazy doświadczeń pomocnej dla innych osób.
          </Text>
        </Section>

        <Section title="5. Miejsce przechowywania i podmioty techniczne">
          <Text style={styles.text}>
            Dane lokalne pozostają na urządzeniu użytkownika. Anonimowo przekazane wpisy mogą być przechowywane w
            infrastrukturze chmurowej obsługiwanej przez Supabase. Dane nie są sprzedawane i nie są przekazywane innym
            podmiotom poza zakresem niezbędnym do technicznego działania usługi oraz obowiązków wynikających z prawa.
          </Text>
        </Section>

        <Section title="6. Uprawnienia i bezpieczeństwo">
          <Text style={styles.text}>
            Użytkownik może zarządzać swoimi danymi lokalnymi z poziomu aplikacji, w tym usuwać wpisy i zmieniać zgody.
            Anonimowe udostępnianie doświadczeń jest dobrowolne i można je wyłączyć w ustawieniach. Stosowane są środki
            techniczne i organizacyjne, które mają chronić dane przed nieuprawnionym dostępem, utratą i nadużyciem.
          </Text>
        </Section>

        <Section title="7. Ważna zasada przy udostępnianiu wpisów">
          <Text style={styles.text}>
            Nie należy wpisywać imion, nazwisk, numerów telefonów, adresów ani innych danych, po których można rozpoznać
            siebie lub inne osoby. Ze względu na anonimowy charakter tej funkcji, po publikacji wpisu może nie być
            możliwe powiązanie go z konkretną osobą, jeśli sam wpis nie zawiera danych identyfikujących.
          </Text>
        </Section>

        <Section title="8. Dzieci i zmiany polityki">
          <Text style={styles.text}>
            Aplikacja nie jest kierowana do dzieci poniżej 13. roku życia. Polityka prywatności może być aktualizowana.
            Aktualna wersja jest publikowana w aplikacji oraz na stronie informacyjnej aplikacji.
          </Text>
        </Section>

        <Section title="9. Kontakt">
          <Text style={styles.text}>
            W sprawach dotyczących prywatności oraz anonimowo przekazanych doświadczeń należy kontaktować się adresem
            kontaktowym podanym na stronie aplikacji w sklepie.
          </Text>
        </Section>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 78, paddingBottom: 32 },
  title: { color: 'white', fontSize: 34, fontWeight: '800', marginBottom: 6 },
  meta: { color: SUB, fontSize: 14, lineHeight: 20, marginBottom: 2 },
  section: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    padding: 14,
    marginTop: 12,
  },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  text: { color: SUB, fontSize: 15, lineHeight: 22 },
});
