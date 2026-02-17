export type CommunityGroup = {
  id: string;
  title: string;
  description: string;
};

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
    description: 'Dzielimy się postępami i wzmacniamy motywację.',
  },
  {
    id: 'pytania',
    title: 'Pytania',
    description: 'Pytania o aplikację, zdrowienie i codzienną praktykę.',
  },
];
