import { Stack } from 'expo-router';

export const Array = {
  // To wymusza na routerze zachowanie statyczne, co często naprawia ten błąd
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}