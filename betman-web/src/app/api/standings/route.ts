import { NextResponse } from 'next/server';

const API_BASE = 'https://v3.football.api-sports.io';
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

async function apiFetch(path: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error('API_FOOTBALL_KEY 없음');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'x-apisports-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) throw new Error(JSON.stringify(json.errors));
  return json.response ?? [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') ?? '39';
  const season = searchParams.get('season') ?? new Date().getFullYear().toString();
  const cacheKey = `${league}_${season}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ success: true, ...cached.data, cached: true });
  }

  try {
    const raw = await apiFetch(`/standings?league=${league}&season=${season}`);
    const entry = raw[0] ?? null;

    const leagueInfo = entry ? {
      id:      entry.league?.id,
      name:    entry.league?.name,
      country: entry.league?.country,
      logo:    entry.league?.logo,
      season:  entry.league?.season,
    } : null;

    const standings: any[][] = (entry?.league?.standings ?? []).map((group: any[]) =>
      group.map((t: any) => ({
        rank:         t.rank,
        teamId:       t.team?.id,
        team:         t.team?.name,
        logo:         t.team?.logo,
        played:       t.all?.played,
        win:          t.all?.win,
        draw:         t.all?.draw,
        lose:         t.all?.lose,
        goalsFor:     t.all?.goals?.for,
        goalsAgainst: t.all?.goals?.against,
        goalsDiff:    t.goalsDiff,
        points:       t.points,
        form:         t.form,
        description:  t.description ?? null,
      }))
    );

    const data = { leagueInfo, standings };
    cache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Standings] 오류:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
