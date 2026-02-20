import { getLocalDateKey } from '@/constants/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

const VISITED_TILES_STORAGE_KEY = '@visited_tiles_v1';

type VisitedTilesStore = {
  dateKey: string;
  routes: string[];
};

function toVisitedSet(rawRoutes: unknown): Set<string> {
  if (!Array.isArray(rawRoutes)) return new Set<string>();
  return new Set(rawRoutes.filter((value): value is string => typeof value === 'string' && value.length > 0));
}

export function useVisitedTiles() {
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(new Set<string>());

  const loadVisited = useCallback(async () => {
    const todayKey = getLocalDateKey();
    const raw = await AsyncStorage.getItem(VISITED_TILES_STORAGE_KEY);
    if (!raw) {
      setVisitedRoutes(new Set<string>());
      return;
    }

    try {
      const parsed = JSON.parse(raw) as VisitedTilesStore;
      if (!parsed || parsed.dateKey !== todayKey) {
        setVisitedRoutes(new Set<string>());
        return;
      }
      setVisitedRoutes(toVisitedSet(parsed.routes));
    } catch {
      setVisitedRoutes(new Set<string>());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadVisited();
    }, [loadVisited])
  );

  const markVisited = useCallback(async (route: string) => {
    if (!route || route.length === 0) return;
    const todayKey = getLocalDateKey();

    setVisitedRoutes((prev) => {
      const next = new Set(prev);
      next.add(route);
      return next;
    });

    try {
      const raw = await AsyncStorage.getItem(VISITED_TILES_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as VisitedTilesStore) : null;
      const baseSet = parsed && parsed.dateKey === todayKey ? toVisitedSet(parsed.routes) : new Set<string>();
      baseSet.add(route);
      const payload: VisitedTilesStore = { dateKey: todayKey, routes: Array.from(baseSet) };
      await AsyncStorage.setItem(VISITED_TILES_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      const payload: VisitedTilesStore = { dateKey: todayKey, routes: [route] };
      await AsyncStorage.setItem(VISITED_TILES_STORAGE_KEY, JSON.stringify(payload));
    }
  }, []);

  const isVisited = useCallback((route: string) => visitedRoutes.has(route), [visitedRoutes]);

  return { isVisited, markVisited };
}
