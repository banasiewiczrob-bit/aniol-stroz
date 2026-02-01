import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export const BackgroundWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.container}>
      {/* Warstwa z napisem w tle */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Text style={styles.watermarkText}>ANIOŁ STRÓŻ</Text>
      </View>
      
      {/* Warstwa z Twoim kodem (np. umową) */}
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071826", // Bardzo jasny szary (standard Apple) zamiast czystej bieli
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0, 
  },
  watermarkText: {
    fontSize: width * 0.18, // Duży napis
    fontWeight: '900',
    color: '#000',
    opacity: 0.08, // Zwiększona widoczność (było 0.05)
    transform: [{ rotate: '-30deg' }], // Przechylony w lewo/prawo (zmień minus jeśli wolisz w drugą stronę)
    textAlign: 'center',
  },
  contentLayer: {
    flex: 1,
    backgroundColor: 'transparent', // Kluczowe: treść nie może mieć własnego białego tła
    zIndex: 1,
  },
});