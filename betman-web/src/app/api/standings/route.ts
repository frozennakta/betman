import { NextResponse } from 'next/server';
import { readCache, writeCache } from '@/lib/apiCache';

const API_BASE = 'https://v3.football.api-sports.io';
const memCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 (순위는 자주 안바뀜)

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

  const mem = memCache.get(cacheKey);
  if (mem && Date.now() - mem.ts < CACHE_TTL) {
    return NextResponse.json({ success: true, ...mem.data, cached: true });
  }
  const disk = readCache(`standings_${cacheKey}`);
  if (disk) {
    memCache.set(cacheKey, { data: disk.data, ts: disk.ts });
    return NextResponse.json({ success: true, ...disk.data, cached: true });
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
    memCache.set(cacheKey, { data, ts: Date.now() });
    writeCache(`standings_${cacheKey}`, data, CACHE_TTL);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Standings] 오류:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
