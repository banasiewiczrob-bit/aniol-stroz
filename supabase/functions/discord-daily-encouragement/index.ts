// Deno Edge Function — wywoływana raz dziennie przez Supabase Cron (Dashboard → Cron Jobs).
// Publikuje na #pogaduchy krótki tytuł prawdziwej refleksji dziennej (reflections.json — wyciąg
// z docs/daily-reflections.json) + proste, bezpośrednie pytanie (wzorzec sprawdzony na grupie FB —
// tego typu pytania generują najwięcej odpowiedzi).
// Uwaga: reflections.json to bundlowana kopia na potrzeby edge function (bez dostępu do reszty
// repo w runtime) — jeśli źródłowe refleksje się zmienią, trzeba regenerować ten plik i redeployować.

import reflections from "./reflections.json" with { type: "json" };

const DISCORD_API_BASE = "https://discord.com/api/v10";

// Krótkie, bezpośrednie pytania — sprawdzony wzorzec z grupy FB, tam ten typ pytań
// generuje najwięcej odpowiedzi (proste, osobiste, bez wysiłku poznawczego).
const ENGAGEMENT_QUESTIONS = [
  "O czym dzisiaj myślicie?",
  "Co Was dziś poruszyło?",
  "Jaki sukces dziś odnieśliście, nawet najmniejszy?",
  "Co dziś sprawiło Wam radość?",
  "Za co dziś jesteście wdzięczni?",
  "Co dziś było dla Was trudne?",
  "Jakie jedno słowo opisuje Wasz dzisiejszy dzień?",
  "Co dziś dodało Wam sił?",
  "Czego dziś dowiedzieliście się o sobie?",
  "Co dziś zrobiliście dla siebie dobrego?",
  "Jak się dziś czujecie, szczerze?",
  "Co dziś chcielibyście komuś powiedzieć, ale jeszcze nie powiedzieliście?",
];

type Reflection = { id: string; title: string; smallStep: string };

function getDayOfYear(): number {
  return Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
}

function pickReflection(): Reflection {
  const list = reflections as Reflection[];
  return list[getDayOfYear() % list.length];
}

function pickQuestion(): string {
  return ENGAGEMENT_QUESTIONS[getDayOfYear() % ENGAGEMENT_QUESTIONS.length];
}

function buildMessage(reflection: Reflection, question: string): string {
  return `**${reflection.title}**\n\n${question}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const channelId = Deno.env.get("DISCORD_POGADUCHY_CHANNEL_ID");
  if (!botToken || !channelId) {
    console.error("discord-daily-encouragement: brak wymaganych zmiennych środowiskowych");
    return new Response("Missing configuration", { status: 500 });
  }

  const content = buildMessage(pickReflection(), pickQuestion());

  const discordResponse = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
      "User-Agent": "AniolStrozBot (https://aniol-stroz.app, 1.0)",
    },
    body: JSON.stringify({ content }),
  });

  if (!discordResponse.ok) {
    const errorBody = await discordResponse.text();
    console.error(`discord-daily-encouragement: Discord API zwróciło ${discordResponse.status}: ${errorBody}`);
    return new Response(`Discord API error ${discordResponse.status}: ${errorBody}`, { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
