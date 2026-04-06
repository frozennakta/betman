"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { TrendingUp, Zap, Clock, CheckCircle2, BarChart2, Target, RefreshCw, ArrowRight } from 'lucide-react';
import { getIso2 } from '@/components/AnalysisTabs';

const LIVE_STATUS = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE', 'SUSP']);

function impliedProb(odd: string | null): number | null {
  if (!odd) return null;
  const n = parseFloat(odd);
  if (isNaN(n) || n <= 0) return null;
  return (1 / n) * 100;
}

function margin(home: string | null, draw: string | null, away: string | null): number | null {
  const h = impliedProb(home);
  const d = impliedProb(draw);
  const a = impliedProb(away);
  if (h == null || d == null || a == null) return null;
  return h + d + a - 100;
}

function formatOdd(v: string | null) {
  if (!v) return '—';
  return parseFloat(v).toFixed(2);
}

function OddBadge({ odd, highlight }: { odd: string | null; highlight?: boolean }) {
  if (!odd) return <span className="text-slate-300 text-[12px]">—</span>;
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[12px] font-black tabular-nums ${
      highlight
        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      {parseFloat(odd).toFixed(2)}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-[20px] font-black text-slate-800 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-slate-400 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeSection, setActiveSection] = useState<'odds' | 'live' | 'schedule'>('odds');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/games');
        if (res.data.success) {
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
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const liveGames = useMemo(() => games.filter(g => LIVE_STATUS.has(g.rawStatus)), [games]);
  const upcomingGames = useMemo(() => {
    const now = new Date();
    return games.filter(g => g.liveStatus === 'PENDING' && new Date(g.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games]);
  const finishedGames = useMemo(() => games.filter(g => g.liveStatus === 'FT'), [games]);

  // 배당 있는 경기만
  const gamesWithOdds = useMemo(() =>
    games.filter(g => g.homeOdds && g.drawOdds && g.awayOdds),
  [games]);

  // 마진 기준 정렬 (낮을수록 베터에게 유리)
  const oddsTable = useMemo(() =>
    gamesWithOdds
      .map(g => ({
        ...g,
        margin: margin(g.homeOdds, g.drawOdds, g.awayOdds),
        homeProb: impliedProb(g.homeOdds),
        drawProb: impliedProb(g.drawOdds),
        awayProb: impliedProb(g.awayOdds),
        favorite: parseFloat(g.homeOdds) < parseFloat(g.awayOdds) ? 'home'
          : parseFloat(g.awayOdds) < parseFloat(g.homeOdds) ? 'away' : 'draw',
      }))
      .sort((a, b) => (a.margin ?? 999) - (b.margin ?? 999)),
  [gamesWithOdds]);

  // 최고 배당 (언더독)
  const highestOdds = useMemo(() =>
    gamesWithOdds
      .flatMap(g => [
        { game: g, side: 'home', odds: g.homeOdds, team: g.homeTeam },
        { game: g, side: 'away', odds: g.awayOdds, team: g.awayTeam },
      ])
      .filter(x => parseFloat(x.odds) >= 3.0)
      .sort((a, b) => parseFloat(b.odds) - parseFloat(a.odds))
      .slice(0, 6),
  [gamesWithOdds]);

  // 리그별 경기 수
  const leagueStats = useMemo(() => {
    const map = new Map<string, { league: string; count: number; liveCount: number; leagueId: number | null }>();
    for (const g of games) {
      const cur = map.get(g.league) ?? { league: g.league, count: 0, liveCount: 0, leagueId: g.leagueId ?? null };
      cur.count++;
      if (LIVE_STATUS.has(g.rawStatus)) cur.liveCount++;
      map.set(g.league, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [games]);

  const maxLeagueCount = leagueStats[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-400 font-black text-sm">분석 데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-slate-800 tracking-tight">오늘의 분석</h1>
          <p className="text-[12px] text-slate-400 font-medium mt-0.5">마지막 업데이트 {lastUpdated || '--:--:--'}</p>
        </div>
      </div>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<BarChart2 className="w-4 h-4 text-indigo-600" />}
          label="오늘 총 경기"
          value={games.length}
          sub={`${gamesWithOdds.length}경기 배당 있음`}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-red-500" />}
          label="라이브"
          value={liveGames.length}
          sub="현재 진행 중"
          color="bg-red-50"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          label="예정"
          value={upcomingGames.length}
          sub="킥오프 대기"
          color="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          label="종료"
          value={finishedGames.length}
          sub="오늘 완료"
          color="bg-emerald-50"
        />
      </div>

      {/* ── 섹션 탭 ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-0">
        {([
          { key: 'odds' as const,     label: '배당 분석',   icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { key: 'live' as const,     label: '라이브',      icon: <Zap className="w-3.5 h-3.5" /> },
          { key: 'schedule' as const, label: '예정 경기',   icon: <Clock className="w-3.5 h-3.5" /> },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-black border-b-2 -mb-px transition-all ${
              activeSection === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── 메인 컨텐츠 ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 배당 분석 섹션 */}
          {activeSection === 'odds' && (
            <>
              {oddsTable.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 font-bold">
                  배당 데이터 없음
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-[13px] font-black text-slate-700">배당 분석표</span>
                    <span className="ml-auto text-[10px] text-slate-400">{oddsTable.length}경기 · 마진 낮은 순</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider">
                          <th className="px-4 py-2 text-left">경기</th>
                          <th className="px-3 py-2 text-center">홈</th>
                          <th className="px-3 py-2 text-center">무</th>
                          <th className="px-3 py-2 text-center">원정</th>
                          <th className="px-3 py-2 text-center">마진</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {oddsTable.slice(0, 20).map(g => (
                          <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5">
                              <Link href={`/match/${g.id.replace('fixture_', '')}`} className="group">
                                <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {g.homeTeam}
                                </div>
                                <div className="text-slate-400 leading-tight">{g.awayTeam}</div>
                                <div className="text-[9px] text-slate-300 mt-0.5">{g.league}</div>
                              </Link>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <OddBadge odd={g.homeOdds} highlight={g.favorite === 'home'} />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <OddBadge odd={g.drawOdds} highlight={g.favorite === 'draw'} />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <OddBadge odd={g.awayOdds} highlight={g.favorite === 'away'} />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-[11px] font-black tabular-nums ${
                                (g.margin ?? 99) < 5 ? 'text-emerald-600' :
                                (g.margin ?? 99) < 10 ? 'text-amber-500' : 'text-red-400'
                              }`}>
                                {g.margin != null ? `+${g.margin.toFixed(1)}%` : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 라이브 섹션 */}
          {activeSection === 'live' && (
            <div className="space-y-2">
              {liveGames.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 font-bold">
                  현재 진행 중인 경기 없음
                </div>
              ) : liveGames.map(g => (
                <Link key={g.id} href={`/match/${g.id.replace('fixture_', '')}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 hover:border-red-200 hover:shadow-sm transition-all group">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-slate-800 truncate">{g.homeTeam}</span>
                      <span className="text-[16px] font-black text-slate-800 tabular-nums px-2 py-0.5 bg-slate-800 text-white rounded-lg">
                        {g.homeScore ?? 0} – {g.awayScore ?? 0}
                      </span>
                      <span className="text-[13px] font-black text-slate-800 truncate">{g.awayTeam}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{g.league}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[12px] font-black text-red-500 tabular-nums">{g.elapsed}'</div>
                    <div className="text-[9px] text-slate-400">{g.rawStatus}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {/* 예정 경기 섹션 */}
          {activeSection === 'schedule' && (
            <div className="space-y-2">
              {upcomingGames.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 font-bold">
                  예정 경기 없음
                </div>
              ) : upcomingGames.slice(0, 30).map(g => {
                const time = new Date(g.date).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
                });
                const iso2 = getIso2(g.country || '');
                return (
                  <Link key={g.id} href={`/match/${g.id.replace('fixture_', '')}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all group">
                    <div className="w-10 shrink-0 text-center">
                      <div className="text-[13px] font-black text-indigo-600 tabular-nums">{time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {iso2 && (
                          <img src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`} alt="" className="w-3.5 h-2.5 object-cover rounded-sm shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <span className="text-[10px] text-slate-400 font-bold truncate">{g.league}</span>
                      </div>
                      <div className="text-[13px] font-black text-slate-800 truncate mt-0.5">
                        {g.homeTeam} <span className="text-slate-300 font-medium">vs</span> {g.awayTeam}
                      </div>
                    </div>
                    {g.homeOdds && (
                      <div className="flex items-center gap-1 shrink-0">
                        <OddBadge odd={g.homeOdds} />
                        <OddBadge odd={g.drawOdds} />
                        <OddBadge odd={g.awayOdds} />
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 사이드 패널 ── */}
        <div className="space-y-4">

          {/* 고배당 언더독 */}
          {highestOdds.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-[13px] font-black text-slate-700">고배당 픽</span>
                <span className="ml-auto text-[10px] text-slate-400">3.00+</span>
              </div>
              <div className="divide-y divide-slate-50">
                {highestOdds.map((item, i) => (
                  <Link key={i} href={`/match/${item.game.id.replace('fixture_', '')}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
                    <span className="text-[10px] font-black text-slate-300 w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-black text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{item.team}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.game.league}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[13px] font-black rounded-xl tabular-nums shrink-0">
                      {parseFloat(item.odds).toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 리그별 경기 수 */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <span className="text-[13px] font-black text-slate-700">리그별 경기</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {leagueStats.map(ls => (
                <div key={ls.league} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[160px]">{ls.league}</span>
                    <span className="text-[11px] font-black text-slate-500 tabular-nums shrink-0 ml-2">
                      {ls.count}
                      {ls.liveCount > 0 && (
                        <span className="ml-1 text-red-500">● {ls.liveCount}</span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${(ls.count / maxLeagueCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense>
      <AnalysisContent />
    </Suspense>
  );
}
