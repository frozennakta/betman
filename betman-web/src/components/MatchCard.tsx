"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { BIG_LEAGUES, STATUS_LABEL, countryFlag, useLocalDateTime } from '@/components/AnalysisTabs';

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

export default function MatchCard({ game, isFavorite, onToggleFav }: MatchCardProps) {
  const isLive     = game.liveStatus !== 'PENDING' && game.liveStatus !== 'FT';
  const isFinished = game.liveStatus === 'FT';
  const isBig      = BIG_LEAGUES.has(game.league);
  const liveMinute = useLiveMinute(game);
  const localDT    = useLocalDateTime(game.date);
  const flag       = countryFlag(game.country);
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
    if (game.venue?.name)  p.set('venue',   game.venue.name);
    if (game.venue?.city)  p.set('city',    game.venue.city);
    if (game.referee)      p.set('referee', game.referee);
    window.open(`/match/${fixtureId}?${p.toString()}`, '_blank');
  };

  return (
    <div
      onClick={openMatchPage}
      className={`relative overflow-hidden cursor-pointer bg-[var(--bg-card)] border rounded-2xl transition-all ${
        scoreFlash
          ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10'
          : isBig
            ? 'border-amber-500/20 hover:border-amber-500/40'
            : 'border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.03]'
      }`}
    >
      {/* 빅리그 왼쪽 악센트 */}
      {isBig && <div className="absolute left-0 inset-y-0 w-0.5 bg-amber-400/50 rounded-l-2xl" />}

      <div className="px-3.5 sm:px-4 pt-2.5 pb-2 flex flex-col gap-1.5">
        {/* 상단: 시간 + 리그 배지 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white/5 rounded border border-white/10 px-1.5 py-0.5 shrink-0">
            {isLive ? (
              <span className="text-[10px] font-black text-red-400 tabular-nums leading-none">
                {liveMinute || `${game.elapsed ?? '–'}'`}
              </span>
            ) : isFinished ? (
              <span className="text-[10px] font-black text-slate-500 leading-none">FT</span>
            ) : (
              <span className="text-[10px] font-black text-indigo-300 tabular-nums leading-none">
                {localDT.date ? `${localDT.date} ` : ''}{localDT.time || game.matchTime}
              </span>
            )}
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase px-1.5 py-0.5 bg-white/5 rounded border border-white/5 truncate max-w-[200px]">
            {flag ? `${flag} ` : ''}{isBig ? '★ ' : ''}{game.country} · {game.league}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded border border-red-500/20 shrink-0">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
              {STATUS_LABEL[game.liveStatus] ?? game.liveStatus}
            </span>
          )}
          {scoreFlash && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black rounded border border-red-500/30 shrink-0 animate-pulse">
              GOAL!
            </span>
          )}
        </div>

        {/* 메인: 홈팀 — 스코어 — 원정팀 */}
        {(() => {
          const hasScore = (isLive || isFinished) && game.homeScore !== null;
          const hWin = hasScore && game.homeScore > game.awayScore;
          const aWin = hasScore && game.awayScore > game.homeScore;
          return (
            <div className="flex items-center gap-2">
              <span className={`flex-1 text-sm font-black text-right truncate ${hWin ? 'text-white' : aWin ? 'text-slate-500' : 'text-white'}`}>
                {game.homeTeam}
              </span>
              <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                hasScore
                  ? scoreFlash ? 'bg-red-500/20 border-red-500/40' : 'bg-black/40 border-white/10'
                  : 'bg-white/5 border-white/5'
              }`}>
                {hasScore ? (
                  <>
                    <span className={`text-base font-black tabular-nums w-4 text-center ${hWin ? 'text-red-400' : aWin ? 'text-slate-400' : 'text-white'}`}>{game.homeScore}</span>
                    <span className="text-slate-500 font-black text-xs">:</span>
                    <span className={`text-base font-black tabular-nums w-4 text-center ${aWin ? 'text-red-400' : hWin ? 'text-slate-400' : 'text-white'}`}>{game.awayScore}</span>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-slate-600 px-0.5">VS</span>
                )}
              </div>
              <span className={`flex-1 text-sm font-black truncate ${aWin ? 'text-white' : hWin ? 'text-slate-500' : 'text-white'}`}>
                {game.awayTeam}
              </span>

              {/* 즐겨찾기 버튼 */}
              <div className="flex items-center gap-1 shrink-0">
                {onToggleFav && (
                  <button
                    onClick={e => { e.stopPropagation(); onToggleFav(game.id); }}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Star className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                  </button>
                )}
                <span className="text-[9px] font-black text-slate-700">→</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 라이브 진행 바 */}
      {liveProgressPct !== null && (
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
            style={{ width: `${liveProgressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
