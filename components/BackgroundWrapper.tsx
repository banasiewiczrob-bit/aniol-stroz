import { BackButton } from '@/components/BackButton';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const Watermark = require('../app/assets/images/maly_aniol.png');

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Image source={Watermark} style={styles.globalWatermark} resizeMode="contain" />
      </View>

      <BackButton />
      <View style={styles.contentLayer}>{children}</View>
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
    top: '20%',
    alignSelf: 'center',
    width: 460,
    height: 460,
    opacity: 0.05,
    tintColor: 'white',
    transform: [{ rotate: '-12deg' }],
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
});
