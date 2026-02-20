import { router, Stack, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { PanResponder, View } from 'react-native';

export default function FlowLayout() {
  const params = useGlobalSearchParams<{ backTo?: string | string[] }>();
  const backToParam = params.backTo;
  const backTo = Array.isArray(backToParam) ? backToParam[0] : backToParam;
  const hasBackTarget = typeof backTo === 'string' && backTo.startsWith('/');

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => hasBackTarget,
        onMoveShouldSetPanResponder: (_, gesture) => hasBackTarget && gesture.dx > 12 && Math.abs(gesture.dy) < 16,
        onPanResponderRelease: (_, gesture) => {
          if (!hasBackTarget) return;
          const isBackSwipe = gesture.dx >= 72 && Math.abs(gesture.dy) <= 36;
          if (!isBackSwipe) return;
          router.replace(backTo as any);
        },
      }),
    [backTo, hasBackTarget]
  );

  return (
    <View style={{ flex: 1 }}>
      {hasBackTarget ? (
        <View
          {...panResponder.panHandlers}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, zIndex: 200 }}
        />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
