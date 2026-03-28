import { scrapeBetmanData } from '../src/lib/scraper';

async function debug() {
  console.log('🔍 [DEBUG] 실시간 배트맨 크롤링 엔진 가동 테스트...');
  console.log('--------------------------------------------------');
  
  try {
    const games = await scrapeBetmanData();
    console.log(`✅ 총 ${games.length}개의 경기를 발견했습니다!\n`);
    
    // 상위 5개 경기만 로그로 출력해봅니다.
    const sample = games.slice(0, 5);
    sample.forEach((game, i) => {
      console.log(`[경기 ${i+1}] ${game.type} | ${game.league}`);
      console.log(`       ${game.homeTeam} VS ${game.awayTeam}`);
      console.log(`       배당: 승(${game.homeOdds}) 무(${game.drawOdds}) 패(${game.awayOdds})`);
      console.log(`       시간: ${game.matchTime}\n`);
    });

    if (games.some(g => g.id.startsWith('proto_'))) {
       console.log('✅ 실제 배트맨 사이트의 동적 데이터 파싱에 성공했습니다!');
    } else {
       console.log('⚠️ 현재 VPN 환경 혹은 사이트 상태로 인해 예비 데이터(Fail-safe)가 로드되었습니다.');
    }

  } catch (err) {
    console.error('❌ 크롤링 중 치명적 오류 발생:', err);
  }
}

debug();
