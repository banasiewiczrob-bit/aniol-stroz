// Deno Edge Function — wywoływana cyklicznie przez Supabase Cron (Dashboard → Cron Jobs, typ "Supabase Edge Function").
// Pobiera ostatnią wiadomość z kanału Discord #pogaduchy i zapisuje jej znacznik do bazy,
// żeby apka mogła tanio sprawdzać "czy jest coś nowego" bez własnego tokena bota.

const DISCORD_API_BASE = "https://discord.com/api/v10";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const channelId = Deno.env.get("DISCORD_POGADUCHY_CHANNEL_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!botToken || !channelId || !supabaseUrl || !serviceRoleKey) {
    console.error("discord-activity-check: brak wymaganych zmiennych środowiskowych");
    return new Response("Missing configuration", { status: 500 });
  }

  let discordResponse: Response;
  try {
    discordResponse = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages?limit=1`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        "User-Agent": "AniolStrozBot (https://aniol-stroz.app, 1.0)",
      },
    });
  } catch (e) {
    console.error("discord-activity-check: błąd sieci przy pobieraniu z Discord API", e);
    return new Response("Discord fetch failed", { status: 502 });
  }

  if (discordResponse.status === 429) {
    console.warn(`discord-activity-check: rate limit Discord, retry-after=${discordResponse.headers.get("Retry-After")}`);
    return new Response("Rate limited by Discord", { status: 429 });
  }

  if (!discordResponse.ok) {
    const errorBody = await discordResponse.text();
    console.error(`discord-activity-check: Discord API zwróciło ${discordResponse.status}: ${errorBody}`);
    // Nie nadpisujemy tabeli przy błędzie — ostatni znany stan zostaje, kolejny cykl crona spróbuje ponownie.
    return new Response(`Discord API error ${discordResponse.status}: ${errorBody}`, { status: 502 });
  }

  const messages = (await discordResponse.json()) as Array<{ id: string; timestamp: string }>;
  const latest = messages[0];
  if (!latest) {
    return new Response("No messages", { status: 200 });
  }

  const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/discord_channel_activity`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        channel_id: channelId,
        last_message_id: latest.id,
        last_message_at: latest.timestamp,
        checked_at: new Date().toISOString(),
      },
    ]),
  });

  if (!upsertResponse.ok) {
    console.error(`discord-activity-check: upsert do Supabase nie powiódł się: ${await upsertResponse.text()}`);
    return new Response("Upsert failed", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
