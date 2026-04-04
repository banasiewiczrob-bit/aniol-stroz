import { getLocalDateKey } from '@/constants/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const PUBLIC_STORAGE_BASE = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public`;
const REFLECTIONS_BUCKET = 'daily-reflections';
const REFLECTIONS_MANIFEST_PATH = 'manifests/daily-reflections.json';
const MANIFEST_CACHE_KEY = '@daily_reflections_manifest_cache_v1';
const FAVORITE_REFLECTION_IDS_KEY = '@daily_reflections_favorites_v1';

export type DailyReflection = {
  id: string;
  title: string;
  opening: string;
  reflection: string;
  question: string;
  smallStep: string;
  closing: string;
  monthDay: string | null;
  tags: string[];
  durationSec: number | null;
  active: boolean;
  audioPath: string | null;
  audioUrl: string | null;
};

type DailyReflectionsSource = 'remote' | 'cache' | 'fallback';

type DailyReflectionsLoadErrorCode =
  | 'manifest_missing'
  | 'access_denied'
  | 'http_error'
  | 'invalid_json'
  | 'invalid_manifest'
  | 'empty_manifest'
  | 'network_error'
  | 'unknown_error';

class DailyReflectionsLoadError extends Error {
  code: DailyReflectionsLoadErrorCode;
  status?: number;

  constructor(code: DailyReflectionsLoadErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'DailyReflectionsLoadError';
    this.code = code;
    this.status = status;
  }
}

type StorageErrorPayload = {
  code: string | null;
  message: string | null;
  rawText: string | null;
};

const FALLBACK_DAILY_REFLECTIONS: DailyReflection[] = [
  {
    id: 'fallback-reflection-today',
    title: 'Przyjmuję życie takim, jakie do mnie przyszło',
    opening: 'Dopiero wtedy mogę je naprawdę przeżyć.',
    reflection:
      'Dziś nie muszę udowadniać, że wszystko jest w porządku. Mogę tylko zobaczyć to, co jest prawdziwe. Przyjęcie życia nie ma być rezygnacją w stylu: "No dobra, niech już będzie". Ma być początkiem świadomego kontaktu. Kiedy przestaję się szarpać z faktami, odzyskuję przestrzeń na to, co mogę wybrać: mój krok, mój kierunek, moje wartości. Akceptuję to, co przyszło, nie po to, by w tym utknąć, lecz po to, by wreszcie zacząć żyć w prawdzie, a nie w walce z nią.',
    question: '',
    smallStep: 'Powiedz na głos: "Tak." Potem dodaj: "Dziś moim małym krokiem w prawdzie będzie..." i zrób to.',
    closing: '',
    monthDay: null,
    tags: [],
    durationSec: null,
    active: true,
    audioPath: null,
    audioUrl: null,
  },
];

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown) {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeMonthDay(value: unknown) {
  const raw = readOptionalText(value);
  if (!raw) return null;
  return /^\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(readText).filter(Boolean);
}

function resolveAudioUrl(audioPath: string | null) {
  if (!audioPath) return null;
  if (/^https?:\/\//i.test(audioPath)) return audioPath;
  const normalized = audioPath.replace(/^\/+/, '');
  return `${PUBLIC_STORAGE_BASE}/${REFLECTIONS_BUCKET}/${normalized}`;
}

function parseReflectionEntry(value: unknown, index: number): DailyReflection | null {
  const row = asRecord(value);
  if (!row) return null;

  const title =
    readOptionalText(row.title) ??
    readOptionalText(row.name) ??
    readOptionalText(row.heading) ??
    readOptionalText(row.label) ??
    '';
  const opening = readOptionalText(row.opening) ?? readOptionalText(row.intro) ?? '';
  const reflection = readOptionalText(row.reflection) ?? readOptionalText(row.body) ?? readOptionalText(row.text) ?? '';
  const question = readOptionalText(row.question) ?? '';
  const smallStep = readOptionalText(row.smallStep) ?? readOptionalText(row.step) ?? readOptionalText(row.action) ?? '';
  const closing = readOptionalText(row.closing) ?? readOptionalText(row.outro) ?? '';
  const monthDay = normalizeMonthDay(row.monthDay) ?? normalizeMonthDay(row.date);
  const audioPath =
    readOptionalText(row.audioPath) ??
    readOptionalText(row.audio) ??
    readOptionalText(row.audioFile) ??
    readOptionalText(row.file) ??
    null;
  const active = row.active !== false && row.enabled !== false && row.published !== false;
  const durationSec = readOptionalNumber(row.durationSec) ?? readOptionalNumber(row.duration);
  const tags = normalizeTags(row.tags);

  if (!title && !opening && !reflection && !question && !smallStep && !closing && !audioPath) {
    return null;
  }

  const fallbackTitle = title;
  const slugId = slugify(fallbackTitle || `reflection-${index + 1}`);
  const id = readOptionalText(row.id) ?? monthDay ?? (slugId || `reflection-${index + 1}`);

  return {
    id,
    title: fallbackTitle,
    opening,
    reflection,
    question,
    smallStep,
    closing,
    monthDay,
    tags,
    durationSec,
    active,
    audioPath,
    audioUrl: resolveAudioUrl(audioPath),
  };
}

function parseManifest(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map(parseReflectionEntry).filter((item): item is DailyReflection => item !== null);
  }

  const row = asRecord(raw);
  if (!row) return [];

  const rawItems = [row.reflections, row.items, row.entries, row.data].find(Array.isArray) as unknown[] | undefined;
  if (!rawItems) return [];

  return rawItems.map(parseReflectionEntry).filter((item): item is DailyReflection => item !== null);
}

function getSelectableReflections(reflections: DailyReflection[]) {
  const active = reflections.filter((item) => item.active);
  const playable = active.filter((item) => item.audioUrl);
  return playable.length > 0 ? playable : active;
}

function normalizeFavoriteIds(raw: unknown) {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }

  return normalized;
}

function getStableDailyHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickReflectionForDate(reflections: DailyReflection[], dateKey: string) {
  const selectable = getSelectableReflections(reflections)
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id, 'pl'));
  if (selectable.length === 0) return null;

  const index = getStableDailyHash(dateKey) % selectable.length;
  return selectable[index] ?? null;
}

function formatStorageErrorDetails(payload: StorageErrorPayload) {
  if (payload.code && payload.message) {
    return `${payload.code}: ${payload.message}`;
  }
  if (payload.message) {
    return payload.message;
  }
  if (payload.rawText) {
    return payload.rawText;
  }
  return null;
}

async function readStorageErrorPayload(response: Response): Promise<StorageErrorPayload> {
  const rawText = (await response.text()).trim();
  if (!rawText) {
    return { code: null, message: null, rawText: null };
  }

  try {
    const parsed = JSON.parse(rawText) as unknown;
    const row = asRecord(parsed);
    if (!row) {
      return { code: null, message: null, rawText };
    }

    const code = readOptionalText(row.code);
    const message = readOptionalText(row.message);
    return { code, message, rawText };
  } catch {
    return { code: null, message: null, rawText };
  }
}

function createHttpError(status: number, payload: StorageErrorPayload) {
  const details = formatStorageErrorDetails(payload);
  const suffix = details ? ` Szczegóły: ${details}` : '';

  if (status === 404) {
    return new DailyReflectionsLoadError(
      'manifest_missing',
      `Nie znaleziono manifestu refleksji w Supabase (${REFLECTIONS_BUCKET}/${REFLECTIONS_MANIFEST_PATH}, HTTP 404).${suffix}`,
      status
    );
  }

  if (status === 401 || status === 403) {
    return new DailyReflectionsLoadError(
      'access_denied',
      `Brak dostępu do manifestu refleksji w Supabase (HTTP ${status}). Sprawdź publiczny bucket albo reguły dostępu.${suffix}`,
      status
    );
  }

  return new DailyReflectionsLoadError(
    'http_error',
    `Supabase zwrócił błąd HTTP ${status} przy pobieraniu manifestu refleksji.${suffix}`,
    status
  );
}

function wrapLoadError(error: unknown) {
  if (error instanceof DailyReflectionsLoadError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new DailyReflectionsLoadError(
      'invalid_json',
      `Manifest refleksji nie jest poprawnym JSON-em (${REFLECTIONS_BUCKET}/${REFLECTIONS_MANIFEST_PATH}).`
    );
  }

  if (error instanceof TypeError) {
    return new DailyReflectionsLoadError(
      'network_error',
      'Nie udało się połączyć z Supabase podczas pobierania manifestu refleksji. Sprawdź połączenie z internetem lub adres projektu.'
    );
  }

  if (error instanceof Error) {
    return new DailyReflectionsLoadError('unknown_error', error.message);
  }

  return new DailyReflectionsLoadError('unknown_error', 'Nieznany błąd podczas pobierania manifestu refleksji.');
}

async function readCachedManifest() {
  const raw = await AsyncStorage.getItem(MANIFEST_CACHE_KEY);
  if (!raw) return [];
  try {
    return parseManifest(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeCachedManifest(reflections: DailyReflection[]) {
  await AsyncStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify({ reflections }));
}

export async function loadDailyReflections(): Promise<{ reflections: DailyReflection[]; source: DailyReflectionsSource }> {
  const manifestUrl = `${PUBLIC_STORAGE_BASE}/${REFLECTIONS_BUCKET}/${REFLECTIONS_MANIFEST_PATH}`;

  try {
    const response = await fetch(manifestUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const payload = await readStorageErrorPayload(response);
      throw createHttpError(response.status, payload);
    }

    const raw = (await response.json()) as unknown;
    const reflections = parseManifest(raw);
    const row = asRecord(raw);
    const hasKnownCollection = Boolean(row && [row.reflections, row.items, row.entries, row.data].some(Array.isArray));

    if (Array.isArray(raw) && raw.length === 0) {
      throw new DailyReflectionsLoadError(
        'empty_manifest',
        `Manifest refleksji jest pusty (${REFLECTIONS_BUCKET}/${REFLECTIONS_MANIFEST_PATH}).`
      );
    }

    if (!Array.isArray(raw) && !hasKnownCollection) {
      throw new DailyReflectionsLoadError(
        'invalid_manifest',
        'Manifest refleksji ma nieprawidłowy format. Oczekuję tablicy albo obiektu z polem reflections/items/entries/data.'
      );
    }

    if (reflections.length === 0) {
      throw new DailyReflectionsLoadError(
        'empty_manifest',
        'Manifest refleksji został pobrany, ale nie zawiera żadnej aktywnej treści możliwej do odczytu.'
      );
    }

    await writeCachedManifest(reflections);
    return { reflections, source: 'remote' };
  } catch (error) {
    const cachedReflections = await readCachedManifest();
    if (cachedReflections.length > 0) {
      return { reflections: cachedReflections, source: 'cache' };
    }
    const wrappedError = wrapLoadError(error);
    console.warn('Nie udało się pobrać refleksji z Supabase. Uruchamiam lokalny fallback:', wrappedError.message);
    return { reflections: FALLBACK_DAILY_REFLECTIONS, source: 'fallback' };
  }
}

export async function getInitialDailyReflection(reflections: DailyReflection[]) {
  const dateKey = getLocalDateKey();
  return pickReflectionForDate(reflections, dateKey);
}

export function findDailyReflectionById(reflections: DailyReflection[], reflectionId: string | null | undefined) {
  const normalizedId = typeof reflectionId === 'string' ? reflectionId.trim() : '';
  if (!normalizedId) return null;
  return reflections.find((item) => item.id === normalizedId) ?? null;
}

export function listFavoriteDailyReflections(reflections: DailyReflection[], favoriteIds: string[]) {
  const normalizedIds = normalizeFavoriteIds(favoriteIds);
  const byId = new Map(reflections.map((item) => [item.id, item] as const));

  return normalizedIds
    .map((favoriteId) => byId.get(favoriteId) ?? null)
    .filter((item): item is DailyReflection => item !== null);
}

export async function loadFavoriteDailyReflectionIds() {
  const raw = await AsyncStorage.getItem(FAVORITE_REFLECTION_IDS_KEY);
  if (!raw) return [];

  try {
    return normalizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveFavoriteDailyReflectionIds(favoriteIds: string[]) {
  const normalized = normalizeFavoriteIds(favoriteIds);
  await AsyncStorage.setItem(FAVORITE_REFLECTION_IDS_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function toggleFavoriteDailyReflection(reflectionId: string) {
  const normalizedId = reflectionId.trim();
  if (!normalizedId) {
    return loadFavoriteDailyReflectionIds();
  }

  const current = await loadFavoriteDailyReflectionIds();
  const next = current.includes(normalizedId)
    ? current.filter((item) => item !== normalizedId)
    : [normalizedId, ...current];

  return saveFavoriteDailyReflectionIds(next);
}
