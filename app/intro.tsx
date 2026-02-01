import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Poprawione ścieżki (zakładając, że assets są w folderze app)
const Logo = require("./assets/images/logo-aniol-stroz.png");
const Watermark = require("./assets/images/maly_aniol.png");

export default function Intro() {
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

  const goNext = () => {
    // Kierujemy do (tabs), co automatycznie otworzy ekran Dom (index.tsx)
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mainContainer}>
        <Animated.View style={[styles.logoSection, { opacity: logoAnim, transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
          <Image source={Logo} style={styles.logo} />
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: textAnim, transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.textWrap}>
            <Text style={styles.hi}>Cześć.</Text>
            <Text style={styles.line}>Jestem Anioł Stróż.</Text>
            <Text style={styles.line}>Będę Cię wspierał{"\n"}w Twoim procesie zdrowienia.</Text>
          </View>
        </Animated.View>

        <Image source={Watermark} style={styles.watermark} />

        <Animated.View style={[styles.bottomSection, { opacity: bottomAnim, transform: [{ translateY: bottomAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Pressable onPress={goNext} style={styles.button}>
            <Text style={styles.buttonText}>Dalej</Text>
          </Pressable>
          <Text style={styles.footer}>Robert Banasiewicz</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071826" },
  mainContainer: { flex: 1, paddingHorizontal: 30, paddingTop: 10, paddingBottom: 30 },
  logoSection: { alignItems: 'center', justifyContent: 'center', height: 220, marginTop: 20 },
  logo: { width: 280, height: '100%', resizeMode: "contain" },
  textSection: { marginTop: 30, zIndex: 2 },
  textWrap: { justifyContent: "center" },
  hi: { color: "#fff", fontSize: 32, fontWeight: "700", marginBottom: 20, letterSpacing: 0.6 },
  line: { color: "rgba(255,255,255,0.85)", fontSize: 19, lineHeight: 30, letterSpacing: 0.4, marginBottom: 12 },
  watermark: { position: "absolute", right: -10, bottom: 120, width: 180, height: 180, opacity: 0.04, resizeMode: "contain", zIndex: 1 },
  bottomSection: { marginTop: 'auto', alignItems: 'center', width: '100%' },
  button: { width: "100%", paddingVertical: 18, borderRadius: 25, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(120,200,255,0.35)" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  footer: { marginTop: 25, color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
});