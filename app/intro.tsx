import { router } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Logo = require("./assets/images/logo-aniol-stroz.png");
const Watermark = require("./assets/images/maly_aniol.png");

export default function Intro() {
  const goNext = async () => {
    router.replace("/dom");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={Watermark} style={styles.watermark} />

        <View style={styles.logoWrap}>
          <Image source={Logo} style={styles.logo} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.hi}>Cześć.</Text>
          <Text style={styles.line}>Jestem Anioł Stróż.</Text>
          <Text style={styles.line}>
            Będę Cię wspierał{"\n"}w Twoim procesie zdrowienia.
          </Text>
        </View>

        <View style={styles.bottomArea}>
          <Pressable onPress={goNext} style={styles.button}>
            <Text style={styles.buttonText}>Dalej</Text>
          </Pressable>

          <Text style={styles.footer}>Robert Banasiewicz</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071826" },
  container: { flex: 1, paddingHorizontal: 24 },

  watermark: {
    position: "absolute",
    right: 16,
    bottom: 100,
    width: 160,
    height: 160,
    opacity: 0.06,
    resizeMode: "contain",
  },

  logoWrap: { alignItems: "center", marginTop: 5 },
  logo: { width: 300, height: 300, resizeMode: "contain" },

  textWrap: { flex: 1, justifyContent: "center" },
  hi: { color: "#fff", fontSize: 30, marginBottom: 36 },
  line: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 12,
  },

  bottomArea: { alignItems: "center", paddingBottom: 24 },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(120,200,255,0.35)",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },

  footer: { marginTop: 30, color: "rgba(255,255,255,0.45)", fontSize: 12 },
});