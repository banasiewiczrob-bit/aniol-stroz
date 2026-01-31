import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="dom" />
      <Stack.Screen name="kontrakt" />
      <Stack.Screen name="licznik" />
      <Stack.Screen name="plan-dnia" />
      <Stack.Screen name="wsparcie" />
      <Stack.Screen name="dzienniki" />
    </Stack>
  );
}