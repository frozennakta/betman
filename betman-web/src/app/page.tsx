"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, TrendingUp, Zap, RefreshCw, Search, ShieldCheck, Globe,
  Calendar, Radio, ChevronUp, ChevronDown, ArrowUpDown, X, Sun, Moon,
} from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import { useTheme } from '@/context/ThemeContext';

type SortKey = 'time' | 'league' | 'country';

// 날짜 레이블 (접속자 로컬 타임존)
function dateLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((dDay - nDay) / 86400000);
  if (diff === -1) return '어제';
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
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

  const { isLight, toggle: toggleTheme } = useTheme();

  const liveRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── 데이터 fetch ──────────────────────────────────────────────────────────
  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        if (res.data.status === 'LOADING_INITIAL') {
          setInitialLoading(true);
        } else {
          setGames(res.data.games);
          setInitialLoading(false);
          setLastUpdated(new Date(res.data.lastUpdated || Date.now()).toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const fetchInterval = setInterval(() => { fetchGames(); setCountdown(20); }, 20000);
    const cdInterval    = setInterval(() => setCountdown(p => p <= 1 ? 20 : p - 1), 1000);
    return () => { clearInterval(fetchInterval); clearInterval(cdInterval); };
  }, []);

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
  const popularLeagues = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach(g => counts.set(g.league, (counts.get(g.league) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l]) => l);
  }, [games]);

  const filteredGames = useMemo(() => {
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

  const LIVE = new Set(['1H','HT','2H','ET','BT','P','INT','LIVE','SUSP']);
  const byDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

  const liveGames     = useMemo(() => filteredGames.filter(g => LIVE.has(g.rawStatus)).sort(byDate),  [filteredGames]);
  const upcomingGames = useMemo(() => {
    const now = new Date();
    return filteredGames.filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now).sort(byDate);
  }, [filteredGames]);
  const finishedGames = useMemo(() => {
    const now = new Date();
    return filteredGames.filter(g => g.liveStatus === 'FT' || (g.liveStatus === 'PENDING' && new Date(g.date) <= now)).sort((a, b) => byDate(b, a));
  }, [filteredGames]);

  const upcomingGroups = useMemo(() => makeGroups(upcomingGames, sortKey),        [upcomingGames, sortKey]);
  const finishedGroups = useMemo(() => makeGroups(finishedGames, 'time', true),   [finishedGames]);

  const todayCount    = useMemo(() => { const t = new Date().toDateString(); return games.filter(g => new Date(g.date).toDateString() === t).length; }, [games]);
  const tomorrowCount = useMemo(() => { const d = new Date(); d.setDate(d.getDate()+1); const t = d.toDateString(); return games.filter(g => new Date(g.date).toDateString() === t).length; }, [games]);

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
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">데이터 동기화 중</h2>
        <p className="text-slate-400 font-medium">잠시만 기다려 주세요.</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* ── 헤더 ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">System Operational</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2">실시간 데이터 레이더</h1>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">전세계 800+ 리그 실시간 스코어 · 분석 · 라인업</p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              {/* 다크/라이트 토글 */}
              <div className="flex justify-end">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-slate-400 hover:text-white"
                  title={isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
                >
                  {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="text-[11px] font-black">{isLight ? 'DARK' : 'LIGHT'}</span>
                </button>
              </div>
              {/* 검색창 */}
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder='팀, 리그, 국가 검색... ( / )'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-white text-sm font-medium pl-10 pr-9 py-3 rounded-2xl focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setLeagueFilter(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 상태 바 */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <span>총 <span className="text-white">{games.length}</span>경기</span>
                <span className="text-slate-700">·</span>
                <span>갱신 <span className="text-indigo-400">{lastUpdated || '--:--:--'}</span></span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${countdown <= 5 ? 'bg-orange-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className={countdown <= 5 ? 'text-orange-400' : ''}>{countdown}s</span>
                </span>
              </div>
            </div>
          </div>

          {/* 리그 빠른 필터 */}
          {popularLeagues.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setLeagueFilter('')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                  leagueFilter === ''
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                }`}
              >
                전체 {games.length}
              </button>
              {popularLeagues.map(league => (
                <button
                  key={league}
                  onClick={() => setLeagueFilter(leagueFilter === league ? '' : league)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border truncate max-w-[150px] ${
                    leagueFilter === league
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                  }`}
                >
                  {league} <span className="opacity-60">{games.filter(g => g.league === league).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin opacity-50 mb-4" />
            <p className="text-slate-600 font-black italic">FETCHING DATA...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

            {/* ── 메인 컨텐츠 ─────────────────────────────────────────── */}
            <div className="xl:col-span-8 space-y-12">

              {/* LIVE */}
              {liveGames.length > 0 && (
                <section ref={liveRef as any}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-3 h-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">라이브</h2>
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-400">
                      {liveGames.length}경기 진행 중
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {liveGames.map(game => <MatchCard key={game.id} game={game} />)}
                  </div>
                </section>
              )}

              {/* 예정 경기 */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <h2 className="text-xl font-black text-white tracking-tight">예정 경기</h2>
                    <span className="bg-white/5 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400">
                      {upcomingGames.length}
                    </span>
                  </div>
                  {/* 정렬 버튼 */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    <ArrowUpDown className="w-3 h-3 text-slate-600 ml-1.5" />
                    {([['time','시간'], ['league','리그'], ['country','국가']] as [SortKey,string][]).map(([key, label]) => (
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
                              {group.label} · {group.games.length}경기
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
                                  {group.games.map((g: any) => <MatchCard key={g.id} game={g} />)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-20 text-center bg-[#0d1425] rounded-3xl border border-white/5 border-dashed">
                    <p className="text-slate-500 font-bold" style={{ color: 'var(--text-primary)', opacity: 0.4 }}>탐색된 경기가 없습니다.</p>
                    <button
                      onClick={() => { setSearchTerm(''); setLeagueFilter(''); }}
                      className="mt-4 text-xs font-black text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                    >
                      필터 초기화
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
                      <h2 className="text-xl font-black text-slate-500 tracking-tight">종료된 경기</h2>
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
                              {group.label} 종료 · {group.games.length}경기
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
                                  {group.games.map((g: any) => <MatchCard key={g.id} game={g} />)}
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

            {/* ── 사이드바 ─────────────────────────────────────────────── */}
            <div className="xl:col-span-4 space-y-6">

              {/* 실시간 현황 */}
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-indigo-600 rounded-3xl p-6 shadow-2xl shadow-indigo-600/30 overflow-hidden relative group"
              >
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 text-white/80 mb-5 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                    <Radio className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Intelligence</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1 leading-tight">실시간<br/>경기 현황</h3>
                  <p className="text-white/60 text-xs font-medium mb-6">접속자 로컬 타임 기준</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '라이브',  val: liveGames.length,     color: 'text-red-400' },
                      { label: '예정',    val: upcomingGames.length,  color: 'text-orange-400' },
                      { label: '오늘',    val: todayCount,            color: 'text-emerald-400' },
                      { label: '내일',    val: tomorrowCount,         color: 'text-sky-400' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="p-4 bg-black/20 rounded-2xl border border-white/10">
                        <div className={`text-2xl font-black ${color} mb-1`}>{val}</div>
                        <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* 갱신 카운트다운 */}
                  <div className="mt-4 flex items-center justify-between bg-black/20 rounded-xl px-3 py-2.5 border border-white/10">
                    <span className="text-[10px] font-bold text-white/50">다음 갱신</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${((20 - countdown) / 20) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-white/70 tabular-nums w-6">{countdown}s</span>
                    </div>
                  </div>
                </div>
                <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
              </motion.section>

              {/* 시스템 인텔리전스 */}
              <section className="bg-[var(--bg-card)] border border-white/5 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-white">시스템 인텔리전스</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '라이브', val: liveGames.length,     color: 'text-red-400' },
                    { label: '오늘',   val: todayCount,           color: 'text-emerald-400' },
                    { label: '내일',   val: tomorrowCount,        color: 'text-sky-400' },
                    { label: '전체',   val: games.length,         color: 'text-indigo-400' },
                    { label: '종료',   val: finishedGames.length, color: 'text-slate-500' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                      <span className="text-xs font-bold text-slate-400">{label}</span>
                      <span className={`text-sm font-black ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400">모니터링 상태</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white">EXCELLENT</span>
                  </span>
                </div>
              </section>

              {/* 인기 리그 */}
              {popularLeagues.length > 0 && (
                <section className="bg-[var(--bg-card)] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-orange-500/20 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-black text-white">인기 리그</h3>
                  </div>
                  <div className="space-y-2">
                    {popularLeagues.map((league, i) => {
                      const cnt = games.filter(g => g.league === league).length;
                      const pct = Math.round((cnt / games.length) * 100);
                      return (
                        <button
                          key={league}
                          onClick={() => setLeagueFilter(leagueFilter === league ? '' : league)}
                          className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 border transition-all text-left ${
                            leagueFilter === league
                              ? 'bg-indigo-500/20 border-indigo-500/30'
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-slate-600 w-4">{i + 1}</span>
                            <span className="text-xs font-bold text-slate-300 truncate">{league}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500/60" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 w-6 text-right">{cnt}</span>
                          </div>
                        </button>
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
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
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
              라이브 {liveGames.length}경기
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
              className="p-3 bg-[#0d1425] hover:bg-white/10 border border-white/10 rounded-2xl shadow-xl text-white transition-colors self-end"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
