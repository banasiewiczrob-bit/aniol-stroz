export type CommunityGroup = {
  id: string;
  title: string;
  description: string;
};

export const DISCORD_INVITE_URL =
  process.env.EXPO_PUBLIC_DISCORD_INVITE_URL ?? 'https://discord.gg/UvTquwcRcX';

// ID kanału #pogaduchy na Discordzie (nie jest sekretem, widoczne w linku do kanału).
export const DISCORD_POGADUCHY_CHANNEL_ID =
  process.env.EXPO_PUBLIC_DISCORD_POGADUCHY_CHANNEL_ID ?? '1548418131939164281';

export const COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'codziennosc',
    title: 'Codzienność',
    description: 'Małe kroki, nawyki i zwykłe sprawy dnia codziennego.',
  },
  {
    id: 'kryzys',
    title: 'Kryzys',
    description: 'Bezpieczna przestrzeń na trudne momenty i szybkie wsparcie.',
  },
  {
    id: 'sukcesy',
    title: 'Sukcesy',
    description: 'Dzielimy się tym, co pomaga, i wzmacniamy motywację.',
  },
  {
    id: 'pytania',
    title: 'Pytania',
    description: 'Pytania o aplikację, zdrowienie i codzienną praktykę.',
  },
];
