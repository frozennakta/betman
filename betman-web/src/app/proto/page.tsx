"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, LayoutGrid, Zap, Filter } from 'lucide-react';
import MatchCard from '@/components/MatchCard';

export default function ProtoPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WIN_LOSS' | 'SPECIAL'>('ALL');

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        setGames(res.data.games.filter((g: any) => g.type?.includes('PROTO')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = activeTab === 'ALL'
    ? games
    : games.filter(g => activeTab === 'WIN_LOSS' ? !g.type.includes('SPECIAL') : g.type.includes('SPECIAL'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 bg-[#030712]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
                 <LayoutGrid className="w-6 h-6 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">프로토 승부식</h1>
          </div>
          <p className="text-slate-400 font-medium">실시간 배당 변동 및 AI 분석 기반 데이터 센터 (자동 업데이트)</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 shadow-2xl">
          {[
            { key: 'ALL', label: '전체' },
            { key: 'WIN_LOSS', label: '승부식' },
            { key: 'SPECIAL', label: '기록식' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Activity className="w-10 h-10 text-emerald-500 animate-pulse mb-4" />
          <p className="text-slate-500 font-black tracking-widest uppercase text-xs">PROTO FEED SYNCING...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-24 bg-[#0d1425] rounded-3xl border border-white/5 border-dashed">
          <p className="text-slate-500 font-black italic">현재 발매 중인 프로토 경기가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredGames.map((game) => (
            <MatchCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
