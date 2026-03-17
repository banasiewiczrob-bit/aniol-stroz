const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

const EXPERIENCE_SUBMISSIONS_URL = `${SUPABASE_URL}/rest/v1/wpisy_doswiadczen`;

type SubmitExperienceInput = {
  content: string;
  contributorId: string;
  clientEntryId: string;
};

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

  const response = await fetch(EXPERIENCE_SUBMISSIONS_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      tresc: content,
      identyfikator_autora: contributorId,
      identyfikator_wpisu: clientEntryId,
      status: 'oczekujacy',
      zrodlo: 'aplikacja',
      anonimowy: true,
    }),
  });

  if (response.ok) return;

  const details = await response.text();
  throw new Error(details || 'Nie udało się przekazać wpisu do wspólnej bazy doświadczeń.');
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
  throw new Error(details || 'Nie udało się usunąć wpisu z bazy doświadczeń.');
}
