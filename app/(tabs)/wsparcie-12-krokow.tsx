import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { DailyReadToggle } from '@/components/DailyReadToggle';
import { TYPE } from '@/styles/typography';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ProgramId = 'aa' | 'na' | 'alanon' | 'slaa' | 'uni';

type StepsProgram = {
  id: ProgramId;
  label: string;
  subtitle: string;
  note: string;
  steps: string[];
};

const PROGRAMS: StepsProgram[] = [
  {
    id: 'aa',
    label: 'AA',
    subtitle: 'Anonimowi Alkoholicy',
    note: 'Klasyczne brzmienie 12 kroków dla osób uzależnionych od alkoholu.',
    steps: [
      'Przyznaliśmy, że jesteśmy bezsilni wobec alkoholu – że nasze życie stało się niekierowalne.',
      'Uwierzyliśmy, że Siła większa od nas samych może przywrócić nam zdrowy rozsądek.',
      'Podjęliśmy decyzję, aby powierzyć naszą wolę i nasze życie opiece Boga, tak jak Go rozumieliśmy.',
      'Zrobiliśmy wnikliwą i odważną osobistą inwenturę moralną.',
      'Wyznaliśmy Bogu, sobie i drugiemu człowiekowi istotę naszych błędów.',
      'Staliśmy się całkowicie gotowi, żeby Bóg usunął wszystkie te wady charakteru.',
      'Zwróciliśmy się do Niego w pokorze, aby usunął nasze braki.',
      'Zrobiliśmy listę wszystkich osób, które skrzywdziliśmy, i staliśmy się gotowi zadośćuczynić im wszystkim.',
      'Zadośćuczyniliśmy osobiście wszystkim, wobec których było to możliwe, z wyjątkiem tych przypadków, gdy zraniłoby to ich lub innych.',
      'Prowadziliśmy nadal osobistą inwenturę, z miejsca przyznając się do popełnianych błędów.',
      'Staraliśmy się przez modlitwę i medytację poprawiać nasz świadomy kontakt z Bogiem, tak jak Go rozumieliśmy, prosząc jedynie o poznanie Jego woli wobec nas oraz o siłę do jej spełnienia.',
      'Przebudzeni duchowo w rezultacie tych kroków staraliśmy się nieść to posłanie innym alkoholikom i stosować te zasady we wszystkich naszych poczynaniach.',
    ],
  },
  {
    id: 'na',
    label: 'NA',
    subtitle: 'Anonimowi Narkomani',
    note: 'Wersja programu odnosząca kroki do uzależnienia i procesu zdrowienia.',
    steps: [
      'Przyznaliśmy, że jesteśmy bezsilni wobec naszego uzależnienia, że przestaliśmy kierować własnym życiem.',
      'Uwierzyliśmy, że Siła większa od nas samych może przywrócić nam zdrowie.',
      'Postanowiliśmy powierzyć naszą wolę i nasze życie opiece Boga, jakkolwiek Go pojmujemy.',
      'Zrobiliśmy gruntowny i odważny obrachunek moralny samych siebie.',
      'Wyznaliśmy Bogu, sobie i drugiemu człowiekowi istotę naszych błędów.',
      'Staliśmy się całkowicie gotowi, aby Bóg usunął wszystkie te wady charakteru.',
      'Zwróciliśmy się do Niego w pokorze, aby usunął nasze braki.',
      'Sporządziliśmy listę osób, które skrzywdziliśmy, i staliśmy się gotowi zadośćuczynić im wszystkim.',
      'Zadośćuczyniliśmy osobiście wszystkim tym osobom, gdziekolwiek było to możliwe, z wyjątkiem przypadków, gdy zraniłoby to ich lub innych.',
      'Prowadziliśmy nadal obrachunek moralny, z miejsca przyznając się do popełnianych błędów.',
      'Dążyliśmy poprzez modlitwę i medytację do coraz doskonalszej więzi z Bogiem, jakkolwiek Go pojmujemy, prosząc jedynie o poznanie Jego woli wobec nas oraz o siłę do jej spełnienia.',
      'Przebudzeni duchowo w rezultacie tych kroków, staraliśmy się nieść posłanie uzależnionym i stosować te zasady we wszystkich naszych poczynaniach.',
    ],
  },
  {
    id: 'alanon',
    label: 'Al-Anon',
    subtitle: 'Dla bliskich osób uzależnionych',
    note: 'Dwanaście Kroków Al-Anon, zwane dziedzictwem Al-Anon.',
    steps: [
      'Przyznaliśmy, że jesteśmy bezsilni wobec alkoholu – że nasze życie przestało się poddawać kierowaniu.',
      'Uwierzyliśmy, że Siła większa od nas samych może nam przywrócić zdrowy rozsądek.',
      'Podjęliśmy decyzję, aby oddać swoją wolę i swoje życie pod opiekę Boga – takiego, jak Go rozumieliśmy.',
      'Zrobiliśmy swoją wnikliwą i odważną inwenturę moralną.',
      'Wyznaliśmy Bogu, sobie i innemu człowiekowi, jaka dokładnie jest natura naszych błędów.',
      'Byliśmy całkowicie gotowi na to, by Bóg usunął te wszystkie wady charakteru.',
      'Pokornie prosiliśmy Go, aby usunął nasze braki.',
      'Zrobiliśmy listę wszystkich osób, które skrzywdziliśmy, i staliśmy się gotowi zadośćuczynić im wszystkim.',
      'Zadośćuczyniliśmy tym ludziom bezpośrednio, gdy tylko było to możliwe, z wyjątkiem sytuacji, gdy zraniłoby to ich samych lub kogoś innego.',
      'Robiliśmy w dalszym ciągu osobistą inwenturę, niezwłocznie przyznając się do popełnianych błędów.',
      'Dążyliśmy przez modlitwę i medytację do poprawy swojego świadomego kontaktu z Bogiem – takim, jak Go rozumieliśmy – modląc się jedynie o poznanie Jego woli względem nas i o siłę do jej wypełniania.',
      'Doświadczywszy duchowego przebudzenia jako rezultatu tych Kroków, staraliśmy się nieść to przesłanie innym ludziom, a zasady te stosować we wszystkich swoich sprawach.',
    ],
  },
  {
    id: 'slaa',
    label: 'SLAA',
    subtitle: 'Anonimowi Uzależnieni od Seksu i Miłości',
    note: 'Wersja kroków dla osób pracujących nad uzależnieniem od seksu i miłości.',
    steps: [
      'Przyznaliśmy, że jesteśmy bezsilni wobec uzależnienia od seksu i miłości - przestaliśmy kierować swoim życiem.',
      'Uwierzyliśmy, że Siła większa od nas samych może przywrócić nam równowagę umysłu.',
      'Postanowiliśmy powierzyć naszą wolę i nasze życie opiece Boga, jakkolwiek Boga pojmujemy.',
      'Zrobiliśmy wnikliwą i odważną osobistą inwenturę moralną.',
      'Wyznaliśmy Bogu, sobie i drugiemu człowiekowi istotę naszych błędów.',
      'Staliśmy się całkowicie gotowi, aby Bóg uwolnił nas od wszystkich wad charakteru.',
      'W pokorze prosiliśmy Boga, aby usuwał nasze braki.',
      'Zrobiliśmy listę osób, które skrzywdziliśmy i staliśmy się gotowi zadośćuczynić im wszystkim.',
      'Zadośćuczyniliśmy osobiście wszystkim, wobec których było to możliwe, z wyjątkiem przypadków, gdy zraniłoby to ich lub innych.',
      'Prowadziliśmy nadal osobistą inwenturę, z miejsca przyznając się do popełnianych błędów.',
      'Dążyliśmy, poprzez modlitwę i medytację, do doskonalenia naszej świadomej więzi z Siłą większą od nas samych, prosząc jedynie o poznanie woli Boga wobec nas oraz o siłę do jej spełniania.',
      'Przebudzeni duchowo dzięki tym Krokom, staraliśmy się nieść posłanie innym uzależnionym od seksu i miłości i stosować te zasady we wszystkich dziedzinach naszego życia.',
    ],
  },
  {
    id: 'uni',
    label: 'Uniwersalne',
    subtitle: 'Wersja neutralna do codziennej pracy',
    note: 'Ujęcie aplikacyjne dla osób, które chcą pracować krokami bez etykiety wspólnoty.',
    steps: [
      'Przyznaję, że w pewnym obszarze życia tracę kontrolę i potrzebuję pomocy.',
      'Uznaję, że wsparcie większe niż moja samotna siła może przywrócić mi równowagę.',
      'Podejmuję decyzję, by zaufać procesowi zdrowienia i trzymać się zasad, które mnie wzmacniają.',
      'Robię uczciwy obrachunek swoich zachowań, lęków i mechanizmów.',
      'Nazywam swoje błędy przed sobą i przed zaufaną osobą.',
      'Staję się gotowy, by rozstawać się z nawykami, które mnie niszczą.',
      'Proszę o pomoc w codziennej zmianie i praktykuję pokorę.',
      'Tworzę listę osób, które zraniłem, oraz tych, wobec których mam dług wdzięczności.',
      'Naprawiam szkody tam, gdzie to możliwe i bezpieczne.',
      'Codziennie robię krótki rachunek sumienia i szybko koryguję błędy.',
      'Wzmacniam kontakt z tym, co daje mi sens: ciszą, modlitwą, medytacją i refleksją.',
      'Dzielę się doświadczeniem z innymi i stosuję te zasady w relacjach, pracy i codzienności.',
    ],
  },
];

export default function Wsparcie12KrokowScreen() {
  const [selectedProgramId, setSelectedProgramId] = useState<ProgramId>('aa');

  const selectedProgram = useMemo(
    () => PROGRAMS.find((program) => program.id === selectedProgramId) ?? PROGRAMS[0],
    [selectedProgramId]
  );

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>12 kroków</Text>
        <Text style={styles.subtitle}>Różne brzmienia kroków: AA, NA, Al-Anon, SLAA i wersja uniwersalna.</Text>

        <CoJakSection
          title="Opis i instrukcja"
          co="W tym miejscu masz kilka wersji 12 kroków. Możesz wybrać to brzmienie, które jest najbliższe Twojej sytuacji."
          jak="Najpierw wybierz wspólnotę lub wersję uniwersalną. Potem czytaj krok po kroku i zatrzymaj się przy tym, który dziś jest dla Ciebie najważniejszy."
        />

        <View style={styles.chipsWrap}>
          {PROGRAMS.map((program) => {
            const active = selectedProgram.id === program.id;
            return (
              <Pressable
                key={program.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedProgramId(program.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{program.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.programTitle}>{selectedProgram.subtitle}</Text>
          <Text style={styles.programNote}>{selectedProgram.note}</Text>
        </View>

        {selectedProgram.steps.map((step, idx) => (
          <View key={`${selectedProgram.id}_${idx + 1}`} style={styles.stepCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <DailyReadToggle id="kroki12" />
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: 'white', marginBottom: 10 },
  subtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.72)', marginBottom: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    borderColor: 'rgba(120,200,255,0.6)',
    backgroundColor: 'rgba(120,200,255,0.22)',
  },
  chipText: { ...TYPE.bodyStrong, color: 'rgba(255,255,255,0.85)' },
  chipTextActive: { color: 'white' },
  headerCard: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    marginBottom: 12,
  },
  programTitle: { ...TYPE.h3, color: 'white', marginBottom: 6 },
  programNote: { ...TYPE.body, color: 'rgba(255,255,255,0.72)' },
  stepCard: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.16)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,200,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.55)',
  },
  badgeText: { ...TYPE.bodyStrong, color: 'white' },
  stepText: { ...TYPE.body, color: 'rgba(255,255,255,0.84)', flex: 1 },
});
