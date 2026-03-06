import { Stack } from 'expo-router';
import React from 'react';

export default function FlowLicznikLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: 'slide_from_right' }} />;
}
