import { NextResponse } from 'next/server';
import { scrapeBetmanData, BetmanGame } from '@/lib/scraper';
import { fetchLiveScores, findMatchingFixture, LiveMatch } from '@/lib/liveScore';
import { getEnglishName } from '@/lib/mapping';

/** 
 * 🚀 [시스템 고도화] 백그라운드 실시간 데이터 워커
 * 사용자가 요청할 때 긁어오는 것이 아니라, 서버가 켜져 있는 동안 
 * 백그라운드에서 주기적으로 수집하여 '즉시 응답' 체제로 전환합니다.
 */

interface GlobalStore {
  games: any[];
  lastUpdated: number;
}

// 글로벌 네이티브 객체에 캐시 저장 (Next.js 가 핫 리로딩되어도 어느 정도 유지)
const globalStore = (global as any).betmanStore || { games: [], lastUpdated: 0 };
(global as any).betmanStore = globalStore;

// 백그라운드 수집 루프 시작 (서버 시작 시 1회 실행)
let isWorkerRunning = false;

async function startBackgroundWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  
  console.log('🤖 [Internal Worker] 백그라운드 수집기 가동 시작...');
  
  while (true) {
    try {
      console.log('🔄 [Internal Worker] 실시간 데이터 업데이트 중...');
      const [betmanGames, liveScores] = await Promise.all([
        scrapeBetmanData(),
        fetchLiveScores()
      ]);

      const merged = betmanGames.map((game: BetmanGame) => {
        const homeEn = getEnglishName(game.homeTeam);
        const awayEn = getEnglishName(game.awayTeam);
        const live: LiveMatch | null = findMatchingFixture(homeEn, awayEn, liveScores);

        return {
          ...game,
          liveStatus: live ? live.status : 'PENDING',
          homeScore: live ? live.homeScore : null,
          awayScore: live ? live.awayScore : null,
          elapsed: live ? live.elapsedTime : null
        };
      });

      globalStore.games = merged;
      globalStore.lastUpdated = Date.now();
      console.log(`✅ [Internal Worker] 업데이트 완료: ${merged.length}개 (다음 주기 대기)`);
    } catch (e) {
      console.error('❌ [Internal Worker] 수집 중 오류 발생:', e);
    }
    
    // 30분마다 재수집 (무료 플랜 100 req/day 기준 안전 주기)
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
  }
}

// API 호출 시 워커가 안 돌아가고 있으면 시작만 시켜줌
if (!isWorkerRunning) {
  startBackgroundWorker();
}

export async function GET() {
  // 사용자는 수집을 기다리지 않고, 즉시 '가장 최신 데이터'를 받음 (0.1초 이내)
  console.log('⚡ [API] 즉시 응답 반환 중...');
  
  // 데이터가 아예 없을 경우 (최초 가동 시) 0.5초만 기다려보고 그래도 없으면 빈 배열 대신 바로 반환
  if (globalStore.games.length === 0) {
     return NextResponse.json({ 
       success: true, 
       games: [], 
       status: 'LOADING_INITIAL',
       message: '최초 데이터 패치 중입니다. 5초 뒤 새로고침 해주세요.' 
     });
  }

  return NextResponse.json({ 
    success: true, 
    games: globalStore.games, 
    lastUpdated: globalStore.lastUpdated,
    status: 'READY'
  });
}
