import { NextResponse } from 'next/server';
import { fetchTodayFixtures, fetchLiveFixtures, LiveMatch } from '@/lib/liveScore';
import { readCache } from '@/lib/apiCache';

const store = (global as any).betmanStore || {
  games: [],
  lastUpdated: 0,
  todayFixtures: [] as LiveMatch[],
  oddsMap: {} as Record<number, { home: string, draw: string, away: string }>,
  initialized: false,   // 첫 번째 liveWorker 실행 완료 여부
};
(global as any).betmanStore = store;

let workersStarted = false;

function normalizeStatus(status: string): string {
  if (status === 'NS') return 'PENDING';
  if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'AWD', 'WO'].includes(status)) return 'FT';
  return status;
}

function normalizeGame(match: LiveMatch, index: number) {
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul', hour12: false,
  }).format(new Date(match.date));
  
  let odds = store.oddsMap[match.fixtureId];
  if (!odds) {
    const cache = readCache(`analysis_${match.fixtureId}`);
    const preOdds = cache?.data?.preMatchOdds;
    if (preOdds) {
      odds = {
        home: preOdds.find((o:any)=>o.value==='Home')?.odd ?? null,
        draw: preOdds.find((o:any)=>o.value==='Draw')?.odd ?? null,
        away: preOdds.find((o:any)=>o.value==='Away')?.odd ?? null,
      };
      store.oddsMap[match.fixtureId] = odds;
    }
  }
  
  return {
    id: `fixture_${match.fixtureId}`,
    matchNo: String(index + 1).padStart(2, '0'),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    category: 'Football',
    matchTime: time,
    liveStatus: normalizeStatus(match.status),
    rawStatus: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    elapsed: match.elapsedTime,
    homeOdds: odds?.home ?? null,
    drawOdds: odds?.draw ?? null,
    awayOdds: odds?.away ?? null,
    date: match.date,
    venue: match.venue ?? null,
    referee: match.referee ?? null,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
  };
}

function merge(today: LiveMatch[], live: LiveMatch[]): LiveMatch[] {
  const liveMap = new Map(live.map(m => [m.fixtureId, m]));
  const merged = today.map(m => liveMap.get(m.fixtureId) ?? m);
  const todayIds = new Set(today.map(m => m.fixtureId));
  const extra = live.filter(m => !todayIds.has(m.fixtureId));
  return [...merged, ...extra];
}

async function fetchTodayOdds() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return;
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  try {
    const res = await fetch(`https://v3.football.api-sports.io/odds?date=${d}&bookmaker=8`, {
      headers: { 'x-apisports-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' }
    });
    const json = await res.json();
    if (json?.response) {
      json.response.forEach((item: any) => {
        const fixId = item.fixture?.id;
        const bm = item.bookmakers?.[0];
        const matchWinner = bm?.bets?.find((b:any) => b.id === 1 || b.name === 'Match Winner');
        if (fixId && matchWinner) {
          store.oddsMap[fixId] = {
            home: matchWinner.values.find((v:any)=>v.value==='Home')?.odd ?? null,
            draw: matchWinner.values.find((v:any)=>v.value==='Draw')?.odd ?? null,
            away: matchWinner.values.find((v:any)=>v.value==='Away')?.odd ?? null,
          };
        }
      });
      console.log(`[Odds] 오늘치 배당 갱신 완료: ${Object.keys(store.oddsMap).length}건`);
    }
  } catch (e) {
    console.error('❌ [Odds] 오류:', e);
  }
}

function startWorkers() {
  if (workersStarted) return;
  workersStarted = true;

  // ── Worker 1: 전체 경기 목록 및 배당 — 성공 시 8시간 간격 ──
  const todayWorker = async () => {
    while (true) {
      let count = 0;
      try {
        store.todayFixtures = await fetchTodayFixtures();
        count = store.todayFixtures.length;
        console.log(`📅 [Today] ${count}경기 갱신`);
        if (count > 0) await fetchTodayOdds(); // 배당 갱신 추가
      } catch (e) {
        console.error('❌ [Today] / [Odds] 오류:', e);
      }
      // 0경기면 API 실패 가능성 → 2분 후 재시도, 성공하면 4시간 대기 (배당 변동 캐치)
      const delay = count > 0 ? 4 * 60 * 60 * 1000 : 2 * 60 * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  };

  // ── Worker 2: 라이브 스코어 — 20분마다 ────────────────────────────────
  const liveWorker = async () => {
    // todayWorker가 첫 번째 API 응답을 받을 때까지 대기
    await new Promise(r => setTimeout(r, 12000));
    while (true) {
      try {
        const live = await fetchLiveFixtures();
        const merged = merge(store.todayFixtures, live);
        store.games = merged.map(normalizeGame);
        store.lastUpdated = Date.now();
        console.log(`⚡ [Live] 라이브 ${live.length}개 · 총 ${store.games.length}경기`);
      } catch (e) {
        console.error('❌ [Live] 오류:', e);
      }
      // 성공/실패 모두 initialized = true (빈 배열이어도 로딩 화면 탈출)
      store.initialized = true;
      await new Promise(r => setTimeout(r, 20 * 60 * 1000));
    }
  };

  todayWorker();
  liveWorker();
}

startWorkers();

export async function GET() {
  // 첫 번째 liveWorker 실행 전 → 로딩 화면
  if (!store.initialized) {
    return NextResponse.json({
      success: true,
      games: [],
      status: 'LOADING_INITIAL',
      message: 'Loading initial data. Please refresh shortly.',
    });
  }
  return NextResponse.json({
    success: true,
    games: store.games,
    lastUpdated: store.lastUpdated,
    status: 'READY',
  });
}
