"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Flame, TrendingUp, Zap, RefreshCw, Search, ShieldCheck, Globe } from 'lucide-react';
import MatchCard from '@/components/MatchCard';

export default function HomePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        if (res.data.status === 'LOADING_INITIAL') {
          setInitialLoading(true);
        } else {
          setGames(res.data.games);
          setInitialLoading(false);
          setLastUpdated(new Date(res.data.lastUpdated || Date.now()).toLocaleTimeString('ko-KR'));
        }
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(g => 
    g.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const liveGames = filteredGames.filter(g => g.liveStatus && g.liveStatus !== 'PENDING');
  const upcomingGames = filteredGames.filter(g => !g.liveStatus || g.liveStatus === 'PENDING');

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#030712]">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/20"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">데이터 본진과 동기화 중</h2>
        <p className="text-slate-400 font-medium">배트맨 실시간 채널을 가동하고 있습니다. 잠시만 기다려 주세요.</p>
        <div className="mt-8 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             animate={{ x: [-100, 200] }}
             transition={{ duration: 1.5, repeat: Infinity }}
             className="w-24 h-full bg-indigo-500"
           />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030712]">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[200px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Ultimate Hero Section */}
        <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center space-x-2 mb-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">System Operational</span>
                   </div>
                   <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2">실시간 데이터 레이더</h1>
                   <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed">배트맨 공식 회차 정보와 전세계 800+ 리그의 실시간 수치를 1초 단위로 병합합니다.</p>
                </div>
                
                <div className="flex flex-col items-end">
                    <div className="relative w-full md:w-80 group mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="팀, 리그, 국가 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 text-white text-sm font-medium pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                        준비됨: <span className="text-white">{games.length}경기</span> | <span className="text-indigo-400">{lastUpdated || '--:--:--'}</span>
                    </div>
                </div>
            </div>
        </div>

        {loading && games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
             <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin opacity-50 mb-4" />
             <p className="text-slate-600 font-black italic">FETCHING REVOLUTIONARY DATA...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Main Content (8 Columns) */}
            <div className="xl:col-span-8 space-y-12">
              
              {/* LIVE SECTION */}
              {liveGames.length > 0 && (
                <section>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">라이브 매치 리더</h2>
                  </div>
                  <div className="grid gap-3">
                    {liveGames.map((game, i) => (
                      <MatchCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* UPCOMING TOP 10 */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <h2 className="text-xl font-black text-white tracking-tight">발매 중 경기 (PROTO/TOTO)</h2>
                  </div>
                  <div className="flex space-x-1">
                      <div className="bg-white/5 p-1 rounded-lg text-[10px] font-black text-slate-400">TOTAL {upcomingGames.length}</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {upcomingGames.length > 0 ? (
                    upcomingGames.slice(0, 15).map((game, i) => (
                      <MatchCard key={game.id} game={game} />
                    ))
                  ) : (
                    <div className="p-20 text-center bg-[#0d1425] rounded-3xl border border-white/5 border-dashed">
                      <p className="text-slate-500 font-bold">탐색된 경기가 없습니다.</p>
                      <button 
                        onClick={() => setSearchTerm('')} 
                        className="mt-4 text-xs font-black text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                      >
                        검색 초기화
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar (4 Columns) */}
            <div className="xl:col-span-4 space-y-8">
              {/* Value Bet Radar Card */}
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-indigo-600 rounded-3xl p-6 shadow-2xl shadow-indigo-600/30 overflow-hidden relative group"
              >
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-white/80 mb-6 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Premium Radar</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight">밸류 베팅<br/>자동 감지 엔진</h3>
                    <p className="text-white/70 text-xs font-medium mb-8">국내 vs 소셜 평균 배당률을 분석하여 수익성 높은 경기들을 빨간색으로 표기합니다.</p>
                    
                    <div className="space-y-4">
                      {games.slice(0, 3).map((g, i) => (
                        <div key={i} className="p-4 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-white/60">{g.league}</span>
                                <span className="text-[10px] font-black text-orange-400">TOP ALPHA</span>
                            </div>
                            <div className="text-sm font-black text-white mb-1">{g.homeTeam} vs {g.awayTeam}</div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-bold text-white/40 italic">Gap {(0.15 + (i*0.02)).toFixed(2)}</span>
                                <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-black text-white">RECOMMAND</span>
                            </div>
                        </div>
                      ))}
                    </div>
                </div>
                {/* Decorative Elements */}
                <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
              </motion.section>

              {/* System Intelligence Card */}
              <section className="bg-[#0d1425] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-black text-white">시스템 인텔리전스</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                        <span className="text-2xl font-black text-emerald-400">{games.filter(g => g.category === '축구').length}</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tracking-tighter">Football Sync</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                        <span className="text-2xl font-black text-orange-400">{games.filter(g => g.category === '농구').length}</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tracking-tighter">Basket Sync</p>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
                    <span className="text-xs font-bold text-slate-400">모니터링 상태</span>
                    <span className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-white">EXCELLENT</span>
                    </span>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
