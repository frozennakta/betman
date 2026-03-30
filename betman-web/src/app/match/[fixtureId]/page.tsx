"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import {
  countryFlag, STATUS_LABEL,
  AnalysisTab, InfoTab, EventsTab, StatsTab, LineupTab, PoissonTab, MemoTab, InjuriesTab,
} from '@/components/AnalysisTabs';

const TABS = ['분석', '예측', '라인업', '부상', '스탯', '이벤트', '정보', '메모'] as const;
type TabKey = typeof TABS[number];

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fixtureId = params.fixtureId as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('분석');
  const [isFav, setIsFav] = useState(false);

  // 쿼리파람에서 기본 게임 정보 복원
  const game = {
    id: `fixture_${fixtureId}`,
    homeTeam:   searchParams.get('home')    ?? '',
    awayTeam:   searchParams.get('away')    ?? '',
    league:     searchParams.get('league')  ?? '',
    country:    searchParams.get('country') ?? '',
    homeScore:  searchParams.get('hs') !== null ? Number(searchParams.get('hs')) : null,
    awayScore:  searchParams.get('as') !== null ? Number(searchParams.get('as')) : null,
    liveStatus: searchParams.get('status')  ?? 'PENDING',
    matchTime:  searchParams.get('time')    ?? '',
    date:       searchParams.get('date')    ?? '',
    elapsed:    searchParams.get('elapsed') ? Number(searchParams.get('elapsed')) : null,
    rawStatus:  searchParams.get('raw')     ?? '',
    venue:      searchParams.get('venue')   ? { name: searchParams.get('venue'), city: searchParams.get('city') ?? '' } : null,
    referee:    searchParams.get('referee') ?? '',
  };

  const isLive     = !['PENDING', 'FT'].includes(game.liveStatus);
  const isFinished = game.liveStatus === 'FT';
  const hWin = game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore;
  const aWin = game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore;
  const flag = countryFlag(game.country);

  // 즐겨찾기
  useEffect(() => {
    try {
      const raw = localStorage.getItem('betman-favorites');
      const favs: string[] = raw ? JSON.parse(raw) : [];
      setIsFav(favs.includes(game.id));
    } catch {}
  }, [game.id]);

  const toggleFav = () => {
    try {
      const raw = localStorage.getItem('betman-favorites');
      const favs: string[] = raw ? JSON.parse(raw) : [];
      const next = isFav ? favs.filter(f => f !== game.id) : [...favs, game.id];
      localStorage.setItem('betman-favorites', JSON.stringify(next));
      setIsFav(!isFav);
    } catch {}
  };

  // 메모 dot
  const noteKey = `betman-notes-${fixtureId}`;
  const [hasNote, setHasNote] = useState(false);
  useEffect(() => {
    try { setHasNote(!!localStorage.getItem(noteKey)); } catch {}
  }, [noteKey]);

  // 분석 데이터 fetch
  useEffect(() => {
    fetch(`/api/analysis/${fixtureId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAnalysis(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fixtureId]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 blur-[200px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* 상단 광고 슬롯 */}
        <div className="w-full h-[90px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* 뒤로가기 */}
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-5 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-black">목록으로</span>
        </button>

        {/* 경기 헤더 카드 */}
        <div className="bg-[var(--bg-card)] border border-white/10 rounded-3xl p-5 mb-6 shadow-xl">
          {/* 리그 + 즐겨찾기 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              {flag} {game.country} · {game.league}
            </div>
            <button
              onClick={toggleFav}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star className={`w-4 h-4 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* 팀 + 스코어 */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 text-right">
              <div className={`text-xl sm:text-2xl font-black ${hWin ? 'text-white' : aWin ? 'text-slate-500' : 'text-white'}`}>
                {game.homeTeam}
              </div>
              <div className="text-[10px] font-black text-slate-600 mt-0.5">홈</div>
            </div>

            <div className="shrink-0 text-center">
              {(isLive || isFinished) && game.homeScore !== null ? (
                <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-4 py-2 border border-white/10">
                  <span className={`text-3xl font-black tabular-nums ${hWin ? 'text-white' : 'text-slate-500'}`}>{game.homeScore}</span>
                  <span className="text-slate-600 font-black text-xl">:</span>
                  <span className={`text-3xl font-black tabular-nums ${aWin ? 'text-white' : 'text-slate-500'}`}>{game.awayScore}</span>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl px-5 py-2 border border-white/5">
                  <div className="text-sm font-black text-indigo-300 tabular-nums">{game.matchTime}</div>
                  <div className="text-[9px] font-black text-slate-600 mt-0.5">킥오프</div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className={`text-xl sm:text-2xl font-black ${aWin ? 'text-white' : hWin ? 'text-slate-500' : 'text-white'}`}>
                {game.awayTeam}
              </div>
              <div className="text-[10px] font-black text-slate-600 mt-0.5">원정</div>
            </div>
          </div>

          {/* 상태 배지 */}
          <div className="flex justify-center">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {STATUS_LABEL[game.liveStatus] ?? game.liveStatus}
                {game.elapsed ? ` · ${game.elapsed}'` : ''}
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full">종료</span>
            )}
            {!isLive && !isFinished && (
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                예정 · {game.matchTime}
              </span>
            )}
          </div>
        </div>

        {/* 탭 바 */}
        <div className="flex gap-1 mb-4 bg-[var(--bg-card)] border border-white/5 rounded-2xl p-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 min-w-[52px] py-2 text-[11px] font-black rounded-xl transition-all whitespace-nowrap ${
                tab === t
                  ? 'text-white bg-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {t}
              {t === '메모' && hasNote && (
                <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-[var(--bg-card)] border border-white/5 rounded-3xl p-5 mb-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-black">분석 데이터 로딩 중...</span>
            </div>
          ) : analysis ? (
            <>
              {tab === '분석'   && <AnalysisTab  analysis={analysis} game={game} />}
              {tab === '예측'   && <PoissonTab   analysis={analysis} game={game} />}
              {tab === '라인업' && <LineupTab    lineups={analysis.lineups ?? []} />}
              {tab === '부상'   && <InjuriesTab  injuries={analysis.injuries ?? []} game={game} />}
              {tab === '스탯'   && <StatsTab     statistics={analysis.statistics ?? []} />}
              {tab === '이벤트' && <EventsTab    events={analysis.events ?? []} />}
              {tab === '정보'   && <InfoTab      analysis={analysis} game={game} />}
              {tab === '메모'   && <MemoTab      fixtureId={fixtureId} />}
            </>
          ) : (
            <div className="py-16 text-center">
              <div className="text-slate-600 text-sm font-bold mb-2">분석 데이터를 불러올 수 없습니다</div>
              <div className="text-[11px] text-slate-700">API 한도 초과 또는 네트워크 오류</div>
            </div>
          )}
        </div>

        {/* 콘텐츠 사이 광고 슬롯 */}
        <div className="w-full h-[250px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* 하단 여백 */}
        <div className="h-10" />
      </div>
    </div>
  );
}
