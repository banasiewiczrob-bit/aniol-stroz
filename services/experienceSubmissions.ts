const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

const PUBLISH_EXPERIENCE_SUBMISSION_URL = `${SUPABASE_URL}/rest/v1/rpc/opublikuj_wpis_uzytkownika_do_bazy`;

type SubmitExperienceInput = {
  content: string;
  contributorId: string;
  clientEntryId: string;
};

function normalizePostgrestError(details: string, fallbackMessage: string) {
  const trimmed = details.trim();
  const normalized = trimmed.toLowerCase();

  if (
    normalized.includes('opublikuj_wpis_uzytkownika_do_bazy') &&
    (normalized.includes('could not find the function') || normalized.includes('pgrst202') || normalized.includes('404'))
  ) {
    return 'Backend nie ma jeszcze wgranej funkcji publikacji. Wdróż migrację 20260409120000_publish_experience_entries_immediately.sql w Supabase.';
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as { message?: string; error?: string; details?: string; hint?: string };
      const combined = [parsed.message, parsed.error, parsed.details, parsed.hint].filter(Boolean).join(' ');
      if (combined.trim()) {
        return normalizePostgrestError(combined, fallbackMessage);
      }
    } catch {
      // ignore JSON parse issues and fall back below
    }
  }

  return trimmed || fallbackMessage;
}

export async function submitExperienceSubmission(input: SubmitExperienceInput) {
  const content = input.content.trim();
  const contributorId = input.contributorId.trim();
  const clientEntryId = input.clientEntryId.trim();
  if (!content) {
    throw new Error('Brak treści do wysłania.');
  }
  if (!contributorId) {
    throw new Error('Brak identyfikatora anonimowego wkładu.');
  }
  if (!clientEntryId) {
    throw new Error('Brak identyfikatora wpisu.');
  }

  const response = await fetch(PUBLISH_EXPERIENCE_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_tresc: content,
      p_identyfikator_autora: contributorId,
      p_identyfikator_wpisu: clientEntryId,
    }),
  });

  if (response.ok) return;

  const details = await response.text();
  throw new Error(
    normalizePostgrestError(details, 'Nie udało się opublikować wpisu we wspólnej bazie doświadczeń.'),
  );
}

const DELETE_EXPERIENCE_SUBMISSION_URL = `${SUPABASE_URL}/rest/v1/rpc/usun_wpis_uzytkownika_z_bazy`;

type DeleteExperienceInput = {
  contributorId: string;
  clientEntryId: string;
};

export async function deleteExperienceSubmission(input: DeleteExperienceInput) {
  const contributorId = input.contributorId.trim();
  const clientEntryId = input.clientEntryId.trim();

  if (!contributorId || !clientEntryId) {
    throw new Error('Brak danych do usunięcia wpisu z bazy doświadczeń.');
  }

  const response = await fetch(DELETE_EXPERIENCE_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_identyfikator_autora: contributorId,
      p_identyfikator_wpisu: clientEntryId,
    }),
  });

  if (response.ok) return;

  const details = await response.text();
  throw new Error(normalizePostgrestError(details, 'Nie udało się usunąć wpisu z bazy doświadczeń.'));
}
