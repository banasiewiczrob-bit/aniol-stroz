import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

interface AnimatedAngelProps {
  color?: string;
  size?: number;
}

export const AnimatedAngel = ({ color = 'white', size = 180 }: AnimatedAngelProps) => {
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: -15,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatingAnim, scaleAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const imageSize = Math.max(40, size);
  const containerHeight = imageSize + 40;
  const shadowWidth = Math.max(30, imageSize * 0.33);
  const shadowHeight = Math.max(6, imageSize * 0.08);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: containerHeight }}>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 20,
          width: shadowWidth,
          height: shadowHeight,
          backgroundColor: 'black',
          borderRadius: 50,
          opacity: 0.2,
          transform: [{ scale: scaleAnim }],
        }}
      />

      <Animated.Image
        source={require('../app/assets/images/maly_aniol.png')}
        style={{
          position: 'absolute',
          width: imageSize,
          height: imageSize,
          tintColor: color,
          transform: [{ translateY: floatingAnim }, { scale: scaleAnim }, { rotate: rotation }],
        }}
        resizeMode="contain"
      />
    </View>
  );
};
