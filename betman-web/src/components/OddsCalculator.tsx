"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Bet {
  id: string;
  label: string;
  odds: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function parseOdds(raw: string): number | null {
  const v = parseFloat(raw.replace(',', '.'));
  return isNaN(v) || v <= 0 ? null : v;
}

export default function OddsCalculator() {
  const [open, setOpen] = useState(false);
  const [bets, setBets] = useState<Bet[]>([
    { id: uid(), label: '', odds: '' },
  ]);
  const [stake, setStake] = useState('10000');
  const [mode, setMode] = useState<'단식' | '다중'>('단식');

  const addBet = useCallback(() => {
    setBets(prev => [...prev, { id: uid(), label: '', odds: '' }]);
    setMode('다중');
  }, []);

  const removeBet = useCallback((id: string) => {
    setBets(prev => {
      const next = prev.filter(b => b.id !== id);
      return next.length === 0 ? [{ id: uid(), label: '', odds: '' }] : next;
    });
  }, []);

  const updateBet = useCallback((id: string, field: 'label' | 'odds', val: string) => {
    setBets(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  }, []);

  const stakeNum = parseFloat(stake.replace(/,/g, '')) || 0;

  const validOdds = bets
    .map(b => parseOdds(b.odds))
    .filter((v): v is number => v !== null);

  const totalOdds =
    mode === '다중'
      ? validOdds.reduce((acc, o) => acc * o, 1)
      : validOdds[0] ?? null;

  const payout = totalOdds !== null ? stakeNum * totalOdds : null;
  const profit = payout !== null ? payout - stakeNum : null;

  const formatKRW = (n: number) =>
    new Intl.NumberFormat('ko-KR').format(Math.round(n));

  const impliedProb =
    totalOdds !== null && totalOdds > 0
      ? ((1 / totalOdds) * 100).toFixed(1) + '%'
      : '–';

  return (
    <>
      {/* FAB 버튼 */}
      <button
        onClick={() => setOpen(v => !v)}
        title="배당 계산기"
        className="p-3 bg-[var(--bg-card)] hover:bg-white/10 border border-white/10 rounded-2xl shadow-xl text-indigo-400 hover:text-white transition-colors"
      >
        <Calculator className="w-5 h-5" />
      </button>

      {/* 패널 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="calc-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-6 z-50 w-[320px] bg-[var(--bg-card)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-black text-white">배당 계산기</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* 단식 / 다중 토글 */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {(['단식', '다중'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                      mode === m
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m === '단식' ? '단식 (Single)' : '다중 (Accumulator)'}
                  </button>
                ))}
              </div>

              {/* 베팅 목록 */}
              <div className="space-y-2">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">배당률 입력</div>
                {bets.map((bet, idx) => (
                  <div key={bet.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`베팅 ${idx + 1}`}
                      value={bet.label}
                      onChange={e => updateBet(bet.id, 'label', e.target.value)}
                      className="flex-1 min-w-0 bg-black/20 border border-white/10 text-white text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="1.85"
                      value={bet.odds}
                      onChange={e => updateBet(bet.id, 'odds', e.target.value)}
                      className="w-20 shrink-0 bg-black/20 border border-white/10 text-white text-xs font-black tabular-nums px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 text-center"
                    />
                    {bets.length > 1 && (
                      <button
                        onClick={() => removeBet(bet.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addBet}
                  className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  베팅 추가
                </button>
              </div>

              {/* 배팅금 */}
              <div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">배팅금 (원)</div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stake}
                    onChange={e => setStake(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-black/20 border border-white/10 text-white text-sm font-black tabular-nums px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600">₩</span>
                </div>
                {/* 빠른 금액 */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[5000, 10000, 50000, 100000].map(n => (
                    <button
                      key={n}
                      onClick={() => setStake(String(n))}
                      className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-500 hover:text-slate-300 hover:border-white/10 transition-all"
                    >
                      {formatKRW(n)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 결과 */}
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">계산 결과</div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500">합산 배당</span>
                  <span className="text-sm font-black text-white tabular-nums">
                    {totalOdds !== null ? totalOdds.toFixed(3) : '–'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500">내재 확률</span>
                  <span className="text-sm font-black text-indigo-400 tabular-nums">{impliedProb}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500">예상 수령액</span>
                  <span className="text-base font-black text-emerald-400 tabular-nums">
                    {payout !== null ? `₩ ${formatKRW(payout)}` : '–'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500">순수익</span>
                  <span className={`text-base font-black tabular-nums ${
                    profit !== null && profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {profit !== null
                      ? `${profit >= 0 ? '+' : ''}₩ ${formatKRW(profit)}`
                      : '–'}
                  </span>
                </div>
              </div>

              {/* 초기화 */}
              <button
                onClick={() => {
                  setBets([{ id: uid(), label: '', odds: '' }]);
                  setStake('10000');
                  setMode('단식');
                }}
                className="w-full py-2 text-[10px] font-black text-slate-600 hover:text-red-400 transition-colors border border-white/5 rounded-xl hover:border-red-500/20"
              >
                초기화
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
