import { getLocalDateKey } from '@/constants/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

const VISITED_TILES_STORAGE_KEY = '@visited_tiles_v1';

type VisitedTilesStore = {
  dateKey: string;
  routes: string[];
};

type RuntimeVisitedCache = {
  dateKey: string;
  routes: Set<string>;
};

type Listener = () => void;

let runtimeCache: RuntimeVisitedCache = {
  dateKey: getLocalDateKey(),
  routes: new Set<string>(),
};
const listeners = new Set<Listener>();

function toVisitedSet(rawRoutes: unknown): Set<string> {
  if (!Array.isArray(rawRoutes)) return new Set<string>();
  const normalized = rawRoutes
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((route) => normalizeRoute(route))
    .filter((route): route is string => Boolean(route));
  return new Set(normalized);
}

function ensureRuntimeDate() {
  const todayKey = getLocalDateKey();
  if (runtimeCache.dateKey !== todayKey) {
    runtimeCache = { dateKey: todayKey, routes: new Set<string>() };
    listeners.forEach((listener) => listener());
  }
}

function normalizeRoute(route: string): string | null {
  if (!route || typeof route !== 'string') return null;
  const base = route.split('?')[0].trim();
  if (!base.startsWith('/')) return null;
  if (base.includes('(') || base.includes(')')) return null;
  if (base === '/centrum-wsparcia') return '/wsparcie';
  if (base === '/kontrakt-start') return '/kontrakt';
  if (base === '/licznik-start') return '/licznik';
  if (base === '/plan-dnia-start') return '/plan-dnia';
  if (base === '/teksty-start') return '/teksty-codzienne';
  if (base === '/obserwatorium-start') return '/obserwatorium';
  if (base === '/dzienniki') return '/obserwatorium';
  if (base === '/wsparcie-start') return '/wsparcie';
  if (base === '/dzienniki-start') return '/dzienniki';
  if (base === '/index') return '/';
  if (base.endsWith('/index')) {
    const next = base.slice(0, -6);
    return next.length > 0 ? next : '/';
  }
  return base;
}

async function persistRuntimeCache() {
  const payload: VisitedTilesStore = {
    dateKey: runtimeCache.dateKey,
    routes: Array.from(runtimeCache.routes),
  };
  await AsyncStorage.setItem(VISITED_TILES_STORAGE_KEY, JSON.stringify(payload));
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export async function markVisitedRoute(route: string) {
  const normalized = normalizeRoute(route);
  if (!normalized) return;
  ensureRuntimeDate();
  runtimeCache.routes.add(normalized);
  notifyListeners();
  try {
    await persistRuntimeCache();
  } catch {
    // ignore storage error; runtime cache still holds state for this session
  }
}

export function useVisitedTiles() {
  ensureRuntimeDate();
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(new Set(runtimeCache.routes));

  useEffect(() => {
    const syncFromRuntime = () => {
      ensureRuntimeDate();
      setVisitedRoutes(new Set(runtimeCache.routes));
    };
    listeners.add(syncFromRuntime);
    return () => {
      listeners.delete(syncFromRuntime);
    };
  }, []);

  const loadVisited = useCallback(async () => {
    const todayKey = getLocalDateKey();
    const raw = await AsyncStorage.getItem(VISITED_TILES_STORAGE_KEY);
    if (!raw) {
      runtimeCache = { dateKey: todayKey, routes: new Set<string>() };
      notifyListeners();
      setVisitedRoutes(new Set<string>());
      return;
    }

    try {
      const parsed = JSON.parse(raw) as VisitedTilesStore;
      if (!parsed || parsed.dateKey !== todayKey) {
        runtimeCache = { dateKey: todayKey, routes: new Set<string>() };
        notifyListeners();
        setVisitedRoutes(new Set<string>());
        return;
      }
      const nextRoutes = toVisitedSet(parsed.routes);
      runtimeCache = { dateKey: todayKey, routes: new Set(nextRoutes) };
      notifyListeners();
      setVisitedRoutes(new Set(nextRoutes));
    } catch {
      runtimeCache = { dateKey: todayKey, routes: new Set<string>() };
      notifyListeners();
      setVisitedRoutes(new Set<string>());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadVisited();
    }, [loadVisited])
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleMidnightReset = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime() + 50);

      timer = setTimeout(() => {
        runtimeCache = { dateKey: getLocalDateKey(), routes: new Set<string>() };
        notifyListeners();
        setVisitedRoutes(new Set<string>());
        void AsyncStorage.removeItem(VISITED_TILES_STORAGE_KEY);
        scheduleMidnightReset();
      }, delayMs);
    };

    scheduleMidnightReset();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const markVisited = useCallback(async (route: string) => {
    const normalized = normalizeRoute(route);
    if (!normalized) return;
    ensureRuntimeDate();
    runtimeCache.routes.add(normalized);
    notifyListeners();
    setVisitedRoutes(new Set(runtimeCache.routes));

    try {
      await persistRuntimeCache();
    } catch {
      // ignore storage error; runtime cache still holds state for this session
    }
  }, []);

  const isVisited = useCallback(
    (route: string) => {
      const normalized = normalizeRoute(route);
      if (!normalized) return false;
      return visitedRoutes.has(normalized);
    },
    [visitedRoutes]
  );

  return { isVisited, markVisited };
}
