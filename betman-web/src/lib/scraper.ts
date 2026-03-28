/**
 * 베트맨 스크래퍼 — "팀명 + 회차" 전용
 *
 * 목표: 배당률/점수 같은 복잡한 데이터 X
 *       회차 번호 + 발매 중인 팀명만 추출 → API-Football에서 실제 데이터 받아옴
 */

import { chromium } from 'playwright';

export interface BetmanGame {
  id: string;
  round: string;        // 회차 (예: "1234")
  gameNo: string;       // 배트맨 게임 번호
  homeTeam: string;     // 한국어 팀명
  awayTeam: string;
  matchTime: string;
  type: string;         // PROTO | TOTO
  category: string;     // 축구 | 농구 | 야구
  league: string;       // 배트맨 리그명 (한국어)
  // route.ts에서 API-Football 병합 후 채워짐
  liveStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  elapsed?: number | null;
  homeOdds?: string;
  drawOdds?: string;
  awayOdds?: string;
}

const BETMAN_URLS = [
  {
    url: 'https://www.betman.co.kr/main/mainPage/gamebuy/buyableGameList.do',
    type: 'PROTO',
  },
];

export async function scrapeBetmanData(): Promise<BetmanGame[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1920, height: 1080 },
  });

  const allGames: BetmanGame[] = [];

  for (const target of BETMAN_URLS) {
    const page = await context.newPage();
    const intercepted: BetmanGame[] = [];

    // ── 1차: JSON API 인터셉션 ─────────────────────────────
    page.on('response', async (response) => {
      if (!response.url().includes('betman.co.kr')) return;
      if (!['xhr', 'fetch'].includes(response.request().resourceType())) return;
      const ct = response.headers()['content-type'] ?? '';
      if (!ct.includes('json')) return;

      try {
        const data = await response.json();
        const list: any[] =
          data?.list ?? data?.gameList ?? data?.data?.list ?? data?.result?.list ??
          (Array.isArray(data) ? data : []);

        list.forEach((item: any, i: number) => {
          const homeTeam = item.homeTeamNm ?? item.homeNm ?? item.home ?? '';
          const awayTeam = item.awayTeamNm ?? item.awayNm ?? item.away ?? '';
          if (!homeTeam || !awayTeam) return;

          intercepted.push({
            id: `${target.type}_${item.gmRound ?? i}_${i}`,
            round: String(item.gmRound ?? item.round ?? item.rcptRound ?? ''),
            gameNo: String(item.gmNo ?? i + 1),
            homeTeam,
            awayTeam,
            matchTime: item.gmTime ?? item.startTime ?? '',
            type: target.type,
            category: item.spKindNm ?? '축구',
            league: item.leagueNm ?? '',
          });
        });
      } catch { /* JSON 파싱 실패 무시 */ }
    });

    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      if (intercepted.length > 0) {
        console.log(`✅ [Scraper] JSON 인터셉션 성공: ${intercepted.length}경기`);
        allGames.push(...intercepted);
        await page.close();
        continue;
      }

      // ── 2차: 렌더링된 DOM에서 팀명만 추출 ──────────────────
      console.log('⚠️ [Scraper] JSON 미발견 → DOM 파싱 시도');
      const domGames: BetmanGame[] = await page.evaluate((type: string) => {
        const games: any[] = [];

        // 회차 정보 추출
        const roundText =
          document.querySelector('.round, .rcpt_round, [class*="round"]')
            ?.textContent?.match(/(\d{3,5})/)?.[1] ?? '';

        // 게임 행 탐색 (여러 셀렉터 시도)
        const selectors = [
          '#tbl_game_list tbody tr',
          '.tbl_game_list tbody tr',
          '.game_list tbody tr',
          'table tbody tr',
        ];

        let rows: Element[] = [];
        for (const sel of selectors) {
          const found = Array.from(document.querySelectorAll(sel));
          if (found.length > 1) { rows = found; break; }
        }

        rows.forEach((row, i) => {
          const homeEl =
            row.querySelector('.home_team, .team_home, [class*="home"]:not([class*="away"])') ??
            row.querySelectorAll('td')[3];
          const awayEl =
            row.querySelector('.away_team, .team_away, [class*="away"]:not([class*="home"])') ??
            row.querySelectorAll('td')[5];

          const homeTeam = homeEl?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
          const awayTeam = awayEl?.textContent?.trim().replace(/\s+/g, ' ') ?? '';

          if (!homeTeam || !awayTeam || homeTeam.length < 2) return;

          const cells = Array.from(row.querySelectorAll('td'));
          games.push({
            id: `${type}_dom_${i}`,
            round: roundText,
            gameNo: cells[0]?.textContent?.trim() ?? String(i + 1),
            homeTeam,
            awayTeam,
            matchTime: row.querySelector('.time, [class*="time"]')?.textContent?.trim() ?? '',
            type,
            category: '축구',
            league: row.querySelector('.league, [class*="league"]')?.textContent?.trim() ?? '',
          });
        });

        return games;
      }, target.type);

      if (domGames.length > 0) {
        console.log(`✅ [Scraper] DOM 파싱 성공: ${domGames.length}경기`);
        allGames.push(...domGames);
      } else {
        console.log('❌ [Scraper] DOM 파싱도 실패 (빈 결과)');
      }

    } catch (err: any) {
      console.error(`❌ [Scraper] 접근 실패: ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log(`📦 [Scraper] 최종 수집: ${allGames.length}경기`);
  return allGames;
}
