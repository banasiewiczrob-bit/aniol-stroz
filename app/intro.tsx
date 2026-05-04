import { getFirstStepsState, markIntroSeen, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import { FirstStepsRoadmap } from '@/components/FirstStepsRoadmap';
import { APP_DISPLAY_NAME } from '@/constants/app';
import Constants from 'expo-constants';
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Poprawione ścieżki (zakładając, że assets są w folderze app)
const Logo = require("./assets/images/icon-stroz.png");
const Watermark = require("./assets/images/maly_aniol.png");

export default function Intro() {
  const { height, fontScale } = useWindowDimensions();
  const compact = height <= 860 || fontScale > 1.05;
  const appVersion = useMemo(
    () => Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0',
    []
  );
  const [showFirstStepsRoadmap, setShowFirstStepsRoadmap] = useState(false);
  const [busy, setBusy] = useState(false);
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(textAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(bottomAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) setShowFirstStepsRoadmap(step !== 'done');
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const resolveNextRoute = async () => {
    const state = await getFirstStepsState();
    const step = resolveFirstStepsStep(state);
    if (step === 'consents') return '/ustawienia';
    if (step === 'contract') return '/kontrakt';
    if (step === 'counter') return '/licznik';
    return '/(tabs)';
  };

  const goNext = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markIntroSeen();
      const nextRoute = await resolveNextRoute();
      router.replace(nextRoute as any);
    } catch (error) {
      console.error('Błąd przejścia z intro:', error);
      Alert.alert('Nie udało się przejść dalej', 'Spróbuj ponownie. Jeśli problem wróci, trzeba sprawdzić build i logi urządzenia.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="always"
      >
        <View style={[styles.mainContainer, compact && styles.mainContainerCompact]}>
          <Animated.View
            style={[
              styles.logoSection,
              compact && styles.logoSectionCompact,
              {
                opacity: logoAnim,
                transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              },
            ]}
          >
            <Image source={Logo} style={[styles.logo, compact && styles.logoCompact]} />
          </Animated.View>

          <Animated.View
            style={[
              styles.textSection,
              compact && styles.textSectionCompact,
              {
                opacity: textAnim,
                transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <View style={styles.textWrap}>
              <Text style={[styles.hi, compact && styles.hiCompact]}>Cześć.</Text>
              <Text style={[styles.line, compact && styles.lineCompact]}>Jestem Anioł Stróż.</Text>
              <Text style={[styles.line, compact && styles.lineCompact]}>Będę Ci towarzyszył{"\n"}w Twoim procesie zdrowienia.</Text>
              {showFirstStepsRoadmap ? <FirstStepsRoadmap currentStep={1} hideTitle compact={compact} /> : null}
            </View>
          </Animated.View>

          <View pointerEvents="none" style={[styles.watermarkWrap, compact && styles.watermarkWrapCompact]}>
            <Image source={Watermark} style={[styles.watermark, compact && styles.watermarkCompact]} />
          </View>

          <Animated.View
            style={[
              styles.bottomSection,
              compact && styles.bottomSectionCompact,
              {
                opacity: bottomAnim,
                transform: [{ translateY: bottomAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <Pressable onPress={() => void goNext()} style={[styles.button, busy && styles.buttonDisabled]} disabled={busy}>
              <Text style={styles.buttonText}>Dalej</Text>
            </Pressable>
            <Pressable onPress={() => void goNext()} style={styles.skipButton} disabled={busy}>
              <Text style={styles.skipButtonText}>Pomiń intro</Text>
            </Pressable>
            <Text style={styles.footer}>{APP_DISPLAY_NAME} {appVersion}</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071826" },
  scrollContent: { flexGrow: 1 },
  mainContainer: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 10, paddingBottom: 30 },
  mainContainerCompact: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 },
  logoSection: { alignItems: 'center', justifyContent: 'center', height: 220, marginTop: 20 },
  logoSectionCompact: { height: 164, marginTop: 8 },
  logo: { width: 164, height: 164, borderRadius: 82, resizeMode: "cover" },
  logoCompact: { width: 126, height: 126, borderRadius: 63 },
  textSection: { marginTop: 30, zIndex: 2 },
  textSectionCompact: { marginTop: 14 },
  textWrap: { justifyContent: "center" },
  hi: { color: "#fff", fontSize: 32, fontWeight: "700", marginBottom: 20, letterSpacing: 0.6 },
  hiCompact: { fontSize: 28, marginBottom: 14 },
  line: { color: "rgba(255,255,255,0.85)", fontSize: 19, lineHeight: 30, letterSpacing: 0.4, marginBottom: 12 },
  lineCompact: { fontSize: 17, lineHeight: 27, marginBottom: 10 },
  watermarkWrap: { position: "absolute", right: -10, bottom: 120, zIndex: 1 },
  watermarkWrapCompact: { right: -18, bottom: 88 },
  watermark: { width: 180, height: 180, opacity: 0.04, resizeMode: "contain" },
  watermarkCompact: { width: 150, height: 150 },
  bottomSection: { marginTop: 'auto', alignItems: 'center', width: '100%' },
  bottomSectionCompact: { marginTop: 22 },
  button: { width: "100%", paddingVertical: 18, borderRadius: 25, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(120,200,255,0.35)" },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  skipButton: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 },
  skipButtonText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '600' },
  footer: { marginTop: 25, color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
});
