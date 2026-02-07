import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { TYPE } from '@/styles/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function KontraktScreen() {
  const [isChecked, setChecked] = useState(false);
  const router = useRouter();

  const handleStartJourney = async () => {
    try {
      const alreadyStarted = await AsyncStorage.getItem('startDate');
      if (!alreadyStarted) {
        await AsyncStorage.setItem('startDate', new Date().toISOString());
      }

      const savedRewards = await AsyncStorage.getItem('unlockedAngels');
      let unlocked = savedRewards ? JSON.parse(savedRewards) : [];
      
      if (!unlocked.includes(1)) {
        unlocked.push(1);
        await AsyncStorage.setItem('unlockedAngels', JSON.stringify(unlocked));
      }

      router.replace('/(tabs)');
    } catch (e) {
      console.error("Błąd podczas zapisywania kontraktu:", e);
      router.replace('/(tabs)');
    }
  };

  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.mainContainer}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Moja Umowa z Samym Sobą</Text>
          
          <Text style={styles.intro}>
            Zaczynam tę drogę dla siebie i z sobą podpisuję ten kontrakt:
          </Text>

          <View style={styles.point}>
            <Text style={styles.pointTitle}>1. Uczciwość</Text>
            <Text style={styles.pointText}>
              Będę szczery wobec siebie. To nie tylko prawdomówność, ale przede wszystkim spójność.
            </Text>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointTitle}>2. Otwartość</Text>
            <Text style={styles.pointText}>
              Daję sobie prawo do wszystkich emocji. Nie będę przed sobą uciekać. Jestem otwarty wobec tego co do mnie przychodzi z zewnątrz.
            </Text>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointTitle}>3. Gotowość do zmiany</Text>
            <Text style={styles.pointText}>
              Zobowiązuję się do małych kroków i nowych sposobów myślenia. Za moją zmianę zapłacę całą cenę jaka jest do zapłacenia.
            </Text>
          </View>

          <Text style={styles.footer}>Robię to, bo zasługuję na opiekę i spokój.</Text>

          {/* Sekcja podpisu */}
          <View style={styles.signatureSection}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                style={styles.checkbox}
                value={isChecked}
                onValueChange={(val) => setChecked(val)}
                // Stonowany kolor zamiast fioletu
                color={isChecked ? '#657a8f' : '#3a576b'} 
              />
              <Text style={styles.label}>Podpisuję się pod tym i zaczynam zmianę.</Text>
            </View>

            {/* Informacja o Aniele */}
            <Text style={styles.angelInfo}>
              Otrzymujesz Anioła "Właśnie dzisiaj".{"\n"}
              To Twój pierwszy symbol zdrowienia.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, !isChecked && styles.buttonDisabled]} 
            onPress={() => isChecked && handleStartJourney()}
            disabled={!isChecked}
          >
            <Text style={styles.buttonText}>Wchodzę</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} /> 
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 25, paddingTop: 10 },
  title: { ...TYPE.h2, marginBottom: 20, textAlign: 'center', color: '#B0B0B0', marginTop: 10 },
  intro: { ...TYPE.body, fontStyle: 'italic', marginBottom: 30, textAlign: 'center', color: '#657a8f' },
  point: { marginBottom: 25 },
  pointTitle: { ...TYPE.bodyStrong, color: '#72869a', marginBottom: 5 },
  pointText: { ...TYPE.body, color: '#bac3cd' },
  footer: { ...TYPE.bodyStrong, marginTop: 10, textAlign: 'center', color: '#66798b', marginBottom: 25 },
  
  signatureSection: {
    marginBottom: 35,
    alignItems: 'center',
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10,
    marginBottom: 10
  },
  checkbox: { width: 22, height: 22, marginRight: 12, borderRadius: 4 },
  label: { ...TYPE.bodySmall, color: '#afbcc9' },
  
  angelInfo: {
    color: '#00BFFF', // Twój kolor dla Anioła
    ...TYPE.caption,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9
  },

  button: { 
    backgroundColor: '#50667a', // Stonowany stalowy/niebieski zamiast fioletu
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonDisabled: { 
    backgroundColor: '#2a3b4a', // Ciemniejszy, przygaszony kolor
    opacity: 0.6
  },
  buttonText: { 
    ...TYPE.button,
    color: '#E0E0E0'
  }
});
