import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function isExpoGoAndroidRuntime() {
  if (Platform.OS !== 'android') return false;
  const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
  const executionEnvironment = (Constants as { executionEnvironment?: string | null }).executionEnvironment;
  return appOwnership === 'expo' || executionEnvironment === 'storeClient';
}

export function useAppIconBadge(count: number) {
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGoAndroidRuntime()) return;

    let active = true;
    const run = async () => {
      try {
        const Notifications = await import('expo-notifications');
        if (!active) return;
        const current = await Notifications.getPermissionsAsync();
        let status = current.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted') return;
        await Notifications.setBadgeCountAsync(Math.max(0, Math.round(count)));
      } catch {
        // Badge on app icon may be unavailable in this runtime (e.g. Expo Go / unsupported launcher).
      }
    };
    void run();

    return () => {
      active = false;
    };
  }, [count]);
}
