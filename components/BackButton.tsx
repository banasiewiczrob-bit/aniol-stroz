import React from 'react';
import { useNavigation } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BackButtonProps = {
  showTopBar?: boolean;
  showSwipeHint?: boolean;
};

export function BackButton({ showTopBar = true, showSwipeHint = true }: BackButtonProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const canShowSwipeHint = showSwipeHint && navigation.canGoBack();
  const swipeHintPaddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 8);

  return (
    <>
      {showTopBar ? <View pointerEvents="none" style={[styles.header, { height: insets.top + 27, paddingTop: insets.top }]} /> : null}
      {canShowSwipeHint ? (
        <View
          pointerEvents="none"
          style={[styles.swipeHintBar, { paddingBottom: swipeHintPaddingBottom }]}
        >
          <Text style={styles.swipeHint}>Przesuń, aby wrócić</Text>
        </View>
      ) : null}
    </>
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
  swipeHintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    minHeight: 26,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120,200,255,0.16)',
    backgroundColor: '#071826',
  },
  swipeHint: {
    color: 'rgba(220, 238, 255, 0.95)',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
