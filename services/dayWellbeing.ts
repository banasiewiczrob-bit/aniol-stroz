import type { DateKey } from '@/constants/calendar';
import type { CravingJournalEntry, EmotionJournalEntry, GratitudeJournalEntry } from '@/constants/journals';
import { DIFFICULT_EMOTIONS, toCravingSeverity } from '@/hooks/useIntelligentSupportEngine';

export type WellbeingTier = 'calm' | 'mixed' | 'tense';

export const WELLBEING_EMOJI: Record<WellbeingTier, string> = {
  calm: '🙂',
  mixed: '😐',
  tense: '😟',
};

export const WELLBEING_COLOR: Record<WellbeingTier, string> = {
  calm: '#69D26D',
  mixed: '#FFC966',
  tense: '#FF8B8B',
};

export const WELLBEING_MESSAGE: Record<WellbeingTier, string> = {
  calm: 'Ten dzień w Twoich zapisach wyglądał na spokojniejszy.',
  mixed: 'Ten dzień miał w Twoich zapisach trochę więcej napięcia.',
  tense: 'Ten dzień wyglądał na wymagający. Jeśli chcesz, zajrzyj do dziennika głodu/kryzysu albo do siatki wsparcia.',
};

type DayInputs = {
  hasDifficultEmotion: boolean;
  hasPositiveEmotion: boolean;
  maxCravingSymptoms: number;
  hasGratitude: boolean;
  haltCount: number;
};

function scoreDay(input: DayInputs): number {
  let score = 0;
  if (input.hasDifficultEmotion) score -= 1;
  if (input.hasPositiveEmotion && !input.hasDifficultEmotion) score += 1;

  const severity = toCravingSeverity(input.maxCravingSymptoms);
  if (severity === 'LOW') score -= 1;
  else if (severity === 'MED') score -= 2;
  else if (severity === 'HIGH' || severity === 'CRISIS') score -= 3;

  if (input.haltCount >= 2) score -= 1;
  if (input.hasGratitude) score += 1;

  return score;
}

function tierFromScore(score: number): WellbeingTier {
  if (score <= -2) return 'tense';
  if (score === -1) return 'mixed';
  return 'calm';
}

/**
 * Zwraca nastrój dnia wyłącznie dla dni z jakimkolwiek sygnałem (wpis dziennika
 * lub >=2 flagi HALT) — dzień bez danych po prostu nie trafia do mapy wynikowej,
 * żeby nie zmyślać samopoczucia tam, gdzie nic nie zostało zapisane.
 */
export function computeWellbeingByDate(
  emotionEntries: EmotionJournalEntry[],
  cravingEntries: CravingJournalEntry[],
  gratitudeEntries: GratitudeJournalEntry[],
  haltCountByDate: Map<DateKey, number>
): Map<DateKey, WellbeingTier> {
  const byDate = new Map<DateKey, DayInputs>();

  const ensure = (dateKey: DateKey) => {
    let entry = byDate.get(dateKey);
    if (!entry) {
      entry = {
        hasDifficultEmotion: false,
        hasPositiveEmotion: false,
        maxCravingSymptoms: 0,
        hasGratitude: false,
        haltCount: haltCountByDate.get(dateKey) ?? 0,
      };
      byDate.set(dateKey, entry);
    }
    return entry;
  };

  for (const entry of emotionEntries) {
    const day = ensure(entry.dateKey);
    if (DIFFICULT_EMOTIONS.has(entry.baseEmotion)) day.hasDifficultEmotion = true;
    else if (entry.baseEmotion === 'Radość') day.hasPositiveEmotion = true;
  }

  for (const entry of cravingEntries) {
    if (!entry.cravingReported) continue;
    const day = ensure(entry.dateKey);
    day.maxCravingSymptoms = Math.max(day.maxCravingSymptoms, entry.symptomsCount);
  }

  for (const entry of gratitudeEntries) {
    ensure(entry.dateKey).hasGratitude = true;
  }

  for (const [dateKey, count] of haltCountByDate.entries()) {
    if (count >= 2) ensure(dateKey);
  }

  const result = new Map<DateKey, WellbeingTier>();
  for (const [dateKey, inputs] of byDate.entries()) {
    result.set(dateKey, tierFromScore(scoreDay(inputs)));
  }
  return result;
}
