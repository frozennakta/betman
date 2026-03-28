/**
 * 🌍 [BetmanPRO Mapping Engine - Global Standard]
 * 배트맨의 한국어 팀명을 글로벌 라이브 스코어 API의 영어명으로 변환합니다.
 */

const teamMap: Record<string, string> = {
  // --- 축구 (Soccer) ---
  // EPL
  '아스널': 'Arsenal',
  '리버풀': 'Liverpool',
  '맨체스터 시티': 'Manchester City',
  '맨시티': 'Manchester City',
  '첼시': 'Chelsea',
  '맨체스터 유나이티드': 'Manchester United',
  '맨유': 'Manchester United',
  '토트넘': 'Tottenham Hotspur',
  '토트넘 홋스퍼': 'Tottenham Hotspur',
  '아스톤 빌라': 'Aston Villa',
  '뉴캐슬': 'Newcastle United',
  '브라이튼': 'Brighton & Hove Albion',
  '웨스트햄': 'West Ham United',
  '울버햄튼': 'Wolverhampton Wanderers',
  '울브스': 'Wolverhampton Wanderers',
  '풀럼': 'Fulham',
  '노팅엄': 'Nottingham Forest',

  // K-League
  '울산현대': 'Ulsan Hyundai',
  '울산HD': 'Ulsan Hyundai',
  '전북현대': 'Jeonbuk Hyundai Motors',
  '전북': 'Jeonbuk Hyundai Motors',
  '포항': 'Pohang Steelers',
  '포항 스틸러스': 'Pohang Steelers',
  'FC서울': 'FC Seoul',
  '서울': 'FC Seoul',
  '광주FC': 'Gwangju FC',
  '인천': 'Incheon United',
  '대구FC': 'Daegu FC',
  '제주': 'Jeju United',
  '강원FC': 'Gangwon FC',
  '수원FC': 'Suwon FC',

  // La Liga
  '레알마드리드': 'Real Madrid',
  '바르셀로나': 'Barcelona',
  '아틀레티코': 'Atletico Madrid',
  '지로나': 'Girona',
  '빌바오': 'Athletic Bilbao',
  '레알 소시에다드': 'Real Sociedad',

  // Serie A
  '인터밀란': 'Inter Milan',
  '나폴리': 'Napoli',
  'AC밀란': 'AC Milan',
  '유벤투스': 'Juventus',
  'AS로마': 'AS Roma',
  '라치오': 'Lazio',

  // 국가대표 (A-Match)
  '대한민국': 'South Korea',
  '코트디부아르': 'Ivory Coast',
  '일본': 'Japan',
  '태국': 'Thailand',
  '중국': 'China',
  '베트남': 'Vietnam',
  '브라질': 'Brazil',
  '아르헨티나': 'Argentina',
  '독일': 'Germany',
  '프랑스': 'France',

  // --- 농구 (Basketball) ---
  // NBA
  'LAL': 'Los Angeles Lakers',
  'GSW': 'Golden State Warriors',
  'BOS': 'Boston Celtics',
  'PHX': 'Phoenix Suns',
  'DEN': 'Denver Nuggets',
  'LAC': 'LA Clippers',
  'MIL': 'Milwaukee Bucks',
  'PHI': 'Philadelphia 76ers',

  // KBL
  '전주KCC': 'KCC Egis',
  '서울SK': 'SK Knights',
  '창원LG': 'LG Sakers',
  '수원KT': 'KT Sonicboom',
  '안양KGC': 'Anyang KGC',
};

export function getEnglishName(koreanName: string): string {
  // 1. 정확한 매핑 검색
  if (teamMap[koreanName]) return teamMap[koreanName];
  
  // 2. 부분 일치 검색 (예: '포항 스틸러스' -> '포항')
  for (const [kr, en] of Object.entries(teamMap)) {
    if (koreanName.includes(kr) || kr.includes(koreanName)) {
      return en;
    }
  }

  // 3. 없으면 원본 반환
  return koreanName;
}
