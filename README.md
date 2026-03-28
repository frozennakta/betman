# Betman Analyzer & Live Score

배트맨(Betman.co.kr)의 프로토/토토 대상 경기와 배당률 데이터를 수집하여 분석하고, 외부 API를 통해 라이브 스코어를 실시간으로 중계하는 종합 스포츠 분석 웹 서비스입니다.

## 🛠 Tech Stack (기술 스택)

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend (Scraping & API):** Node.js / Python (진행 예정)
- **Database:** PostgreSQL or MongoDB (진행 예정)

## 🎯 주요 기능 (예정)

1. **배트맨 경기 스크래핑:**
   - 일자별 승부식 대상 경기 목록 (축구, 농구, 야구, 배구 등)
   - 실시간 배당률 정보 및 변동 기록 저장
2. **라이브 스코어 연동:**
   - 해외 스포츠 API를 활용한 실시간 스코어 중계
   - 배장률 기반의 실시간 경기 결과 반영 보드
3. **데이터 분석:**
   - 동일 배당 결과 통계
   - 팀 역대 전적 및 흐름 분석

## 🚀 시작하기

### 웹 애플리케이션 실행
```bash
cd betman-web
npm install
npm run dev
```
