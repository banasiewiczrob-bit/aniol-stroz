const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dqblnmimbqsmmzjzzrjr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable__gWdeZShGG4w6JwKEd74yw_ozTnv2Gm';

const WSPOLNA_BAZA_DOSWIADCZEN_URL = `${SUPABASE_URL}/rest/v1/wspolna_baza_doswiadczen`;

type WspolnySposobWiersz = {
  id?: string;
  tresc?: string;
  opublikowano_o?: string | null;
  dodano_o?: string | null;
};

export type WspolnySposob = {
  id: string;
  tresc: string;
  dodanoO: string | null;
};

export async function pobierzWspolneSposoby(limit = 12): Promise<WspolnySposob[]> {
  const response = await fetch(
    `${WSPOLNA_BAZA_DOSWIADCZEN_URL}?select=id,tresc,opublikowano_o,dodano_o&order=dodano_o.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'Nie udało się pobrać wpisów ze wspólnej bazy doświadczeń.');
  }

  const rows = (await response.json()) as WspolnySposobWiersz[];

  return rows.flatMap((row) => {
    if (typeof row.id !== 'string' || typeof row.tresc !== 'string') return [];

    const tresc = row.tresc.trim();
    if (!tresc) return [];

    return [
      {
        id: row.id,
        tresc,
        dodanoO:
          typeof row.opublikowano_o === 'string'
            ? row.opublikowano_o
            : typeof row.dodano_o === 'string'
              ? row.dodano_o
              : null,
      },
    ];
  });
}
