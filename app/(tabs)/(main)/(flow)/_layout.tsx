import { Stack } from 'expo-router';
import React from 'react';

export default function FlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'none',
      }}
    />
  );
}
