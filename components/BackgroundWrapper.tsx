import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const Watermark = require('../assets/images/maly_aniol.png');

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  return (
    <View style={styles.container}>
      {/* Kontener na watermark musi być pierwszy */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={Watermark}
          style={styles.globalWatermark}
          resizeMode="contain"
        />
      </View>
      
      {/* Treść aplikacji */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071826',
  },
  globalWatermark: {
    position: 'absolute',
    top: '25%', 
    alignSelf: 'center',
    width: 320,
    height: 320,
    opacity: 0.03, // Zwiększyłem odrobinę, żebyś go na pewno zobaczył
    tintColor: 'white',
    transform: [{ rotate: '-12deg' }],
  },
});
