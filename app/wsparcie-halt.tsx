import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { DailyReadToggle } from '@/components/DailyReadToggle';
import { SCREEN_CONTAINER, SCREEN_TITLE } from '@/styles/screenStyles';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Watermark = require('../assets/images/maly_aniol.png');

export default function HaltScreen() {
  const insets = useSafeAreaInsets();

  return (
    <BackgroundWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 110) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />
        <Text style={styles.title}>HALT</Text>
        <Text style={styles.subtitle}>
          Zanim podejmiesz decyzję lub działanie, sprawdź czy nie jesteś:
        </Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Znasz tak zwany program HALT? Jego stosowanie pomaga zauważyć stany, które zwiększają napięcie i ryzyko impulsywnych decyzji."
          jak="Przed każdą ważną dla Ciebie decyzją zrób krótki sprawdzian: głód, złość, samotność, zmęczenie. 
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
      </ScrollView>
    </BackgroundWrapper>
  );
}

function HaltItem({ letter, title, description, icon }: { letter: string, title: string, description: string, icon: any }) {
  return (
    <View style={styles.card}>
      <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
      <View style={styles.cardAccent} />
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
  container: { flex: 1 },
  content: {
    ...SCREEN_CONTAINER,
    flex: 0,
    flexGrow: 1,
  },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 158, 158, 0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 194, 194, 0.09)',
    bottom: 110,
    left: -75,
  },
  title: { ...SCREEN_TITLE, marginBottom: 10 },
  subtitle: { ...TYPE.body, color: 'rgba(255, 229, 229, 0.8)', marginBottom: 30 },
  card: {
    backgroundColor: 'rgba(63, 32, 40, 0.36)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 194, 0.34)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FF9E9E',
    marginBottom: 12,
  },
  cardWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -24,
    width: 140,
    height: 140,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  letterBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 158, 158, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  letterText: { ...TYPE.h3, color: '#FFB7B7' },
  cardTitle: { ...TYPE.h3, color: '#FFFFFF', flex: 1 },
  cardDesc: { ...TYPE.body, color: 'rgba(255, 232, 232, 0.86)' },
  icon: { marginLeft: 10 }
});
