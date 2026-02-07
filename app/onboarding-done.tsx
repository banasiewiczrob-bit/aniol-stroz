import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingDoneScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Gotowe</Text>
        <Text style={styles.subtitle}>
          Podpis jest zapisany, a licznik ustawiony.
          {'\n'}
          Drzwi do całej aplikacji są już otwarte.
        </Text>

        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Wejdź do aplikacji</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#071826',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(120,200,255,0.2)',
    borderWidth: 1,
    borderColor: '#78C8FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
