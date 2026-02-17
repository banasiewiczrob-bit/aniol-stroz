import { Stack } from 'expo-router';
import { useDailyPlanNotifications } from '@/hooks/useDailyPlanNotifications';
import { runMigrationsIfNeeded } from '@/hooks/useDataMigrations';
import { useEffect, useState } from 'react';

export const Array = {
  // To wymusza na routerze zachowanie statyczne, co często naprawia ten błąd
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [migrationsReady, setMigrationsReady] = useState(false);
  useDailyPlanNotifications();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await runMigrationsIfNeeded();
      } finally {
        if (mounted) setMigrationsReady(true);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  if (!migrationsReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
