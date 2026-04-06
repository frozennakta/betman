"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Calendar, ChevronUp, ChevronRight, X, Star } from 'lucide-react';
import MatchCard, { useFavorites } from '@/components/MatchCard';
import OddsCalculator from '@/components/OddsCalculator';
import { getIso2 } from '@/components/AnalysisTabs';

type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

const TOP_LEAGUES = [
  'UEFA Champions League',
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'UEFA Europa League',
  'UEFA Conference League',
  'FIFA World Cup',
  'Copa Libertadores',
  'AFC Champions League',
];

const LIVE_STATUS = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE', 'SUSP']);

function getDateStrip() {
  const days = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({ offset: i, dayName, date: `${mm}/${dd}` });
  }
  return days;
}

export default function HomePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [dateOffset, setDateOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [countdown, setCountdown] = useState(20);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const { favorites, toggle: toggleFav, isFav } = useFavorites();

  const fetchGames = useCallback(async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success && res.data.games) {
        setGames(res.data.games);
        setLastUpdated(
          new Date(res.data.lastUpdated || Date.now()).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    const fi = setInterval(() => { fetchGames(); setCountdown(20); }, 20000);
    const ci = setInterval(() => setCountdown(p => p <= 1 ? 20 : p - 1), 1000);
    return () => { clearInterval(fi); clearInterval(ci); };
  }, [fetchGames]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dateStrip = useMemo(() => getDateStrip(), []);

  // 검색 + 리그 필터
  const baseFiltered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return games.filter(g => {
      const textOk = !s ||
        g.homeTeam.toLowerCase().includes(s) ||
        g.awayTeam.toLowerCase().includes(s) ||
        g.league.toLowerCase().includes(s) ||
        g.country.toLowerCase().includes(s);
      const leagueOk = !leagueFilter || g.league === leagueFilter;
      return textOk && leagueOk;
    });
  }, [games, searchTerm, leagueFilter]);

  const liveCount = useMemo(
    () => baseFiltered.filter(g => LIVE_STATUS.has(g.rawStatus)).length,
    [baseFiltered]
  );
  const upcomingCount = useMemo(() => {
    const now = new Date();
    return baseFiltered.filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now).length;
  }, [baseFiltered]);

  const countForOffset = useCallback((offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const ds = d.toDateString();
    return baseFiltered.filter(g => new Date(g.date).toDateString() === ds).length;
  }, [baseFiltered]);

  // 상태 필터 + 날짜 필터로 보여줄 경기 결정
  const visibleGames = useMemo(() => {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + dateOffset);
    const targetStr = target.toDateString();
    const byTime = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

    if (statusFilter === 'live') {
      return baseFiltered.filter(g => LIVE_STATUS.has(g.rawStatus)).sort(byTime);
    }
    if (statusFilter === 'upcoming') {
      return baseFiltered.filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now).sort(byTime);
    }
    if (statusFilter === 'finished') {
      return baseFiltered
        .filter(g => new Date(g.date).toDateString() === targetStr && g.liveStatus === 'FT')
        .sort((a, b) => byTime(b, a));
    }
    // all: live → today upcoming → finished (선택 날짜)
    const live = baseFiltered.filter(g => LIVE_STATUS.has(g.rawStatus)).sort(byTime);
    const todayStr = new Date().toDateString();
    const upcoming = baseFiltered
      .filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now && new Date(g.date).toDateString() === todayStr)
      .sort(byTime);
    const finished = baseFiltered
      .filter(g => new Date(g.date).toDateString() === targetStr && g.liveStatus === 'FT')
      .sort((a, b) => byTime(b, a));
    return [...live, ...upcoming, ...finished];
  }, [baseFiltered, statusFilter, dateOffset]);

  // 리그별 그룹
  const leagueGroups = useMemo(() => {
    const map = new Map<string, { league: string; country: string; leagueId: number | null; games: any[] }>();
    for (const g of visibleGames) {
      if (!map.has(g.league)) {
        map.set(g.league, { league: g.league, country: g.country, leagueId: g.leagueId ?? null, games: [] });
      }
      map.get(g.league)!.games.push(g);
    }
    return [...map.values()];
  }, [visibleGames]);

  // 즐겨찾기
  const favoriteGames = useMemo(() => games.filter(g => isFav(g.id)), [games, favorites]);

  const SIDEBAR_W = sidebarOpen ? 220 : 60;

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">

      {/* ── Left Sidebar ────────────────────────────────────────────── */}
      <aside
        className="fixed left-0 z-30 flex flex-col bg-[var(--bg-card)] border-r border-white/[0.06] overflow-y-auto no-scrollbar transition-all duration-300"
        style={{ top: 96, width: SIDEBAR_W, height: 'calc(100vh - 96px)' }}
      >
        {/* 접기 버튼 */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center justify-end p-3 text-slate-600 hover:text-slate-400 transition-colors shrink-0"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Top Leagues */}
        <div className="px-2 space-y-0.5 pb-4">
          {sidebarOpen && (
            <div className="px-2 pb-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">Top Leagues</div>
          )}
          <button
            onClick={() => setLeagueFilter('')}
            title="All Leagues"
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all ${
              !leagueFilter ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <span className="text-lg shrink-0">🌍</span>
            {sidebarOpen && <span className="text-[11px] font-bold truncate">All Leagues</span>}
          </button>
          {TOP_LEAGUES.map(lg => (
            <button
              key={lg}
              onClick={() => setLeagueFilter(leagueFilter === lg ? '' : lg)}
              title={lg}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all ${
                leagueFilter === lg
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base shrink-0">🏆</span>
              {sidebarOpen && <span className="text-[11px] font-bold truncate">{lg}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 transition-all duration-300" style={{ marginLeft: SIDEBAR_W }}>

        {/* ── 상단 고정 바 ─────────────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-[var(--bg-base)]/95 backdrop-blur-xl border-b border-white/[0.06]">

          {/* 날짜 스트립 + 검색 */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
            <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
              {dateStrip.map(d => (
                <button
                  key={d.offset}
                  onClick={() => { setDateOffset(d.offset); }}
                  className={`flex flex-col items-center px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                    dateOffset === d.offset
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-[9px] font-black tracking-wider">
                    {d.offset === 0 ? 'TODAY' : d.dayName}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums">{d.date}</span>
                  <span className={`text-[8px] font-bold tabular-nums ${dateOffset === d.offset ? 'text-indigo-200' : 'text-slate-700'}`}>
                    {countForOffset(d.offset) || ''}
                  </span>
                </button>
              ))}
            </div>

            {/* 검색 */}
            <div className="relative shrink-0 w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 text-white text-[11px] font-medium pl-7 pr-6 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 갱신 카운트 */}
            <div className="hidden lg:flex items-center gap-1 text-[10px] font-bold text-slate-600 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${countdown <= 5 ? 'bg-orange-400 animate-ping' : 'bg-slate-700'}`} />
              <span className={countdown <= 5 ? 'text-orange-400' : ''}>{countdown}s</span>
            </div>
          </div>

          {/* 상태 필터 탭 */}
          <div className="flex items-center gap-1.5 px-4 py-2">
            {([
              { key: 'all' as const,      label: 'All',      count: visibleGames.length },
              { key: 'live' as const,     label: 'Live',     count: liveCount },
              { key: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
              { key: 'finished' as const, label: 'Finished', count: null },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                  statusFilter === tab.key
                    ? tab.key === 'live'
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                }`}
              >
                {tab.key === 'live' && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${liveCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
                )}
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    tab.key === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

            <div className="ml-auto text-[10px] font-bold text-slate-600 hidden sm:block">
              Updated <span className="text-slate-500">{lastUpdated || '--:--:--'}</span>
            </div>
          </div>
        </div>

        {/* ── 경기 목록 ──────────────────────────────────────────────── */}
        <div className="p-4">
          {loading && games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin opacity-50 mb-4" />
              <p className="text-slate-600 font-black text-sm">FETCHING DATA...</p>
            </div>
          ) : (
            <div className="space-y-3">

              {/* 즐겨찾기 (All 탭에서만) */}
              {statusFilter === 'all' && favoriteGames.length > 0 && (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-amber-500/20 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="text-[12px] font-black text-white">Favorites</span>
                    <span className="ml-auto text-[10px] text-slate-600">{favoriteGames.length} matches</span>
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {favoriteGames.map(g => (
                      <MatchCard key={g.id} game={g} isFavorite={isFav(g.id)} onToggleFav={toggleFav} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* 리그 그룹 */}
              {leagueGroups.length === 0 ? (
                <div className="py-20 text-center text-slate-600 font-bold text-sm">No matches found</div>
              ) : (
                leagueGroups.map(group => {
                  const iso2 = getIso2(group.country);
                  return (
                    <div key={group.league} className="bg-[var(--bg-card)] rounded-2xl border border-white/[0.06] overflow-hidden">
                      {/* 리그 헤더 */}
                      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.04]">
                        {group.leagueId ? (
                          <img
                            src={`https://media.api-sports.io/football/leagues/${group.leagueId}.png`}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-base shrink-0">🏆</span>
                        )}
                        <span className="text-[12px] font-black text-white truncate">{group.league}</span>
                        {iso2 && (
                          <img
                            src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`}
                            alt={group.country}
                            className="w-4 h-3 object-cover rounded-sm shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="text-[10px] text-slate-600 ml-auto shrink-0">{group.games.length}</span>
                      </div>
                      {/* 경기 목록 */}
                      <div className="divide-y divide-white/[0.03]">
                        {group.games.map(g => (
                          <MatchCard
                            key={g.id}
                            game={g}
                            isFavorite={isFav(g.id)}
                            onToggleFav={toggleFav}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FABs ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 items-end">
        <OddsCalculator />
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="scroll-top"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-3 bg-[var(--bg-card)] hover:bg-white/10 border border-white/10 rounded-2xl shadow-xl text-white transition-colors"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
