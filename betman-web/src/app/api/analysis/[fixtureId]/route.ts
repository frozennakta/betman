import { NextResponse } from 'next/server';

const API_BASE = 'https://v3.football.api-sports.io';

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

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
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.response ?? [];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;

  const cached = cache.get(fixtureId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ success: true, ...cached.data, cached: true });
  }

  try {
    // 4개 엔드포인트 병렬 호출
    const [predictions, events, statistics, lineups] = await Promise.allSettled([
      apiFetch(`/predictions?fixture=${fixtureId}`),
      apiFetch(`/fixtures/events?fixture=${fixtureId}`),
      apiFetch(`/fixtures/statistics?fixture=${fixtureId}`),
      apiFetch(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);

    const pred = predictions.status === 'fulfilled' ? predictions.value : [];
    const evts = events.status === 'fulfilled' ? events.value : [];
    const stats = statistics.status === 'fulfilled' ? statistics.value : [];
    const lnps = lineups.status === 'fulfilled' ? lineups.value : [];

    const p = pred[0] ?? null;

    const prediction = p ? {
      homeWin: p.predictions?.percent?.home ?? null,
      draw:    p.predictions?.percent?.draw ?? null,
      awayWin: p.predictions?.percent?.away ?? null,
      advice:  p.predictions?.advice ?? null,
      winner:  p.predictions?.winner?.name ?? null,
    } : null;

    const home = p ? {
      name:         p.teams?.home?.name,
      form:         p.teams?.home?.last_5?.form ?? null,
      attack:       p.teams?.home?.last_5?.att ?? null,
      defense:      p.teams?.home?.last_5?.def ?? null,
      goalsFor:     p.teams?.home?.last_5?.goals?.for?.average ?? null,
      goalsAgainst: p.teams?.home?.last_5?.goals?.against?.average ?? null,
    } : null;

    const away = p ? {
      name:         p.teams?.away?.name,
      form:         p.teams?.away?.last_5?.form ?? null,
      attack:       p.teams?.away?.last_5?.att ?? null,
      defense:      p.teams?.away?.last_5?.def ?? null,
      goalsFor:     p.teams?.away?.last_5?.goals?.for?.average ?? null,
      goalsAgainst: p.teams?.away?.last_5?.goals?.against?.average ?? null,
    } : null;

    const comparison = p ? {
      form:    p.comparison?.form,
      attack:  p.comparison?.att,
      defense: p.comparison?.def,
      h2h:     p.comparison?.h2h,
      goals:   p.comparison?.goals,
      total:   p.comparison?.total,
    } : null;

    const h2h = (p?.h2h ?? []).slice(0, 5).map((m: any) => ({
      date:      m.fixture?.date?.slice(0, 10),
      homeTeam:  m.teams?.home?.name,
      awayTeam:  m.teams?.away?.name,
      homeGoals: m.goals?.home,
      awayGoals: m.goals?.away,
      status:    m.fixture?.status?.short,
    }));

    // 이벤트 (골, 카드, 교체)
    const eventList = evts.map((e: any) => ({
      minute:  e.time?.elapsed,
      extra:   e.time?.extra ?? null,
      teamId:  e.team?.id,
      team:    e.team?.name,
      player:  e.player?.name,
      assist:  e.assist?.name ?? null,
      type:    e.type,    // 'Goal' | 'Card' | 'subst' | 'Var'
      detail:  e.detail,  // 'Normal Goal' | 'Yellow Card' | 'Red Card' | 'Substitution 1' ...
    }));

    // 통계 (홈, 원정)
    const statList = stats.map((teamStat: any) => ({
      team: teamStat.team?.name,
      teamId: teamStat.team?.id,
      stats: (teamStat.statistics ?? []).map((s: any) => ({
        type:  s.type,
        value: s.value,
      })),
    }));

    // 라인업
    const lineupList = lnps.map((l: any) => ({
      team:      l.team?.name,
      teamId:    l.team?.id,
      formation: l.formation ?? null,
      startXI: (l.startXI ?? []).map((p: any) => ({
        number: p.player?.number,
        name:   p.player?.name,
        pos:    p.player?.pos,
        grid:   p.player?.grid,
      })),
      substitutes: (l.substitutes ?? []).map((p: any) => ({
        number: p.player?.number,
        name:   p.player?.name,
        pos:    p.player?.pos,
      })),
      coach: l.coach?.name ?? null,
    }));

    const season = p?.league?.season ?? null;
    const round  = p?.league?.round  ?? null;

    const result = { prediction, home, away, comparison, h2h, events: eventList, statistics: statList, lineups: lineupList, season, round };

    cache.set(fixtureId, { data: result, ts: Date.now() });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error(`[Analysis] ${fixtureId} 오류:`, err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
