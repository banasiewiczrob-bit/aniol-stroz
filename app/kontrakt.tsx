import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import { CoJakSection } from '@/components/CoJakSection';
import { FirstStepsRoadmap } from '@/components/FirstStepsRoadmap';
import { CONTRACT_SIGNED_STORAGE_KEY } from '@/constants/storageKeys';
import { getFirstStepsState, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Watermark = require('../assets/images/maly_aniol.png');
export default function KontraktScreen() {
  const { swipeHintInset } = useSwipeHintInset();
  const [isChecked, setChecked] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);
  const [showFirstStepsRoadmap, setShowFirstStepsRoadmap] = useState(false);
  const [showSignedContractDetails, setShowSignedContractDetails] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    const loadRoadmapVisibility = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) setShowFirstStepsRoadmap(step !== 'done');
    };
    void loadRoadmapVisibility();
    return () => {
      mounted = false;
    };
  }, []);

  const handleContinue = async () => {
    if (!isChecked) return;
    try {
      await AsyncStorage.setItem(CONTRACT_SIGNED_STORAGE_KEY, '1');
      router.replace('/licznik');
    } catch (e) {
      console.error('Błąd zapisu podpisu kontraktu:', e);
    }
  };

  const showSignedSummary = signatureLoaded && isChecked && !showFirstStepsRoadmap && !showSignedContractDetails;

  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton showTopBar={false} />
      <SafeAreaView style={styles.mainContainer}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Moja Umowa z Samym Sobą</Text>
          {showSignedSummary ? (
            <>
              <View style={styles.signedCard}>
                <Image source={Watermark} resizeMode="contain" style={styles.signedCardWatermark} />
                <View style={styles.signedBadge}>
                  <Text style={styles.signedBadgeText}>Podpisano</Text>
                </View>
                <Text style={styles.signedTitle}>Kontrakt jest podpisany</Text>
                <Text style={styles.signedText}>
                  Ta decyzja już została podjęta. Możesz wracać do niej wtedy, gdy potrzebujesz przypomnieć sobie kierunek swojej zmiany.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowSignedContractDetails(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Pokaż treść kontraktu</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <CoJakSection
                title="Opis i instrukcja"
                co="To osobisty kontrakt. Ma Ci przypominać, na co zgadzasz się wobec siebie, kiedy wracasz do zmiany."
                jak="Przeczytaj spokojnie wszystkie punkty. Nie musisz się spieszyć. Zaznacz pole wyboru dopiero wtedy, gdy naprawdę chcesz wejść w ten kontrakt."
              />
              {showFirstStepsRoadmap ? <FirstStepsRoadmap currentStep={1} /> : null}

              <Text style={styles.intro}>Jeśli chcesz wejść w to uczciwie, możesz powiedzieć sobie:</Text>

              <View style={styles.point}>
                <Image source={Watermark} resizeMode="contain" style={styles.pointWatermark} />
                <Text style={styles.pointTitle}>1. Uczciwość</Text>
                <Text style={styles.pointText}>
                  Będę szczery wobec siebie. To nie tylko prawdomówność, ale przede wszystkim spójność.
                </Text>
              </View>

              <View style={styles.point}>
                <Image source={Watermark} resizeMode="contain" style={styles.pointWatermark} />
                <Text style={styles.pointTitle}>2. Otwartość</Text>
                <Text style={styles.pointText}>
                  Daję sobie prawo do wszystkich emocji. Nie będę przed sobą uciekać. Jestem otwarty wobec tego, co do mnie przychodzi z
                  zewnątrz.
                </Text>
              </View>

              <View style={styles.point}>
                <Image source={Watermark} resizeMode="contain" style={styles.pointWatermark} />
                <Text style={styles.pointTitle}>3. Gotowość do zmiany</Text>
                <Text style={styles.pointText}>
                  Zobowiązuję się do małych kroków i nowych sposobów myślenia. Za moją zmianę zapłacę całą cenę, jaka jest do zapłacenia.
                </Text>
              </View>

              <Text style={styles.footer}>Robię to, bo zasługuję na opiekę i spokój.</Text>

              {showFirstStepsRoadmap ? (
                <>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setChecked((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <Checkbox
                      style={styles.checkbox}
                      value={isChecked}
                      onValueChange={setChecked}
                      color={isChecked ? '#4630EB' : undefined}
                    />
                    <Text style={styles.label}>Podpisuję się pod tym i zaczynam zmianę.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, (!isChecked || !signatureLoaded) && styles.buttonDisabled]}
                    onPress={() => void handleContinue()}
                    disabled={!isChecked || !signatureLoaded}
                  >
                    <Text style={styles.buttonText}>Wchodzę</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowSignedContractDetails(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Zwiń</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          <View style={{ height: 40 }} /> 
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#061A2C',
  },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(118, 214, 255, 0.1)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 208, 149, 0.08)',
    bottom: 110,
    left: -80,
  },
  mainContainer: { 
    flex: 1 
  },
  container: { 
    flex: 1 
  },
  content: { 
    padding: 18, 
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: { 
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'left',
    color: 'white',
    marginTop: 4,
  },
  intro: { 
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'left',
    color: 'rgba(232,245,255,0.84)',
    lineHeight: 22,
  },
  point: { 
    marginBottom: 10,
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    padding: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  pointWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -20,
    width: 110,
    height: 110,
    opacity: 0.1,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  pointTitle: { 
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  pointText: { 
    fontSize: 15,
    color: 'rgba(232,245,255,0.84)',
    lineHeight: 22,
  },
  signedCard: {
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: 'rgba(12,38,62,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(158,243,199,0.34)',
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  signedCardWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -20,
    width: 120,
    height: 120,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  signedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(158,243,199,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(158,243,199,0.42)',
    marginBottom: 14,
  },
  signedBadgeText: {
    color: '#B8FFD8',
    fontSize: 13,
    fontWeight: '700',
  },
  signedTitle: {
    color: 'white',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 10,
    maxWidth: '78%',
  },
  signedText: {
    color: 'rgba(232,245,255,0.88)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '80%',
  },
  footer: { 
    marginTop: 10, 
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: 'rgba(232,245,255,0.88)',
    marginBottom: 20,
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(12,38,62,0.78)',
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    marginRight: 12 
  },
  label: { 
    fontSize: 16, 
    color: 'rgba(232,245,255,0.9)',
    fontWeight: '500' 
  },
  button: { 
    backgroundColor: 'rgba(120, 200, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.5)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { 
    backgroundColor: 'rgba(58, 87, 107, 0.7)',
    borderColor: 'rgba(120, 200, 255, 0.22)',
  },
  buttonText: { 
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold' 
  },
  secondaryButton: {
    backgroundColor: 'rgba(120, 200, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.28)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(232,245,255,0.94)',
    fontSize: 16,
    fontWeight: '700',
  },
});
