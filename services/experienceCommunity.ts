import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

const CONTRIBUTOR_ID_KEY = 'experience_contributor_id_v1';
const CONTRIBUTOR_PROGRESS_URL = `${SUPABASE_URL}/rest/v1/rpc/pobierz_postep_wkladu`;

export type ContributorBadgeCode =
  | 'pierwszy_wklad'
  | 'cicha_pomoc'
  | 'wspoltworca_bazy_doswiadczen'
  | 'staly_wklad'
  | 'tworze_przestrzen_wsparcia';

export type ContributorBadgeDefinition = {
  code: ContributorBadgeCode;
  title: string;
  description: string;
  threshold: number;
};

export type ContributorBadgeAward = {
  badgeCode: ContributorBadgeCode;
  awardedAt: string;
  approvedCountAtAward: number;
};

export type ContributorProgress = {
  approvedCount: number;
  pendingCount: number;
  badges: ContributorBadgeAward[];
};

type ContributorProgressResponse = {
  liczba_zaakceptowanych?: number;
  liczba_oczekujacych?: number;
  odznaki?: Array<{
    kod_odznaki?: string;
    przyznano_o?: string;
    liczba_zaakceptowanych_przy_przyznaniu?: number;
  }>;
} | null;

export const CONTRIBUTOR_BADGES: ContributorBadgeDefinition[] = [
  {
    code: 'pierwszy_wklad',
    title: 'Pierwszy wkład',
    description: 'Twój pierwszy wpis może dodać komuś otuchy w trudnym momencie.',
    threshold: 1,
  },
  {
    code: 'cicha_pomoc',
    title: 'Cicha pomoc',
    description: 'Twoje doświadczenia po cichu zaczynają wspierać innych.',
    threshold: 3,
  },
  {
    code: 'wspoltworca_bazy_doswiadczen',
    title: 'Współtwórca bazy doświadczeń',
    description: 'Razem z innymi tworzysz miejsce, które może naprawdę pomagać.',
    threshold: 5,
  },
  {
    code: 'staly_wklad',
    title: 'Stały wkład',
    description: 'Twoja regularność buduje dla innych coś naprawdę wartościowego.',
    threshold: 10,
  },
  {
    code: 'tworze_przestrzen_wsparcia',
    title: 'Tworzę przestrzeń wsparcia',
    description: 'Dzięki Tobie powstaje bezpieczna przestrzeń, która może dawać nadzieję.',
    threshold: 20,
  },
];

function isContributorBadgeCode(value: string): value is ContributorBadgeCode {
  return CONTRIBUTOR_BADGES.some((item) => item.code === value);
}

function parseContributorBadges(value: ContributorProgressResponse['odznaki']): ContributorBadgeAward[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (!item || typeof item.kod_odznaki !== 'string' || !isContributorBadgeCode(item.kod_odznaki)) {
        return [];
      }

      return [
        {
          badgeCode: item.kod_odznaki,
          awardedAt: typeof item.przyznano_o === 'string' ? item.przyznano_o : new Date().toISOString(),
          approvedCountAtAward:
            typeof item.liczba_zaakceptowanych_przy_przyznaniu === 'number'
              ? item.liczba_zaakceptowanych_przy_przyznaniu
              : 0,
        },
      ];
    })
    .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
}

function createContributorId() {
  return `contrib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateContributorId() {
  const current = await AsyncStorage.getItem(CONTRIBUTOR_ID_KEY);
  if (current) return current;

  const next = createContributorId();
  await AsyncStorage.setItem(CONTRIBUTOR_ID_KEY, next);
  return next;
}

export async function fetchContributorProgress(contributorId: string): Promise<ContributorProgress> {
  const normalizedContributorId = contributorId.trim();
  if (!normalizedContributorId) {
    return { approvedCount: 0, pendingCount: 0, badges: [] };
  }

  const response = await fetch(CONTRIBUTOR_PROGRESS_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_identyfikator_autora: normalizedContributorId,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'Nie udało się pobrać informacji o wkładzie.');
  }

  const payload = (await response.json()) as ContributorProgressResponse;

  return {
    approvedCount: typeof payload?.liczba_zaakceptowanych === 'number' ? payload.liczba_zaakceptowanych : 0,
    pendingCount: typeof payload?.liczba_oczekujacych === 'number' ? payload.liczba_oczekujacych : 0,
    badges: parseContributorBadges(payload?.odznaki),
  };
}

export function getContributionBadgeDefinition(code: ContributorBadgeCode) {
  return CONTRIBUTOR_BADGES.find((item) => item.code === code) ?? CONTRIBUTOR_BADGES[0];
}

export function getNextContributionBadge(approvedCount: number) {
  return CONTRIBUTOR_BADGES.find((item) => item.threshold > approvedCount) ?? null;
}

export function buildBadgeShareMessage(
  badgeCode: ContributorBadgeCode,
  approvedCount: number,
  variant: 'soft' | 'detailed',
) {
  const badge = getContributionBadgeDefinition(badgeCode);

  if (variant === 'soft') {
    return `Zdobyłem odznakę "${badge.title}". To dla mnie ważne, że moje doświadczenia mogą dodać komuś otuchy i stać się częścią bazy wsparcia w aplikacji Anioł Stróż.`;
  }

  return `Moje anonimowe wpisy zostały włączone do bazy doświadczeń w aplikacji Anioł Stróż. Mam już ${approvedCount} zaakceptowanych wpisów i odznakę "${badge.title}". Dobrze wiedzieć, że coś, co pomogło mnie, może dziś wesprzeć także kogoś innego.`;
}
