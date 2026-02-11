import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { DailyReadToggle } from '@/components/DailyReadToggle';
import { SCREEN_CONTAINER, SCREEN_TITLE } from '@/styles/screenStyles';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HaltScreen() {
  return (
    <BackgroundWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>HALT</Text>
        <Text style={styles.subtitle}>
          Zanim podejmiesz decyzję lub działanie, sprawdź czy nie jesteś:
        </Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Znasz tak zwany program HALT? Jego stosowanie pomaga zauważyć stany, które zwiększają napięcie i ryzyko impulsywnych decyzji."
          jak="Przed kadą waną dla Ciebie decyzją zrób krótki sprawdzian: głód, złość, samotność, zmęczenie. 
          Najpierw pomyśl o swoich potrzebach, potem działaj. Przeczytaj każdy punkt i zastanów się, 
          czy któryś z nich nie jest teraz w Tobie obecny. Jeśli tak, zatrzymaj się i zadbaj o tę 
          potrzebę, zanim podejmiesz decyzję. Zaznacz na dole Przeczytałem."
        />

        <HaltItem 
          letter="H" 
          title="Hungry (Głodny)" 
          description="Unikaj długich przerw w jedzeniu, które obniżają nastrój i zwiększają drażliwość." 
          icon="restaurant-outline"
        />

        <HaltItem 
          letter="A" 
          title="Angry (Zezłoszczony)" 
          description="Radź sobie z gniewem i złością, zamiast tłumienia ich, co prowadzi do silnego napięcia." 
          icon="thunderstorm-outline"
        />

        <HaltItem 
          letter="L" 
          title="Lonely (Samotny)" 
          description="Przeciwdziałaj izolacji poprzez kontakt z innymi, udział w mityngach i szukanie wsparcia." 
          icon="people-outline"
        />

        <HaltItem 
          letter="T" 
          title="Tired (Zmęczony)" 
          description="Dbaj o odpowiednią ilość snu i odpoczynek, aby uniknąć fizycznego i psychicznego wyczerpania." 
          icon="bed-outline"
        />

        <DailyReadToggle id="halt" />
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </BackgroundWrapper>
  );
}

function HaltItem({ letter, title, description, icon }: { letter: string, title: string, description: string, icon: any }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.letterBadge}>
          <Text style={styles.letterText}>{letter}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons name={icon} size={24} color="rgba(120, 200, 255, 0.5)" style={styles.icon} />
      </View>
      <Text style={styles.cardDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...SCREEN_CONTAINER },
  title: { ...SCREEN_TITLE, marginBottom: 10 },
  subtitle: { ...TYPE.body, color: 'rgba(209, 209, 209, 0.6)', marginBottom: 30 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.1)',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  letterBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 200, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  letterText: { ...TYPE.h3, color: '#78C8FF' },
  cardTitle: { ...TYPE.h3, color: '#FFFFFF', flex: 1 },
  cardDesc: { ...TYPE.body, color: 'rgba(209, 209, 209, 0.8)' },
  icon: { marginLeft: 10 }
});
