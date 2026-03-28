import { chromium } from 'playwright';

export interface GameInfo {
  no: string;          // 게임 번호
  time: string;        // 게임 시간
  league: string;      // 리그명
  homeTeam: string;    // 홈팀
  awayTeam: string;    // 원정팀
  homeOdds: string;    // 홈 승 배당
  drawOdds: string;    // 무승부 배당
  awayOdds: string;    // 홈 패(어웨이 승) 배당
}

async function scrapeProtoAndToto() {
  console.log('🤖 배트맨 데이터 통합 크롤링 봇 가동 시작!\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // ==========================================
  // 1. 프로토 승부식 데이터 스크래핑
  // ==========================================
  console.log('👉 [1/3] 프로토 승부식 데이터 파싱 중...');
  await page.goto('https://www.betman.co.kr/main/mainPage/gamebuy/gameBuyEx.do', { waitUntil: 'domcontentloaded' });
  
  // 브라우저 내부 DOM에서 테이블 데이터를 순회하며 추출합니다. (예시 셀렉터)
  const protoGames = await page.evaluate(() => {
    const games: any[] = [];
    // 배트맨 승부식 테이블 행들 선택 (실제 DOM 구조에 맞게 셀렉터 수정 예정)
    const rows = document.querySelectorAll('table.tbl_game_list tbody tr');
    
    rows.forEach(row => {
        // 실제 배트맨 테이블 구조 파악 후 추출 로직 정교화
        // 여기에 팀명, 배당률 매핑 로직이 들어갑니다.
    });
    return games;
  });
  console.log(`✅ 프로토 승부식 기본 구조 로드 완료!`);

  // ==========================================
  // 2. 토토 승무패 데이터 스크래핑
  // ==========================================
  console.log('\n👉 [2/3] 토토 승무패 데이터 파싱 중...');
  await page.goto('https://www.betman.co.kr/main/mainPage/gamebuy/gameBuyWdl.do', { waitUntil: 'domcontentloaded' });
  
  const totoWDLGames = await page.evaluate(() => {
    const games: any[] = [];
    const rows = document.querySelectorAll('table.tbl_game_list tbody tr'); // 토토 경기 테이블
    return games;
  });
  console.log(`✅ 토토 승무패 기본 구조 로드 완료!`);


  // ==========================================
  // 3. 토토 스페셜 / 매치 (기타 토토류)
  // ==========================================
  console.log('\n👉 [3/3] 토토 스페셜/매치 및 기록식 파싱 준비...');
  
  // .. 추가 로직 처리 ..

  console.log('\n🎉 전체 구조 크롤링 봇 세팅 완료!');
  await browser.close();
}

scrapeProtoAndToto().catch(console.error);
