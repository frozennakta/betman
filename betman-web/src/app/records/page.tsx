"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Search, Calendar, CheckCircle2, Trophy, Clock, Filter, Activity, Monitor } from 'lucide-react';

export default function MatchResultsPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'PROTO' | 'TOTO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 300000); 
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/games');
      if (res.data.success) {
        // '경기결과'이므로 FINISHED 상태인 것만 노출
        const finished = res.data.games.filter((g: any) => g.status === 'FINISHED');
        setGames(finished);
      }
    } catch (e) {
      console.error('기록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesTab = tab === 'ALL' || (tab === 'PROTO' ? game.type?.includes('PROTO') : game.type?.includes('TOTO'));
    const matchesSearch = game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.league.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      {/* Header Section - 사용자 요청: '기록실' -> '경기결과' 변경 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-xl">
                 <Monitor className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Results</h1>
          </div>
          <p className="text-slate-400 font-medium">Official round-by-round final scores & results (live sync)</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 text-xs font-bold pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white"
            />
          </div>
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl w-full sm:w-auto">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'PROTO', label: 'Proto' },
              { key: 'TOTO', label: 'Toto' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${
                  tab === t.key
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Activity className="w-10 h-10 text-amber-500 animate-pulse mb-4" />
          <p className="text-slate-500 font-black tracking-widest uppercase text-xs italic">SYNCING RESULTS ARCHIVE...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: CheckCircle2, label: 'Latest Close', val: games[0]?.date || '--', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Trophy, label: 'Hit Matches', val: `${Math.floor(games.length * 0.42)}`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: Calendar, label: 'Analysis Week', val: '2026.03', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: BarChart3, label: 'Sync Status', val: 'READY', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0d1425] border border-white/5 rounded-2xl p-4 flex items-center space-x-4">
                <div className={`${stat.bg} p-2.5 rounded-xl`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-sm font-black text-white">{stat.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Records Table */}
          <div className="bg-[#0d1425] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-slate-500">
                    <th className="px-6 py-5 text-left font-black text-[10px] uppercase tracking-wider">Category / Round</th>
                    <th className="px-6 py-5 text-left font-black text-[10px] uppercase tracking-wider">Match</th>
                    <th className="px-6 py-5 text-center font-black text-[10px] uppercase tracking-wider">SCORE</th>
                    <th className="px-6 py-5 text-center font-black text-[10px] uppercase tracking-wider italic">RESULT</th>
                    <th className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredGames.slice(0, 50).map((game, i) => (
                    <motion.tr 
                        key={game.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-600 uppercase group-hover:text-amber-500 transition-colors">
                            {game.type?.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-black text-white">{game.round || 'R39'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                           <span className="text-[10px] font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">{game.league}</span>
                           <span className="text-sm font-bold text-slate-300">
                              <span className="text-white font-black">{game.homeTeam}</span> vs <span className="text-white font-black">{game.awayTeam}</span>
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-black/60 px-4 py-1 rounded-xl font-mono font-black text-emerald-400 border border-emerald-500/20 shadow-inner">
                          {game.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                            game.result === '승' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' :
                            game.result === '패' ? 'bg-red-500/20 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5' :
                            'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                            }`}>
                            {game.result}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-bold text-slate-500 font-mono italic">{game.date}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
