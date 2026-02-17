import { CoJakSection } from '@/components/CoJakSection';
import { CONTRACT_SIGNED_STORAGE_KEY } from '@/constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Zmień to:
// import { BackgroundWrapper } from '../components/BackgroundWrapper';

// Na to:
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
export default function KontraktScreen() {
  const [isChecked, setChecked] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSignature = async () => {
      try {
        const signedRaw = await AsyncStorage.getItem(CONTRACT_SIGNED_STORAGE_KEY);
        setChecked(signedRaw === '1');
      } catch (e) {
        console.error('Błąd ładowania podpisu kontraktu:', e);
      } finally {
        setSignatureLoaded(true);
      }
    };

    void loadSignature();
  }, []);

  const handleSign = async () => {
    if (isChecked) return;
    try {
      await AsyncStorage.setItem(CONTRACT_SIGNED_STORAGE_KEY, '1');
      setChecked(true);
    } catch (e) {
      console.error('Błąd zapisu podpisu kontraktu:', e);
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
          <CoJakSection
            title="Opis i instrukcja"
            co="To osobisty kontrakt, który wyznacza kierunek Twojej zmiany i przypomina, po co ją zaczynasz."
            jak="Przeczytaj spokojnie wszystkie punkty. Zaznacz pole wyboru dopiero wtedy, gdy poczujesz gotowość wejścia w proces."
          />
          
          <Text style={styles.intro}>
            Zaczynam tę drogę dla siebie i ze sobą podpisuję ten kontrakt:
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
              Daję sobie prawo do wszystkich emocji. Nie będę przed sobą uciekać. Jestem otwarty wobec tego, co do mnie przychodzi z
              zewnątrz.
            </Text>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointTitle}>3. Gotowość do zmiany</Text>
            <Text style={styles.pointText}>
              Zobowiązuję się do małych kroków i nowych sposobów myślenia. Za moją zmianę zapłacę całą cenę, jaka jest do zapłacenia.
            </Text>
          </View>

          <Text style={styles.footer}>Robię to, bo zasługuję na opiekę i spokój.</Text>

          {/* Sekcja podpisu */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={handleSign}
            activeOpacity={0.8}
          >
            <Checkbox
              style={styles.checkbox}
              value={isChecked}
              onValueChange={handleSign}
              color={isChecked ? '#4630EB' : undefined}
            />
            <Text style={styles.label}>
              {isChecked ? 'Kontrakt podpisany.' : 'Podpisuję się pod tym i zaczynam zmianę.'}
            </Text>
          </TouchableOpacity>

          {/* Przycisk - teraz w pełni bezpieczny */}
          <TouchableOpacity 
            style={[styles.button, (!isChecked || !signatureLoaded) && styles.buttonDisabled]} 
            onPress={() => isChecked && router.replace('/(tabs)')}
            disabled={!isChecked || !signatureLoaded}
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
  mainContainer: { 
    flex: 1 
  },
  container: { 
    flex: 1 
  },
  content: { 
    padding: 25, 
    paddingTop: 10 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#B0B0B0', 
    marginTop: 10 
  },
  intro: { 
    fontSize: 17, 
    fontStyle: 'italic', 
    marginBottom: 30, 
    textAlign: 'center', 
    color: '#657a8f', 
    lineHeight: 24 
  },
  point: { 
    marginBottom: 25 
  },
  pointTitle: { 
    fontSize: 19, 
    fontWeight: '800', 
    color: '#72869a', 
    marginBottom: 5 
  },
  pointText: { 
    fontSize: 17, 
    color: '#bac3cd', 
    lineHeight: 24 
  },
  footer: { 
    marginTop: 10, 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#66798b', 
    marginBottom: 35 
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30, 
    justifyContent: 'center', 
    paddingVertical: 10 
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    marginRight: 12 
  },
  label: { 
    fontSize: 16, 
    color: '#afbcc9', 
    fontWeight: '500' 
  },
  button: { 
    backgroundColor: '#4630EB', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonDisabled: { 
    backgroundColor: '#3a576b' 
  },
  buttonText: { 
    color: '#abb1c7', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});
