import { getLocalDateKey, parseDateKey, type DateKey } from '@/constants/calendar';

export type JournalType = 'emotion' | 'craving' | 'gratitude';

export const BASE_EMOTIONS = [
  'Złość',
  'Wstyd',
  'Strach',
  'Smutek',
  'Poczucie winy',
  'Samotność',
  'Radość',
] as const;

export type BaseEmotion = (typeof BASE_EMOTIONS)[number];

export const EMOTION_DETAILS_BY_BASE: Record<BaseEmotion, readonly string[]> = {
  'Złość': ['Irytacja', 'Rozdrażnienie', 'Frustracja', 'Wściekłość', 'Furia'],
  'Wstyd': ['Niepewność', 'Zażenowanie', 'Poniżenie', 'Zakłopotanie', 'Upokorzenie'],
  'Strach': ['Niepokój', 'Trema', 'Przerażenie', 'Tchórzostwo', 'Panika'],
  'Smutek': ['Zmartwienie', 'Przygnębienie', 'Przykrość', 'Beznadzieja', 'Rozpacz'],
  'Poczucie winy': ['Żal', 'Wyrzuty sumienia', 'Skrucha', 'Zadręczanie się'],
  'Samotność': ['Porzucenie', 'Wyobcowanie', 'Opuszczenie'],
  'Radość': ['Zadowolenie', 'Rozbawienie', 'Entuzjazm', 'Wesołość', 'Euforia'],
};

export const EMOTION_DIRECTION_BY_BASE: Record<BaseEmotion, string> = {
  'Złość': 'Agresja',
  'Wstyd': 'Zaburzenie własnej wartości',
  'Strach': 'Lęk',
  'Smutek': 'Depresja',
  'Poczucie winy': 'Obwinianie',
  'Samotność': 'Izolacja',
  'Radość': 'Szczęście',
};

export const CRAVING_SYMPTOMS = [
  'Silna potrzeba (głód/przymus)',
  'Natrętne myśli',
  'Rozdrażnienie',
  'Niepokój',
  'Bezsenność',
  'Zmęczenie',
  'Trudność koncentracji',
  'Impulsywność',
  'Poczucie pustki',
  'Wstyd',
  'Izolowanie się',
  'Ukrywanie problemu',
  'Konflikty z bliskimi',
  'Obniżony nastrój',
  'Poczucie utraty kontroli',
  'Ryzykowne zachowania',
  'Zaniedbywanie obowiązków',
  'Napięcie somatyczne',
  'Poczucie beznadziei',
  'Myśli o nawrocie',
] as const;

export type CravingSummaryLevel = 'pod_kontrola' | 'ostrzegawczy' | 'wysokie_ryzyko' | 'kryzys';

export type JournalEntryBase = {
  id: string;
  type: JournalType;
  createdAt: string;
  updatedAt: string;
  dateKey: DateKey;
};

export type EmotionJournalEntry = JournalEntryBase & {
  type: 'emotion';
  baseEmotion: BaseEmotion;
  detailEmotion: string;
  directionHint: string;
  intensity: number;
  triggerNote: string;
  needNote: string;
  actionNote: string;
};

export type CravingJournalEntry = JournalEntryBase & {
  type: 'craving';
  urgeBefore: number;
  selectedSymptoms: string[];
  symptomsCount: number;
  summaryLevel: CravingSummaryLevel;
  preTriggerNote: string;
  plan15m: string;
  urgeAfter: number | null;
  whatHelped: string;
};

export type GratitudeJournalEntry = JournalEntryBase & {
  type: 'gratitude';
  item: string;
  note: string;
};

export type JournalEntry = EmotionJournalEntry | CravingJournalEntry | GratitudeJournalEntry;

export type CreateEmotionJournalInput = {
  dateKey?: DateKey;
  baseEmotion: BaseEmotion;
  detailEmotion: string;
  intensity: number;
  triggerNote: string;
  needNote: string;
  actionNote: string;
};

export type CreateCravingJournalInput = {
  dateKey?: DateKey;
  urgeBefore: number;
  selectedSymptoms: string[];
  preTriggerNote: string;
  plan15m: string;
  urgeAfter: number | null;
  whatHelped: string;
};

export type CreateGratitudeJournalInput = {
  dateKey?: DateKey;
  item: string;
  note: string;
};

export function getJournalDateKey(date = new Date()) {
  return getLocalDateKey(date);
}

export function parseJournalDateKey(dateKey: string) {
  return parseDateKey(dateKey);
}

export function clampIntensity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function getCravingSummaryLevel(symptomsCount: number): CravingSummaryLevel {
  if (symptomsCount <= 3) return 'pod_kontrola';
  if (symptomsCount <= 6) return 'ostrzegawczy';
  if (symptomsCount <= 10) return 'wysokie_ryzyko';
  return 'kryzys';
}

export function getCravingSummaryLabel(level: CravingSummaryLevel) {
  if (level === 'pod_kontrola') return '0-3: pod kontrolą';
  if (level === 'ostrzegawczy') return '4-6: poziom ostrzegawczy';
  if (level === 'wysokie_ryzyko') return '7-10: wysokie ryzyko';
  return '11-20: kryzys / przymus';
}
