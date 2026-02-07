import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { TYPE } from '@/styles/typography';

// Ustawienia routingu dla Expo Router
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadFonts = async () => {
      try {
        const Font = await import('expo-font');
        const inter = await import('@expo-google-fonts/inter');
        await Font.loadAsync({
          Inter_400Regular: inter.Inter_400Regular,
          Inter_500Medium: inter.Inter_500Medium,
          Inter_600SemiBold: inter.Inter_600SemiBold,
          Inter_700Bold: inter.Inter_700Bold,
        });
      } catch (e) {
        // Jeśli fonty nie są zainstalowane, użyjemy systemowych.
      } finally {
        if (!cancelled) setFontsLoaded(true);
      }
    };
    loadFonts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const baseStyle = {
      fontFamily: fontsLoaded ? TYPE.body.fontFamily : undefined,
      fontSize: TYPE.body.fontSize,
      lineHeight: TYPE.body.lineHeight,
    };
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [baseStyle, Text.defaultProps.style];
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [baseStyle, TextInput.defaultProps.style];
  }, [fontsLoaded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
