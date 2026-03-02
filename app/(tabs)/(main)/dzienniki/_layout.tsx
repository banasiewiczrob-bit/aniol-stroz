import { Stack } from 'expo-router';

export default function DziennikiLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false, animation: 'none' }} />;
}
