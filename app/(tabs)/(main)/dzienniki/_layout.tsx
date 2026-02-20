import { Stack } from 'expo-router';

export default function DziennikiLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: 'slide_from_right' }} />;
}
