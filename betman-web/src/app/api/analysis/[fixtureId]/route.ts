import { NextResponse } from 'next/server';
import { readCache, writeCache } from '@/lib/apiCache';

const API_BASE = 'https://v3.football.api-sports.io';

// 인메모리 캐시 (파일 캐시와 병행: 서버 재시작 없을 때 빠른 응답용)
const memCache = new Map<string, { data: any; ts: number; ttl: number }>();

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
  req: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  const url = new URL(req.url);
  const homeTeamIdParam = url.searchParams.get('homeTeamId');
  const awayTeamIdParam = url.searchParams.get('awayTeamId');
  const statusParam = url.searchParams.get('status') ?? 'NS';

  // 1) 인메모리 캐시
  const mem = memCache.get(fixtureId);
  if (mem && Date.now() - mem.ts < mem.ttl) {
    return NextResponse.json({ success: true, ...mem.data, cached: true });
  }
  // 2) 파일 캐시 (서버 재시작 후에도 유지)
  const disk = readCache(`analysis_${fixtureId}`);
  if (disk) {
    memCache.set(fixtureId, disk);
    return NextResponse.json({ success: true, ...disk.data, cached: true });
  }

  try {
    let homeTeamId: number | null = homeTeamIdParam ? Number(homeTeamIdParam) : null;
    let awayTeamId: number | null = awayTeamIdParam ? Number(awayTeamIdParam) : null;
    let shortStatus: string = statusParam;

    // teamId가 없을 때만 fixture 기본정보 호출 (1 call 절약)
    if (!homeTeamId || !awayTeamId) {
      const fixtureRaw = await apiFetch(`/fixtures?id=${fixtureId}`);
      const fi = fixtureRaw[0] ?? null;
      homeTeamId = fi?.teams?.home?.id ?? null;
      awayTeamId = fi?.teams?.away?.id ?? null;
      shortStatus = fi?.fixture?.status?.short ?? 'NS';
    }

    const isFinishedOrLive = !['NS', 'TBD', 'CANC', 'PST', 'ABD', 'AWD', 'WO'].includes(shortStatus);

    // Step 2: 상태에 따라 필요한 데이터만 병렬 호출
    // 예정(NS): predictions + team fixtures (3 calls)
    // 진행/종료: events + statistics + lineups + team fixtures (5 calls)
    // 🔧 유료 플랜 전환 시 아래 두 줄을 &season=2024 → &last=20 으로 변경
    const fetchMap: Record<string, Promise<any>> = {
      teamHome: homeTeamId ? apiFetch(`/fixtures?team=${homeTeamId}&season=2024`) : Promise.resolve([]),
      teamAway: awayTeamId ? apiFetch(`/fixtures?team=${awayTeamId}&season=2024`) : Promise.resolve([]),
    };

    if (isFinishedOrLive) {
      fetchMap.events     = apiFetch(`/fixtures/events?fixture=${fixtureId}`);
      fetchMap.statistics = apiFetch(`/fixtures/statistics?fixture=${fixtureId}`);
      fetchMap.lineups    = apiFetch(`/fixtures/lineups?fixture=${fixtureId}`);
      fetchMap.predictions = apiFetch(`/predictions?fixture=${fixtureId}`);
      fetchMap.injuries   = apiFetch(`/injuries?fixture=${fixtureId}`);
      fetchMap.players    = apiFetch(`/fixtures/players?fixture=${fixtureId}`);
      fetchMap.odds       = apiFetch(`/odds?fixture=${fixtureId}`); // 전체 북메이커
    } else {
      fetchMap.predictions = apiFetch(`/predictions?fixture=${fixtureId}`);
      fetchMap.injuries   = apiFetch(`/injuries?fixture=${fixtureId}`);
      fetchMap.odds       = apiFetch(`/odds?fixture=${fixtureId}`); // 전체 북메이커
    }

    const keys = Object.keys(fetchMap);
    const settled = await Promise.allSettled(keys.map(k => fetchMap[k]));
    const results: Record<string, any[]> = {};
    const debugInfo: Record<string, any> = {};
    keys.forEach((k, i) => {
      const s = settled[i];
      if (s.status === 'fulfilled') {
        results[k] = s.value;
        debugInfo[k] = { ok: true, count: Array.isArray(s.value) ? s.value.length : s.value };
      } else {
        results[k] = [];
        debugInfo[k] = { ok: false, error: s.reason?.message ?? String(s.reason) };
      }
    });
    console.log(`[Analysis] ${fixtureId} homeId=${homeTeamId} awayId=${awayTeamId}`, JSON.stringify(debugInfo));

    const pred    = results.predictions ?? [];
    const evts    = results.events      ?? [];
    const stats   = results.statistics  ?? [];
    const lnps    = results.lineups     ?? [];
    const injRaw  = results.injuries    ?? [];
    const plRaw   = results.players     ?? [];
    const oddsRaw = results.odds        ?? [];

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
        id:     pl.player?.id,
        number: pl.player?.number,
        name:   pl.player?.name,
        pos:    pl.player?.pos,
        grid:   pl.player?.grid,
      })),
      substitutes: (l.substitutes ?? []).map((pl: any) => ({
        id:     pl.player?.id,
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
      // 종료된 경기만 필터 → 최신순 정렬 → 최근 20경기
      const finished = fixtures.filter((f: any) => {
        const st = f.fixture?.status?.short;
        return st === 'FT' || st === 'AET' || st === 'PEN';
      });
      return finished
        .sort((a: any, b: any) => new Date(b.fixture?.date).getTime() - new Date(a.fixture?.date).getTime())
        .slice(0, 20)
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

    const leagueId = p?.league?.id ?? null;

    const playerRatings: Record<number, string> = {};
    const playerStatsMap: Record<number, any> = {};
    if (plRaw.length > 0) {
      for (const team of plRaw) {
        for (const pStat of (team.players ?? [])) {
          const s = pStat.statistics?.[0];
          if (!s) continue;
          const rating = s.games?.rating;
          if (rating) playerRatings[pStat.player.id] = rating;
          playerStatsMap[pStat.player.id] = {
            name:           pStat.player?.name ?? null,
            rating:         s.games?.rating ?? null,
            minutesPlayed:  s.games?.minutes ?? null,
            goals:          s.goals?.total ?? null,
            assists:        s.goals?.assists ?? null,
            shots:          s.shots?.total ?? null,
            shotsOnTarget:  s.shots?.on ?? null,
            passes:         s.passes?.total ?? null,
            passAccuracy:   s.passes?.accuracy ?? null,
            keyPasses:      s.passes?.key ?? null,
            dribbles:       s.dribbles?.attempts ?? null,
            tackles:        s.tackles?.total ?? null,
            duelsWon:       s.duels?.won ?? null,
            foulsDrawn:     s.fouls?.drawn ?? null,
            foulsCommitted: s.fouls?.committed ?? null,
            yellowCards:    s.cards?.yellow ?? null,
            redCards:       s.cards?.red ?? null,
            saves:          s.goalkeeper?.saves ?? null,
            team:           team.team?.name ?? null,
            teamId:         team.team?.id ?? null,
          };
        }
      }
    }

    // 멀티 북메이커 배당 (Match Winner + Over/Under + BTTS)
    let preMatchOdds = null;
    const allBookmakerOdds: { bookmaker: string; home: string | null; draw: string | null; away: string | null }[] = [];
    const oddsOverUnder: { bookmaker: string; over: string | null; under: string | null }[] = [];
    const oddsBTTS: { bookmaker: string; yes: string | null; no: string | null }[] = [];
    if (oddsRaw.length > 0) {
      for (const item of oddsRaw) {
        for (const bm of (item.bookmakers ?? [])) {
          const bets = bm.bets ?? [];
          const matchWinner = bets.find((b: any) => b.id === 1 || b.name === 'Match Winner');
          const ouBet      = bets.find((b: any) => b.id === 5 || b.name === 'Goals Over/Under');
          const bttsBet    = bets.find((b: any) => b.id === 8 || b.name === 'Both Teams Score');

          if (matchWinner) {
            const vals = matchWinner.values ?? [];
            allBookmakerOdds.push({
              bookmaker: bm.name,
              home: vals.find((v: any) => v.value === 'Home')?.odd ?? null,
              draw: vals.find((v: any) => v.value === 'Draw')?.odd ?? null,
              away: vals.find((v: any) => v.value === 'Away')?.odd ?? null,
            });
            if (!preMatchOdds) {
              preMatchOdds = matchWinner.values.map((v: any) => ({ value: v.value, odd: v.odd }));
            }
          }
          if (ouBet) {
            const vals = ouBet.values ?? [];
            oddsOverUnder.push({
              bookmaker: bm.name,
              over:  vals.find((v: any) => v.value === 'Over 2.5')?.odd  ?? null,
              under: vals.find((v: any) => v.value === 'Under 2.5')?.odd ?? null,
            });
          }
          if (bttsBet) {
            const vals = bttsBet.values ?? [];
            oddsBTTS.push({
              bookmaker: bm.name,
              yes: vals.find((v: any) => v.value === 'Yes')?.odd ?? null,
              no:  vals.find((v: any) => v.value === 'No')?.odd  ?? null,
            });
          }
        }
      }
    }

    // xG 데이터 추출 (statistics에서)
    const xgHome = results.statistics?.[0]?.stats?.find((s: any) => s.type === 'expected_goals')?.value ?? null;
    const xgAway = results.statistics?.[1]?.stats?.find((s: any) => s.type === 'expected_goals')?.value ?? null;

    const ttl = shortStatus === 'FT' || shortStatus === 'AET' || shortStatus === 'PEN'
      ? 24 * 60 * 60 * 1000  // 종료 경기: 24시간
      : 5 * 60 * 1000;        // 예정/진행: 5분

    const data = { prediction, home, away, comparison, h2h, events: eventList, statistics: statList, lineups: lineupList, injuries: injuryList, season, round, leagueId, homeLast20, awayLast20, playerRatings, playerStatsMap, preMatchOdds, allBookmakerOdds, oddsOverUnder, oddsBTTS, xgHome, xgAway };
    memCache.set(fixtureId, { data, ts: Date.now(), ttl });
    writeCache(`analysis_${fixtureId}`, data, ttl);
    return NextResponse.json({ success: true, ...data, _debug: debugInfo });
  } catch (err: any) {
    console.error(`[Analysis] ${fixtureId} 오류:`, err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
