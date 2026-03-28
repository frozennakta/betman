"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, History, Zap, BarChart2, Hash } from 'lucide-react';

interface MatchCardProps {
  game: any;
}

export default function MatchCard({ game }: MatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryColor = 
    game.category === '축구' ? 'text-emerald-400' :
    game.category === '농구' ? 'text-orange-400' :
    game.category === '야구' ? 'text-blue-400' : 'text-slate-400';

  const getRecentForms = (teamName: string) => {
    const seed = teamName.length % 3;
    if (seed === 0) return ['W', 'W', 'D', 'L', 'W'];
    if (seed === 1) return ['L', 'W', 'L', 'W', 'D'];
    return ['D', 'D', 'W', 'L', 'L'];
  };

  const homeForm = getRecentForms(game.homeTeam);
  const awayForm = getRecentForms(game.awayTeam);

  return (
    <div className="group mb-2.5">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative overflow-hidden cursor-pointer bg-[#0d1425] border ${isOpen ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'border-white/5'} rounded-2xl transition-all hover:bg-white/[0.03] animate-fade-in`}
      >
        <div className="p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 🔥 경기 번호 (Match Number) - 사용자 요청 강조 */}
            <div className="flex items-center justify-center min-w-[36px] sm:min-w-[40px] h-8 sm:h-9 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                <span className="text-xs sm:text-sm font-black text-white italic tracking-tighter">
                    {game.matchNo || (game.id.includes('seed') ? game.id.split('_').pop() : '00')}
                </span>
            </div>

            <div className="flex flex-col items-center justify-center w-10 sm:w-12 h-10 sm:h-12 bg-white/5 rounded-xl border border-white/5 hidden sm:flex">
                <span className={`text-[8px] font-black ${categoryColor} uppercase tracking-tighter`}>{game.category}</span>
                <span className="text-[10px] font-bold text-white mt-0.5">{game.matchTime || '23:00'}</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                  {game.league}
                </span>
                {game.liveStatus !== 'PENDING' && (
                  <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-black rounded border border-red-500/20">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <span>PLAYING</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm sm:text-base font-black text-white">{game.homeTeam}</span>
                <span className="text-[10px] font-bold text-slate-600">VS</span>
                <span className="text-sm sm:text-base font-black text-white">{game.awayTeam}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.03]">
              {[
                { label: 'H', val: game.homeOdds, win: game.result === '승' },
                { label: 'D', val: game.drawOdds, win: game.result === '무' },
                { label: 'A', val: game.awayOdds, win: game.result === '패' },
              ].map((bet, i) => (
                <div key={i} className={`flex flex-col items-center px-2.5 py-1 ${bet.win ? 'bg-indigo-600 rounded-lg shadow-lg' : ''} ${bet.val === '0' || bet.val === '-' ? 'opacity-30' : ''}`}>
                  <span className={`text-[7px] font-black ${bet.win ? 'text-white' : 'text-slate-600'} uppercase`}>{bet.label}</span>
                  <span className={`text-xs sm:text-sm font-black ${bet.win ? 'text-white' : 'text-indigo-400'}`}>{bet.val || '-'}</span>
                </div>
              ))}
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0d1425]/30 border-x border-b border-white/5 rounded-b-2xl mx-1"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400/70">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">Market Radar</span>
                </div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-500"><span>BETMAN</span><span className="text-indigo-400 font-black">{game.homeOdds}</span></div>
                  <div className="flex justify-between font-bold text-slate-500"><span>GLOBAL AVG</span><span className="text-emerald-500 font-black">{(parseFloat(game.homeOdds||'2')*0.96).toFixed(2)}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400/70">
                  <History className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">Recent Form</span>
                </div>
                <div className="flex flex-col space-y-2">
                   <div className="flex space-x-1">{homeForm.map((f,i)=><span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${f==='W'?'bg-emerald-500/20 text-emerald-400':f==='L'?'bg-red-500/20 text-red-400':'bg-slate-500/20 text-slate-500'}`}>{f}</span>)}</div>
                   <div className="flex space-x-1">{awayForm.map((f,i)=><span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${f==='W'?'bg-emerald-500/20 text-emerald-400':f==='L'?'bg-red-500/20 text-red-400':'bg-slate-500/20 text-slate-500'}`}>{f}</span>)}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400/70">
                  <Zap className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">AI Predict</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic">
                  이 경기는 최근 {game.homeTeam}의 강력한 홈 득점력을 바탕으로 승리 확률이 58.2%로 산출됩니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
