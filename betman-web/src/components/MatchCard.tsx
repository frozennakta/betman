"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MapPin, User, Calendar, Trophy } from 'lucide-react';

interface MatchCardProps {
  game: any;
}

const STATUS_LABEL: Record<string, string> = {
  '1H': '전반전', 'HT': '하프타임', '2H': '후반전',
  'ET': '연장전', 'P': '승부차기', 'FT': '종료', 'PENDING': '예정',
};

const BIG_LEAGUES = new Set([
  'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League',
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'FIFA World Cup', 'Copa America', 'UEFA European Championship',
  'Copa Libertadores', 'AFC Champions League',
]);

// ── 로컬 시간/날짜 훅 ─────────────────────────────────────────────────────────
function useLocalDateTime(isoDate: string | undefined) {
  const [dt, setDt] = useState({ time: '', date: '' });
  useEffect(() => {
    if (!isoDate) return;
    const d = new Date(isoDate);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const now = new Date();
    const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diff = Math.round((dDay - nDay) / 86400000);
    const date =
      diff === -1 ? '어제'
      : diff === 0 ? '오늘'
      : diff === 1 ? '내일'
      : d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    setDt({ time, date });
  }, [isoDate]);
  return dt;
}

// ── 라이브 분 표기 (API elapsed 기반) ─────────────────────────────────────────
function useLiveMinute(game: any): string {
  if (game.liveStatus === 'PENDING' || game.liveStatus === 'FT') return '';
  if (game.rawStatus === 'HT') return 'HT';
  if (game.rawStatus === 'BT') return 'BT';  // 승부차기 전 휴식
  if (game.rawStatus === 'ET') return `ET`;
  const e = game.elapsed;
  if (e == null) return '';
  if (e > 90) return '90+';
  return `${e}'`;
}

// ── 국기 이모지 ────────────────────────────────────────────────────────────────
function countryFlag(country: string): string {
  const map: Record<string, string> = {
    Afghanistan:'AF', Albania:'AL', Algeria:'DZ', Argentina:'AR', Armenia:'AM',
    Australia:'AU', Austria:'AT', Azerbaijan:'AZ', Bahrain:'BH', Bangladesh:'BD',
    Belarus:'BY', Belgium:'BE', Bolivia:'BO', Bosnia:'BA', Brazil:'BR',
    Bulgaria:'BG', Cameroon:'CM', Canada:'CA', Chile:'CL', China:'CN',
    Colombia:'CO', 'Costa Rica':'CR', Croatia:'HR', Cuba:'CU',
    'Czech Republic':'CZ', Czechia:'CZ', Denmark:'DK', 'DR Congo':'CD',
    Ecuador:'EC', Egypt:'EG', 'El Salvador':'SV', England:'GB',
    Estonia:'EE', Ethiopia:'ET', Finland:'FI', France:'FR',
    Georgia:'GE', Germany:'DE', Ghana:'GH', Greece:'GR',
    Guatemala:'GT', Honduras:'HN', Hungary:'HU', Iceland:'IS',
    India:'IN', Indonesia:'ID', Iran:'IR', Iraq:'IQ',
    Ireland:'IE', Israel:'IL', Italy:'IT', Jamaica:'JM',
    Japan:'JP', Jordan:'JO', Kazakhstan:'KZ', Kenya:'KE',
    Kuwait:'KW', Latvia:'LV', Lebanon:'LB', Libya:'LY',
    Lithuania:'LT', Luxembourg:'LU', Malaysia:'MY', Mali:'ML',
    Malta:'MT', Mexico:'MX', Moldova:'MD', Montenegro:'ME',
    Morocco:'MA', Netherlands:'NL', 'New Zealand':'NZ', Nicaragua:'NI',
    Nigeria:'NG', 'North Korea':'KP', 'North Macedonia':'MK', Norway:'NO',
    Oman:'OM', Pakistan:'PK', Panama:'PA', Paraguay:'PY',
    Peru:'PE', Philippines:'PH', Poland:'PL', Portugal:'PT',
    Qatar:'QA', Romania:'RO', Russia:'RU', 'Saudi Arabia':'SA',
    Scotland:'GB', Senegal:'SN', Serbia:'RS', Singapore:'SG',
    Slovakia:'SK', Slovenia:'SI', 'South Africa':'ZA', 'South Korea':'KR',
    Spain:'ES', Sweden:'SE', Switzerland:'CH', Syria:'SY',
    Thailand:'TH', Tunisia:'TN', Turkey:'TR', UAE:'AE',
    Uganda:'UG', Ukraine:'UA', 'United Arab Emirates':'AE',
    'United Kingdom':'GB', Uruguay:'UY', USA:'US', Uzbekistan:'UZ',
    Venezuela:'VE', Vietnam:'VN', Wales:'GB', Yemen:'YE',
    Zambia:'ZM', Zimbabwe:'ZW', 'Ivory Coast':'CI',
    Kosovo:'XK', Cyprus:'CY', 'Trinidad and Tobago':'TT',
  };
  const code = map[country];
  if (!code || code.length !== 2) return '';
  return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
function FormBadges({ form }: { form: string }) {
  return (
    <div className="flex space-x-1">
      {form.split('').map((f, i) => (
        <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-black
          ${f === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
            f === 'L' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-500/20 text-slate-500'}`}>{f}</span>
      ))}
    </div>
  );
}

function CompareBar({ label, home, away }: { label: string; home: string; away: string }) {
  const h = parseInt(home) || 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black">
        <span className="text-emerald-400">{home}</span>
        <span className="uppercase tracking-widest text-slate-600 text-[9px]">{label}</span>
        <span className="text-orange-400">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="bg-emerald-500 transition-all" style={{ width: `${h}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${100 - h}%` }} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-slate-600 shrink-0">{icon}</span>}
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 w-14">{label}</span>
      <span className="text-xs font-bold text-slate-300 text-right flex-1 truncate">{value}</span>
    </div>
  );
}

// ── 탭 컴포넌트들 ─────────────────────────────────────────────────────────────
function InfoTab({ analysis, game }: { analysis: any; game: any }) {
  const localDT = useLocalDateTime(game.date);
  const flag = countryFlag(game.country);

  return (
    <div className="space-y-4">
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">경기 기본 정보</div>
        {localDT.time && (
          <InfoRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="킥오프"
            value={`${localDT.date} ${localDT.time} (현지 시간)`}
          />
        )}
        <InfoRow
          icon={<Trophy className="w-3.5 h-3.5" />}
          label="리그"
          value={game.league}
        />
        <InfoRow label="국가" value={`${flag} ${game.country}`} />
        {analysis.season && <InfoRow label="시즌" value={String(analysis.season)} />}
        {analysis.round  && <InfoRow label="라운드" value={analysis.round} />}
      </div>

      {(game.venue?.name || game.referee) && (
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">장소 & 심판</div>
          {game.venue?.name && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="경기장"
              value={`${game.venue.name}${game.venue.city ? ` · ${game.venue.city}` : ''}`}
            />
          )}
          {game.referee && (
            <InfoRow
              icon={<User className="w-3.5 h-3.5" />}
              label="주심"
              value={game.referee}
            />
          )}
        </div>
      )}

      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">팀 정보</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '홈팀', name: game.homeTeam },
            { label: '원정팀', name: game.awayTeam },
          ].map(({ label, name }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-black text-white leading-tight">{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[9px] font-bold text-slate-700">
        Fixture ID: {game.id?.replace('fixture_', '')}
      </div>
    </div>
  );
}

function EventsTab({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">이벤트 없음 (경기 전 또는 미지원)</div>;
  }
  const icon = (type: string, detail: string) => {
    if (type === 'Goal') return detail.includes('Penalty') ? '⚽🎯' : detail.includes('Own') ? '⚽🔴' : '⚽';
    if (type === 'Card') return detail.includes('Red') ? '🟥' : '🟨';
    if (type === 'subst') return '🔄';
    if (type === 'Var') return '📺';
    return '•';
  };
  return (
    <div className="space-y-1.5">
      {events.map((e, i) => (
        <div key={i} className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2 border border-white/5">
          <span className="text-[10px] font-black text-slate-500 w-10 shrink-0 text-right tabular-nums">
            {e.minute}{e.extra ? `+${e.extra}` : ''}'
          </span>
          <span className="text-base w-6 text-center shrink-0">{icon(e.type, e.detail)}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white truncate block">{e.player}</span>
            {e.assist && <span className="text-[9px] text-slate-500 truncate block">→ {e.assist}</span>}
          </div>
          <span className="text-[9px] font-black text-slate-600 shrink-0 truncate max-w-[80px] text-right">{e.team}</span>
        </div>
      ))}
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: any; away: any }) {
  const hNum = typeof home === 'string' ? parseFloat(home.replace('%', '')) : (home ?? 0);
  const aNum = typeof away === 'string' ? parseFloat(away.replace('%', '')) : (away ?? 0);
  const total = hNum + aNum || 1;
  const hPct = Math.round((hNum / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black">
        <span className="text-emerald-400">{home ?? '–'}</span>
        <span className="text-slate-600 uppercase tracking-widest text-[9px]">{label}</span>
        <span className="text-orange-400">{away ?? '–'}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="bg-emerald-500 transition-all" style={{ width: `${hPct}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${100 - hPct}%` }} />
      </div>
    </div>
  );
}

function StatsTab({ statistics }: { statistics: any[] }) {
  if (!statistics || statistics.length < 2) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">스탯 없음 (경기 전 또는 미지원)</div>;
  }
  const homeStats = statistics[0];
  const awayStats = statistics[1];
  const homeMap = Object.fromEntries((homeStats.stats ?? []).map((s: any) => [s.type, s.value]));
  const awayMap = Object.fromEntries((awayStats.stats ?? []).map((s: any) => [s.type, s.value]));
  const rows = [
    ['Ball Possession', '점유율'], ['Total Shots', '전체 슈팅'], ['Shots on Goal', '유효 슈팅'],
    ['Shots off Goal', '빗나간 슈팅'], ['Blocked Shots', '블록'], ['Corner Kicks', '코너킥'],
    ['Fouls', '파울'], ['Yellow Cards', '옐로카드'], ['Red Cards', '레드카드'],
    ['Goalkeeper Saves', '선방'], ['Total passes', '패스 총계'], ['Passes accurate', '성공 패스'],
    ['Passes %', '패스 성공률'], ['Offsides', '오프사이드'],
  ].filter(([key]) => homeMap[key] != null || awayMap[key] != null);
  return (
    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex justify-between text-[10px] font-black mb-1">
        <span className="text-emerald-400 truncate">{homeStats.team}</span>
        <span className="text-orange-400 truncate text-right">{awayStats.team}</span>
      </div>
      {rows.map(([key, label]) => (
        <StatBar key={key} label={label} home={homeMap[key]} away={awayMap[key]} />
      ))}
    </div>
  );
}

function LineupTab({ lineups }: { lineups: any[] }) {
  if (!lineups || lineups.length === 0) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">라인업 미발표</div>;
  }
  const POS: Record<string, string> = { G: 'GK', D: 'DF', M: 'MF', F: 'FW' };
  return (
    <div className="space-y-6">
      {lineups.map((l) => (
        <div key={l.teamId} className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black text-white">{l.team}</span>
            <div className="flex gap-2 flex-wrap justify-end">
              {l.formation && (
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">{l.formation}</span>
              )}
              {l.coach && (
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">👔 {l.coach}</span>
              )}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">선발 XI</div>
            <div className="grid grid-cols-2 gap-1">
              {l.startXI.map((p: any) => (
                <div key={p.number} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5">
                  <span className="text-[10px] font-black text-slate-500 w-5 text-right tabular-nums shrink-0">{p.number}</span>
                  <span className={`text-[9px] font-black px-1 rounded shrink-0 ${
                    p.pos === 'G' ? 'text-yellow-400 bg-yellow-500/10' :
                    p.pos === 'D' ? 'text-blue-400 bg-blue-500/10' :
                    p.pos === 'M' ? 'text-emerald-400 bg-emerald-500/10' :
                    'text-red-400 bg-red-500/10'
                  }`}>{POS[p.pos] ?? p.pos}</span>
                  <span className="text-xs font-bold text-white truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          {l.substitutes?.length > 0 && (
            <div>
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">후보</div>
              <div className="grid grid-cols-2 gap-1">
                {l.substitutes.map((p: any) => (
                  <div key={p.number} className="flex items-center gap-2 px-2 py-1">
                    <span className="text-[10px] font-black text-slate-600 w-5 text-right tabular-nums shrink-0">{p.number}</span>
                    <span className="text-xs text-slate-500 truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AnalysisTab({ analysis, game }: { analysis: any; game: any }) {
  return (
    <div className="space-y-6">
      {analysis.prediction && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: '홈 승', val: analysis.prediction.homeWin, color: 'text-indigo-400' },
            { label: '무승부', val: analysis.prediction.draw,    color: 'text-yellow-400' },
            { label: '원정 승', val: analysis.prediction.awayWin, color: 'text-purple-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className={`text-2xl font-black ${color}`}>{val ?? '–'}</div>
              <div className="text-[9px] font-black text-slate-600 uppercase mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
      {analysis.prediction?.winner && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <span className="text-xl">🏆</span>
          <div>
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">AI 예상 승자</span>
            <span className="text-sm font-black text-white">{analysis.prediction.winner}</span>
          </div>
        </div>
      )}
      {analysis.prediction?.advice && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Advice · </span>
          <span className="text-xs text-slate-300 font-medium">{analysis.prediction.advice}</span>
        </div>
      )}
      {analysis.comparison && (
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-4">
          <div className="flex justify-between text-[10px] font-black mb-2">
            <span className="text-emerald-400 truncate">{game.homeTeam}</span>
            <span className="text-slate-600 uppercase tracking-widest">팀 비교</span>
            <span className="text-orange-400 truncate text-right">{game.awayTeam}</span>
          </div>
          {[
            { label: 'Form',    ...analysis.comparison.form },
            { label: 'Attack',  ...analysis.comparison.attack },
            { label: 'Defense', ...analysis.comparison.defense },
            { label: 'H2H',     ...analysis.comparison.h2h },
            { label: 'Goals',   ...analysis.comparison.goals },
          ].filter(r => r.home && r.away).map(r => (
            <CompareBar key={r.label} label={r.label} home={r.home} away={r.away} />
          ))}
        </div>
      )}
      {(analysis.home?.form || analysis.away?.form) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { team: analysis.home, name: game.homeTeam },
            { team: analysis.away, name: game.awayTeam },
          ].map(({ team, name }) => (
            <div key={name} className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2">
              <div className="text-[9px] font-black text-slate-500 truncate">{name}</div>
              {team?.form && <FormBadges form={team.form} />}
              <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                <span>득점 avg {team?.goalsFor ?? '–'}</span>
                <span>실점 avg {team?.goalsAgainst ?? '–'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {analysis.h2h?.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">최근 맞대결</div>
          {analysis.h2h.map((m: any, i: number) => {
            const hw = m.homeGoals > m.awayGoals;
            const aw = m.awayGoals > m.homeGoals;
            return (
              <div key={i} className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-2.5 border border-white/5">
                <span className="text-[9px] text-slate-600 shrink-0 w-20">{m.date}</span>
                <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                  <span className={`text-xs font-bold truncate text-right flex-1 ${hw ? 'text-red-400' : 'text-slate-400'}`}>{m.homeTeam}</span>
                  <span className="text-sm font-black text-slate-300 tabular-nums shrink-0">{m.homeGoals} : {m.awayGoals}</span>
                  <span className={`text-xs font-bold truncate flex-1 ${aw ? 'text-red-400' : 'text-slate-400'}`}>{m.awayTeam}</span>
                </div>
                <span className="text-[9px] font-black text-slate-600 shrink-0 w-8 text-right">{m.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────────────────────
const TABS = ['분석', '정보', '이벤트', '스탯', '라인업'] as const;
type TabKey = typeof TABS[number];

function AnalysisModal({ game, onClose }: { game: any; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('분석');
  const fixtureId = game.id?.replace('fixture_', '');
  const isLive = game.liveStatus !== 'PENDING' && game.liveStatus !== 'FT';
  const isFinished = game.liveStatus === 'FT';

  useEffect(() => {
    fetch(`/api/analysis/${fixtureId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAnalysis(d); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fixtureId, onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-white/10 rounded-3xl shadow-2xl"
        >
          {/* 헤더 */}
          <div className="shrink-0 bg-[var(--bg-card)] border-b border-white/5 px-5 pt-4 pb-0 rounded-t-3xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  {countryFlag(game.country)} {game.country} · {game.league}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {(isLive || isFinished) && game.homeScore !== null ? (() => {
                    const hWin = game.homeScore > game.awayScore;
                    const aWin = game.awayScore > game.homeScore;
                    return (
                      <>
                        <span className={`text-lg font-black ${hWin ? 'text-white' : aWin ? 'text-slate-500' : 'text-white'}`}>{game.homeTeam}</span>
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <span className={`text-2xl font-black ${hWin ? 'text-red-400' : aWin ? 'text-slate-400' : 'text-white'}`}>{game.homeScore}</span>
                          <span className="text-slate-600 font-black text-lg">:</span>
                          <span className={`text-2xl font-black ${aWin ? 'text-red-400' : hWin ? 'text-slate-400' : 'text-white'}`}>{game.awayScore}</span>
                        </div>
                        <span className={`text-lg font-black ${aWin ? 'text-white' : hWin ? 'text-slate-500' : 'text-white'}`}>{game.awayTeam}</span>
                      </>
                    );
                  })() : (
                    <>
                      <span className="text-lg font-black text-white">{game.homeTeam}</span>
                      <span className="text-slate-600 font-black text-sm">VS</span>
                      <span className="text-lg font-black text-white">{game.awayTeam}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {isLive && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                      {STATUS_LABEL[game.liveStatus] ?? game.liveStatus}{game.elapsed ? ` · ${game.elapsed}'` : ''}
                    </span>
                  )}
                  {isFinished && <span className="text-[9px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">종료</span>}
                  {!isLive && !isFinished && (
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      킥오프 {game.matchTime}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="ml-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {/* 탭 바 */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 min-w-[52px] py-2 text-[11px] font-black rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    tab === t
                      ? 'text-white border-indigo-500 bg-indigo-500/10'
                      : 'text-slate-600 border-transparent hover:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-black">로딩 중...</span>
              </div>
            ) : analysis ? (
              <>
                {tab === '분석'   && <AnalysisTab  analysis={analysis} game={game} />}
                {tab === '정보'   && <InfoTab      analysis={analysis} game={game} />}
                {tab === '이벤트' && <EventsTab    events={analysis.events ?? []} />}
                {tab === '스탯'   && <StatsTab     statistics={analysis.statistics ?? []} />}
                {tab === '라인업' && <LineupTab    lineups={analysis.lineups ?? []} />}
              </>
            ) : (
              <div className="py-16 text-center text-slate-600 text-sm font-bold">데이터 없음</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── 카드 ──────────────────────────────────────────────────────────────────────
export default function MatchCard({ game }: MatchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isLive = game.liveStatus !== 'PENDING' && game.liveStatus !== 'FT';
  const isFinished = game.liveStatus === 'FT';
  const isBig = BIG_LEAGUES.has(game.league);
  const liveMinute = useLiveMinute(game);
  const localDT = useLocalDateTime(game.date);
  const flag = countryFlag(game.country);

  // ── 골 스코어 변경 감지 → 플래시 ──────────────────────────────────────────
  const prevScore = useRef<{ home: number; away: number } | null>(null);
  const [scoreFlash, setScoreFlash] = useState(false);

  useEffect(() => {
    if (prevScore.current === null) {
      prevScore.current = { home: game.homeScore, away: game.awayScore };
      return;
    }
    if (prevScore.current.home !== game.homeScore || prevScore.current.away !== game.awayScore) {
      setScoreFlash(true);
      prevScore.current = { home: game.homeScore, away: game.awayScore };
      const t = setTimeout(() => setScoreFlash(false), 3000);
      return () => clearTimeout(t);
    }
  }, [game.homeScore, game.awayScore]);

  const liveProgressPct = isLive && typeof game.elapsed === 'number'
    ? Math.min((game.elapsed / 90) * 100, 100)
    : null;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={`relative overflow-hidden cursor-pointer bg-[var(--bg-card)] border rounded-2xl transition-all ${
          scoreFlash
            ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10'
            : isBig
              ? 'border-amber-500/20 hover:border-amber-500/40'
              : 'border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.03]'
        }`}
      >
        {/* 빅리그 왼쪽 악센트 */}
        {isBig && <div className="absolute left-0 inset-y-0 w-0.5 bg-amber-400/50 rounded-l-2xl" />}

        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
          {/* 왼쪽: 시간 배지 + 팀명 */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* 시간 배지 */}
            <div className="flex flex-col items-center justify-center min-w-[48px] bg-white/5 rounded-lg border border-white/10 shrink-0 px-1.5 py-1.5 gap-0.5">
              {isLive ? (
                <span className="text-[11px] font-black text-red-400 leading-none tabular-nums">
                  {liveMinute || `${game.elapsed ?? '–'}'`}
                </span>
              ) : isFinished ? (
                <span className="text-[11px] font-black text-slate-500 leading-none">FT</span>
              ) : (
                <>
                  <span className="text-[8px] font-bold text-slate-600 leading-none">{localDT.date || '–'}</span>
                  <span className="text-[11px] font-black text-indigo-300 leading-none tabular-nums">
                    {localDT.time || game.matchTime}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1.5 py-0.5 bg-white/5 rounded border border-white/5 truncate max-w-[190px]">
                  {flag ? `${flag} ` : ''}{isBig ? '★ ' : ''}{game.country} · {game.league}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded border border-red-500/20 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                    {STATUS_LABEL[game.liveStatus] ?? game.liveStatus}
                  </span>
                )}
                {scoreFlash && (
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black rounded border border-red-500/30 shrink-0 animate-pulse">
                    GOAL!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base font-black text-white truncate">{game.homeTeam}</span>
                <span className="text-[10px] font-bold text-slate-600 shrink-0">VS</span>
                <span className="text-sm sm:text-base font-black text-white truncate">{game.awayTeam}</span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 스코어 */}
          <div className="shrink-0">
            {(isLive || isFinished) && game.homeScore !== null ? (() => {
              const hWin = game.homeScore > game.awayScore;
              const aWin = game.awayScore > game.homeScore;
              return (
                <div className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                  scoreFlash ? 'bg-red-500/20 border-red-500/40' : 'bg-black/40 border-white/5'
                }`}>
                  <span className={`text-lg font-black tabular-nums ${hWin ? 'text-red-400' : aWin ? 'text-slate-400' : 'text-white'}`}>{game.homeScore}</span>
                  <span className="text-slate-600 font-black">:</span>
                  <span className={`text-lg font-black tabular-nums ${aWin ? 'text-red-400' : hWin ? 'text-slate-400' : 'text-white'}`}>{game.awayScore}</span>
                </div>
              );
            })() : (
              <span className="text-[10px] font-black text-slate-700 px-2">분석 →</span>
            )}
          </div>
        </div>

        {/* 라이브 진행 바 */}
        {liveProgressPct !== null && (
          <div className="h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
              style={{ width: `${liveProgressPct}%` }}
            />
          </div>
        )}
      </div>

      {modalOpen && <AnalysisModal game={game} onClose={() => setModalOpen(false)} />}
    </>
  );
}
