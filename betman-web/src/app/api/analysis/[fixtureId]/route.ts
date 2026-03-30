import { NextResponse } from 'next/server';

const API_BASE = 'https://v3.football.api-sports.io';

// 종료경기 24h, 진행/예정 5분 캐시
const cache = new Map<string, { data: any; ts: number; ttl: number }>();

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
  if (cached && Date.now() - cached.ts < cached.ttl) {
    return NextResponse.json({ success: true, ...cached.data, cached: true });
  }

  try {
    // Step 1: fixture 기본정보 (1 call) → 팀 ID + 경기 상태 파악
    const fixtureRaw = await apiFetch(`/fixtures?id=${fixtureId}`);
    const fi = fixtureRaw[0] ?? null;
    const homeTeamId: number | null = fi?.teams?.home?.id ?? null;
    const awayTeamId: number | null = fi?.teams?.away?.id ?? null;
    const shortStatus: string = fi?.fixture?.status?.short ?? 'NS';
    const isFinishedOrLive = !['NS', 'TBD', 'CANC', 'PST', 'ABD', 'AWD', 'WO'].includes(shortStatus);

    // Step 2: 상태에 따라 필요한 데이터만 병렬 호출
    // 예정(NS): predictions + team fixtures (3 calls)
    // 진행/종료: events + statistics + lineups + team fixtures (5 calls)
    const fetchMap: Record<string, Promise<any>> = {
      teamHome: homeTeamId ? apiFetch(`/fixtures?team=${homeTeamId}&last=20`) : Promise.resolve([]),
      teamAway: awayTeamId ? apiFetch(`/fixtures?team=${awayTeamId}&last=20`) : Promise.resolve([]),
    };

    if (isFinishedOrLive) {
      fetchMap.events     = apiFetch(`/fixtures/events?fixture=${fixtureId}`);
      fetchMap.statistics = apiFetch(`/fixtures/statistics?fixture=${fixtureId}`);
      fetchMap.lineups    = apiFetch(`/fixtures/lineups?fixture=${fixtureId}`);
      fetchMap.predictions = apiFetch(`/predictions?fixture=${fixtureId}`);
      fetchMap.injuries   = apiFetch(`/injuries?fixture=${fixtureId}`);
    } else {
      // 예정 경기: prediction만
      fetchMap.predictions = apiFetch(`/predictions?fixture=${fixtureId}`);
      fetchMap.injuries   = apiFetch(`/injuries?fixture=${fixtureId}`);
    }

    const keys = Object.keys(fetchMap);
    const settled = await Promise.allSettled(keys.map(k => fetchMap[k]));
    const results: Record<string, any[]> = {};
    keys.forEach((k, i) => {
      results[k] = settled[i].status === 'fulfilled' ? settled[i].value : [];
    });

    const pred    = results.predictions ?? [];
    const evts    = results.events      ?? [];
    const stats   = results.statistics  ?? [];
    const lnps    = results.lineups     ?? [];
    const injRaw  = results.injuries    ?? [];

    const p = (pred[0] ?? null) as any;

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

    const h2h = (p?.h2h ?? []).slice(0, 20).map((m: any) => ({
      date:      m.fixture?.date?.slice(0, 10),
      homeTeam:  m.teams?.home?.name,
      homeId:    m.teams?.home?.id,
      awayTeam:  m.teams?.away?.name,
      awayId:    m.teams?.away?.id,
      homeGoals: m.goals?.home,
      awayGoals: m.goals?.away,
      status:    m.fixture?.status?.short,
      league:    m.league?.name ?? null,
      season:    m.league?.season ?? null,
    }));

    const eventList = evts.map((e: any) => ({
      minute:  e.time?.elapsed,
      extra:   e.time?.extra ?? null,
      teamId:  e.team?.id,
      team:    e.team?.name,
      player:  e.player?.name,
      assist:  e.assist?.name ?? null,
      type:    e.type,
      detail:  e.detail,
    }));

    const statList = stats.map((teamStat: any) => ({
      team: teamStat.team?.name,
      teamId: teamStat.team?.id,
      stats: (teamStat.statistics ?? []).map((s: any) => ({
        type:  s.type,
        value: s.value,
      })),
    }));

    const lineupList = lnps.map((l: any) => ({
      team:      l.team?.name,
      teamId:    l.team?.id,
      formation: l.formation ?? null,
      startXI: (l.startXI ?? []).map((pl: any) => ({
        number: pl.player?.number,
        name:   pl.player?.name,
        pos:    pl.player?.pos,
        grid:   pl.player?.grid,
      })),
      substitutes: (l.substitutes ?? []).map((pl: any) => ({
        number: pl.player?.number,
        name:   pl.player?.name,
        pos:    pl.player?.pos,
      })),
      coach: l.coach?.name ?? null,
    }));

    const season = p?.league?.season ?? null;
    const round  = p?.league?.round  ?? null;

    const injuryList = injRaw.map((inj: any) => ({
      player: inj.player?.name ?? null,
      team:   inj.team?.name   ?? null,
      teamId: inj.team?.id     ?? null,
      type:   inj.player?.type   ?? null,
      reason: inj.player?.reason ?? null,
    }));

    function normalizeRecent(fixtures: any[], teamId: number | null) {
      return fixtures
        .sort((a: any, b: any) => new Date(b.fixture?.date).getTime() - new Date(a.fixture?.date).getTime())
        .map((f: any) => {
          const isHome = f.teams?.home?.id === teamId;
          const myGoals   = isHome ? f.goals?.home : f.goals?.away;
          const oppGoals  = isHome ? f.goals?.away : f.goals?.home;
          const oppTeam   = isHome ? f.teams?.away?.name : f.teams?.home?.name;
          const result =
            myGoals == null || oppGoals == null ? null
            : myGoals > oppGoals ? 'W'
            : myGoals === oppGoals ? 'D'
            : 'L';
          return {
            date:      f.fixture?.date?.slice(0, 10),
            league:    f.league?.name ?? null,
            homeTeam:  f.teams?.home?.name,
            awayTeam:  f.teams?.away?.name,
            homeGoals: f.goals?.home,
            awayGoals: f.goals?.away,
            myGoals,
            oppGoals,
            oppTeam,
            isHome,
            result,
            status: f.fixture?.status?.short,
          };
        });
    }

    const homeLast20 = normalizeRecent(results.teamHome ?? [], homeTeamId);
    const awayLast20 = normalizeRecent(results.teamAway ?? [], awayTeamId);

    const ttl = shortStatus === 'FT' || shortStatus === 'AET' || shortStatus === 'PEN'
      ? 24 * 60 * 60 * 1000  // 종료 경기: 24시간
      : 5 * 60 * 1000;        // 예정/진행: 5분

    const data = { prediction, home, away, comparison, h2h, events: eventList, statistics: statList, lineups: lineupList, injuries: injuryList, season, round, homeLast20, awayLast20 };
    cache.set(fixtureId, { data, ts: Date.now(), ttl });
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error(`[Analysis] ${fixtureId} 오류:`, err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
