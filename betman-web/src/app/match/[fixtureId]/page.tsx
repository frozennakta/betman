"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import {
  countryFlag, STATUS_LABEL,
  AnalysisTab, InfoTab, EventsTab, StatsTab, LineupTab, PoissonTab, MemoTab, InjuriesTab,
} from '@/components/AnalysisTabs';

const TABS = ['Analysis', 'Predict', 'Lineup', 'Injuries', 'Stats', 'Events', 'Info', 'Notes'] as const;
type TabKey = typeof TABS[number];

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fixtureId = params.fixtureId as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Analysis');
  const [isFav, setIsFav] = useState(false);

  // 쿼리파람에서 기본 게임 정보 복원 (정적 필드)
  const game = {
    id: `fixture_${fixtureId}`,
    homeTeam:  searchParams.get('home')    ?? '',
    awayTeam:  searchParams.get('away')    ?? '',
    league:    searchParams.get('league')  ?? '',
    country:   searchParams.get('country') ?? '',
    matchTime: searchParams.get('time')    ?? '',
    date:      searchParams.get('date')    ?? '',
    venue:     searchParams.get('venue')   ? { name: searchParams.get('venue'), city: searchParams.get('city') ?? '' } : null,
    referee:   searchParams.get('referee') ?? '',
  };
  const flag = countryFlag(game.country);

  // ── 라이브 업데이트용 state (20s 폴링으로 갱신) ──────────────────────────
  const [live, setLive] = useState({
    homeScore:  searchParams.get('hs') !== null ? Number(searchParams.get('hs')) : null as number | null,
    awayScore:  searchParams.get('as') !== null ? Number(searchParams.get('as')) : null as number | null,
    liveStatus: searchParams.get('status')  ?? 'PENDING',
    rawStatus:  searchParams.get('raw')     ?? '',
    elapsed:    searchParams.get('elapsed') ? Number(searchParams.get('elapsed')) : null as number | null,
  });
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef({ home: live.homeScore, away: live.awayScore });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/games');
        const data = await res.json();
        if (!data.success || !data.games) return;
        const match = data.games.find((g: any) => g.id === `fixture_${fixtureId}`);
        if (!match) return;
        // 골 감지 → 플래시
        if (prevScore.current.home !== match.homeScore || prevScore.current.away !== match.awayScore) {
          setScoreFlash(true);
          setTimeout(() => setScoreFlash(false), 3000);
        }
        prevScore.current = { home: match.homeScore, away: match.awayScore };
        setLive({
          homeScore:  match.homeScore,
          awayScore:  match.awayScore,
          liveStatus: match.liveStatus,
          rawStatus:  match.rawStatus,
          elapsed:    match.elapsed,
        });
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 20000);
    return () => clearInterval(interval);
  }, [fixtureId]);

  const isLive     = !['PENDING', 'FT'].includes(live.liveStatus);
  const isFinished = live.liveStatus === 'FT';
  const hWin = live.homeScore !== null && live.awayScore !== null && live.homeScore > live.awayScore;
  const aWin = live.homeScore !== null && live.awayScore !== null && live.awayScore > live.homeScore;

  // 탭 콘텐츠용 game 객체 (정적 + 라이브 병합)
  const fullGame = { ...game, ...live };

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
    const homeTeamId = searchParams.get('homeTeamId');
    const awayTeamId = searchParams.get('awayTeamId');
    const rawStatus  = searchParams.get('raw') ?? 'NS';
    const qs = new URLSearchParams();
    if (homeTeamId) qs.set('homeTeamId', homeTeamId);
    if (awayTeamId) qs.set('awayTeamId', awayTeamId);
    qs.set('status', rawStatus);
    fetch(`/api/analysis/${fixtureId}?${qs.toString()}`)
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
          <span className="text-xs font-black">Back</span>
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
              title={isFav ? 'Remove favorite' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* 팀 + 스코어 */}
          {(() => {
            // Count red cards per team from analysis events
            const events = analysis?.events ?? [];
            const homeReds = events.filter((e: any) => e.type === 'Card' && e.detail?.includes('Red') && e.team === game.homeTeam).length;
            const awayReds = events.filter((e: any) => e.type === 'Card' && e.detail?.includes('Red') && e.team === game.awayTeam).length;
            return (
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 text-right">
              <div className={`text-xl sm:text-2xl font-black ${hWin ? 'text-white' : aWin ? 'text-slate-500' : 'text-white'} flex items-center justify-end gap-1.5`}>
                <span>{game.homeTeam}</span>
                {homeReds > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({length: homeReds}).map((_, i) => (
                      <span key={i} className="text-sm">🟥</span>
                    ))}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-black text-slate-600 mt-0.5">Home</div>
            </div>

            <div className="shrink-0 text-center">
              {(isLive || isFinished) && live.homeScore !== null ? (
                <div className={`flex items-center gap-2 bg-black/40 rounded-2xl px-4 py-2 border transition-colors duration-300 ${scoreFlash ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
                  <span className={`text-3xl font-black tabular-nums ${hWin ? 'text-white' : 'text-slate-500'}`}>{live.homeScore}</span>
                  <span className="text-slate-600 font-black text-xl">:</span>
                  <span className={`text-3xl font-black tabular-nums ${aWin ? 'text-white' : 'text-slate-500'}`}>{live.awayScore}</span>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl px-5 py-2 border border-white/5">
                  <div className="text-sm font-black text-indigo-300 tabular-nums">{game.matchTime}</div>
                  <div className="text-[9px] font-black text-slate-600 mt-0.5">Kick-off</div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className={`text-xl sm:text-2xl font-black ${aWin ? 'text-white' : hWin ? 'text-slate-500' : 'text-white'} flex items-center gap-1.5`}>
                {awayReds > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({length: awayReds}).map((_, i) => (
                      <span key={i} className="text-sm">🟥</span>
                    ))}
                  </span>
                )}
                <span>{game.awayTeam}</span>
              </div>
              <div className="text-[10px] font-black text-slate-600 mt-0.5">Away</div>
            </div>
          </div>
            );
          })()}

          {/* 상태 배지 */}
          <div className="flex justify-center">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {STATUS_LABEL[live.liveStatus] ?? live.liveStatus}
                {live.elapsed ? ` · ${live.elapsed}'` : ''}
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full">Full Time</span>
            )}
            {!isLive && !isFinished && (
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Scheduled · {game.matchTime}
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
              {t === 'Notes' && hasNote && (
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
              <span className="text-sm font-black">Loading analysis data...</span>
            </div>
          ) : analysis ? (
            <>
              {tab === 'Analysis'   && <AnalysisTab  analysis={analysis} game={fullGame} />}
              {tab === 'Predict'   && <PoissonTab   analysis={analysis} game={fullGame} />}
              {tab === 'Lineup' && <LineupTab    lineups={analysis.lineups ?? []} playerRatings={analysis.playerRatings} />}
              {tab === 'Injuries'   && <InjuriesTab  injuries={analysis.injuries ?? []} game={fullGame} />}
              {tab === 'Stats'   && <StatsTab     statistics={analysis.statistics ?? []} />}
              {tab === 'Events' && <EventsTab    events={analysis.events ?? []} />}
              {tab === 'Info'   && <InfoTab      analysis={analysis} game={fullGame} />}
              {tab === 'Notes'   && <MemoTab      fixtureId={fixtureId} />}
            </>
          ) : (
            <div className="py-16 text-center">
              <div className="text-slate-600 text-sm font-bold mb-2">Could not load analysis data</div>
              <div className="text-[11px] text-slate-700">API limit exceeded or network error</div>
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
