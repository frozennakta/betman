"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Zap, RefreshCw, Search,
  Calendar, ChevronUp, ChevronDown, ArrowUpDown, X, Sun, Moon,
  Bell, BellOff, Star, ChevronLeft, ChevronRight, LayoutList, LayoutGrid,
} from 'lucide-react';
import MatchCard, { useFavorites } from '@/components/MatchCard';
import OddsCalculator from '@/components/OddsCalculator';
import { useTheme } from '@/context/ThemeContext';
import { countryFlag } from '@/components/AnalysisTabs';

type SortKey = 'time' | 'league' | 'country';

// 날짜 레이블 (접속자 로컬 타임존)
function dateLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((dDay - nDay) / 86400000);
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}

function makeGroups(games: any[], key: SortKey, reversed = false) {
  const byDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();
  const sorted = [...games].sort((a, b) => {
    if (key === 'league') return a.league.localeCompare(b.league) || byDate(a, b);
    if (key === 'country') return a.country.localeCompare(b.country) || byDate(a, b);
    return reversed ? byDate(b, a) : byDate(a, b);
  });
  const map = new Map<string, { key: string; label: string; games: any[] }>();
  for (const g of sorted) {
    const groupKey =
      key === 'time'    ? new Date(g.date).toDateString()
      : key === 'league'  ? g.league
      : g.country;
    if (!map.has(groupKey)) {
      const label = key === 'time' ? dateLabel(g.date) : groupKey;
      map.set(groupKey, { key: groupKey, label, games: [] });
    }
    map.get(groupKey)!.games.push(g);
  }
  return [...map.values()];
}

export default function HomePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(20);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showJumpLive, setShowJumpLive] = useState(false);

  // ── 컴팩트 모드 ───────────────────────────────────────────────────────────
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('betman-compact') === 'true'; } catch { return false; }
  });
  const toggleCompact = useCallback(() => {
    setCompact(prev => {
      const next = !prev;
      try { localStorage.setItem('betman-compact', String(next)); } catch {}
      return next;
    });
  }, []);

  // ── 국가/리그 필터 (기본 접힘) ───────────────────────────────────────────
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showCountryFilter, setShowCountryFilter] = useState(false);

  // ── 즐겨찾기 ─────────────────────────────────────────────────────────────
  const { favorites, toggle: toggleFav, isFav } = useFavorites();

  // ── 날짜 필터 (-1=어제 ~ +6=6일후) ──────────────────────────────────────
  const [dateOffset, setDateOffset] = useState(0);
  const offsetLabel = (offset: number) => {
    if (offset === -1) return 'Yesterday';
    if (offset === 0)  return 'Today';
    if (offset === 1)  return 'Tomorrow';
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  // ── 알림 ─────────────────────────────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('betman-notify-enabled') === 'true'; } catch { return false; }
  });
  const prevStatusRef = useRef<Record<string, string>>({});

  const toggleNotif = useCallback(async () => {
    if (!notifEnabled) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotifEnabled(true);
        try { localStorage.setItem('betman-notify-enabled', 'true'); } catch {}
      }
    } else {
      setNotifEnabled(false);
      try { localStorage.setItem('betman-notify-enabled', 'false'); } catch {}
    }
  }, [notifEnabled]);

  const { isLight, toggle: toggleTheme } = useTheme();

  const liveRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── 데이터 fetch ──────────────────────────────────────────────────────────
  const fetchGames = useCallback(async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        if (res.data.status === 'LOADING_INITIAL') {
          setInitialLoading(true);
        } else {
          const newGames: any[] = res.data.games;
          // 알림: PENDING → LIVE 전환 감지
          if (notifEnabled && Notification.permission === 'granted') {
            newGames.forEach(g => {
              const prev = prevStatusRef.current[g.id];
              const LIVE_SET = new Set(['1H','HT','2H','ET','BT','P','INT','LIVE','SUSP']);
              if (prev === 'PENDING' && LIVE_SET.has(g.rawStatus)) {
                new Notification(`🔴 ${g.homeTeam} vs ${g.awayTeam} - Match Started!`, {
                  body: `${g.country} · ${g.league}`,
                  tag: g.id,
                });
              }
            });
          }
          // 현재 상태 기록
          newGames.forEach(g => { prevStatusRef.current[g.id] = g.liveStatus ?? g.rawStatus; });
          setGames(newGames);
          setInitialLoading(false);
          setLastUpdated(new Date(res.data.lastUpdated || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, [notifEnabled]);

  useEffect(() => {
    fetchGames();
    const fetchInterval = setInterval(() => { fetchGames(); setCountdown(20); }, 20000);
    const cdInterval    = setInterval(() => setCountdown(p => p <= 1 ? 20 : p - 1), 1000);
    return () => { clearInterval(fetchInterval); clearInterval(cdInterval); };
  }, [fetchGames]);

  // ── 스크롤 이벤트 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      if (liveRef.current) {
        setShowJumpLive(liveRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── 키보드 단축키 "/" → 검색 포커스 ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchTerm('');
        setLeagueFilter('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── 파생 데이터 ───────────────────────────────────────────────────────────
  // ── 국가별 그룹 (필터 패널용) ─────────────────────────────────────────────
  const countryGroups = useMemo(() => {
    const map = new Map<string, { count: number; leagues: Map<string, number> }>();
    games.forEach(g => {
      if (!map.has(g.country)) map.set(g.country, { count: 0, leagues: new Map() });
      const entry = map.get(g.country)!;
      entry.count++;
      entry.leagues.set(g.league, (entry.leagues.get(g.league) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([country, { count, leagues }]) => ({
        country,
        flag: countryFlag(country),
        count,
        leagues: [...leagues.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, cnt]) => ({ name, count: cnt })),
      }));
  }, [games]);

  const LIVE_STATUS = new Set(['1H','HT','2H','ET','BT','P','INT','LIVE','SUSP']);
  const byDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

  // ── 검색/리그 필터만 (날짜 무관) — 라이브·예정용 ─────────────────────────
  const textFilteredGames = useMemo(() => {
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

  // ── 날짜 + 검색/리그 필터 — 종료경기용 ──────────────────────────────────
  const filteredGames = useMemo(() => {
    const target = new Date();
    target.setDate(target.getDate() + dateOffset);
    const targetStr = target.toDateString();
    return textFilteredGames.filter(g => new Date(g.date).toDateString() === targetStr);
  }, [textFilteredGames, dateOffset]);

  // 라이브: 날짜 무관
  const liveGames = useMemo(() =>
    textFilteredGames.filter(g => LIVE_STATUS.has(g.rawStatus)).sort(byDate),
  [textFilteredGames]);

  // 예정: 날짜 무관 — 오늘 이후 전체
  const upcomingGames = useMemo(() => {
    const now = new Date();
    return textFilteredGames.filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now).sort(byDate);
  }, [textFilteredGames]);

  // 종료: 선택된 날짜만
  const finishedGames = useMemo(() => {
    const now = new Date();
    return filteredGames.filter(g => g.liveStatus === 'FT' || (g.liveStatus === 'PENDING' && new Date(g.date) <= now)).sort((a, b) => byDate(b, a));
  }, [filteredGames]);

  const upcomingGroups = useMemo(() => makeGroups(upcomingGames, sortKey),        [upcomingGames, sortKey]);
  const finishedGroups = useMemo(() => makeGroups(finishedGames, 'time', true),   [finishedGames]);

  // ── 날짜별 총 경기 수 (배지용) ────────────────────────────────────────────
  const countForOffset = useCallback((offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const ds = d.toDateString();
    return games.filter(g => new Date(g.date).toDateString() === ds).length;
  }, [games]);

  // ── 즐겨찾기 경기 목록 ────────────────────────────────────────────────────
  const favoriteGames = useMemo(() => games.filter(g => isFav(g.id)), [games, favorites]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── 로딩 화면 ─────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[var(--bg-base)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/20"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">Syncing Data</h2>
        <p className="text-slate-400 font-medium">Please wait a moment.</p>
        <div className="mt-8 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ x: [-100, 200] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-24 h-full bg-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)]">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[200px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">

        {/* ── 헤더 (한 줄) ────────────────────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 상태 dot */}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />

            {/* 검색창 */}
            <div className="relative flex-1 min-w-[180px] max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                ref={searchRef}
                type="text"
                placeholder='Search teams, leagues, countries... ( / )'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 text-white text-xs font-medium pl-8 pr-8 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setLeagueFilter(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 상태 바 */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 shrink-0">
              <span>Total <span className="text-white">{games.length}</span> matches</span>
              <span className="text-slate-700">·</span>
              <span>Updated <span className="text-indigo-400">{lastUpdated || '--:--:--'}</span></span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${countdown <= 5 ? 'bg-orange-400 animate-ping' : 'bg-slate-600'}`} />
                <span className={countdown <= 5 ? 'text-orange-400' : ''}>{countdown}s</span>
              </span>
            </div>

            {/* 버튼들 */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={toggleNotif}
                title={notifEnabled ? 'Turn off notifications' : 'Turn on match start notifications'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                  notifEnabled
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/30'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                }`}
              >
                {notifEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-black">{notifEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-slate-400 hover:text-white"
                title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-black">{isLight ? 'DARK' : 'LIGHT'}</span>
              </button>
            </div>
          </div>

          {/* ── 종료경기 날짜 네비 + 국가/리그 필터 토글 ──────────────────── */}
          <div className="mt-4 space-y-2">
            {/* 종료경기 날짜 선택 + 필터 버튼 한 줄 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest shrink-0">FT</span>
              <button
                onClick={() => setDateOffset(v => Math.max(v - 1, -1))}
                disabled={dateOffset <= -1}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
                {([-1, 0, 1, 2, 3, 4, 5, 6] as const).map(offset => (
                  <button
                    key={offset}
                    onClick={() => setDateOffset(offset)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border whitespace-nowrap shrink-0 ${
                      dateOffset === offset
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                    }`}
                  >
                    {offsetLabel(offset)}
                    <span className={`text-[8px] ${dateOffset === offset ? 'text-indigo-200' : 'text-slate-600'}`}>
                      {countForOffset(offset)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDateOffset(v => Math.min(v + 1, 6))}
                disabled={dateOffset >= 6}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {/* 국가 필터 토글 */}
              <button
                onClick={() => setShowCountryFilter(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all shrink-0 ${
                  showCountryFilter || leagueFilter
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                }`}
              >
                {leagueFilter ? '🔍' : '🌍'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showCountryFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 국가 → 리그 2단계 필터 (접힘/펼침) */}
            <AnimatePresence initial={false}>
              {showCountryFilter && countryGroups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => { setLeagueFilter(''); setExpandedCountry(null); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                          leagueFilter === '' && expandedCountry === null
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                        }`}
                      >
                        All <span className="opacity-60">{games.length}</span>
                      </button>
                      {countryGroups.map(cg => (
                        <button
                          key={cg.country}
                          onClick={() => setExpandedCountry(expandedCountry === cg.country ? null : cg.country)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                            expandedCountry === cg.country
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                          }`}
                        >
                          {cg.flag && <span>{cg.flag}</span>}
                          <span className="truncate max-w-[100px]">{cg.country}</span>
                          <span className="opacity-50">{cg.count}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedCountry === cg.country ? 'rotate-180' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <AnimatePresence initial={false}>
                      {expandedCountry !== null && (() => {
                        const cg = countryGroups.find(c => c.country === expandedCountry);
                        if (!cg) return null;
                        return (
                          <motion.div
                            key={expandedCountry}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-1.5 pl-2 pt-1 pb-1 border-l-2 border-indigo-500/30">
                              {cg.leagues.map(lg => (
                                <button
                                  key={lg.name}
                                  onClick={() => setLeagueFilter(leagueFilter === lg.name ? '' : lg.name)}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all border ${
                                    leagueFilter === lg.name
                                      ? 'bg-indigo-500 border-indigo-500 text-white'
                                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                                  }`}
                                >
                                  <span className="truncate max-w-[160px]">{lg.name}</span>
                                  <span className="opacity-50">{lg.count}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading && games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin opacity-50 mb-4" />
            <p className="text-slate-600 font-black italic">FETCHING DATA...</p>
          </div>
        ) : (
          <div>

            {/* ── 즐겨찾기 섹션 ───────────────────────────────────────── */}
            {favoriteGames.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">Favorites</h2>
                  <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black text-amber-400">
                    {favoriteGames.length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {favoriteGames.map(g => (
                    <MatchCard
                      key={g.id}
                      game={g}
                      isFavorite={isFav(g.id)}
                      onToggleFav={toggleFav}
                      compact={compact}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── 메인 컨텐츠 ─────────────────────────────────────────── */}
            <div className="space-y-12">

              {/* LIVE */}
              {liveGames.length > 0 && (
                <section ref={liveRef as any}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-3 h-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Live</h2>
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-400">
                      {liveGames.length} live
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {liveGames.map(game => (
                      <MatchCard
                        key={game.id}
                        game={game}
                        isFavorite={isFav(game.id)}
                        onToggleFav={toggleFav}
                        compact={compact}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 예정 경기 */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <h2 className="text-xl font-black text-white tracking-tight">Upcoming</h2>
                    <span className="bg-white/5 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400">
                      {upcomingGames.length}
                    </span>
                  </div>
                  {/* 정렬 버튼 */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    <ArrowUpDown className="w-3 h-3 text-slate-600 ml-1.5" />
                    {([['time','Time'], ['league','League'], ['country','Country']] as [SortKey,string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSortKey(key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                          sortKey === key ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {upcomingGroups.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingGroups.map(group => {
                      const collapsed = collapsedGroups.has(group.key);
                      return (
                        <div key={group.key}>
                          {/* 그룹 헤더 */}
                          <button
                            onClick={() => toggleGroup(group.key)}
                            className="w-full flex items-center gap-3 mb-2 group"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 group-hover:text-slate-300 transition-colors">
                              {group.label} · {group.games.length} matches
                            </span>
                            <div className="h-px flex-1 bg-white/5" />
                            {collapsed
                              ? <ChevronDown className="w-3 h-3 text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
                              : <ChevronUp   className="w-3 h-3 text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
                            }
                          </button>
                          {/* 접기/펼치기 애니메이션 */}
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="grid gap-2">
                                  {group.games.map((g: any) => (
                                    <MatchCard
                                      key={g.id}
                                      game={g}
                                      isFavorite={isFav(g.id)}
                                      onToggleFav={toggleFav}
                                      compact={compact}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-20 text-center bg-[var(--bg-card)] rounded-3xl border border-white/5 border-dashed">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', opacity: 0.4 }}>No matches found.</p>
                    <button
                      onClick={() => { setSearchTerm(''); setLeagueFilter(''); }}
                      className="mt-4 text-xs font-black text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </section>

              {/* 종료 경기 (날짜별 그룹) */}
              {finishedGroups.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-slate-600 rounded-full" />
                      <h2 className="text-xl font-black text-slate-500 tracking-tight">Finished</h2>
                      <span className="bg-white/5 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-600">
                        {finishedGames.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 opacity-60">
                    {finishedGroups.map(group => {
                      const collapsed = collapsedGroups.has(`fin_${group.key}`);
                      return (
                        <div key={group.key}>
                          <button
                            onClick={() => toggleGroup(`fin_${group.key}`)}
                            className="w-full flex items-center gap-3 mb-2 group"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 group-hover:text-slate-400 transition-colors">
                              {group.label} finished · {group.games.length} matches
                            </span>
                            <div className="h-px flex-1 bg-white/5" />
                            {collapsed
                              ? <ChevronDown className="w-3 h-3 text-slate-700 shrink-0" />
                              : <ChevronUp   className="w-3 h-3 text-slate-700 shrink-0" />
                            }
                          </button>
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="grid gap-2">
                                  {group.games.map((g: any) => (
                                    <MatchCard
                                      key={g.id}
                                      game={g}
                                      isFavorite={isFav(g.id)}
                                      onToggleFav={toggleFav}
                                      compact={compact}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 items-end">
        {/* 배당 계산기 FAB */}
        <OddsCalculator />

        <AnimatePresence>
          {showJumpLive && liveGames.length > 0 && (
            <motion.button
              key="jump-live"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={() => liveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-400 rounded-2xl shadow-xl shadow-red-500/30 text-white text-sm font-black transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Live {liveGames.length}
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="scroll-top"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-3 bg-[var(--bg-card)] hover:bg-white/10 border border-white/10 rounded-2xl shadow-xl text-white transition-colors self-end"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
