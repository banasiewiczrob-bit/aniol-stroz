// Deno Edge Function — wywoływana bezpośrednio z panelu (Artifact), nie przez cron.
// Agreguje app_usage_events (sumy per ekran + rozbicie dzienne z ostatnich RANGE_DAYS dni).
// Dostęp chroniony własnym tokenem (?token=), niezależnym od standardowej warstwy Supabase.

const AUTH_TOKEN = Deno.env.get("ANALYTICS_DASHBOARD_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RANGE_DAYS = 90;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!AUTH_TOKEN || token !== AUTH_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("usage-analytics-summary: brak wymaganych zmiennych środowiskowych");
    return new Response("Missing configuration", { status: 500 });
  }

  const since = new Date(Date.now() - RANGE_DAYS * 86400000).toISOString();

  let res: Response;
  try {
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_usage_events?select=event_name,created_at&created_at=gte.${since}&limit=50000`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    );
  } catch (e) {
    console.error("usage-analytics-summary: błąd sieci przy zapytaniu do bazy", e);
    return new Response("Query failed", { status: 502 });
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`usage-analytics-summary: zapytanie zwróciło ${res.status}: ${errorBody}`);
    return new Response(`Query failed: ${errorBody}`, { status: 502 });
  }

  const rows = (await res.json()) as Array<{ event_name: string; created_at: string }>;

  const totals = new Map<string, number>();
  const daily = new Map<string, number>(); // klucz: `${event_name}|${YYYY-MM-DD}`

  for (const row of rows) {
    totals.set(row.event_name, (totals.get(row.event_name) ?? 0) + 1);
    const day = row.created_at.slice(0, 10);
    const key = `${row.event_name}|${day}`;
    daily.set(key, (daily.get(key) ?? 0) + 1);
  }

  const totalsOut = [...totals.entries()]
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count);

  const dailyOut = [...daily.entries()].map(([key, count]) => {
    const [event_name, date] = key.split("|");
    return { event_name, date, count };
  });

  return new Response(
    JSON.stringify({
      totals: totalsOut,
      daily: dailyOut,
      generatedAt: new Date().toISOString(),
      rangeDays: RANGE_DAYS,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
