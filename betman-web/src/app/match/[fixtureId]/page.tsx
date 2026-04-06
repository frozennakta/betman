"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Star, MapPin, User, Thermometer, Wind } from 'lucide-react';
import {
  countryFlag, STATUS_LABEL,
  AnalysisTab, StatsTab, LineupTab, PoissonTab, MemoTab, InjuriesTab, ChatTab,
  OddsTab, PlayerStatCard, FormTab, StandingsTab
} from '@/components/AnalysisTabs';
import html2canvas from 'html2canvas';

const TABS = ['Analysis', 'Predict', 'Lineup', 'Absences', 'Stats', 'Form', 'Standings', 'Odds', 'Notes', 'Chat'] as const;
type TabKey = typeof TABS[number];

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fixtureId = params.fixtureId as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Analysis');
  const [isFav, setIsFav] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // 쿼리파람에서 기본 게임 정보 복원 (정적 필드)
  const homeTeamId = searchParams.get('homeTeamId');
  const awayTeamId = searchParams.get('awayTeamId');
  const homeLogo = homeTeamId ? `https://media.api-sports.io/football/teams/${homeTeamId}.png` : null;
  const awayLogo = awayTeamId ? `https://media.api-sports.io/football/teams/${awayTeamId}.png` : null;

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

  // 선수 스탯 카드 팝업
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  // 날씨
  const [weather, setWeather] = useState<{ emoji: string; label: string; temp: number; wind: number; humidity: number; pressure: number } | null>(null);
  useEffect(() => {
    const city = game.venue?.city || searchParams.get('city');
    if (!city) return;
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => { if (d.emoji) setWeather(d); })
      .catch(() => {});
  }, []);

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

      <div className="max-w-3xl mx-auto px-4 py-6" ref={captureRef}>

        {/* 상단 광고 슬롯 */}
        <div className="w-full h-[90px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* 뒤로가기 & 다운로드 캡쳐 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-black">Back</span>
          </button>
          <button
            onClick={() => {
              if (captureRef.current) {
                // 다운로드 아이콘 대신 버튼 전체 적용
                html2canvas(captureRef.current, { backgroundColor: '#0e0e16', scale: 2 }).then(canvas => {
                  const link = document.createElement('a');
                  link.download = `TomatoScore_${game.homeTeam}_vs_${game.awayTeam}.png`;
                  link.href = canvas.toDataURL();
                  link.click();
                });
              }
            }}
            className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Share Ticket</span>
            <span className="text-sm">📸</span>
          </button>
        </div>

        {/* 경기 헤더 카드 */}
        <div className="bg-[var(--bg-card)] border border-white/10 rounded-3xl p-5 mb-6 shadow-xl">

          {/* ① 리그 + 즐겨찾기 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">
                {flag} {game.country} · {game.league}
              </span>
              {analysis?.round && (
                <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                  {analysis.round}
                </span>
              )}
            </div>
            <button onClick={toggleFav} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
              <Star className={`w-4 h-4 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* ② 팀 + 스코어 + 포메이션 */}
          {(() => {
            const events = analysis?.events ?? [];
            const homeReds = events.filter((e: any) => e.type === 'Card' && e.detail?.includes('Red') && e.team === game.homeTeam).length;
            const awayReds = events.filter((e: any) => e.type === 'Card' && e.detail?.includes('Red') && e.team === game.awayTeam).length;
            const homeFormation = analysis?.lineups?.[0]?.formation ?? null;
            const awayFormation = analysis?.lineups?.[1]?.formation ?? null;
            return (
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* 홈 */}
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className={`text-lg sm:text-xl font-black leading-tight truncate ${hWin ? 'text-white' : aWin ? 'text-slate-500' : 'text-white'}`}>
                        {game.homeTeam}
                        {homeReds > 0 && <span className="ml-1">{Array.from({length: homeReds}).map((_, i) => <span key={i}>🟥</span>)}</span>}
                      </div>
                      {homeFormation && <div className="text-[10px] font-black text-indigo-400 mt-0.5 text-right">{homeFormation}</div>}
                      {analysis?.homeLast20?.length > 0 && (
                        <div className="flex gap-0.5 mt-1 justify-end">
                          {analysis.homeLast20.slice(0, 5).map((m: any, i: number) => (
                            <span key={i} className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center ${m.result === 'W' ? 'bg-emerald-500/30 text-emerald-400' : m.result === 'D' ? 'bg-slate-500/30 text-slate-400' : 'bg-red-500/30 text-red-400'}`}>{m.result}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] font-black text-slate-600 mt-0.5">Home</div>
                    </div>
                    {homeLogo && (
                      <img src={homeLogo} alt="" className="w-10 h-10 shrink-0 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                </div>

                {/* 스코어 */}
                <div className="shrink-0 text-center">
                  {(isLive || isFinished) && live.homeScore !== null ? (
                    <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 border transition-colors duration-300 ${scoreFlash ? 'border-red-500/50 bg-red-500/10' : 'bg-black/40 border-white/10'}`}>
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

                {/* 원정 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {awayLogo && (
                      <img src={awayLogo} alt="" className="w-10 h-10 shrink-0 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="min-w-0">
                      <div className={`text-lg sm:text-xl font-black leading-tight truncate ${aWin ? 'text-white' : hWin ? 'text-slate-500' : 'text-white'}`}>
                        {awayReds > 0 && <span className="mr-1">{Array.from({length: awayReds}).map((_, i) => <span key={i}>🟥</span>)}</span>}
                        {game.awayTeam}
                      </div>
                      {awayFormation && <div className="text-[10px] font-black text-orange-400 mt-0.5">{awayFormation}</div>}
                      {analysis?.awayLast20?.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {analysis.awayLast20.slice(0, 5).map((m: any, i: number) => (
                            <span key={i} className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center ${m.result === 'W' ? 'bg-emerald-500/30 text-emerald-400' : m.result === 'D' ? 'bg-slate-500/30 text-slate-400' : 'bg-red-500/30 text-red-400'}`}>{m.result}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] font-black text-slate-600 mt-0.5">Away</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ③ 상태 배지 + 진행 바 */}
          <div className="flex flex-col items-center gap-2 mb-3">
            {isLive && (
              <>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {STATUS_LABEL[live.liveStatus] ?? live.liveStatus}
                  {live.elapsed ? ` · ${live.elapsed}'` : ''}
                </span>
                {typeof live.elapsed === 'number' && (
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500/60 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((live.elapsed / 90) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </>
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

          {/* ④ 라이브 미니스탯 */}
          {(isLive || isFinished) && analysis?.statistics?.length >= 2 && (() => {
            const hStats = analysis.statistics[0]?.stats ?? [];
            const aStats = analysis.statistics[1]?.stats ?? [];
            const hMap: Record<string, any> = Object.fromEntries(hStats.map((s: any) => [s.type, s.value]));
            const aMap: Record<string, any> = Object.fromEntries(aStats.map((s: any) => [s.type, s.value]));

            const parseVal = (v: any) => {
              if (v == null) return 0;
              if (typeof v === 'string' && v.includes('%')) return parseFloat(v);
              return Number(v) || 0;
            };

            const rows = [
              { key: 'Ball Possession', label: 'Poss', isPct: true },
              { key: 'Total Shots',     label: 'Shots', isPct: false },
              { key: 'Shots on Goal',   label: 'On Target', isPct: false },
              { key: 'Corner Kicks',    label: 'Corners', isPct: false },
              { key: 'Yellow Cards',    label: 'Yellows', isPct: false },
              { key: 'Red Cards',       label: 'Reds', isPct: false },
            ].filter(r => hMap[r.key] != null || aMap[r.key] != null);

            if (!rows.length) return null;

            return (
              <div className="border-t border-white/5 pt-3 space-y-2">
                {rows.map(r => {
                  const hRaw = hMap[r.key];
                  const aRaw = aMap[r.key];
                  const h = parseVal(hRaw);
                  const a = parseVal(aRaw);
                  const total = h + a || 1;
                  const hPct = r.isPct ? h : Math.round((h / total) * 100);
                  const aPct = r.isPct ? a : 100 - hPct;
                  const hDisplay = r.isPct ? `${Math.round(h)}%` : String(Math.round(h));
                  const aDisplay = r.isPct ? `${Math.round(a)}%` : String(Math.round(a));
                  return (
                    <div key={r.key} className="flex items-center gap-2">
                      <span className="text-[11px] font-black tabular-nums text-white w-8 text-right">{hDisplay}</span>
                      <div className="flex-1 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/5">
                        <div className="bg-indigo-500 h-full rounded-l-full transition-all" style={{ width: `${hPct}%` }} />
                        <div className="bg-orange-500 h-full rounded-r-full transition-all" style={{ width: `${aPct}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 w-14 text-center shrink-0 uppercase tracking-widest">{r.label}</span>
                      <div className="flex-1 hidden" />
                      <span className="text-[11px] font-black tabular-nums text-white w-8 text-left">{aDisplay}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ⑤ 이벤트 타임라인 (골·카드·교체) */}
          {analysis?.events?.filter((e: any) => ['Goal', 'Card', 'subst'].includes(e.type)).length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
              {analysis.events
                .filter((e: any) => ['Goal', 'Card', 'subst'].includes(e.type))
                .map((e: any, i: number) => {
                  const isHome = e.team === game.homeTeam;
                  const icon = e.type === 'Goal'
                    ? (e.detail?.includes('Penalty') ? '⚽🎯' : e.detail?.includes('Own') ? '⚽🔴' : '⚽')
                    : e.type === 'Card' ? (e.detail?.includes('Red') ? '🟥' : '🟨') : '🔄';
                  return (
                    <div key={i} className={`flex items-center gap-2 py-0.5 ${!isHome ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] font-black text-slate-500 tabular-nums w-8 shrink-0 text-center">
                        {e.minute}{e.extra ? `+${e.extra}` : ''}'
                      </span>
                      <span className="text-sm shrink-0">{icon}</span>
                      <div className={`flex-1 min-w-0 ${!isHome ? 'text-right' : 'text-left'}`}>
                        <span className="text-[11px] font-bold text-white truncate block leading-tight">{e.player}</span>
                        {e.assist && (
                          <span className="text-[9px] text-slate-500 truncate block">
                            {e.type === 'subst' ? '↑' : '→'} {e.assist}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ⑥ 구장 + 날씨 + 심판 */}
          {(game.venue?.name || game.referee || weather || analysis?.season) && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">

              {/* 구장 + 날씨 */}
              {(game.venue?.name || weather) && (
                <div className="flex items-center justify-between gap-3 bg-white/[0.04] rounded-2xl px-4 py-3 border border-white/5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {game.venue?.city && (
                        <div className="text-[13px] font-black text-white leading-tight truncate">{game.venue.city}</div>
                      )}
                      {game.venue?.name && (
                        <div className="text-[11px] font-medium text-slate-500 leading-tight truncate mt-0.5">{game.venue.name}</div>
                      )}
                    </div>
                  </div>
                  {weather && (
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-3xl leading-none">{weather.emoji}</span>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1 text-[12px] font-bold text-slate-300">
                          <Thermometer className="w-3 h-3 text-orange-400 shrink-0" />{weather.temp}°C
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-bold text-slate-400">
                          <Wind className="w-3 h-3 text-sky-400 shrink-0" />{weather.wind} km/h
                        </div>
                        {weather.humidity != null && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <span className="text-blue-400">💧</span>{weather.humidity}%
                          </div>
                        )}
                        {weather.pressure != null && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <span>🔽</span>{weather.pressure} hPa
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 심판 + 시즌 */}
              <div className="flex flex-wrap gap-2">
                {analysis?.season && (
                  <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                    📅 {analysis.season}
                  </span>
                )}
                {game.referee && (
                  <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1.5 min-w-0">
                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{game.referee}</span>
                  </span>
                )}
              </div>
            </div>
          )}
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
              {tab === 'Analysis'   && <AnalysisTab    analysis={analysis} game={fullGame} />}
              {tab === 'Predict'    && <PoissonTab     analysis={analysis} game={fullGame} />}
              {tab === 'Lineup'     && <LineupTab      lineups={analysis.lineups ?? []} playerRatings={analysis.playerRatings} playerStatsMap={analysis.playerStatsMap ?? {}} onPlayerClick={(p: any) => setSelectedPlayer(p)} />}
              {tab === 'Absences'   && <InjuriesTab    injuries={analysis.injuries ?? []} game={fullGame} />}
              {tab === 'Stats'      && <StatsTab       statistics={analysis.statistics ?? []} xgHome={analysis.xgHome} xgAway={analysis.xgAway} events={analysis.events ?? []} game={fullGame} elapsed={live.elapsed} />}
              {tab === 'Form'       && <FormTab        homeLast20={analysis.homeLast20 ?? []} awayLast20={analysis.awayLast20 ?? []} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />}
              {tab === 'Standings'  && <StandingsTab   leagueId={analysis.leagueId ?? null} season={analysis.season ?? null} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />}
              {tab === 'Odds'       && <OddsTab        allBookmakerOdds={analysis.allBookmakerOdds ?? []} oddsOverUnder={analysis.oddsOverUnder ?? []} oddsBTTS={analysis.oddsBTTS ?? []} prediction={analysis.prediction} game={fullGame} />}
              {tab === 'Notes'      && <MemoTab        fixtureId={fixtureId} />}
              {tab === 'Chat'       && <ChatTab        fixtureId={fixtureId} />}
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

      {/* 선수 스탯 카드 팝업 */}
      {selectedPlayer && (
        <PlayerStatCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}
