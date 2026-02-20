import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BackButton() {
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[styles.header, { height: insets.top + 27, paddingTop: insets.top }]} />;
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,200,255,0.12)',
    backgroundColor: '#071826',
  },
});
