const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

export async function logScreenOpen(eventName: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_usage_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ event_name: eventName }),
    });
  } catch {
    // Cicho ignorujemy błędy sieci — czysto diagnostyczna, nieblokująca funkcja.
  }
}
