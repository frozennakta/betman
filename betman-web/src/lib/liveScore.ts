/**
 * API-Football 연동 모듈
 *
 * 무료 플랜: 100 req/day, 10 req/min
 * 키 발급: https://dashboard.api-football.com (무료, 카드 불필요)
 * 환경변수: API_FOOTBALL_KEY=your_key_here (.env.local에 설정)
 *
 * 전략:
 * - 하루 1회 오늘의 전체 경기 목록 로드 → 캐싱
 * - 실시간 갱신은 live=all 엔드포인트 (소수의 API 호출)
 * - 베트맨 한국어 팀명 → 영어 변환 → API-Football 매칭
 */

export interface LiveMatch {
  fixtureId: number;
  homeTeam: string;       // API-Football 영어명
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  status: string;         // NS | 1H | HT | 2H | FT | ET | PEN | AET | CANC
  homeScore: number;
  awayScore: number;
  elapsedTime: number | null;
  league: string;
  leagueId: number;
  country: string;
  date: string;           // ISO 날짜
  venue?: { name: string; city: string } | null;
  referee?: string | null;
}

interface APIFootballResponse {
  fixture: {
    id: number;
    date: string;
    venue?: { id: number; name: string; city: string } | null;
    referee?: string | null;
    status: { short: string; elapsed: number | null };
  };
  league: { id: number; name: string; country: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

const API_BASE = 'https://v3.football.api-sports.io';

async function apiFetch(path: string): Promise<any> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error('API_FOOTBALL_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'x-apisports-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
    next: { revalidate: 0 }, // Next.js 캐시 비활성화
  });

  if (!res.ok) throw new Error(`API-Football 오류: ${res.status}`);
  const json = await res.json();

  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football 에러: ${JSON.stringify(json.errors)}`);
  }

  return json.response ?? [];
}

function toMatch(item: APIFootballResponse): LiveMatch {
  return {
    fixtureId: item.fixture.id,
    homeTeam: item.teams.home.name,
    awayTeam: item.teams.away.name,
    homeTeamId: item.teams.home.id,
    awayTeamId: item.teams.away.id,
    status: item.fixture.status.short,
    homeScore: item.goals.home ?? 0,
    awayScore: item.goals.away ?? 0,
    elapsedTime: item.fixture.status.elapsed,
    league: item.league.name,
    leagueId: item.league.id,
    country: item.league.country,
    date: item.fixture.date,
    venue: item.fixture.venue ? { name: item.fixture.venue.name, city: item.fixture.venue.city } : null,
    referee: item.fixture.referee ?? null,
  };
}

/** YYYY-MM-DD 포맷 헬퍼 (KST 기준) — en-CA로 플랫폼 무관하게 안정적 포맷 */
function toKSTDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // en-CA 로케일은 OS/언어 설정과 무관하게 항상 "YYYY-MM-DD" 형식 반환
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

/**
 * 여러 날짜 병렬 조회 (무료 플랜은 date= 단일날짜만 지원)
 * - 기본: 어제(-1) ~ 6일 후(+6) = 8일치, 8 req/호출
 * - 6시간마다 갱신 → 32 req/day
 */
export async function fetchTodayFixtures(pastDays = 0, futureDays = 1): Promise<LiveMatch[]> {
  if (!process.env.API_FOOTBALL_KEY) {
    console.warn('[LiveScore] API_FOOTBALL_KEY 없음 → 빈 배열 반환');
    return [];
  }

  try {
    const offsets = Array.from({ length: pastDays + futureDays + 1 }, (_, i) => i - pastDays);
    const results = await Promise.all(
      offsets.map(async (offset) => {
        const date = toKSTDateStr(offset);
        try {
          const data: APIFootballResponse[] = await apiFetch(`/fixtures?date=${date}&timezone=Asia%2FSeoul`);
          return data.map(toMatch);
        } catch {
          return [] as LiveMatch[];
        }
      })
    );

    const all = results.flat();
    console.log(`[LiveScore] ${offsets.length}일치 조회 완료: ${all.length}경기`);
    return all;

  } catch (err: any) {
    console.error('[LiveScore] fetchTodayFixtures 실패:', err.message);
    return [];
  }
}

/**
 * 현재 진행 중인 경기만 (실시간 갱신용)
 * - 20~60초 간격으로 호출 가능
 */
export async function fetchLiveFixtures(): Promise<LiveMatch[]> {
  if (!process.env.API_FOOTBALL_KEY) return [];

  try {
    const data: APIFootballResponse[] = await apiFetch('/fixtures?live=all');
    console.log(`[LiveScore] 현재 라이브 경기: ${data.length}`);
    return data.map(toMatch);
  } catch (err: any) {
    console.error('[LiveScore] fetchLiveFixtures 실패:', err.message);
    return [];
  }
}

/**
 * 오늘 + 라이브 통합 (중복 제거)
 * route.ts의 백그라운드 워커에서 호출
 */
export async function fetchLiveScores(): Promise<LiveMatch[]> {
  if (!process.env.API_FOOTBALL_KEY) {
    console.warn('[LiveScore] API_FOOTBALL_KEY 없음');
    return [];
  }

  try {
    // API 호출 최소화: 오늘 경기 + 라이브를 병렬 조회
    const [today, live] = await Promise.all([
      fetchTodayFixtures(),
      fetchLiveFixtures(),
    ]);

    // 라이브 경기로 오늘 데이터 업데이트 (실시간 점수 반영)
    const liveIds = new Set(live.map(m => m.fixtureId));
    const todayUpdated = today.map(m => liveIds.has(m.fixtureId)
      ? (live.find(l => l.fixtureId === m.fixtureId) ?? m)
      : m
    );

    // 오늘 목록에 없는 라이브 경기 추가
    const todayIds = new Set(todayUpdated.map(m => m.fixtureId));
    const extraLive = live.filter(m => !todayIds.has(m.fixtureId));

    return [...todayUpdated, ...extraLive];

  } catch (err: any) {
    console.error('[LiveScore] fetchLiveScores 실패:', err.message);
    return [];
  }
}

/**
 * 베트맨 팀명(한국어/영어 혼합)으로 API-Football fixture 매칭
 * getEnglishName()으로 변환한 영어 팀명과 비교
 */
export function findMatchingFixture(
  homeTeamEn: string,
  awayTeamEn: string,
  fixtures: LiveMatch[]
): LiveMatch | null {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const hNorm = normalize(homeTeamEn);
  const aNorm = normalize(awayTeamEn);

  // 1순위: 홈+원정 동시 매칭
  const exact = fixtures.find(f => {
    const fh = normalize(f.homeTeam);
    const fa = normalize(f.awayTeam);
    return (fh.includes(hNorm) || hNorm.includes(fh)) &&
           (fa.includes(aNorm) || aNorm.includes(fa));
  });
  if (exact) return exact;

  // 2순위: 홈팀만 매칭 (팀명이 특이한 경우)
  const homeOnly = fixtures.find(f => {
    const fh = normalize(f.homeTeam);
    return fh.includes(hNorm) || hNorm.includes(fh);
  });
  return homeOnly ?? null;
}
