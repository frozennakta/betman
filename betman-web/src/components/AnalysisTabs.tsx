"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapPin, User, Calendar, Trophy, Send, MessageSquare } from 'lucide-react';

export const STATUS_LABEL: Record<string, string> = {
  '1H': '1st Half', 'HT': 'Half Time', '2H': '2nd Half',
  'ET': 'Extra Time', 'P': 'Penalties', 'FT': 'Full Time', 'PENDING': 'Scheduled',
  'BT': 'Break', 'INT': 'Interrupted', 'SUSP': 'Suspended', 'LIVE': 'Live',
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
      diff === -1 ? 'Yesterday'
      : diff === 0 ? 'Today'
      : diff === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setDt({ time, date });
  }, [isoDate]);
  return dt;
}

export function countryFlag(country: string): string {
  if (!country) return '';
  // 이미 2글자 ISO 코드인 경우 처리 (대소문자 무관)
  if (country.length === 2) {
    const code = country.toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) {
      return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
    }
  }
  const map: Record<string, string> = {
    Afghanistan:'AF', Albania:'AL', Algeria:'DZ', Argentina:'AR', Armenia:'AM',
    Australia:'AU', Austria:'AT', Azerbaijan:'AZ', Bahrain:'BH', Bangladesh:'BD',
    Belarus:'BY', Belgium:'BE', Bolivia:'BO', Bosnia:'BA', 'Bosnia and Herzegovina':'BA',
    Brazil:'BR', Bulgaria:'BG', 'Burkina Faso':'BF', Cameroon:'CM', Canada:'CA',
    Chile:'CL', China:'CN', Colombia:'CO', Congo:'CG', 'Costa Rica':'CR',
    Croatia:'HR', Cuba:'CU', Cyprus:'CY', 'Czech Republic':'CZ', Czechia:'CZ',
    Denmark:'DK', 'DR Congo':'CD', Ecuador:'EC', Egypt:'EG', 'El Salvador':'SV',
    England:'GB', Estonia:'EE', Ethiopia:'ET', Finland:'FI', France:'FR',
    Georgia:'GE', Germany:'DE', Ghana:'GH', Greece:'GR', Guatemala:'GT',
    Honduras:'HN', 'Hong Kong':'HK', Hungary:'HU', Iceland:'IS', India:'IN',
    Indonesia:'ID', Iran:'IR', Iraq:'IQ', Ireland:'IE', Israel:'IL',
    Italy:'IT', 'Ivory Coast':'CI', Jamaica:'JM', Japan:'JP', Jordan:'JO',
    Kazakhstan:'KZ', Kenya:'KE', Kosovo:'XK', Kuwait:'KW', Latvia:'LV',
    Lebanon:'LB', Libya:'LY', Lithuania:'LT', Luxembourg:'LU', Malaysia:'MY',
    Mali:'ML', Malta:'MT', Mexico:'MX', Moldova:'MD', Montenegro:'ME',
    Morocco:'MA', Mozambique:'MZ', Netherlands:'NL', 'New Zealand':'NZ',
    Nicaragua:'NI', Nigeria:'NG', 'North Korea':'KP', 'North Macedonia':'MK',
    Norway:'NO', Oman:'OM', Pakistan:'PK', Palestine:'PS', Panama:'PA',
    Paraguay:'PY', Peru:'PE', Philippines:'PH', Poland:'PL', Portugal:'PT',
    Qatar:'QA', Romania:'RO', Russia:'RU', Rwanda:'RW', 'Saudi Arabia':'SA',
    Scotland:'GB', Senegal:'SN', Serbia:'RS', Singapore:'SG', Slovakia:'SK',
    Slovenia:'SI', 'South Africa':'ZA', 'South Korea':'KR', Spain:'ES',
    Sweden:'SE', Switzerland:'CH', Syria:'SY', Taiwan:'TW', Tanzania:'TZ',
    Thailand:'TH', Tunisia:'TN', Turkey:'TR', Uganda:'UG', Ukraine:'UA',
    UAE:'AE', 'United Arab Emirates':'AE', 'United Kingdom':'GB',
    Uruguay:'UY', USA:'US', 'United States':'US', Uzbekistan:'UZ',
    Venezuela:'VE', Vietnam:'VN', Wales:'GB', Yemen:'YE',
    Zambia:'ZM', Zimbabwe:'ZW', 'Trinidad and Tobago':'TT',
    World:'🌍', International:'🌍',
  };
  if (country === 'World' || country === 'International') return '🌍';
  const code = map[country];
  if (!code || code.length !== 2) return '';
  return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

export function getCountryDisplay(country: string): { flag: string; code: string } {
  if (!country) return { flag: '', code: '---' };

  const codeMap: Record<string, string> = {
    Afghanistan:'AFG', Albania:'ALB', Algeria:'ALG', Argentina:'ARG', Armenia:'ARM',
    Australia:'AUS', Austria:'AUT', Azerbaijan:'AZE', Bahrain:'BHR', Bangladesh:'BAN',
    Belarus:'BLR', Belgium:'BEL', Bolivia:'BOL', Bosnia:'BIH', 'Bosnia and Herzegovina':'BIH',
    Brazil:'BRA', Bulgaria:'BUL', Cameroon:'CMR', Canada:'CAN', Chile:'CHI',
    China:'CHN', Colombia:'COL', 'Costa Rica':'CRC', Croatia:'CRO', Cuba:'CUB',
    Cyprus:'CYP', 'Czech Republic':'CZE', Czechia:'CZE', Denmark:'DEN', Ecuador:'ECU',
    Egypt:'EGY', 'El Salvador':'SLV', England:'ENG', Estonia:'EST', Ethiopia:'ETH',
    Finland:'FIN', France:'FRA', Georgia:'GEO', Germany:'GER', Ghana:'GHA',
    Greece:'GRE', Guatemala:'GUA', Honduras:'HON', 'Hong Kong':'HKG', Hungary:'HUN',
    Iceland:'ISL', India:'IND', Indonesia:'IDN', Iran:'IRN', Iraq:'IRQ',
    Ireland:'IRL', Israel:'ISR', Italy:'ITA', 'Ivory Coast':'CIV', Jamaica:'JAM',
    Japan:'JPN', Jordan:'JOR', Kazakhstan:'KAZ', Kenya:'KEN', Kosovo:'KOS',
    Kuwait:'KUW', Latvia:'LVA', Lebanon:'LBN', Lithuania:'LTU', Luxembourg:'LUX',
    Malaysia:'MAS', Mali:'MLI', Malta:'MLT', Mexico:'MEX', Moldova:'MDA',
    Montenegro:'MNE', Morocco:'MAR', Netherlands:'NED', 'New Zealand':'NZL',
    Nicaragua:'NCA', Nigeria:'NGA', 'North Korea':'PRK', 'North Macedonia':'MKD',
    Norway:'NOR', Pakistan:'PAK', Palestine:'PLE', Panama:'PAN', Paraguay:'PAR',
    Peru:'PER', Philippines:'PHI', Poland:'POL', Portugal:'POR', Qatar:'QAT',
    Romania:'ROU', Russia:'RUS', 'Saudi Arabia':'KSA', Scotland:'SCO', Senegal:'SEN',
    Serbia:'SRB', Singapore:'SGP', Slovakia:'SVK', Slovenia:'SVN',
    'South Africa':'RSA', 'South Korea':'KOR', Spain:'ESP', Sweden:'SWE',
    Switzerland:'SUI', Syria:'SYR', Thailand:'THA', Tunisia:'TUN', Turkey:'TUR',
    Uganda:'UGA', Ukraine:'UKR', UAE:'UAE', 'United Arab Emirates':'UAE',
    'United Kingdom':'GBR', Uruguay:'URU', USA:'USA', 'United States':'USA',
    Uzbekistan:'UZB', Venezuela:'VEN', Vietnam:'VIE', Wales:'WAL',
    World:'WLD', International:'INT',
  };

  const flag = countryFlag(country);
  // 입력이 2글자 ISO 코드인 경우 → 3자리로 변환 시도
  let code3 = codeMap[country];
  if (!code3 && country.length === 2) {
    // ISO 2자리 → 국가명 역매핑 시도, 없으면 그냥 2자리 대문자 사용
    code3 = country.toUpperCase();
  }
  if (!code3) {
    code3 = country.substring(0, 3).toUpperCase();
  }

  return { flag, code: code3 };
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
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Match Info</div>
        {localDT.time && (
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Kick-off" value={`${localDT.date} ${localDT.time} (local time)`} />
        )}
        <InfoRow icon={<Trophy className="w-3.5 h-3.5" />} label="League" value={game.league} />
        <InfoRow label="Country" value={`${flag} ${game.country}`} />
        {analysis.season && <InfoRow label="Season" value={String(analysis.season)} />}
        {analysis.round  && <InfoRow label="Round" value={analysis.round} />}
      </div>
      {(game.venue?.name || game.referee) && (
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Venue & Referee</div>
          {game.venue?.name && (
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Venue" value={`${game.venue.name}${game.venue.city ? ` · ${game.venue.city}` : ''}`} />
          )}
          {game.referee && (
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Ref" value={game.referee} />
          )}
        </div>
      )}
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Team Info</div>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'Home', name: game.homeTeam }, { label: 'Away', name: game.awayTeam }].map(({ label, name }) => (
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
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">No events (pre-match or unsupported)</div>;
  }
  const icon = (type: string, detail: string) => {
    if (type === 'Goal') return detail.includes('Penalty') ? '⚽🎯' : detail.includes('Own') ? '⚽🔴' : '⚽';
    if (type === 'Card') return detail.includes('Red') ? '🟥' : '🟨';
    if (type === 'subst') return '🔄';
    if (type === 'Var') return '📺';
    return '•';
  };
  // Group events by team for home/away alignment
  // Determine home team name from first event or use first unique team
  const teamNames = [...new Set(events.map(e => e.team))];
  const homeTeamName = teamNames[0] ?? '';
  
  return (
    <div className="space-y-1.5">
      {events.map((e, i) => {
        const isHome = e.team === homeTeamName;
        return (
          <div key={i} className={`flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2 border border-white/5 ${!isHome ? 'flex-row-reverse' : ''}`}>
            <span className={`text-[10px] font-black text-slate-500 w-10 shrink-0 tabular-nums leading-none ${isHome ? 'text-right' : 'text-left'}`}>
              {e.minute}{e.extra ? `+${e.extra}` : ''}'
            </span>
            <span className="text-base w-6 text-center shrink-0">{icon(e.type, e.detail)}</span>
            <div className={`flex-1 min-w-0 ${!isHome ? 'text-right' : 'text-left'}`}>
              <span className="text-xs font-bold text-white truncate block">{e.player}</span>
              {e.assist && <span className="text-[9px] text-slate-500 truncate block">→ {e.assist}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 탭: 스탯 ──────────────────────────────────────────────────────────────────
export function StatsTab({ statistics, xgHome, xgAway, events = [], game, elapsed }: {
  statistics: any[];
  xgHome?: string | null;
  xgAway?: string | null;
  events?: any[];
  game?: any;
  elapsed?: number | null;
}) {
  const hasStats = statistics && statistics.length >= 2;
  const hasEvents = events.length > 0;

  if (!hasStats && !hasEvents) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">No stats (pre-match or unsupported)</div>;
  }

  if (!hasStats) {
    return (
      <div className="space-y-4">
        {game && hasEvents && <MomentumChart events={events} game={game} elapsed={elapsed} />}
      </div>
    );
  }
  const homeStats = statistics[0];
  const awayStats = statistics[1];
  const homeMap = Object.fromEntries((homeStats.stats ?? []).map((s: any) => [s.type, s.value]));
  const awayMap = Object.fromEntries((awayStats.stats ?? []).map((s: any) => [s.type, s.value]));

  const hDA = parseInt(homeMap['Dangerous attacks']?.toString() || '0');
  const aDA = parseInt(awayMap['Dangerous attacks']?.toString() || '0');
  const hasMomentum = hDA > 0 || aDA > 0;
  const hPct = hasMomentum ? Math.round((hDA / (hDA + aDA)) * 100) : 50;

  const categories = [
    {
      label: '⭐ Top Stats',
      rows: [
        ['Ball Possession', 'Possession'],
        ['Total Shots', 'Shots'],
        ['Shots on Goal', 'On Target'],
        ['Corner Kicks', 'Corners'],
        ['Yellow Cards', 'Yellows'],
        ['Red Cards', 'Reds'],
      ],
    },
    {
      label: '🎯 Shots',
      rows: [
        ['Total Shots', 'Total'],
        ['Shots on Goal', 'On Target'],
        ['Shots off Goal', 'Off Target'],
        ['Blocked Shots', 'Blocked'],
        ['Shots insidebox', 'Inside Box'],
        ['Shots outsidebox', 'Outside Box'],
      ],
    },
    {
      label: '⚔️ Attack',
      rows: [
        ['Total attacks', 'Attacks'],
        ['Dangerous attacks', 'Dangerous'],
        ['Offsides', 'Offsides'],
        ['Fouls', 'Fouls'],
      ],
    },
    {
      label: '🔄 Passes',
      rows: [
        ['Total passes', 'Total'],
        ['Passes accurate', 'Accurate'],
        ['Passes %', 'Pass %'],
        ['Ball Possession', 'Possession'],
      ],
    },
    {
      label: '🛡️ Defence',
      rows: [
        ['Goalkeeper Saves', 'Saves'],
        ['Fouls', 'Fouls'],
        ['Yellow Cards', 'Yellows'],
        ['Red Cards', 'Reds'],
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState(0);
  const currentRows = categories[activeCategory].rows.filter(
    ([key]) => homeMap[key] != null || awayMap[key] != null
  );

  return (
    <div className="space-y-4">
      {/* 경기 흐름 차트 */}
      {game && hasEvents && (
        <MomentumChart events={events} game={game} elapsed={elapsed} />
      )}

      {/* 모멘텀 바 */}
      {hasMomentum && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-black to-orange-500/10 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-[50%] w-[1px] h-full bg-white/20 z-0" />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">Live Momentum (Dangerous Attacks)</div>
          <div className="flex justify-between mb-2 relative z-10 font-black text-lg">
            <span className="text-emerald-400">{hDA}</span>
            <span className="text-orange-400">{aDA}</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-white/5 relative z-10 shadow-inner">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 relative" style={{ width: `${hPct}%` }}>
              {hPct > 60 && <div className="absolute right-0 inset-y-0 w-10 bg-white/30 blur-md animate-pulse pointer-events-none" />}
            </div>
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 relative" style={{ width: `${100 - hPct}%` }}>
              {hPct < 40 && <div className="absolute left-0 inset-y-0 w-10 bg-white/30 blur-md animate-pulse pointer-events-none" />}
            </div>
          </div>
        </div>
      )}

      {/* xG 카드 */}
      {(xgHome || xgAway) && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-3">
            <div className="text-xl font-black text-emerald-400">{xgHome ?? '–'}</div>
            <div className="text-[9px] font-black text-slate-600 uppercase mt-1">xG Home</div>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-2xl py-3 flex flex-col items-center justify-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expected</div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Goals</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl py-3">
            <div className="text-xl font-black text-orange-400">{xgAway ?? '–'}</div>
            <div className="text-[9px] font-black text-slate-600 uppercase mt-1">xG Away</div>
          </div>
        </div>
      )}

      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
              activeCategory === i
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 스탯 바 */}
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex justify-between text-[10px] font-black mb-1">
          <span className="text-emerald-400 truncate">{homeStats.team}</span>
          <span className="text-orange-400 truncate text-right">{awayStats.team}</span>
        </div>
        {currentRows.length > 0 ? (
          currentRows.map(([key, label]) => (
            <StatBar key={key} label={label} home={homeMap[key]} away={awayMap[key]} />
          ))
        ) : (
          <div className="py-4 text-center text-[11px] text-slate-600 font-bold">No data for this category</div>
        )}
      </div>
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

// 선수 원형 사진 토큰 (피치 위 사용)
function PlayerToken({ id, number, pos }: { id: number; number: number; pos: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative">
      {!failed ? (
        <img
          src={`https://media.api-sports.io/football/players/${id}.png`}
          alt=""
          className="w-12 h-12 rounded-full object-cover shadow-xl border-2 border-white/60 bg-white/10"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-sm font-black shadow-xl border-2 border-white/60 ${POS_COLOR[pos] ?? 'bg-slate-500 text-white'}`}>
          {number}
        </div>
      )}
      {!failed && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white border-2 border-white/50 leading-none shadow">
          {number}
        </div>
      )}
    </div>
  );
}

function PitchView({ lineup }: { lineup: any }) {
  const hasGrid = (lineup.startXI ?? []).some((p: any) => p.grid);
  if (!hasGrid || !lineup.formation) return null;

  const formRows = lineup.formation.split('-').map(Number);
  const maxRow = formRows.length + 1;

  const byRow = new Map<number, any[]>();
  for (const p of (lineup.startXI ?? [])) {
    if (!p.grid) continue;
    const [row] = p.grid.split(':').map(Number);
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push(p);
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: 'linear-gradient(180deg, #2a7a3b 0%, #2f8c43 12.5%, #2a7a3b 25%, #2f8c43 37.5%, #2a7a3b 50%, #2f8c43 62.5%, #2a7a3b 75%, #2f8c43 87.5%, #2a7a3b 100%)',
        aspectRatio: '2/3',
      }}
    >
      <div className="absolute left-0 right-0 border-t border-white/35" style={{ top: '50%' }} />
      <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', aspectRatio: '1', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)' }} />
      <div className="absolute border-2 border-white/35 rounded-sm" style={{ top: '1%', left: '22%', right: '22%', height: '15%' }} />
      <div className="absolute border-2 border-white/35 rounded-sm" style={{ bottom: '1%', left: '22%', right: '22%', height: '15%' }} />
      {/* 센터 스팟 */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/40" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      {[...byRow.entries()].map(([row, players]) => {
        const topPct = ((row - 0.5) / maxRow) * 100;
        return players.map((p, ci) => {
          const leftPct = ((ci + 1) / (players.length + 1)) * 100;
          return (
            <div
              key={p.number}
              className="absolute flex flex-col items-center"
              style={{ top: `${topPct}%`, left: `${leftPct}%`, transform: 'translate(-50%, -50%)', width: '20%' }}
            >
              <PlayerToken id={p.id} number={p.number} pos={p.pos} />
              <span className="text-[9px] font-bold text-white text-center leading-tight mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-full truncate px-0.5">
                {p.name?.split(' ').slice(-1)[0]}
              </span>
            </div>
          );
        });
      })}
    </div>
  );
}

// 선수 한 칸 (좌/우 공용)
function PlayerCell({ p, team, playerRatings, playerStatsMap, onPlayerClick, isHome }: {
  p: any; team: string;
  playerRatings: Record<number, string>;
  playerStatsMap: Record<number, any>;
  onPlayerClick?: (p: any) => void;
  isHome: boolean;
}) {
  if (!p) return <div className="p-1.5" />;
  const rating = playerRatings[p.id] ? parseFloat(playerRatings[p.id]) : null;
  const posColor =
    p.pos === 'G' ? 'text-yellow-400' :
    p.pos === 'D' ? 'text-blue-400' :
    p.pos === 'M' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className={`flex items-center gap-2 p-2 ${onPlayerClick ? 'cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors' : ''}`}
      onClick={() => onPlayerClick?.({ ...p, team, rating: playerRatings[p.id], stats: playerStatsMap[p.id] ?? {} })}
    >
      <img
        src={`https://media.api-sports.io/football/players/${p.id}.png`}
        alt=""
        className="w-8 h-8 rounded-full object-cover shrink-0 bg-white/5 border border-white/10"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black text-white truncate leading-tight">{p.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[9px] font-black ${posColor}`}>{POS_LABEL[p.pos] ?? p.pos}</span>
          <span className="text-[9px] text-slate-500">#{p.number}</span>
          {rating != null && (
            <span className={`text-[9px] font-black ${rating >= 7 ? 'text-amber-400' : 'text-slate-500'}`}>★{rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LineupTab({ lineups, playerRatings = {}, playerStatsMap = {}, onPlayerClick }: {
  lineups: any[];
  playerRatings?: Record<number, string>;
  playerStatsMap?: Record<number, any>;
  onPlayerClick?: (p: any) => void;
}) {
  if (!lineups || lineups.length === 0) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">Lineup not announced</div>;
  }

  const [home, away] = lineups;
  const hasVisual = lineups.some(l => l.formation && (l.startXI ?? []).some((p: any) => p.grid));
  const maxXI  = Math.max(home?.startXI?.length ?? 0, away?.startXI?.length ?? 0);
  const maxSub = Math.max(home?.substitutes?.length ?? 0, away?.substitutes?.length ?? 0);

  return (
    <div className="space-y-4">
      {/* 피치 뷰 (사진 토큰) */}
      {hasVisual && (
        <div className="grid grid-cols-2 gap-2">
          {[home, away].filter(Boolean).map((l, i) => (
            <div key={l.teamId}>
              <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 text-center truncate ${i === 0 ? 'text-indigo-400' : 'text-orange-400'}`}>{l.team}</div>
              <PitchView lineup={l} />
              {l.formation && <div className={`text-center mt-1 text-[9px] font-black ${i === 0 ? 'text-indigo-400' : 'text-orange-400'}`}>{l.formation}</div>}
            </div>
          ))}
        </div>
      )}

      {onPlayerClick && (
        <div className="text-[9px] font-bold text-slate-600 text-center">Tap a player to see stats</div>
      )}

      {/* 홈 / 원정 나란히 */}
      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
        {/* 팀 헤더 */}
        <div className="grid grid-cols-2">
          {[home, away].filter(Boolean).map((l, i) => (
            <div key={l.teamId} className={`p-3 ${i === 0 ? 'border-r border-white/5' : ''}`}>
              <div className="text-sm font-black text-white truncate">{l.team}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {l.formation && <span className={`text-xs font-black ${i === 0 ? 'text-indigo-400' : 'text-orange-400'}`}>{l.formation}</span>}
                {l.coach && <span className="text-[10px] text-slate-500 truncate">👔 {l.coach}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Starting XI */}
        <div className="border-t border-white/5 bg-white/[0.02] px-3 py-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Starting XI</span>
        </div>
        {Array.from({ length: maxXI }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 border-t border-white/[0.04]">
            <div className="border-r border-white/[0.04]">
              <PlayerCell p={home?.startXI?.[i]} team={home?.team} playerRatings={playerRatings} playerStatsMap={playerStatsMap} onPlayerClick={onPlayerClick} isHome />
            </div>
            <PlayerCell p={away?.startXI?.[i]} team={away?.team} playerRatings={playerRatings} playerStatsMap={playerStatsMap} onPlayerClick={onPlayerClick} isHome={false} />
          </div>
        ))}

        {/* Substitutes */}
        {maxSub > 0 && (
          <>
            <div className="border-t border-white/5 bg-white/[0.02] px-3 py-1.5 mt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Substitutes</span>
            </div>
            {Array.from({ length: maxSub }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 border-t border-white/[0.04] opacity-70">
                <div className="border-r border-white/[0.04]">
                  <PlayerCell p={home?.substitutes?.[i]} team={home?.team} playerRatings={playerRatings} playerStatsMap={playerStatsMap} onPlayerClick={onPlayerClick} isHome />
                </div>
                <PlayerCell p={away?.substitutes?.[i]} team={away?.team} playerRatings={playerRatings} playerStatsMap={playerStatsMap} onPlayerClick={onPlayerClick} isHome={false} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── 맞대결 섹션 (홈/원정 필터 포함) ─────────────────────────────────────────
function H2HSection({ h2h, homeTeamName }: { h2h: any[]; homeTeamName: string }) {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');

  // 홈팀 기준 전체 승/무/패
  let w = 0, d = 0, l = 0;
  h2h.forEach((m: any) => {
    if (m.homeGoals == null || m.awayGoals == null) return;
    const isHome = m.homeTeam === homeTeamName;
    const mg = isHome ? m.homeGoals : m.awayGoals;
    const og = isHome ? m.awayGoals : m.homeGoals;
    if (mg > og) w++; else if (mg === og) d++; else l++;
  });

  // 필터: 홈 = 홈팀이 홈으로 뛴 경기, 원정 = 홈팀이 원정으로 뛴 경기
  const filtered = filter === 'all' ? h2h
    : h2h.filter(m => filter === 'home' ? m.homeTeam === homeTeamName : m.awayTeam === homeTeamName);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">H2H Record ({h2h.length})</span>
          {[
            { label: `${w}W`,  cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            { label: `${d}D`, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
            { label: `${l}L`,  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
          ].map(({ label, cls }) => (
            <span key={label} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          {(['all', 'home', 'away'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${
                filter === f
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f === 'home' ? 'Home' : 'Away'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-4 text-center text-[10px] text-slate-600 font-bold">No matches found</div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <span className="text-[8px] font-black text-slate-700 w-[72px] shrink-0">Date</span>
            <span className="text-[8px] font-black text-slate-700 flex-1 text-right">Home</span>
            <span className="text-[8px] font-black text-slate-700 w-12 text-center shrink-0">Score</span>
            <span className="text-[8px] font-black text-slate-700 flex-1">Away</span>
            <span className="text-[8px] font-black text-slate-700 w-5 text-center shrink-0">W/L</span>
          </div>
          <div className="space-y-0.5">
            {filtered.map((m: any, i: number) => {
              if (m.homeGoals == null || m.awayGoals == null) return null;
              const isHome = m.homeTeam === homeTeamName;
              const myGoals  = isHome ? m.homeGoals : m.awayGoals;
              const oppGoals = isHome ? m.awayGoals : m.homeGoals;
              const result = myGoals > oppGoals ? 'W' : myGoals === oppGoals ? 'D' : 'L';
              const resultCls = result === 'W' ? 'bg-emerald-500 text-white' : result === 'D' ? 'bg-slate-500 text-white' : 'bg-red-500 text-white';
              const hw = m.homeGoals > m.awayGoals;
              const aw = m.awayGoals > m.homeGoals;
              
              const hPro = m.homeTeam === homeTeamName;
              const aPro = m.awayTeam === homeTeamName;
              
              const hColor = (hPro && hw) ? 'text-emerald-500 font-extrabold' : hw ? 'text-white font-extrabold' : 'text-slate-700 dark:text-slate-400 font-medium';
              const aColor = (aPro && aw) ? 'text-emerald-500 font-extrabold' : aw ? 'text-white font-extrabold' : 'text-slate-700 dark:text-slate-400 font-medium';
              const sColorH = hw ? (hPro ? 'text-emerald-500' : 'text-white') : 'text-slate-500 dark:text-slate-400';
              const sColorA = aw ? (aPro ? 'text-emerald-500' : 'text-white') : 'text-slate-500 dark:text-slate-400';

              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-[72px] shrink-0">
                    <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">{m.date}</div>
                    {m.league && <div className="text-[8px] text-slate-500 dark:text-slate-600 truncate">{m.league}</div>}
                  </div>
                  <span className={`flex-1 text-[10px] truncate text-right ${hColor}`}>{m.homeTeam}</span>
                  <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">
                    <span className={`text-xs font-black tabular-nums ${sColorH}`}>{m.homeGoals}</span>
                    <span className="text-slate-400 dark:text-slate-600 text-[10px]">:</span>
                    <span className={`text-xs font-black tabular-nums ${sColorA}`}>{m.awayGoals}</span>
                  </div>
                  <span className={`flex-1 text-[10px] truncate ${aColor}`}>{m.awayTeam}</span>
                  <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[8px] font-black ${resultCls}`}>{result}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── 최근 경기 섹션 (홈/원정 필터 포함) ──────────────────────────────────────
function RecentGamesSection({ recent, teamName }: { recent: any[]; teamName: string }) {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');

  const played = recent.filter(m => m.result != null);
  const wins   = played.filter(m => m.result === 'W').length;
  const draws  = played.filter(m => m.result === 'D').length;
  const losses = played.filter(m => m.result === 'L').length;

  const filtered = filter === 'all' ? recent
    : recent.filter(m => filter === 'home' ? m.isHome === true : m.isHome === false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[140px]">
            {teamName} Last {recent.length}
          </span>
          {[
            { label: `${wins}W`,  cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            { label: `${draws}D`, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
            { label: `${losses}L`,cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
          ].map(({ label, cls }) => (
            <span key={label} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          {(['all', 'home', 'away'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${
                filter === f
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f === 'home' ? 'Home' : 'Away'}
            </button>
          ))}
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="py-4 text-center text-[10px] text-slate-600 font-bold">No data (API limit may have been reached)</div>
      ) : filtered.length === 0 ? (
        <div className="py-4 text-center text-[10px] text-slate-600 font-bold">No matches found</div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <span className="text-[8px] font-black text-slate-700 w-[72px] shrink-0">Date</span>
            <span className="text-[8px] font-black text-slate-700 flex-1 text-right">Home</span>
            <span className="text-[8px] font-black text-slate-700 w-12 text-center shrink-0">Score</span>
            <span className="text-[8px] font-black text-slate-700 flex-1">Away</span>
            <span className="text-[8px] font-black text-slate-700 w-5 text-center shrink-0">W/L</span>
          </div>
          <div className="space-y-0.5">
            {filtered.map((m: any, i: number) => {
              const hw = m.homeGoals != null && m.awayGoals != null && m.homeGoals > m.awayGoals;
              const aw = m.homeGoals != null && m.awayGoals != null && m.awayGoals > m.homeGoals;
              
              const hPro = m.homeTeam === teamName;
              const aPro = m.awayTeam === teamName;
              
              const hColor = (hPro && hw) ? 'text-emerald-500 font-extrabold' : hw ? 'text-white font-extrabold' : 'text-slate-700 dark:text-slate-400 font-medium';
              const aColor = (aPro && aw) ? 'text-emerald-500 font-extrabold' : aw ? 'text-white font-extrabold' : 'text-slate-700 dark:text-slate-400 font-medium';
              const sColorH = hw ? (hPro ? 'text-emerald-500' : 'text-white') : 'text-slate-500 dark:text-slate-400';
              const sColorA = aw ? (aPro ? 'text-emerald-500' : 'text-white') : 'text-slate-500 dark:text-slate-400';

              const resultCls =
                m.result === 'W' ? 'bg-emerald-500 text-white' :
                m.result === 'D' ? 'bg-slate-400 dark:bg-slate-500 text-white' :
                m.result === 'L' ? 'bg-red-500 text-white' :
                'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400';

              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-[72px] shrink-0">
                    <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">{m.date}</div>
                    {m.league && <div className="text-[8px] text-slate-500 dark:text-slate-600 truncate">{m.league}</div>}
                  </div>
                  <span className={`flex-1 text-[10px] truncate text-right ${hColor}`}>{m.homeTeam}</span>
                  <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">
                    <span className={`text-xs font-black tabular-nums ${sColorH}`}>{m.homeGoals ?? '–'}</span>
                    <span className="text-slate-400 dark:text-slate-600 text-[10px]">:</span>
                    <span className={`text-xs font-black tabular-nums ${sColorA}`}>{m.awayGoals ?? '–'}</span>
                  </div>
                  <span className={`flex-1 text-[10px] truncate ${aColor}`}>{m.awayTeam}</span>
                  <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[8px] font-black ${resultCls}`}>
                    {m.result ?? (m.status === 'NS' ? '–' : m.status ?? '–')}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
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
            { label: 'Home Win', val: analysis.prediction.homeWin, color: 'text-indigo-400' },
            { label: 'Draw', val: analysis.prediction.draw,    color: 'text-yellow-400' },
            { label: 'Away Win', val: analysis.prediction.awayWin, color: 'text-purple-400' },
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
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">AI Predicted Winner</span>
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
            <span className="text-slate-600 uppercase tracking-widest">Comparison</span>
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
                <span>GF avg {team?.goalsFor ?? '–'}</span>
                <span>GA avg {team?.goalsAgainst ?? '–'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {analysis.h2h?.length > 0 && (
        <H2HSection h2h={analysis.h2h} homeTeamName={game.homeTeam} />
      )}
      <RecentGamesSection recent={analysis.homeLast20 ?? []} teamName={game.homeTeam} />
      <RecentGamesSection recent={analysis.awayLast20 ?? []} teamName={game.awayTeam} />
    </div>
  );
}

// ── 탭: Trollbox 채팅방 ───────────────────────────────────────────────────────
export function ChatTab({ fixtureId: _fixtureId }: { fixtureId: string }) {
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('Guest');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let name = localStorage.getItem('betman-chat-name');
    if (!name) {
      name = 'BetMan_' + Math.floor(Math.random() * 9999);
      localStorage.setItem('betman-chat-name', name);
    }
    setUsername(name);
    // 모의 채팅 로딩
    setMessages([
      { id: '1', user: 'System', text: 'Welcome to the Trollbox! Predictions?', time: '00:00' }
    ]);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now().toString(), user: username, text: input, time: now };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="flex flex-col h-[400px] bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      <div className="bg-indigo-500/10 border-b border-white/5 p-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Global Trollbox</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar flex flex-col">
        {messages.map(m => (
          <div key={m.id} className="flex flex-col">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className={`text-[10px] font-black ${m.user === username ? 'text-emerald-400' : m.user === 'System' ? 'text-amber-400' : 'text-slate-400'}`}>{m.user}</span>
              <span className="text-[8px] font-bold text-slate-600">{m.time}</span>
            </div>
            <div className={`px-3 py-2 rounded-xl text-sm font-bold w-fit max-w-[85%] ${m.user === username ? 'bg-indigo-500 text-white rounded-tl-none' : 'bg-white/5 text-slate-300 rounded-tr-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
        <input
          className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 font-bold"
          placeholder="Trash talk or predictions..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="p-2 bg-indigo-500 rounded-xl text-white hover:bg-indigo-600 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── 탭: 포아송 예측 (기존) ────────────────────────────────────────────────────

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
    return <div className="py-16 text-center text-slate-600 text-sm font-bold">No prediction data (team goal averages required)</div>;
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
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Home xG</div>
          <div className="text-2xl font-black text-emerald-400">{lambdaHome.toFixed(2)}</div>
          <div className="text-[9px] text-slate-500 mt-1">{game.homeTeam}</div>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Away xG</div>
          <div className="text-2xl font-black text-orange-400">{lambdaAway.toFixed(2)}</div>
          <div className="text-[9px] text-slate-500 mt-1">{game.awayTeam}</div>
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
        <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Most Likely Score</div>
        <div className="text-3xl font-black text-white">{bestH} : {bestA}</div>
        <div className="text-[10px] text-amber-400 font-bold mt-1">Probability {pct(bestP / totalProb)}</div>
      </div>
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 overflow-x-auto">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Score Probability Matrix (Home ↓ / Away →)</div>
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
          { label: 'Home Win', val: homeWin, color: 'text-indigo-400' },
          { label: 'Draw', val: draw,   color: 'text-yellow-400' },
          { label: 'Away Win', val: awayWin, color: 'text-purple-400' },
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
          <div className="text-[9px] font-black text-slate-600 uppercase mt-1">Over 2.5</div>
        </div>
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="text-lg font-black text-pink-400">{pct(1 - over25)}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase mt-1">Under 2.5</div>
        </div>
      </div>
      <div className="text-[9px] text-slate-700 text-center">Poisson distribution prediction · for reference only</div>
    </div>
  );
}

// ── 탭: 부상/결장 ─────────────────────────────────────────────────────────────
export function InjuriesTab({ injuries }: { injuries: any[]; game?: any }) {
  if (!injuries || injuries.length === 0) {
    return (
      <div className="py-12 text-center text-slate-600 text-sm font-bold">
        No injury/suspension data
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

  const getReasonIcon = (reason: string = '', type: string = '') => {
    const text = (reason + ' ' + type).toLowerCase();
    if (text.includes('suspend') || text.includes('suspension') || text.includes('card') || text.includes('red') || text.includes('yellow') || text.includes('disciplinary')) return '🚫';
    if (text.includes('injur') || text.includes('knock') || text.includes('surgery') || text.includes('illness') || text.includes('sick') || text.includes('virus') || text.includes('muscle') || text.includes('hamstring') || text.includes('ankle') || text.includes('knee')) return '🩹';
    return '⚠️';
  };

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([teamName, { players }]) => (
        <div key={teamName} className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{teamName}</div>
          <div className="space-y-2">
            {players.map((inj, i) => {
              const icon = getReasonIcon(inj.reason, inj.type);
              return (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-sm shrink-0">{icon}</span>
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
              );
            })}
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
      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Personal Notes</div>
      <textarea
        value={note}
        onChange={e => handleChange(e.target.value)}
        maxLength={MAX_CHARS}
        placeholder="Add your notes about this match..."
        className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 font-medium resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
      />
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-700">Auto-saved</span>
        <span className={`text-[10px] font-black tabular-nums ${note.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}>
          {note.length} / {MAX_CHARS}
        </span>
      </div>
      {note.length > 0 && (
        <button onClick={() => handleChange('')} className="text-[10px] font-black text-red-400/70 hover:text-red-400 transition-colors">
          Clear Notes
        </button>
      )}
    </div>
  );
}

// ── 탭: 라이브 코멘터리 ────────────────────────────────────────────────────────
export function CommentaryTab({ events, game }: { events: any[]; game: any }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-12 text-center text-slate-600 text-sm font-bold">
        No commentary (pre-match or data unavailable)
      </div>
    );
  }

  const icon = (type: string, detail: string) => {
    if (type === 'Goal') return detail?.includes('Penalty') ? '⚽🎯' : detail?.includes('Own') ? '⚽🔴' : '⚽';
    if (type === 'Card') return detail?.includes('Red') ? '🟥' : '🟨';
    if (type === 'subst') return '🔄';
    if (type === 'Var') return '📺';
    return '•';
  };

  const bgColor = (type: string, detail: string) => {
    if (type === 'Goal') return 'bg-emerald-500/10 border-emerald-500/20';
    if (type === 'Card' && detail?.includes('Red')) return 'bg-red-500/10 border-red-500/20';
    if (type === 'Card') return 'bg-yellow-500/10 border-yellow-500/20';
    if (type === 'subst') return 'bg-blue-500/10 border-blue-500/10';
    return 'bg-white/[0.03] border-white/5';
  };

  const sorted = [...events].sort((a, b) => {
    const am = (a.minute ?? 0) + (a.extra ?? 0) * 0.01;
    const bm = (b.minute ?? 0) + (b.extra ?? 0) * 0.01;
    return bm - am; // 최신순
  });

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">
        Latest first · {events.length} events
      </div>
      {sorted.map((e, i) => {
        const isHome = e.team === game.homeTeam;
        return (
          <div key={i} className={`flex gap-3 rounded-xl px-3 py-2.5 border ${bgColor(e.type, e.detail)}`}>
            {/* 분 */}
            <div className="shrink-0 w-10 text-center">
              <span className="text-[11px] font-black text-slate-400 tabular-nums">
                {e.minute}{e.extra ? `+${e.extra}` : ''}'
              </span>
            </div>
            {/* 아이콘 */}
            <span className="text-base shrink-0">{icon(e.type, e.detail)}</span>
            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-black text-white">{e.player}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isHome ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {isHome ? 'HM' : 'AW'}
                </span>
              </div>
              {e.assist && (
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {e.type === 'subst' ? '↑ In: ' : 'Assist: '}<span className="text-slate-400">{e.assist}</span>
                </div>
              )}
              <div className="text-[9px] text-slate-600 mt-0.5">{e.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 탭: 배당률 비교 (멀티 북메이커) ──────────────────────────────────────────
export function OddsTab({ allBookmakerOdds, oddsOverUnder = [], oddsBTTS = [], game, prediction }: {
  allBookmakerOdds: any[];
  oddsOverUnder?: any[];
  oddsBTTS?: any[];
  game: any;
  prediction?: any;
}) {
  const [market, setMarket] = useState<'1x2' | 'ou' | 'btts'>('1x2');

  const hasAny = allBookmakerOdds.length > 0 || oddsOverUnder.length > 0 || oddsBTTS.length > 0;
  if (!hasAny) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">No odds data available</div>;
  }

  // ── 공통 헬퍼 ──
  const avgOdd = (arr: any[], key: string) => {
    const vs = arr.filter(o => o[key]).map(o => parseFloat(o[key]));
    return vs.length ? (vs.reduce((s, v) => s + v, 0) / vs.length).toFixed(2) : null;
  };
  const bestOddBm = (arr: any[], key: string) =>
    arr.reduce((b: any, o: any) => (parseFloat(o[key] ?? '0') > parseFloat(b?.[key] ?? '0') ? o : b), arr[0]);

  const OddCell = ({ val, isBest }: { val: string | null; isBest?: boolean }) => (
    <span className={`text-[12px] font-black tabular-nums ${isBest ? 'text-emerald-400' : 'text-slate-300'}`}>{val ?? '–'}</span>
  );

  // ── Value Bet (1X2만 해당) ──
  const valueBets: { label: string; value: number; color: string }[] = [];
  if (market === '1x2' && prediction && allBookmakerOdds.length > 0) {
    const valids = allBookmakerOdds.filter(o => o.home && o.draw && o.away);
    if (valids.length > 0) {
      const ah = parseFloat(avgOdd(valids, 'home') ?? '0');
      const ad = parseFloat(avgOdd(valids, 'draw') ?? '0');
      const aw = parseFloat(avgOdd(valids, 'away') ?? '0');
      const ph = parseFloat(prediction.homeWin ?? '0') / 100;
      const pd = parseFloat(prediction.draw ?? '0') / 100;
      const pa = parseFloat(prediction.awayWin ?? '0') / 100;
      [
        { label: `${game.homeTeam} Win`, prob: ph, odd: ah, color: 'text-indigo-400' },
        { label: 'Draw',                  prob: pd, odd: ad, color: 'text-slate-400' },
        { label: `${game.awayTeam} Win`,  prob: pa, odd: aw, color: 'text-orange-400' },
      ].forEach(({ label, prob, odd, color }) => {
        if (odd > 0 && prob > 0) {
          const edge = Math.round((prob - 1 / odd) * 100);
          if (edge > 2) valueBets.push({ label, value: edge, color });
        }
      });
    }
  }

  // ── 1X2 뷰 ──
  const render1X2 = () => {
    const valids = allBookmakerOdds.filter(o => o.home && o.draw && o.away);
    if (valids.length === 0 && allBookmakerOdds.length === 0)
      return <div className="py-8 text-center text-slate-600 text-sm font-bold">No Match Winner odds</div>;
    const avgH = avgOdd(allBookmakerOdds, 'home');
    const avgD = avgOdd(allBookmakerOdds, 'draw');
    const avgA = avgOdd(allBookmakerOdds, 'away');
    const bH = bestOddBm(allBookmakerOdds, 'home');
    const bD = bestOddBm(allBookmakerOdds, 'draw');
    const bA = bestOddBm(allBookmakerOdds, 'away');
    return (
      <div className="space-y-3">
        {/* 평균 요약 */}
        {avgH && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: game.homeTeam, val: avgH, color: 'text-indigo-400', predPct: prediction?.homeWin },
              { label: 'Draw',        val: avgD, color: 'text-slate-400',   predPct: prediction?.draw },
              { label: game.awayTeam, val: avgA, color: 'text-orange-400',  predPct: prediction?.awayWin },
            ].map(({ label, val, color, predPct }) => (
              <div key={label} className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className="text-[8px] font-black text-slate-600 uppercase mt-0.5 truncate">Avg Odds</div>
                {predPct && <div className="text-[9px] font-bold text-slate-500 mt-1">AI {predPct}</div>}
              </div>
            ))}
          </div>
        )}
        {/* 가치 배팅 */}
        {valueBets.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">📈 Value Bets</div>
            <div className="flex flex-wrap gap-2">
              {valueBets.map(vb => (
                <div key={vb.label} className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2.5 py-1">
                  <span className={`text-[10px] font-black ${vb.color}`}>{vb.label}</span>
                  <span className="text-[10px] font-black text-emerald-400">+{vb.value}%</span>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-slate-600 mt-2">Edge = AI prediction − bookmaker implied probability</div>
          </div>
        )}
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="flex-1 text-[9px] font-black text-slate-600 uppercase">Bookmaker</span>
          <span className="w-14 text-[9px] font-black text-indigo-400 uppercase text-center">Home</span>
          <span className="w-14 text-[9px] font-black text-slate-500 uppercase text-center">Draw</span>
          <span className="w-14 text-[9px] font-black text-orange-400 uppercase text-center">Away</span>
        </div>
        <div className="space-y-1">
          {allBookmakerOdds.map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors">
              <span className="flex-1 text-[11px] font-bold text-slate-400 truncate">{o.bookmaker}</span>
              <span className="w-14 text-center"><OddCell val={o.home} isBest={bH?.bookmaker === o.bookmaker} /></span>
              <span className="w-14 text-center"><OddCell val={o.draw} isBest={bD?.bookmaker === o.bookmaker} /></span>
              <span className="w-14 text-center"><OddCell val={o.away} isBest={bA?.bookmaker === o.bookmaker} /></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Over/Under 뷰 ──
  const renderOU = () => {
    if (oddsOverUnder.length === 0)
      return <div className="py-8 text-center text-slate-600 text-sm font-bold">No Over/Under odds</div>;
    const avgO = avgOdd(oddsOverUnder, 'over');
    const avgU = avgOdd(oddsOverUnder, 'under');
    const bO = bestOddBm(oddsOverUnder, 'over');
    const bU = bestOddBm(oddsOverUnder, 'under');
    return (
      <div className="space-y-3">
        {avgO && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Over 2.5', val: avgO, color: 'text-sky-400' },
              { label: 'Under 2.5', val: avgU, color: 'text-purple-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className="text-[8px] font-black text-slate-600 uppercase mt-1">{label} · Avg</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="flex-1 text-[9px] font-black text-slate-600 uppercase">Bookmaker</span>
          <span className="w-16 text-[9px] font-black text-sky-400 uppercase text-center">Over 2.5</span>
          <span className="w-16 text-[9px] font-black text-purple-400 uppercase text-center">Under 2.5</span>
        </div>
        <div className="space-y-1">
          {oddsOverUnder.map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors">
              <span className="flex-1 text-[11px] font-bold text-slate-400 truncate">{o.bookmaker}</span>
              <span className="w-16 text-center"><OddCell val={o.over}  isBest={bO?.bookmaker === o.bookmaker} /></span>
              <span className="w-16 text-center"><OddCell val={o.under} isBest={bU?.bookmaker === o.bookmaker} /></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── BTTS 뷰 ──
  const renderBTTS = () => {
    if (oddsBTTS.length === 0)
      return <div className="py-8 text-center text-slate-600 text-sm font-bold">No BTTS odds</div>;
    const avgY = avgOdd(oddsBTTS, 'yes');
    const avgN = avgOdd(oddsBTTS, 'no');
    const bY = bestOddBm(oddsBTTS, 'yes');
    const bN = bestOddBm(oddsBTTS, 'no');
    return (
      <div className="space-y-3">
        {avgY && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Both Score — Yes', val: avgY, color: 'text-emerald-400' },
              { label: 'Both Score — No',  val: avgN, color: 'text-red-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className="text-[8px] font-black text-slate-600 uppercase mt-1">{label} · Avg</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="flex-1 text-[9px] font-black text-slate-600 uppercase">Bookmaker</span>
          <span className="w-16 text-[9px] font-black text-emerald-400 uppercase text-center">Yes</span>
          <span className="w-16 text-[9px] font-black text-red-400 uppercase text-center">No</span>
        </div>
        <div className="space-y-1">
          {oddsBTTS.map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors">
              <span className="flex-1 text-[11px] font-bold text-slate-400 truncate">{o.bookmaker}</span>
              <span className="w-16 text-center"><OddCell val={o.yes} isBest={bY?.bookmaker === o.bookmaker} /></span>
              <span className="w-16 text-center"><OddCell val={o.no}  isBest={bN?.bookmaker === o.bookmaker} /></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 마켓 탭 */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {([
          { key: '1x2',  label: '1X2',       sub: `${allBookmakerOdds.length} BMs` },
          { key: 'ou',   label: 'Over/Under', sub: `${oddsOverUnder.length} BMs` },
          { key: 'btts', label: 'BTTS',       sub: `${oddsBTTS.length} BMs` },
        ] as const).map(({ key, label, sub }) => (
          <button
            key={key}
            onClick={() => setMarket(key)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
              market === key ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
            <div className="text-[8px] font-bold opacity-60">{sub}</div>
          </button>
        ))}
      </div>

      {market === '1x2'  && render1X2()}
      {market === 'ou'   && renderOU()}
      {market === 'btts' && renderBTTS()}

      <div className="text-[9px] text-slate-700 text-center font-bold">🟢 Best available odd</div>
    </div>
  );
}

// ── 선수 스탯 카드 팝업 ────────────────────────────────────────────────────────
export function PlayerStatCard({ player, onClose }: { player: any; onClose: () => void }) {
  const rating = player.rating ? parseFloat(player.rating) : null;
  const ratingColor = rating == null ? 'text-slate-500'
    : rating >= 8 ? 'text-amber-400'
    : rating >= 7 ? 'text-emerald-400'
    : rating >= 6 ? 'text-blue-400'
    : 'text-red-400';

  const stats = player.stats ?? {};

  const rows = [
    { label: 'Minutes', val: stats.minutesPlayed },
    { label: 'Goals', val: stats.goals },
    { label: 'Assists', val: stats.assists },
    { label: 'Shots', val: stats.shots },
    { label: 'Shots on Target', val: stats.shotsOnTarget },
    { label: 'Key Passes', val: stats.keyPasses },
    { label: 'Passes', val: stats.passes },
    { label: 'Pass Accuracy', val: stats.passAccuracy != null ? `${stats.passAccuracy}%` : null },
    { label: 'Dribbles', val: stats.dribbles },
    { label: 'Tackles', val: stats.tackles },
    { label: 'Duels Won', val: stats.duelsWon },
    { label: 'Fouls Drawn', val: stats.foulsDrawn },
    { label: 'Fouls Committed', val: stats.foulsCommitted },
    { label: 'Yellow Cards', val: stats.yellowCards },
    { label: 'Red Cards', val: stats.redCards },
  ].filter(r => r.val != null && r.val !== 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1a1a2e] border border-white/10 rounded-3xl p-5 w-full max-w-sm shadow-2xl z-10 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-4">
          <img
            src={`https://media.api-sports.io/football/players/${player.id}.png`}
            alt=""
            className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-white/5 border border-white/10"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-white leading-tight">{player.name}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                player.pos === 'G' ? 'bg-yellow-500/20 text-yellow-400' :
                player.pos === 'D' ? 'bg-blue-500/20 text-blue-400' :
                player.pos === 'M' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-red-500/20 text-red-400'
              }`}>{player.pos === 'G' ? 'GK' : player.pos === 'D' ? 'DF' : player.pos === 'M' ? 'MF' : 'FW'}</span>
              <span className="text-[10px] text-slate-500 font-bold">#{player.number}</span>
              <span className="text-[10px] text-slate-500 font-bold truncate">{player.team}</span>
            </div>
          </div>
          {rating != null && (
            <div className={`text-2xl font-black shrink-0 ${ratingColor}`}>{rating.toFixed(1)}</div>
          )}
        </div>

        {/* 스탯 */}
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-[11px] font-bold text-slate-500">{r.label}</span>
                <span className="text-[12px] font-black text-white tabular-nums">{String(r.val)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-600 text-sm font-bold">No detailed stats</div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl bg-white/5 text-slate-500 text-[11px] font-black hover:bg-white/10 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── 경기 흐름 차트 (Match Flow / Momentum) ───────────────────────────────────
export function MomentumChart({ events, game, elapsed }: {
  events: any[];
  game: any;
  elapsed?: number | null;
}) {
  const [cursor, setCursor] = useState<number>(() => Math.min(elapsed ?? 90, 90));
  useEffect(() => { if (elapsed != null) setCursor(Math.min(elapsed, 90)); }, [elapsed]);

  const homeTeam = game.homeTeam ?? '';
  const awayTeam = game.awayTeam ?? '';

  // 결정론적 모멘텀 데이터 (이벤트 기반 스파이크 + 사인파 배경)
  const pts = useMemo(() => {
    const data: number[] = [];
    for (let t = 0; t <= 90; t++) {
      const base =
        Math.sin(t * 0.23) * 18 +
        Math.sin(t * 0.51) * 13 +
        Math.sin(t * 1.17) * 8  +
        Math.cos(t * 0.71) * 11 +
        Math.cos(t * 1.43) * 6;
      data.push(base);
    }
    for (const ev of events) {
      const m = Math.min(Math.max(Math.round(ev.minute ?? 0), 0), 90);
      const isHome = ev.team === homeTeam;
      const dir = isHome ? 1 : -1;
      const mag =
        ev.type === 'Goal'  ? 58 :
        ev.type === 'Card'  && ev.detail?.includes('Red') ? 32 :
        ev.type === 'Card'  ? 16 :
        ev.type === 'subst' ? 8  : 0;
      if (!mag) continue;
      for (let j = 0; j <= 90; j++) {
        const d = j - m;
        if (d < -6 || d > 25) continue;
        const w = d < 0 ? Math.exp(d * 0.55) : Math.exp(-d * 0.13);
        data[j] = Math.max(-88, Math.min(88, data[j] + dir * mag * w));
      }
    }
    return data;
  }, [events, homeTeam]);

  // 스크러버 위치의 값
  const cursorVal = pts[Math.round(Math.min(cursor, 90))] ?? 0;
  const dominant = cursorVal > 3 ? homeTeam : cursorVal < -3 ? awayTeam : 'Even';

  // SVG 좌표 계산
  const W = 800, CY = 70, H = 140;
  const xOf = (t: number) => (t / 90) * W;
  const yOf = (v: number) => CY - (v / 100) * (CY - 8);

  // polyline 포인트
  const linePts = pts.map((v, t) => `${xOf(t).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  // 홈 fill (center 위) — polygon with flat bottom
  const homeArea = [
    `${xOf(0)},${CY}`,
    ...pts.map((v, t) => `${xOf(t).toFixed(1)},${yOf(Math.max(0, v)).toFixed(1)}`),
    `${xOf(90)},${CY}`,
  ].join(' ');
  // 원정 fill (center 아래)
  const awayArea = [
    `${xOf(0)},${CY}`,
    ...pts.map((v, t) => `${xOf(t).toFixed(1)},${yOf(Math.min(0, v)).toFixed(1)}`),
    `${xOf(90)},${CY}`,
  ].join(' ');

  const ticks = [0, 15, 30, 45, 60, 75, 90];
  const tickLabel = (t: number) => t === 45 ? 'HT' : t === 90 ? "90'" : `${t}'`;
  const cursorX = xOf(cursor);
  const cursorY = yOf(cursorVal);

  const goalEvents   = events.filter(e => e.type === 'Goal');
  const cardEvents   = events.filter(e => e.type === 'Card');

  return (
    <div className="bg-black/20 rounded-2xl border border-white/5 p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Match Flow</span>
        <div className="flex items-center gap-1.5 text-[10px] font-black">
          <span className={`px-2 py-0.5 rounded-full border ${cursorVal > 3 ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-600 border-white/5'}`}>
            {homeTeam.split(' ').slice(-1)[0]}
          </span>
          <span className="text-slate-600">vs</span>
          <span className={`px-2 py-0.5 rounded-full border ${cursorVal < -3 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-slate-600 border-white/5'}`}>
            {awayTeam.split(' ').slice(-1)[0]}
          </span>
        </div>
      </div>

      {/* SVG 차트 */}
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="mgHomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="mgAwayGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.03" />
          </linearGradient>
          <clipPath id="mgHomeClip"><rect x="0" y="0" width={W} height={CY} /></clipPath>
          <clipPath id="mgAwayClip"><rect x="0" y={CY} width={W} height={CY} /></clipPath>
        </defs>

        {/* 세로 그리드 */}
        {ticks.map(t => (
          <line key={t} x1={xOf(t)} y1={0} x2={xOf(t)} y2={H}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}

        {/* 가로 중심선 */}
        <line x1={0} y1={CY} x2={W} y2={CY}
          stroke="rgba(255,255,255,0.13)" strokeWidth="1" strokeDasharray="5 4" />

        {/* 홈 그라데이션 fill */}
        <polygon points={homeArea} fill="url(#mgHomeGrad)" clipPath="url(#mgHomeClip)" />
        {/* 원정 그라데이션 fill */}
        <polygon points={awayArea} fill="url(#mgAwayGrad)" clipPath="url(#mgAwayClip)" />

        {/* 모멘텀 선 */}
        <polyline points={linePts} fill="none"
          stroke="#818cf8" strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* 골 마커 */}
        {goalEvents.map((ev, i) => {
          const x = xOf(Math.min(ev.minute ?? 0, 90));
          const isHome = ev.team === homeTeam;
          return (
            <g key={`g${i}`}>
              <rect x={x - 5} y={isHome ? 4 : CY + 2} width={10}
                height={isHome ? CY - 4 : CY - 2}
                fill={isHome ? 'rgba(99,102,241,0.25)' : 'rgba(249,115,22,0.25)'} rx="2" />
              <text x={x} y={isHome ? 4 : H - 2}
                textAnchor="middle" fontSize="11" dominantBaseline={isHome ? 'auto' : 'hanging'}>
                ⚽
              </text>
            </g>
          );
        })}

        {/* 카드 마커 */}
        {cardEvents.map((ev, i) => {
          const x = xOf(Math.min(ev.minute ?? 0, 90));
          const isRed = ev.detail?.includes('Red');
          return (
            <rect key={`c${i}`}
              x={x - 4} y={CY - 5} width={8} height={10}
              fill={isRed ? '#ef4444' : '#eab308'} rx="1.5" opacity="0.85" />
          );
        })}

        {/* 커서 라인 */}
        <line x1={cursorX} y1={0} x2={cursorX} y2={H}
          stroke="#22c55e" strokeWidth="2" />
        <circle cx={cursorX} cy={cursorY} r={5}
          fill="#22c55e" stroke="#0f172a" strokeWidth="1.5" />

        {/* X축 레이블 */}
        {ticks.map(t => (
          <text key={t} x={xOf(t)} y={H + 16}
            textAnchor="middle" fontSize="11" fontWeight="700"
            fill="rgba(148,163,184,0.55)">
            {tickLabel(t)}
          </text>
        ))}

        {/* 커서 시간 레이블 */}
        <text
          x={Math.max(20, Math.min(cursorX, W - 20))} y={H + 16}
          textAnchor="middle" fontSize="11" fontWeight="900"
          fill="#22c55e">
          {Math.floor(cursor)}'
        </text>
      </svg>

      {/* 스크러버 */}
      <input
        type="range" min={0} max={90} step={1} value={Math.round(cursor)}
        onChange={e => setCursor(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-white/10"
      />

      {/* 스크러버 레이블 */}
      <div className="flex justify-between text-[9px] font-black text-slate-600 -mt-1">
        <span>0'</span>
        <span>HT</span>
        <span>FT</span>
      </div>
    </div>
  );
}

// ── 탭: 최근 폼 차트 ──────────────────────────────────────────────────────────
export function FormTab({ homeLast20, awayLast20, homeTeam, awayTeam }: {
  homeLast20: any[];
  awayLast20: any[];
  homeTeam: string;
  awayTeam: string;
}) {
  if (!homeLast20?.length && !awayLast20?.length) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">No form data available</div>;
  }

  function TeamFormCard({ recent, teamName }: { recent: any[]; teamName: string }) {
    const last10 = recent.slice(0, 10);
    const played = recent.filter(m => m.result != null);
    const wins   = played.filter(m => m.result === 'W').length;
    const draws  = played.filter(m => m.result === 'D').length;
    const losses = played.filter(m => m.result === 'L').length;
    const gf = played.reduce((s, m) => s + (m.myGoals ?? 0), 0);
    const ga = played.reduce((s, m) => s + (m.oppGoals ?? 0), 0);
    const cleanSheets = played.filter(m => (m.oppGoals ?? 0) === 0).length;
    const btts = played.filter(m => (m.myGoals ?? 0) > 0 && (m.oppGoals ?? 0) > 0).length;
    const homeMatches = played.filter(m => m.isHome);
    const awayMatches = played.filter(m => !m.isHome);
    const homeWR = homeMatches.length > 0 ? Math.round((homeMatches.filter(m => m.result === 'W').length / homeMatches.length) * 100) : 0;
    const awayWR = awayMatches.length > 0 ? Math.round((awayMatches.filter(m => m.result === 'W').length / awayMatches.length) * 100) : 0;

    return (
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-4">
        <div className="text-[11px] font-black text-white truncate">{teamName}</div>

        {/* Last 10 form dots */}
        <div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Last {last10.length} Results</div>
          <div className="flex gap-1 flex-wrap">
            {last10.map((m, i) => (
              <div
                key={i}
                title={`${m.homeTeam} ${m.homeGoals ?? '?'}-${m.awayGoals ?? '?'} ${m.awayTeam}\n${m.date}`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black cursor-default ${
                  m.result === 'W' ? 'bg-emerald-500 text-white' :
                  m.result === 'D' ? 'bg-slate-500 text-white' :
                  'bg-red-500 text-white'
                }`}
              >
                {m.result}
              </div>
            ))}
          </div>
        </div>

        {/* W/D/L + Pts */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'W', val: wins,  color: 'text-emerald-400' },
            { label: 'D', val: draws, color: 'text-slate-400' },
            { label: 'L', val: losses, color: 'text-red-400' },
            { label: 'Pts', val: wins * 3 + draws, color: 'text-indigo-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white/5 rounded-xl py-2">
              <div className={`text-sm font-black ${color}`}>{val}</div>
              <div className="text-[9px] font-black text-slate-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Goal metrics */}
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'Goals For',     val: gf, sub: played.length > 0 ? `${(gf / played.length).toFixed(1)} avg` : '–' },
            { label: 'Goals Against', val: ga, sub: played.length > 0 ? `${(ga / played.length).toFixed(1)} avg` : '–' },
            { label: 'Clean Sheets',  val: cleanSheets, sub: played.length > 0 ? `${Math.round((cleanSheets / played.length) * 100)}%` : '–' },
            { label: 'Both Score',    val: btts, sub: played.length > 0 ? `${Math.round((btts / played.length) * 100)}%` : '–' },
          ].map(({ label, val, sub }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2.5">
              <div className="text-sm font-black text-white">{val}</div>
              <div className="text-[8px] font-black text-slate-600 mt-0.5">{label}</div>
              <div className="text-[9px] text-slate-500">{sub}</div>
            </div>
          ))}
        </div>

        {/* Home / Away win rate */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/[0.03] rounded-xl p-2.5">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Home Win%</div>
            <div className="text-lg font-black text-indigo-400">{homeWR}%</div>
            <div className="text-[8px] text-slate-600">{homeMatches.length} games</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-2.5">
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Away Win%</div>
            <div className="text-lg font-black text-orange-400">{awayWR}%</div>
            <div className="text-[8px] text-slate-600">{awayMatches.length} games</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TeamFormCard recent={homeLast20} teamName={homeTeam} />
      <TeamFormCard recent={awayLast20} teamName={awayTeam} />
    </div>
  );
}

// ── 탭: 리그 순위표 ───────────────────────────────────────────────────────────
export function StandingsTab({ leagueId, season, homeTeam, awayTeam }: {
  leagueId: number | null;
  season: number | null;
  homeTeam: string;
  awayTeam: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId || !season) return;
    setLoading(true);
    setError(null);
    fetch(`/api/standings?league=${leagueId}&season=${season}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); else setError(d.message ?? 'Failed'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [leagueId, season]);

  if (!leagueId || !season) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">No league info available</div>;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-black">Loading standings...</span>
      </div>
    );
  }
  if (error || !data) {
    return <div className="py-12 text-center text-slate-600 text-sm font-bold">{error ?? 'No data'}</div>;
  }

  const table: any[] = data.standings?.[0] ?? [];

  return (
    <div className="space-y-3">
      {data.leagueInfo && (
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          {data.leagueInfo.name} · {data.leagueInfo.season}
        </div>
      )}

      {/* header */}
      <div className="flex items-center gap-1 px-2 py-1 text-[8px] font-black text-slate-700 uppercase">
        <span className="w-5 shrink-0 text-center">#</span>
        <span className="flex-1">Team</span>
        <span className="w-6 text-center shrink-0">P</span>
        <span className="w-6 text-center shrink-0">W</span>
        <span className="w-6 text-center shrink-0">D</span>
        <span className="w-6 text-center shrink-0">L</span>
        <span className="w-8 text-center shrink-0">GD</span>
        <span className="w-7 text-center shrink-0">Pts</span>
      </div>

      <div className="space-y-0.5">
        {table.map((t: any) => {
          const isHome = t.team === homeTeam;
          const isAway = t.team === awayTeam;
          return (
            <div
              key={t.rank}
              className={`flex items-center gap-1 px-2 py-2 rounded-xl border transition-colors ${
                isHome ? 'bg-indigo-500/10 border-indigo-500/30' :
                isAway ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-white/[0.03] border-white/5'
              }`}
            >
              <span className={`w-5 text-center text-[11px] font-black shrink-0 ${isHome || isAway ? 'text-white' : 'text-slate-600'}`}>
                {t.rank}
              </span>
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                {t.logo && (
                  <img src={t.logo} alt="" className="w-4 h-4 object-contain shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span className={`text-[11px] font-black truncate ${isHome || isAway ? 'text-white' : 'text-slate-400'}`}>{t.team}</span>
              </div>
              <span className="w-6 text-center text-[11px] tabular-nums shrink-0 text-slate-500">{t.played}</span>
              <span className="w-6 text-center text-[11px] tabular-nums shrink-0 text-emerald-400">{t.win}</span>
              <span className="w-6 text-center text-[11px] tabular-nums shrink-0 text-slate-500">{t.draw}</span>
              <span className="w-6 text-center text-[11px] tabular-nums shrink-0 text-red-400">{t.lose}</span>
              <span className={`w-8 text-center text-[11px] tabular-nums shrink-0 font-bold ${t.goalsDiff > 0 ? 'text-emerald-400' : t.goalsDiff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {t.goalsDiff > 0 ? '+' : ''}{t.goalsDiff}
              </span>
              <span className={`w-7 text-center text-[12px] tabular-nums font-black shrink-0 ${isHome || isAway ? 'text-white' : 'text-slate-300'}`}>
                {t.points}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[9px] text-slate-700 text-center font-bold mt-2">
        🔵 Home · 🟠 Away
      </div>
    </div>
  );
}

// ── 탭: 이 경기 탑 선수 ───────────────────────────────────────────────────────
export function TopPlayersTab({ playerStatsMap, lineups }: {
  playerStatsMap: Record<number, any>;
  lineups: any[];
}) {
  if (!playerStatsMap || Object.keys(playerStatsMap).length === 0) {
    return (
      <div className="py-12 text-center text-slate-600 text-sm font-bold">
        No player stats (available after match)
      </div>
    );
  }

  const ratingColor = (r: string | null) => {
    if (!r) return 'text-slate-500';
    const v = parseFloat(r);
    if (v >= 8)  return 'text-amber-400';
    if (v >= 7)  return 'text-emerald-400';
    if (v >= 6)  return 'text-blue-400';
    return 'text-red-400';
  };

  const homeTeamId = lineups?.[0]?.teamId;

  const allPlayers = Object.entries(playerStatsMap)
    .map(([id, s]) => ({ id: parseInt(id), ...s }))
    .filter(p => p.rating != null)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  const scorers = Object.entries(playerStatsMap)
    .map(([id, s]) => ({ id: parseInt(id), ...s }))
    .filter(p => (p.goals ?? 0) > 0 || (p.assists ?? 0) > 0)
    .sort((a, b) => ((b.goals ?? 0) * 2 + (b.assists ?? 0)) - ((a.goals ?? 0) * 2 + (a.assists ?? 0)));

  return (
    <div className="space-y-5">
      {/* Goals & Assists */}
      {scorers.length > 0 && (
        <div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">⚽ Goals & Assists</div>
          <div className="space-y-1.5">
            {scorers.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-black text-white truncate">{p.name}</div>
                  <div className={`text-[9px] font-bold ${p.teamId === homeTeamId ? 'text-indigo-400' : 'text-orange-400'}`}>{p.team}</div>
                </div>
                <div className="flex items-center gap-3">
                  {(p.goals ?? 0) > 0 && (
                    <div className="text-center">
                      <div className="text-base font-black text-emerald-400">{p.goals}</div>
                      <div className="text-[8px] text-slate-600">Goals</div>
                    </div>
                  )}
                  {(p.assists ?? 0) > 0 && (
                    <div className="text-center">
                      <div className="text-base font-black text-indigo-400">{p.assists}</div>
                      <div className="text-[8px] text-slate-600">Ast</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Ratings leaderboard */}
      <div>
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">⭐ Match Ratings</div>
        <div className="space-y-1">
          {allPlayers.slice(0, 11).map((p, i) => (
            <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
              <span className="w-4 text-[10px] font-black text-slate-600 text-center shrink-0">{i + 1}</span>
              <img
                src={`https://media.api-sports.io/football/players/${p.id}.png`}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0 bg-white/5"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black text-white truncate">{p.name}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold ${p.teamId === homeTeamId ? 'text-indigo-400' : 'text-orange-400'}`}>
                    {p.teamId === homeTeamId ? 'HM' : 'AW'}
                  </span>
                  {p.minutesPlayed != null && (
                    <span className="text-[8px] text-slate-600">{p.minutesPlayed}'</span>
                  )}
                  {(p.goals ?? 0) > 0 && <span className="text-[8px] text-emerald-400">{p.goals}G</span>}
                  {(p.assists ?? 0) > 0 && <span className="text-[8px] text-indigo-400">{p.assists}A</span>}
                </div>
              </div>
              <div className={`text-lg font-black tabular-nums ${ratingColor(p.rating)}`}>
                {parseFloat(p.rating).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
