"use client";

import { useEffect, useState } from 'react';
import { MapPin, User, Calendar, Trophy } from 'lucide-react';

export const STATUS_LABEL: Record<string, string> = {
  '1H': '전반전', 'HT': '하프타임', '2H': '후반전',
  'ET': '연장전', 'P': '승부차기', 'FT': '종료', 'PENDING': '예정',
};

export const BIG_LEAGUES = new Set([
  'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League',
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'FIFA World Cup', 'Copa America', 'UEFA European Championship',
  'Copa Libertadores', 'AFC Champions League',
]);

export function useLocalDateTime(isoDate: string | undefined) {
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

export function countryFlag(country: string): string {
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
    World:'🌍',
  };
  if (country === 'World') return '🌍';
  const code = map[country];
  if (!code || code.length !== 2) return '';
  return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

export function FormBadges({ form }: { form: string }) {
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

export function CompareBar({ label, home, away }: { label: string; home: string; away: string }) {
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

export function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-slate-600 shrink-0">{icon}</span>}
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 w-14">{label}</span>
      <span className="text-xs font-bold text-slate-300 text-right flex-1 truncate">{value}</span>
    </div>
  );
}

export function StatBar({ label, home, away }: { label: string; home: any; away: any }) {
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

// ── 탭: 정보 ──────────────────────────────────────────────────────────────────
export function InfoTab({ analysis, game }: { analysis: any; game: any }) {
  const localDT = useLocalDateTime(game.date);
  const flag = countryFlag(game.country);
  return (
    <div className="space-y-4">
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">경기 기본 정보</div>
        {localDT.time && (
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="킥오프" value={`${localDT.date} ${localDT.time} (현지 시간)`} />
        )}
        <InfoRow icon={<Trophy className="w-3.5 h-3.5" />} label="리그" value={game.league} />
        <InfoRow label="국가" value={`${flag} ${game.country}`} />
        {analysis.season && <InfoRow label="시즌" value={String(analysis.season)} />}
        {analysis.round  && <InfoRow label="라운드" value={analysis.round} />}
      </div>
      {(game.venue?.name || game.referee) && (
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">장소 & 심판</div>
          {game.venue?.name && (
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="경기장" value={`${game.venue.name}${game.venue.city ? ` · ${game.venue.city}` : ''}`} />
          )}
          {game.referee && (
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="주심" value={game.referee} />
          )}
        </div>
      )}
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">팀 정보</div>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: '홈팀', name: game.homeTeam }, { label: '원정팀', name: game.awayTeam }].map(({ label, name }) => (
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

// ── 탭: 이벤트 ────────────────────────────────────────────────────────────────
export function EventsTab({ events }: { events: any[] }) {
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

// ── 탭: 스탯 ──────────────────────────────────────────────────────────────────
export function StatsTab({ statistics }: { statistics: any[] }) {
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

// ── 탭: 라인업 ────────────────────────────────────────────────────────────────
const POS_COLOR: Record<string, string> = {
  G: 'bg-yellow-500 text-black',
  D: 'bg-blue-500 text-white',
  M: 'bg-emerald-500 text-white',
  F: 'bg-red-500 text-white',
};
const POS_LABEL: Record<string, string> = { G: 'GK', D: 'DF', M: 'MF', F: 'FW' };

function PitchView({ lineup }: { lineup: any }) {
  const hasGrid = (lineup.startXI ?? []).some((p: any) => p.grid);
  if (!hasGrid || !lineup.formation) return null;

  // formation e.g. "4-3-3" → parse max row number
  const formRows = lineup.formation.split('-').map(Number);
  // rows: 1=GK, then each formation segment adds a row
  const maxRow = formRows.length + 1; // +1 for GK row

  // group players by row
  const byRow = new Map<number, any[]>();
  for (const p of (lineup.startXI ?? [])) {
    if (!p.grid) continue;
    const [row] = p.grid.split(':').map(Number);
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push(p);
  }

  const posColor = (pos: string) => POS_COLOR[pos] ?? 'bg-slate-500 text-white';

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)', aspectRatio: '2/3' }}
    >
      {/* pitch lines */}
      {/* center line */}
      <div className="absolute left-0 right-0 border-t border-white/20" style={{ top: '50%' }} />
      {/* center circle */}
      <div className="absolute" style={{
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '28%', aspectRatio: '1',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.2)',
      }} />
      {/* penalty box top */}
      <div className="absolute border border-white/20" style={{ top: 0, left: '25%', right: '25%', height: '14%' }} />
      {/* penalty box bottom */}
      <div className="absolute border border-white/20" style={{ bottom: 0, left: '25%', right: '25%', height: '14%' }} />

      {/* players */}
      {[...byRow.entries()].map(([row, players]) => {
        const topPct = ((row - 0.5) / maxRow) * 100;
        return players.map((p, ci) => {
          const leftPct = ((ci + 1) / (players.length + 1)) * 100;
          return (
            <div
              key={p.number}
              className="absolute flex flex-col items-center"
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                transform: 'translate(-50%, -50%)',
                width: '14%',
              }}
            >
              <div className={`flex items-center justify-center rounded-full text-[9px] font-black w-6 h-6 shrink-0 shadow-lg ${posColor(p.pos)}`}>
                {p.number}
              </div>
              <span className="text-[7px] font-bold text-white text-center leading-tight mt-0.5 drop-shadow-md max-w-full truncate px-0.5">
                {p.name?.split(' ').slice(-1)[0]}
              </span>
            </div>
          );
        });
      })}
    </div>
  );
}

export function LineupTab({ lineups }: { lineups: any[] }) {
  if (!lineups || lineups.length === 0) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">라인업 미발표</div>;
  }
  const hasVisual = lineups.some(l => l.formation && (l.startXI ?? []).some((p: any) => p.grid));
  return (
    <div className="space-y-6">
      {/* 시각적 피치 (데이터 있을 때) */}
      {hasVisual && (
        <div className="grid grid-cols-2 gap-3">
          {lineups.slice(0, 2).map((l) => (
            <div key={l.teamId}>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center truncate">{l.team}</div>
              <PitchView lineup={l} />
              {l.formation && (
                <div className="text-center mt-1">
                  <span className="text-[9px] font-black text-indigo-400">{l.formation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 상세 리스트 */}
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
                  }`}>{POS_LABEL[p.pos] ?? p.pos}</span>
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

// ── 탭: 분석 ──────────────────────────────────────────────────────────────────
export function AnalysisTab({ analysis, game }: { analysis: any; game: any }) {
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
      {analysis.h2h?.length > 0 && (() => {
        const homeTeamName = game.homeTeam;
        let w = 0, d = 0, l = 0;
        analysis.h2h.forEach((m: any) => {
          if (m.homeGoals == null || m.awayGoals == null) return;
          const isHome = m.homeTeam === homeTeamName;
          const hg = isHome ? m.homeGoals : m.awayGoals;
          const ag = isHome ? m.awayGoals : m.homeGoals;
          if (hg > ag) w++;
          else if (hg === ag) d++;
          else l++;
        });
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">맞대결 기록 ({analysis.h2h.length})</span>
              <div className="flex gap-1.5">
                {[
                  { label: `${w}승`, cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                  { label: `${d}무`, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
                  { label: `${l}패`, cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
                ].map(({ label, cls }) => (
                  <span key={label} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <span className="text-[8px] font-black text-slate-700 w-[72px] shrink-0">날짜</span>
              <span className="text-[8px] font-black text-slate-700 flex-1 text-right">홈</span>
              <span className="text-[8px] font-black text-slate-700 w-12 text-center shrink-0">스코어</span>
              <span className="text-[8px] font-black text-slate-700 flex-1">원정</span>
              <span className="text-[8px] font-black text-slate-700 w-5 text-center shrink-0">결과</span>
            </div>
            <div className="space-y-0.5">
              {analysis.h2h.map((m: any, i: number) => {
                if (m.homeGoals == null || m.awayGoals == null) return null;
                const isHome = m.homeTeam === homeTeamName;
                const myGoals = isHome ? m.homeGoals : m.awayGoals;
                const oppGoals = isHome ? m.awayGoals : m.homeGoals;
                const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
                const resultCls = result === 'W' ? 'bg-emerald-500 text-white' : result === 'D' ? 'bg-slate-500 text-white' : 'bg-red-500 text-white';
                const hw = m.homeGoals > m.awayGoals;
                const aw = m.awayGoals > m.homeGoals;
                return (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
                    <div className="w-[72px] shrink-0">
                      <div className="text-[9px] font-bold text-slate-400 tabular-nums">{m.date}</div>
                      {m.league && <div className="text-[8px] text-slate-600 truncate">{m.league}</div>}
                    </div>
                    <span className={`flex-1 text-[10px] font-bold truncate text-right ${hw ? 'text-white' : 'text-slate-500'}`}>{m.homeTeam}</span>
                    <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">
                      <span className={`text-xs font-black tabular-nums ${hw ? 'text-white' : 'text-slate-500'}`}>{m.homeGoals}</span>
                      <span className="text-slate-600 text-[10px]">:</span>
                      <span className={`text-xs font-black tabular-nums ${aw ? 'text-white' : 'text-slate-500'}`}>{m.awayGoals}</span>
                    </div>
                    <span className={`flex-1 text-[10px] font-bold truncate ${aw ? 'text-white' : 'text-slate-500'}`}>{m.awayTeam}</span>
                    <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[8px] font-black ${resultCls}`}>{result}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {(['home', 'away'] as const).map(side => {
        const recent: any[] = side === 'home' ? (analysis.homeLast20 ?? []) : (analysis.awayLast20 ?? []);
        const teamName = side === 'home' ? game.homeTeam : game.awayTeam;
        if (recent.length === 0) return null;
        const wins   = recent.filter(r => r.result === 'W').length;
        const draws  = recent.filter(r => r.result === 'D').length;
        const losses = recent.filter(r => r.result === 'L').length;
        return (
          <div key={side}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[160px]">
                {teamName} 최근 {recent.length}경기
              </span>
              <div className="flex gap-1.5">
                {[
                  { label: `${wins}승`, cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                  { label: `${draws}무`, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
                  { label: `${losses}패`, cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
                ].map(({ label, cls }) => (
                  <span key={label} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <span className="text-[8px] font-black text-slate-700 w-[72px] shrink-0">날짜</span>
              <span className="text-[8px] font-black text-slate-700 flex-1 text-right">홈</span>
              <span className="text-[8px] font-black text-slate-700 w-12 text-center shrink-0">스코어</span>
              <span className="text-[8px] font-black text-slate-700 flex-1">원정</span>
              <span className="text-[8px] font-black text-slate-700 w-5 text-center shrink-0">결과</span>
            </div>
            <div className="space-y-0.5">
              {recent.map((m: any, i: number) => {
                const hw = m.homeGoals != null && m.awayGoals != null && m.homeGoals > m.awayGoals;
                const aw = m.homeGoals != null && m.awayGoals != null && m.awayGoals > m.homeGoals;
                const resultCls = m.result === 'W' ? 'bg-emerald-500 text-white' : m.result === 'D' ? 'bg-slate-500 text-white' : m.result === 'L' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400';
                return (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
                    <div className="w-[72px] shrink-0">
                      <div className="text-[9px] font-bold text-slate-400 tabular-nums">{m.date}</div>
                      {m.league && <div className="text-[8px] text-slate-600 truncate">{m.league}</div>}
                    </div>
                    <span className={`flex-1 text-[10px] font-bold truncate text-right ${hw ? 'text-white' : 'text-slate-500'}`}>{m.homeTeam}</span>
                    <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">
                      <span className={`text-xs font-black tabular-nums ${hw ? 'text-white' : 'text-slate-500'}`}>{m.homeGoals ?? '–'}</span>
                      <span className="text-slate-600 text-[10px]">:</span>
                      <span className={`text-xs font-black tabular-nums ${aw ? 'text-white' : 'text-slate-500'}`}>{m.awayGoals ?? '–'}</span>
                    </div>
                    <span className={`flex-1 text-[10px] font-bold truncate ${aw ? 'text-white' : 'text-slate-500'}`}>{m.awayTeam}</span>
                    <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[8px] font-black ${resultCls}`}>{m.result ?? '–'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 탭: 포아송 예측 ───────────────────────────────────────────────────────────
function poissonProb(lambda: number, k: number): number {
  if (lambda <= 0) return 0;
  let val = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) val *= lambda / i;
  return val;
}

export function PoissonTab({ analysis, game }: { analysis: any; game: any }) {
  const homeAvgFor     = parseFloat(analysis.home?.goalsFor)     || 0;
  const homeAvgAgainst = parseFloat(analysis.home?.goalsAgainst) || 0;
  const awayAvgFor     = parseFloat(analysis.away?.goalsFor)     || 0;
  const awayAvgAgainst = parseFloat(analysis.away?.goalsAgainst) || 0;

  if (!homeAvgFor && !awayAvgFor) {
    return <div className="py-16 text-center text-slate-600 text-sm font-bold">예측 데이터 없음 (팀 평균 골 정보가 필요합니다)</div>;
  }

  const lambdaHome = homeAvgFor * awayAvgAgainst;
  const lambdaAway = awayAvgFor * homeAvgAgainst;
  const MAX = 4;
  const matrix: number[][] = [];
  for (let h = 0; h <= MAX; h++) {
    matrix[h] = [];
    for (let a = 0; a <= MAX; a++) matrix[h][a] = poissonProb(lambdaHome, h) * poissonProb(lambdaAway, a);
  }
  const totalProb = matrix.flat().reduce((s, v) => s + v, 0) || 1;
  let homeWin = 0, draw = 0, awayWin = 0, over25 = 0;
  for (let h = 0; h <= MAX; h++) for (let a = 0; a <= MAX; a++) {
    const p = matrix[h][a] / totalProb;
    if (h > a) homeWin += p; else if (h === a) draw += p; else awayWin += p;
    if (h + a > 2.5) over25 += p;
  }
  let bestH = 0, bestA = 0, bestP = 0;
  for (let h = 0; h <= MAX; h++) for (let a = 0; a <= MAX; a++) {
    if (matrix[h][a] > bestP) { bestP = matrix[h][a]; bestH = h; bestA = a; }
  }
  const maxP = Math.max(...matrix.flat());
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">홈 예상 득점</div>
          <div className="text-2xl font-black text-emerald-400">{lambdaHome.toFixed(2)}</div>
          <div className="text-[9px] text-slate-500 mt-1">{game.homeTeam}</div>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">원정 예상 득점</div>
          <div className="text-2xl font-black text-orange-400">{lambdaAway.toFixed(2)}</div>
          <div className="text-[9px] text-slate-500 mt-1">{game.awayTeam}</div>
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
        <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">가장 유력한 스코어</div>
        <div className="text-3xl font-black text-white">{bestH} : {bestA}</div>
        <div className="text-[10px] text-amber-400 font-bold mt-1">확률 {pct(bestP / totalProb)}</div>
      </div>
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 overflow-x-auto">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">스코어 확률 매트릭스 (홈 ↓ / 원정 →)</div>
        <table className="text-[10px] font-black w-full min-w-[200px]">
          <thead>
            <tr>
              <th className="text-slate-600 pb-1 pr-2 text-left">H\A</th>
              {Array.from({ length: MAX + 1 }, (_, a) => (
                <th key={a} className="text-orange-400 pb-1 px-1.5 text-center w-10">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX + 1 }, (_, h) => (
              <tr key={h}>
                <td className="text-emerald-400 py-0.5 pr-2">{h}</td>
                {Array.from({ length: MAX + 1 }, (_, a) => {
                  const p = matrix[h][a];
                  const isBest = h === bestH && a === bestA;
                  const intensity = maxP > 0 ? p / maxP : 0;
                  return (
                    <td key={a} className={`py-0.5 px-1.5 text-center rounded ${isBest ? 'bg-amber-500/30 text-amber-300 font-black' : intensity > 0.6 ? 'bg-indigo-500/20 text-indigo-300' : intensity > 0.3 ? 'bg-indigo-500/10 text-slate-400' : 'text-slate-600'}`}>
                      {pct(p / totalProb)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: '홈 승', val: homeWin, color: 'text-indigo-400' },
          { label: '무승부', val: draw,   color: 'text-yellow-400' },
          { label: '원정 승', val: awayWin, color: 'text-purple-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-black/20 rounded-2xl p-3 border border-white/5">
            <div className={`text-xl font-black ${color}`}>{pct(val)}</div>
            <div className="text-[9px] font-black text-slate-600 uppercase mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="text-lg font-black text-sky-400">{pct(over25)}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase mt-1">오버 2.5</div>
        </div>
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="text-lg font-black text-pink-400">{pct(1 - over25)}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase mt-1">언더 2.5</div>
        </div>
      </div>
      <div className="text-[9px] text-slate-700 text-center">포아송 분포 기반 예측 · 참고용</div>
    </div>
  );
}

// ── 탭: 부상/결장 ─────────────────────────────────────────────────────────────
export function InjuriesTab({ injuries, game }: { injuries: any[]; game: any }) {
  if (!injuries || injuries.length === 0) {
    return (
      <div className="py-12 text-center text-slate-600 text-sm font-bold">
        부상/결장 정보 없음
      </div>
    );
  }

  // 팀별 그룹
  const groups = new Map<string, { teamId: number; players: any[] }>();
  for (const inj of injuries) {
    if (!inj.team) continue;
    if (!groups.has(inj.team)) groups.set(inj.team, { teamId: inj.teamId, players: [] });
    groups.get(inj.team)!.players.push(inj);
  }

  const typeBadge = (type: string | null) => {
    if (!type) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    const t = type.toLowerCase();
    if (t.includes('miss') || t.includes('out')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (t.includes('question')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (t.includes('doubt')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([teamName, { players }]) => (
        <div key={teamName} className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{teamName}</div>
          <div className="space-y-2">
            {players.map((inj, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-white flex-1 truncate">{inj.player ?? '–'}</span>
                {inj.type && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${typeBadge(inj.type)}`}>
                    {inj.type}
                  </span>
                )}
                {inj.reason && (
                  <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{inj.reason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 탭: 메모 ──────────────────────────────────────────────────────────────────
export function MemoTab({ fixtureId }: { fixtureId: string }) {
  const key = `betman-notes-${fixtureId}`;
  const [note, setNote] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
  });
  const handleChange = (val: string) => {
    setNote(val);
    try { localStorage.setItem(key, val); } catch {}
  };
  const MAX_CHARS = 1000;
  return (
    <div className="space-y-3">
      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">개인 메모</div>
      <textarea
        value={note}
        onChange={e => handleChange(e.target.value)}
        maxLength={MAX_CHARS}
        placeholder="이 경기에 대한 메모를 입력하세요..."
        className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 font-medium resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
      />
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-700">자동 저장됨</span>
        <span className={`text-[10px] font-black tabular-nums ${note.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}>
          {note.length} / {MAX_CHARS}
        </span>
      </div>
      {note.length > 0 && (
        <button onClick={() => handleChange('')} className="text-[10px] font-black text-red-400/70 hover:text-red-400 transition-colors">
          메모 삭제
        </button>
      )}
    </div>
  );
}
