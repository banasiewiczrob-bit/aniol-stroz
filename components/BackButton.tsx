import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BackButton() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ backTo?: string | string[] }>();
  const backToParam = params.backTo;
  const backTo = Array.isArray(backToParam) ? backToParam[0] : backToParam;

  if (!navigation.canGoBack() && !backTo) {
    return null;
  }

  const handlePress = () => {
    if (backTo && backTo.startsWith('/')) {
      router.replace(backTo as any);
      return;
    }
    router.back();
  };

  return (
    <View style={[styles.header, { height: insets.top + 54, paddingTop: insets.top }]}>
      <Pressable style={styles.button} onPress={handlePress} hitSlop={8}>
        <Text style={styles.text}>Wróć</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,200,255,0.12)',
    backgroundColor: '#071826',
  },
  button: {
    left: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.35)',
    backgroundColor: 'rgba(7,24,38,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  text: {
    color: '#D8F1FF',
    fontSize: 17,
    fontWeight: '700',
  },
});
