import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. GŁÓWNY FOLDER Z MENU NA DOLE */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 2. EKRAN POWITALNY */}
      <Stack.Screen name="intro" options={{ headerShown: false }} />

      {/* 3. POZOSTAŁE EKRANY (te, które Expo widzi w folderze app) */}
      <Stack.Screen name="kontrakt" options={{ presentation: 'modal', title: 'Kontrakt' }} />
      <Stack.Screen name="plan-dnia" options={{ title: 'Plan dnia' }} />
      <Stack.Screen name="dzienniki" options={{ title: 'Dzienniki' }} />
      <Stack.Screen name="note" options={{ title: 'Notatka' }} />
      
      {/* 4. SEKCJA WSPARCIE - EKRANY SZCZEGÓŁOWE */}
      <Stack.Screen name="wsparcie-24" options={{ title: 'Wsparcie 24h' }} />
      <Stack.Screen name="wsparcie-desiderata" options={{ title: 'Desiderata' }} />
      <Stack.Screen name="wsparcie-halt" options={{ title: 'HALT' }} />
      <Stack.Screen name="wsparcie-kontakt" options={{ title: 'Kontakt' }} />
      <Stack.Screen name="wsparcie-modlitwa" options={{ title: 'Modlitwa' }} />
      <Stack.Screen name="wsparcie-siatka" options={{ title: 'Siatka wsparcia' }} />

      {/* 5. EKRAN STARTOWY (index.tsx w głównym folderze app, jeśli go masz) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}