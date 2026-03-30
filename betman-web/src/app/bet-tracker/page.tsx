"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, BookOpen } from 'lucide-react';

interface Bet {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  myPick: '홈' | '무' | '원정';
  odds: number;
  stake: number;
  result: 'pending' | 'win' | 'lose' | 'void';
  note?: string;
}

const STORAGE_KEY = 'betman-bet-tracker';
const RESULT_CYCLE: Bet['result'][] = ['pending', 'win', 'lose', 'void'];

function profit(bet: Bet): number {
  if (bet.result === 'win')  return Math.round((bet.stake * (bet.odds - 1)) * 100) / 100;
  if (bet.result === 'lose') return -bet.stake;
  return 0;
}

function ResultBadge({ result, onClick }: { result: Bet['result']; onClick: () => void }) {
  const cfg = {
    pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    win:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    lose:    'bg-red-500/20 text-red-400 border-red-500/30',
    void:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }[result];
  const label = { pending: '대기중', win: '적중', lose: '실패', void: '취소' }[result];
  return (
    <button
      onClick={onClick}
      title="클릭하여 결과 변경"
      className={`px-2 py-0.5 rounded-full border text-[9px] font-black transition-all hover:opacity-80 shrink-0 ${cfg}`}
    >
      {label}
    </button>
  );
}

const FILTER_TABS: { key: Bet['result'] | 'all'; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'pending', label: '대기중' },
  { key: 'win',     label: '적중' },
  { key: 'lose',    label: '실패' },
  { key: 'void',    label: '취소' },
];

function emptyForm(): Omit<Bet, 'id' | 'result'> {
  return { homeTeam: '', awayTeam: '', league: '', date: '', myPick: '홈', odds: 0, stake: 0, note: '' };
}

export default function BetTrackerPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [filter, setFilter] = useState<Bet['result'] | 'all'>('all');
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  // localStorage 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBets(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((next: Bet[]) => {
    setBets(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const addBet = () => {
    if (!form.homeTeam.trim() || !form.awayTeam.trim()) {
      setFormError('홈팀과 원정팀을 입력해주세요.');
      return;
    }
    if (!form.odds || form.odds <= 1) {
      setFormError('배당률은 1보다 커야 합니다.');
      return;
    }
    if (!form.stake || form.stake <= 0) {
      setFormError('베팅 금액을 입력해주세요.');
      return;
    }
    setFormError('');
    const newBet: Bet = {
      ...form,
      id: `bet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      result: 'pending',
    };
    save([newBet, ...bets]);
    setForm(emptyForm());
  };

  const deleteBet = (id: string) => save(bets.filter(b => b.id !== id));

  const cycleResult = (id: string) => {
    save(bets.map(b => {
      if (b.id !== id) return b;
      const idx = RESULT_CYCLE.indexOf(b.result);
      return { ...b, result: RESULT_CYCLE[(idx + 1) % RESULT_CYCLE.length] };
    }));
  };

  // 통계
  const settled = bets.filter(b => b.result !== 'void');
  const wins    = settled.filter(b => b.result === 'win').length;
  const nonPending = settled.filter(b => b.result !== 'pending').length;
  const hitRate = nonPending > 0 ? Math.round((wins / nonPending) * 100) : 0;
  const totalStake  = bets.reduce((s, b) => s + (b.result !== 'void' ? b.stake : 0), 0);
  const totalProfit = bets.reduce((s, b) => s + profit(b), 0);
  const roi = totalStake > 0 ? Math.round((totalProfit / totalStake) * 100 * 10) / 10 : 0;

  const filtered = filter === 'all' ? bets : bets.filter(b => b.result === filter);

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all";
  const labelCls = "text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1";

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[200px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* 상단 광고 슬롯 */}
        <div className="w-full h-[90px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">베팅 기록</h1>
            <p className="text-slate-500 text-xs font-medium">로컬 저장 · 개인 베팅 기록 관리</p>
          </div>
        </div>

        {/* 통계 바 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: '총 베팅', value: `${bets.length}건`, color: 'text-white' },
            { label: '적중률',  value: `${hitRate}%`,      color: 'text-emerald-400' },
            { label: '총 투자', value: `${totalStake.toLocaleString()}`, color: 'text-slate-300' },
            { label: '순 손익', value: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'ROI',     value: `${roi >= 0 ? '+' : ''}${roi}%`, color: roi >= 0 ? 'text-indigo-400' : 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--bg-card)] border border-white/5 rounded-2xl p-3 text-center">
              <div className={`text-lg font-black tabular-nums ${color}`}>{value}</div>
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* 베팅 추가 폼 */}
        <div className="bg-[var(--bg-card)] border border-white/5 rounded-2xl p-5 mb-6">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">새 베팅 추가</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>홈팀</label>
              <input className={inputCls} placeholder="홈팀 이름" value={form.homeTeam}
                onChange={e => setForm(f => ({ ...f, homeTeam: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>원정팀</label>
              <input className={inputCls} placeholder="원정팀 이름" value={form.awayTeam}
                onChange={e => setForm(f => ({ ...f, awayTeam: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>리그</label>
              <input className={inputCls} placeholder="리그명" value={form.league}
                onChange={e => setForm(f => ({ ...f, league: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>날짜</label>
              <input className={inputCls} type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>

          {/* 픽 선택 */}
          <div className="mb-3">
            <label className={labelCls}>내 픽</label>
            <div className="flex gap-2">
              {(['홈', '무', '원정'] as const).map(pick => (
                <button
                  key={pick}
                  onClick={() => setForm(f => ({ ...f, myPick: pick }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-black border transition-all ${
                    form.myPick === pick
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {pick}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>배당률</label>
              <input className={inputCls} type="number" step="0.01" min="1.01" placeholder="예: 1.85"
                value={form.odds || ''} onChange={e => setForm(f => ({ ...f, odds: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className={labelCls}>베팅 금액</label>
              <input className={inputCls} type="number" min="1" placeholder="예: 10000"
                value={form.stake || ''} onChange={e => setForm(f => ({ ...f, stake: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls}>메모 (선택)</label>
            <input className={inputCls} placeholder="분석 메모..." value={form.note ?? ''}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>

          {formError && (
            <div className="mb-3 text-xs text-red-400 font-bold">{formError}</div>
          )}

          {/* 예상 수익 미리보기 */}
          {form.odds > 1 && form.stake > 0 && (
            <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">예상 수익 (적중 시)</span>
              <span className="text-sm font-black text-emerald-400 tabular-nums">
                +{Math.round(form.stake * (form.odds - 1) * 100) / 100}
              </span>
            </div>
          )}

          <button
            onClick={addBet}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-sm font-black text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            베팅 추가
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-1 mb-4 bg-[var(--bg-card)] border border-white/5 rounded-2xl p-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                filter === key
                  ? 'text-white bg-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1 opacity-60">
                  {bets.filter(b => b.result === key).length}
                </span>
              )}
              {key === 'all' && (
                <span className="ml-1 opacity-60">{bets.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* 베팅 목록 */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-600 text-sm font-bold bg-[var(--bg-card)] border border-white/5 rounded-2xl border-dashed">
            베팅 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(bet => {
              const p = profit(bet);
              return (
                <div key={bet.id} className="bg-[var(--bg-card)] border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 날짜 + 리그 */}
                      <div className="flex items-center gap-2 mb-1">
                        {bet.date && (
                          <span className="text-[9px] font-bold text-slate-600 tabular-nums">{bet.date}</span>
                        )}
                        {bet.league && (
                          <span className="text-[9px] font-bold text-slate-600 truncate">{bet.league}</span>
                        )}
                      </div>
                      {/* 팀 */}
                      <div className="text-sm font-black text-white truncate">
                        {bet.homeTeam} <span className="text-slate-500 font-bold">vs</span> {bet.awayTeam}
                      </div>
                      {/* 픽 + 배당 + 금액 */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                          bet.myPick === '홈' ? 'bg-indigo-500/20 text-indigo-400' :
                          bet.myPick === '원정' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {bet.myPick}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">@{bet.odds}</span>
                        <span className="text-[10px] font-bold text-slate-500">{bet.stake.toLocaleString()}</span>
                        {bet.note && (
                          <span className="text-[9px] text-slate-600 truncate max-w-[120px]">{bet.note}</span>
                        )}
                      </div>
                    </div>

                    {/* 우측: 결과 + 손익 + 삭제 */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <ResultBadge result={bet.result} onClick={() => cycleResult(bet.id)} />
                      {bet.result !== 'pending' && bet.result !== 'void' && (
                        <span className={`text-[11px] font-black tabular-nums ${p >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p >= 0 ? '+' : ''}{p.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={() => deleteBet(bet.id)}
                        className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
