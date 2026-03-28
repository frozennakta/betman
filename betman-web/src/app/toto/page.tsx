"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Layers, Zap, Info, ChevronRight } from 'lucide-react';
import MatchCard from '@/components/MatchCard';

export default function TotoPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'WDL' | 'SPECIAL'>('WDL');

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        setGames(res.data.games.filter((g: any) => g.type?.includes('TOTO')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(g => g.type?.includes(subTab));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 bg-[#030712]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-xl">
                 <Layers className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">TOTO BOARD</h1>
          </div>
          <p className="text-slate-400 font-medium tracking-tight">회차별 전체 경기 자동 동기화 (승무패/스페셜 분리 연동)</p>
        </div>

        {/* 탭에서 '전체' 삭제 - 사용자 요청 반영 */}
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 shadow-2xl">
          {[
            { key: 'WDL', label: '승무패 (14G)' },
            { key: 'SPECIAL', label: '스페셜' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key as any)}
              className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${
                subTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Round Info Info Card */}
      {!loading && (
         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/10 rounded-2xl flex items-center justify-between"
         >
            <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">Active Batch Round</h4>
                    <p className="text-[11px] font-medium text-slate-400">
                        현재 <strong className="text-blue-400 italic font-black">제 260014회차</strong> {subTab === 'WDL' ? '승무패 14경기' : '스페셜 경기'}가 업데이트 되었습니다.
                    </p>
                </div>
            </div>
            <div className="hidden sm:flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                Next Sync in 20s <ChevronRight className="w-3 h-3 ml-1" />
            </div>
         </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Activity className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
          <p className="text-slate-500 font-black tracking-widest uppercase text-xs italic">Syncing Toto Channels...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-24 bg-[#0d1425] rounded-3xl border border-white/5 border-dashed">
          <p className="text-slate-500 font-black italic tracking-tighter uppercase">No {subTab} Games Detected for This Round.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredGames.map((game) => (
            <MatchCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
