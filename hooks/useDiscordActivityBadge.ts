import { DISCORD_POGADUCHY_SEEN_STORAGE_KEY } from '@/constants/storageKeys';
import { pobierzAktywnoscKanaluDiscord } from '@/services/discordActivity';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

export function useDiscordActivityBadge() {
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const latestMessageIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const activity = await pobierzAktywnoscKanaluDiscord();
      if (!activity) {
        setHasNewMessage(false);
        return;
      }
      latestMessageIdRef.current = activity.lastMessageId;

      const seenId = await AsyncStorage.getItem(DISCORD_POGADUCHY_SEEN_STORAGE_KEY);
      if (!seenId) {
        // Pierwsza wizyta: zapisz punkt odniesienia, nie pokazuj badge dla wiadomości sprzed wdrożenia.
        await AsyncStorage.setItem(DISCORD_POGADUCHY_SEEN_STORAGE_KEY, activity.lastMessageId);
        setHasNewMessage(false);
        return;
      }
      setHasNewMessage(seenId !== activity.lastMessageId);
    } catch (e) {
      console.error('Błąd sprawdzania aktywności Discord:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const markSeen = useCallback(async () => {
    setHasNewMessage(false);
    if (latestMessageIdRef.current) {
      await AsyncStorage.setItem(DISCORD_POGADUCHY_SEEN_STORAGE_KEY, latestMessageIdRef.current);
    }
  }, []);

  return { hasNewMessage, markSeen };
}
