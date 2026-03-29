import { NextResponse } from 'next/server';
import { fetchTodayFixtures, fetchLiveFixtures, LiveMatch } from '@/lib/liveScore';

const store = (global as any).betmanStore || {
  games: [],
  lastUpdated: 0,
  todayFixtures: [] as LiveMatch[],
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
  return {
    id: `fixture_${match.fixtureId}`,
    matchNo: String(index + 1).padStart(2, '0'),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    category: '축구',
    matchTime: time,
    liveStatus: normalizeStatus(match.status),
    rawStatus: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    elapsed: match.elapsedTime,
    homeOdds: null,
    drawOdds: null,
    awayOdds: null,
    date: match.date,
    venue: match.venue ?? null,
    referee: match.referee ?? null,
  };
}

function merge(today: LiveMatch[], live: LiveMatch[]): LiveMatch[] {
  const liveMap = new Map(live.map(m => [m.fixtureId, m]));
  const merged = today.map(m => liveMap.get(m.fixtureId) ?? m);
  const todayIds = new Set(today.map(m => m.fixtureId));
  const extra = live.filter(m => !todayIds.has(m.fixtureId));
  return [...merged, ...extra];
}

function startWorkers() {
  if (workersStarted) return;
  workersStarted = true;

  // ── Worker 1: 전체 경기 목록 — 8시간마다 ──────────────────────────────
  const todayWorker = async () => {
    while (true) {
      try {
        store.todayFixtures = await fetchTodayFixtures();
        console.log(`📅 [Today] ${store.todayFixtures.length}경기 갱신`);
      } catch (e) {
        console.error('❌ [Today] 오류:', e);
      }
      await new Promise(r => setTimeout(r, 8 * 60 * 60 * 1000));
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
      message: '데이터를 처음 불러오는 중입니다. 잠시 후 새로고침 해주세요.',
    });
  }
  return NextResponse.json({
    success: true,
    games: store.games,
    lastUpdated: store.lastUpdated,
    status: 'READY',
  });
}
