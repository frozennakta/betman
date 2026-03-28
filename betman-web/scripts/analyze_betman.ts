/**
 * 베트맨 내부 API 탐색 스크립트
 *
 * 실행 방법 (VPN 켜고 한국 IP에서):
 *   npx ts-node scripts/analyze_betman.ts
 *
 * 결과: betman_api_logs.txt 파일에 발견된 API 엔드포인트와 응답 저장
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'betman_api_logs.txt');
const HTML_FILE = path.join(process.cwd(), 'betman_html_dump.html');

// 탐색할 페이지 목록 (구버전 URL 제거, 현재 베트맨 URL 사용)
const TARGET_PAGES = [
  {
    name: '구매 가능 경기 목록',
    url: 'https://www.betman.co.kr/main/mainPage/gamebuy/buyableGameList.do',
  },
  {
    name: '마감 경기 목록',
    url: 'https://www.betman.co.kr/main/mainPage/gamebuy/closedGameList.do',
  },
  {
    name: '경기 일정 (축구)',
    url: 'https://www.betman.co.kr/main/mainPage/gameinfo/scGameInfo.do?item=SC',
  },
];

interface ApiLog {
  page: string;
  url: string;
  method: string;
  status: number;
  contentType: string;
  bodyPreview: string;
  isJson: boolean;
}

async function analyzeBetman() {
  console.log('🚀 베트맨 내부 API 탐색 시작...');
  console.log('📝 로그 파일:', LOG_FILE);
  console.log('');

  // 로그 파일 초기화
  fs.writeFileSync(LOG_FILE, `=== 베트맨 API 탐색 로그 (${new Date().toLocaleString('ko-KR')}) ===\n\n`);

  const browser = await chromium.launch({
    headless: false, // 베트맨은 headless 차단 가능성 있어 non-headless 사용
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  const allApiLogs: ApiLog[] = [];

  // ============================================================
  // 네트워크 요청 인터셉터 설정
  // ============================================================
  page.on('response', async (response) => {
    const url = response.url();
    const method = response.request().method();
    const status = response.status();
    const contentType = response.headers()['content-type'] || '';
    const resourceType = response.request().resourceType();

    // XHR / Fetch 요청만 캡처 (CSS, 이미지 제외)
    if (!['xhr', 'fetch', 'document'].includes(resourceType)) return;
    // 외부 CDN, 분석 도구 제외
    if (!url.includes('betman.co.kr')) return;

    const isJson = contentType.includes('json');
    let bodyPreview = '';

    try {
      const body = await response.text();
      bodyPreview = body.substring(0, 800);
    } catch {
      bodyPreview = '[응답 본문 읽기 실패]';
    }

    const log: ApiLog = { page: '', url, method, status, contentType, bodyPreview, isJson };
    allApiLogs.push(log);

    if (isJson) {
      console.log(`  🎯 [JSON API 발견!] ${method} ${url}`);
      console.log(`     응답: ${bodyPreview.substring(0, 150)}...`);
    } else if (url.includes('.do') || url.includes('/api/')) {
      console.log(`  📡 [.do 요청] ${method} ${url} (${status})`);
    }
  });

  // ============================================================
  // 각 페이지 순차 방문
  // ============================================================
  for (const target of TARGET_PAGES) {
    console.log(`\n🔍 [${target.name}] 접속 중...`);
    console.log(`   URL: ${target.url}`);

    const pageStartIdx = allApiLogs.length;

    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });

      // JS 렌더링 완료 대기
      await page.waitForTimeout(3000);

      // 렌더링된 HTML 덤프 (첫 번째 페이지만)
      if (target.name === '구매 가능 경기 목록') {
        const html = await page.content();
        fs.writeFileSync(HTML_FILE, html);
        console.log(`  💾 HTML 덤프 저장됨: ${HTML_FILE}`);

        // 렌더링된 DOM에서 게임 테이블 찾기
        const tableInfo = await page.evaluate(() => {
          const results: any = {};

          // 테이블 목록
          results.tables = Array.from(document.querySelectorAll('table')).map(t => ({
            id: t.id,
            className: t.className,
            rowCount: t.querySelectorAll('tr').length,
            firstRowText: t.querySelector('tr')?.textContent?.substring(0, 100)?.trim(),
          }));

          // 팀명 포함 가능성 있는 요소 탐색
          const teamKeywords = ['team', 'home', 'away', '홈', '원정', '팀'];
          results.possibleTeamElements = [];

          document.querySelectorAll('[class]').forEach(el => {
            const cls = el.className.toLowerCase();
            if (teamKeywords.some(k => cls.includes(k))) {
              results.possibleTeamElements.push({
                tag: el.tagName,
                class: el.className,
                text: el.textContent?.substring(0, 50)?.trim(),
              });
            }
          });

          // 배당률 포함 가능성 있는 요소 (숫자 2.xx 패턴)
          results.oddsElements = [];
          document.querySelectorAll('td, span, div').forEach(el => {
            const text = el.textContent?.trim() || '';
            if (/^\d\.\d{2}$/.test(text)) {
              results.oddsElements.push({
                tag: el.tagName,
                class: (el as HTMLElement).className,
                text,
              });
            }
          });

          return results;
        });

        console.log(`  📊 DOM 분석 결과:`);
        console.log(`     테이블 수: ${tableInfo.tables.length}`);
        tableInfo.tables.forEach((t: any) => {
          if (t.rowCount > 1) {
            console.log(`     - 테이블 [id:"${t.id}" class:"${t.className}"] ${t.rowCount}행`);
          }
        });
        console.log(`     팀명 관련 요소: ${tableInfo.possibleTeamElements.length}개`);
        console.log(`     배당률 의심 요소: ${tableInfo.oddsElements.length}개`);

        // 로그 파일에 DOM 분석 결과 저장
        fs.appendFileSync(LOG_FILE, `\n=== DOM 분석 결과 (${target.name}) ===\n`);
        fs.appendFileSync(LOG_FILE, JSON.stringify(tableInfo, null, 2) + '\n');
      }

      // 현재 페이지에서 발견된 API 기록
      const pageApis = allApiLogs.slice(pageStartIdx);
      console.log(`  ✅ 완료 - ${pageApis.length}개 요청 캡처`);
      console.log(`     JSON API: ${pageApis.filter(l => l.isJson).length}개`);

    } catch (err: any) {
      console.error(`  ❌ 접속 실패: ${err.message}`);
      fs.appendFileSync(LOG_FILE, `\n[에러] ${target.name}: ${err.message}\n`);
    }
  }

  // ============================================================
  // 최종 결과 저장
  // ============================================================
  console.log('\n\n🏁 탐색 완료!');
  console.log('='.repeat(50));

  const jsonApis = allApiLogs.filter(l => l.isJson);
  console.log(`\n🎯 발견된 JSON API: ${jsonApis.length}개`);
  jsonApis.forEach(api => {
    console.log(`  - [${api.method}] ${api.url}`);
  });

  // 로그 파일에 전체 결과 저장
  fs.appendFileSync(LOG_FILE, '\n\n=== 전체 API 요청 목록 ===\n');
  allApiLogs.forEach(log => {
    fs.appendFileSync(LOG_FILE, `\n[${log.method}] ${log.url}\n`);
    fs.appendFileSync(LOG_FILE, `  타입: ${log.contentType} | 상태: ${log.status}\n`);
    if (log.isJson) {
      fs.appendFileSync(LOG_FILE, `  📌 JSON 응답 미리보기:\n${log.bodyPreview}\n`);
    }
  });

  console.log(`\n📁 로그 파일 저장됨: ${LOG_FILE}`);
  console.log('💡 betman_api_logs.txt를 분석하면 실제 JSON API 엔드포인트를 확인할 수 있습니다.\n');

  await browser.close();
}

analyzeBetman().catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
