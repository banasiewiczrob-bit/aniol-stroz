import { DISCORD_POGADUCHY_CHANNEL_ID } from '@/constants/community';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

export type AktywnoscKanaluDiscord = {
  channelId: string;
  lastMessageId: string;
  lastMessageAt: string;
};

export async function pobierzAktywnoscKanaluDiscord(): Promise<AktywnoscKanaluDiscord | null> {
  if (!DISCORD_POGADUCHY_CHANNEL_ID) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/discord_channel_activity?select=channel_id,last_message_id,last_message_at&channel_id=eq.${DISCORD_POGADUCHY_CHANNEL_ID}&limit=1`,
    { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` } }
  );

  if (!response.ok) {
    throw new Error((await response.text()) || 'Nie udało się pobrać aktywności kanału Discord.');
  }

  const rows = (await response.json()) as Array<{
    channel_id?: string;
    last_message_id?: string;
    last_message_at?: string;
  }>;
  const row = rows[0];
  if (!row?.channel_id || !row.last_message_id || !row.last_message_at) return null;

  return { channelId: row.channel_id, lastMessageId: row.last_message_id, lastMessageAt: row.last_message_at };
}
