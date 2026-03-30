"use client";

import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';

const LEAGUES = [
  { id: 39,  name: 'Premier League',   country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',          country: 'Spain',   flag: '🇪🇸' },
  { id: 135, name: 'Serie A',          country: 'Italy',   flag: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',       country: 'Germany', flag: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',          country: 'France',  flag: '🇫🇷' },
  { id: 2,   name: 'Champions League', country: 'Europe',  flag: '🇪🇺' },
  { id: 3,   name: 'Europa League',    country: 'Europe',  flag: '🇪🇺' },
  { id: 292, name: 'K League 1',       country: 'Korea',   flag: '🇰🇷' },
  { id: 98,  name: 'J1 League',        country: 'Japan',   flag: '🇯🇵' },
];

const DEFAULT_SEASON = String(new Date().getFullYear() - 1);

function FormBadge({ ch }: { ch: string }) {
  const cls =
    ch === 'W' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    ch === 'L' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
    'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return (
    <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black border ${cls}`}>
      {ch}
    </span>
  );
}

function rowHighlight(rank: number, total: number): string {
  if (rank <= 4) return 'border-l-2 border-l-indigo-500';
  if (rank <= 6) return 'border-l-2 border-l-orange-500';
  if (total >= 18 && rank >= total - 2) return 'border-l-2 border-l-red-500';
  return '';
}

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);
  const [standings, setStandings] = useState<any[]>([]);
  const [leagueInfo, setLeagueInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setStandings([]);
    fetch(`/api/standings?league=${selectedLeague.id}&season=${DEFAULT_SEASON}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStandings(d.standings?.[0] ?? []);
          setLeagueInfo(d.leagueInfo ?? null);
        } else {
          setError(d.message ?? '데이터 로드 실패');
        }
      })
      .catch(() => setError('네트워크 오류'))
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[200px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* 상단 광고 슬롯 */}
        <div className="w-full h-[90px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white tracking-tighter">리그 순위표</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">{DEFAULT_SEASON}/{String(Number(DEFAULT_SEASON) + 1).slice(2)} 시즌 최신 순위</p>
        </div>

        {/* 리그 선택 탭 — 가로 스크롤 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {LEAGUES.map(lg => (
            <button
              key={lg.id}
              onClick={() => setSelectedLeague(lg)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap border transition-all shrink-0 ${
                selectedLeague.id === lg.id
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <span>{lg.flag}</span>
              <span>{lg.name}</span>
            </button>
          ))}
        </div>

        {/* 리그 이름 */}
        {leagueInfo && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-black text-white">{leagueInfo.name}</span>
            {leagueInfo.country && (
              <span className="text-[10px] font-bold text-slate-500">{leagueInfo.country}</span>
            )}
          </div>
        )}

        {/* 상태 */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-black">순위 데이터 로딩 중...</span>
          </div>
        )}

        {error && !loading && (
          <div className="py-12 text-center text-red-400 text-sm font-bold bg-red-500/10 rounded-2xl border border-red-500/20">
            {error}
          </div>
        )}

        {/* 순위 테이블 */}
        {!loading && standings.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-white/5 rounded-2xl overflow-hidden">
            {/* 범례 */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-black/10">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-l-2 border-l-indigo-500 bg-indigo-500/10" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">UCL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-l-2 border-l-orange-500 bg-orange-500/10" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">UEL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-l-2 border-l-red-500 bg-red-500/10" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">강등권</span>
              </div>
            </div>

            {/* 헤더 행 */}
            <div className="grid items-center text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 py-2 border-b border-white/5"
              style={{ gridTemplateColumns: '2rem 1fr 2.5rem 2rem 2rem 2rem 2rem 2rem 2.5rem 2.5rem 5rem' }}>
              <span className="text-center">#</span>
              <span>팀</span>
              <span className="text-center">경기</span>
              <span className="text-center">승</span>
              <span className="text-center">무</span>
              <span className="text-center">패</span>
              <span className="text-center">득</span>
              <span className="text-center">실</span>
              <span className="text-center">득실</span>
              <span className="text-center">승점</span>
              <span className="text-center">최근5</span>
            </div>

            {standings.map((t) => (
              <div
                key={t.rank}
                className={`grid items-center px-4 py-2.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${rowHighlight(t.rank, standings.length)}`}
                style={{ gridTemplateColumns: '2rem 1fr 2.5rem 2rem 2rem 2rem 2rem 2rem 2.5rem 2.5rem 5rem' }}
              >
                <span className="text-[11px] font-black text-slate-500 text-center tabular-nums">{t.rank}</span>
                <span className="text-xs font-bold text-white truncate pr-2">{t.team}</span>
                <span className="text-[11px] font-bold text-slate-400 text-center tabular-nums">{t.played}</span>
                <span className="text-[11px] font-bold text-emerald-400 text-center tabular-nums">{t.win}</span>
                <span className="text-[11px] font-bold text-slate-400 text-center tabular-nums">{t.draw}</span>
                <span className="text-[11px] font-bold text-red-400 text-center tabular-nums">{t.lose}</span>
                <span className="text-[11px] font-bold text-slate-300 text-center tabular-nums">{t.goalsFor}</span>
                <span className="text-[11px] font-bold text-slate-300 text-center tabular-nums">{t.goalsAgainst}</span>
                <span className={`text-[11px] font-black text-center tabular-nums ${(t.goalsDiff ?? 0) > 0 ? 'text-emerald-400' : (t.goalsDiff ?? 0) < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {(t.goalsDiff ?? 0) > 0 ? `+${t.goalsDiff}` : t.goalsDiff}
                </span>
                <span className="text-[13px] font-black text-white text-center tabular-nums">{t.points}</span>
                <div className="flex gap-0.5 justify-center">
                  {(t.form ?? '').split('').slice(-5).map((ch: string, i: number) => (
                    <FormBadge key={i} ch={ch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && standings.length === 0 && (
          <div className="py-16 text-center text-slate-600 text-sm font-bold">
            순위 데이터가 없습니다.
          </div>
        )}

        {/* 하단 광고 슬롯 */}
        <div className="w-full h-[250px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mt-8">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
