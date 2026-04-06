"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BIG_LEAGUES, STATUS_LABEL, countryFlag, useLocalDateTime, getCountryDisplay } from '@/components/AnalysisTabs';
import { useTheme } from '@/context/ThemeContext';

// ── 즐겨찾기 훅 ──────────────────────────────────────────────────────────────
function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('betman-favorites');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem('betman-favorites', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  return { favorites, toggle, isFav: (id: string) => favorites.has(id) };
}

interface MatchCardProps {
  game: any;
  isFavorite?: boolean;
  onToggleFav?: (id: string) => void;
  compact?: boolean;
}

// ── 라이브 분 표기 ────────────────────────────────────────────────────────────
function useLiveMinute(game: any): string {
  if (game.liveStatus === 'PENDING' || game.liveStatus === 'FT') return '';
  if (game.rawStatus === 'HT') return 'HT';
  if (game.rawStatus === 'BT') return 'BT';
  if (game.rawStatus === 'ET') return 'ET';
  const e = game.elapsed;
  if (e == null) return '';
  if (e > 90) return '90+';
  return `${e}'`;
}

export { useFavorites };

export default function MatchCard({ game, isFavorite, onToggleFav, compact = false }: MatchCardProps) {
  const { isTomatoMode } = useTheme();
  const isLive     = game.liveStatus !== 'PENDING' && game.liveStatus !== 'FT';
  const isFinished = game.liveStatus === 'FT';
  const isBig      = BIG_LEAGUES.has(game.league);
  const liveMinute = useLiveMinute(game);
  const localDT    = useLocalDateTime(game.date);
  const { code, iso2 } = getCountryDisplay(game.country || '');
  const fixtureId  = game.id?.replace('fixture_', '');

  // 골 스코어 변경 감지 → 플래시
  const prevScore = useRef<{ home: number; away: number } | null>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  useEffect(() => {
    if (prevScore.current === null) {
      prevScore.current = { home: game.homeScore, away: game.awayScore };
      return;
    }
    if (prevScore.current.home !== game.homeScore || prevScore.current.away !== game.awayScore) {
      setScoreFlash(true);
      // 토마토 + 에메랄드 컨페티 (골 축포) - Tomato 모드에서만 실행
      if (isTomatoMode) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#f87171', '#10b981', '#34d399', '#ffffff'],
            zIndex: 9999
          });
        } catch {}
      }

      prevScore.current = { home: game.homeScore, away: game.awayScore };
      const t = setTimeout(() => setScoreFlash(false), 3000);
      return () => clearTimeout(t);
    }
  }, [game.homeScore, game.awayScore]);

  const liveProgressPct = isLive && typeof game.elapsed === 'number'
    ? Math.min((game.elapsed / 90) * 100, 100)
    : null;

  const openMatchPage = () => {
    const p = new URLSearchParams({
      home:    game.homeTeam  ?? '',
      away:    game.awayTeam  ?? '',
      league:  game.league    ?? '',
      country: game.country   ?? '',
      status:  game.liveStatus ?? 'PENDING',
      time:    game.matchTime ?? '',
      date:    game.date      ?? '',
      raw:     game.rawStatus ?? '',
    });
    if (game.homeScore !== null && game.homeScore !== undefined) p.set('hs', String(game.homeScore));
    if (game.awayScore !== null && game.awayScore !== undefined) p.set('as', String(game.awayScore));
    if (game.elapsed   !== null && game.elapsed   !== undefined) p.set('elapsed', String(game.elapsed));
    if (game.venue?.name)    p.set('venue',      game.venue.name);
    if (game.venue?.city)    p.set('city',       game.venue.city);
    if (game.referee)        p.set('referee',    game.referee);
    if (game.homeTeamId)     p.set('homeTeamId', String(game.homeTeamId));
    if (game.awayTeamId)     p.set('awayTeamId', String(game.awayTeamId));
    window.open(`/match/${fixtureId}?${p.toString()}`, '_blank');
  };

  const cardBaseCls = isTomatoMode 
    ? 'cursor-pointer bg-[var(--bg-card)] border border-white/5 rounded-2xl transition-all duration-300 transform active:scale-[0.98] hover:shadow-2xl'
    : 'cursor-pointer bg-white border border-zinc-200 rounded-2xl transition-all hover:shadow-lg active:scale-[0.98]';
    
  const flashCls = isTomatoMode
    ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    : 'border-red-200 bg-red-50 shadow-lg shadow-red-500/5';
    
  const defaultBg = isTomatoMode && isBig
    ? 'border-amber-500/20 shadow-xl shadow-amber-500/5'
    : isTomatoMode ? 'border-white/5' : 'border-zinc-200';

  return (
    <div
      onClick={openMatchPage}
      className={`relative overflow-hidden transition-all duration-300 ${cardBaseCls} ${
        scoreFlash ? flashCls : defaultBg
      }`}
    >
      {/* 빅리그 왼쪽 악센트 */}
      {isBig && <div className="absolute left-0 inset-y-0 w-0.5 bg-amber-400/50 rounded-l-2xl" />}

      {/* 상단 행: 시간 + 국가코드 + 리그명 (잘림 없이 1줄) + 액션 버튼 */}
      <div className={`flex items-center gap-2 ${compact ? 'px-2 pt-1 pb-0.5' : 'px-3 sm:px-4 pt-2 pb-0.5'}`}>
        <span className={`text-[12px] sm:text-[13px] font-black tabular-nums shrink-0 ${isTomatoMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          {isLive ? (liveMinute || `${game.elapsed ?? '–'}'`) : isFinished ? 'FT' : (localDT.time || game.matchTime)}
        </span>
        <span className={`text-[9px] font-black shrink-0 px-1 py-0.5 rounded flex items-center gap-0.5 ${isTomatoMode ? 'text-slate-500 bg-white/5' : 'text-slate-500 bg-zinc-100'}`}>
          {iso2 && (
            <img
              src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`}
              alt={iso2}
              className="w-4 h-3 object-cover rounded-sm shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {code}
        </span>
        <span className={`text-[10px] sm:text-[11px] font-medium flex-1 leading-none ${isTomatoMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {game.league}
        </span>
        {/* 버튼들 */}
        <div className="flex items-center gap-0 shrink-0">
          {onToggleFav && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFav(game.id); }}
              className={`p-1.5 rounded-lg transition-colors ${isTomatoMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            >
              <Star className={`w-3 h-3 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); openMatchPage(); }}
            className={`p-1.5 rounded-lg transition-colors ${isTomatoMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            title="Match Analysis"
          >
            <BarChart3 className={`w-3 h-3 ${isTomatoMode ? 'text-indigo-400' : 'text-indigo-400'}`} />
          </button>
        </div>
      </div>

      {/* 하단 행: 홈팀 — 스코어 — 원정팀 */}
      <div className={`flex items-center gap-2 sm:gap-4 ${compact ? 'px-2 pb-1' : 'px-3 sm:px-4 pb-2'}`}>
        {(() => {
          const hasScore = (isLive || isFinished) && game.homeScore != null;
          const hScore = game.homeScore ?? 0;
          const aScore = game.awayScore ?? 0;
          const hWin = hasScore && hScore > aScore;
          const aWin = hasScore && aScore > hScore;
          
          const homeScoreColor = hWin ? 'text-red-500' : aWin ? (isTomatoMode ? 'text-slate-500' : 'text-slate-400') : (isTomatoMode ? 'text-white' : 'text-slate-800');
          const awayScoreColor = aWin ? 'text-red-500' : hWin ? (isTomatoMode ? 'text-slate-500' : 'text-slate-400') : (isTomatoMode ? 'text-white' : 'text-slate-800');

          const homeLogo = game.homeTeamId ? `https://media.api-sports.io/football/teams/${game.homeTeamId}.png` : null;
          const awayLogo = game.awayTeamId ? `https://media.api-sports.io/football/teams/${game.awayTeamId}.png` : null;

          return (
            <>
              {/* 홈팀 */}
              <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                <span className={`text-[13px] sm:text-[14px] font-black text-right truncate ${
                  isTomatoMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {game.homeTeam}
                </span>
                {homeLogo && (
                  <img src={homeLogo} alt="" className="w-5 h-5 shrink-0 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>

              {/* 스코어 */}
              <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border tabular-nums transition-all ${
                isTomatoMode
                  ? (scoreFlash ? 'bg-red-500/20 border-red-500/40' : 'bg-black/30 border-white/5')
                  : (scoreFlash ? 'bg-red-50 border-red-200' : 'bg-zinc-100 border-zinc-200')
              }`}>
                <span className={`text-[13px] sm:text-[14px] font-black min-w-[10px] text-center ${homeScoreColor}`}>{hScore}</span>
                <span className={`font-bold text-[10px] ${isTomatoMode ? 'text-slate-600' : 'text-slate-300'}`}>:</span>
                <span className={`text-[13px] sm:text-[14px] font-black min-w-[10px] text-center ${awayScoreColor}`}>{aScore}</span>
              </div>

              {/* 원정팀 */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                {awayLogo && (
                  <img src={awayLogo} alt="" className="w-5 h-5 shrink-0 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span className={`text-[13px] sm:text-[14px] font-black text-left truncate ${
                  isTomatoMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {game.awayTeam}
                </span>
              </div>
            </>
          );
        })()}
      </div>

      {/* 모바일 하단 배당 정보 (컴팩트 모드가 아닐 때만) */}
      {!compact && game.homeOdds != null && (
        <div className="flex items-center gap-3 px-4 pb-2 ml-[80px] sm:ml-[115px] opacity-60">
          {[
            { l: 'H', v: game.homeOdds, c: 'text-indigo-400' },
            { l: 'D', v: game.drawOdds, c: 'text-slate-400' },
            { l: 'A', v: game.awayOdds, c: 'text-orange-400' }
          ].map(o => (
            <span key={o.l} className="text-[9px] font-black tracking-tighter">
              <span className={o.c}>{o.l}</span> {o.v}
            </span>
          ))}
        </div>
      )}

      {/* 라이브 진행 바 */}
      {liveProgressPct !== null && (
        <div className={`h-[3px] absolute bottom-0 left-0 right-0 ${isTomatoMode ? 'bg-white/5' : 'bg-black-[3%]'}`}>
          <div
            className={`h-full transition-all duration-1000 ${isTomatoMode ? 'bg-red-500' : 'bg-red-500/70'}`}
            style={{ width: `${liveProgressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
