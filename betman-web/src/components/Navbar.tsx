"use client";

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_TABS = [
  { href: '/',         label: '라이브스코어' },
  { href: '/analysis', label: '분석' },
];

const SPORTS = [
  { icon: '⚽', label: 'Football', active: true },
  { icon: '🏀', label: 'Basketball', active: false },
  { icon: '🎾', label: 'Tennis', active: false },
  { icon: '🏈', label: 'Am Football', active: false },
  { icon: '⚾', label: 'Baseball', active: false },
  { icon: '🏸', label: 'Badminton', active: false },
  { icon: '🏐', label: 'Volleyball', active: false },
  { icon: '🏏', label: 'Cricket', active: false },
  { icon: '🏒', label: 'Hockey', active: false },
  { icon: '🏓', label: 'Table Tennis', active: false },
];

function TomatoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tomatoBody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#cc0000" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="26" fill="url(#tomatoBody)" />
      <path d="M32 8 L32 20 M32 48 L32 60 M8 34 L20 34 M44 34 L56 34" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <path d="M32 22 L40 28 L40 40 L32 46 L24 40 L24 28 Z" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <path d="M32 22 L44 14 M40 28 L54 26 M40 40 L54 42 M32 46 L44 54 M24 40 L10 42 M24 28 L10 26 M32 22 L20 14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
      <path d="M32 8 C35 2 40 4 40 4 L34 10 L32 14 L30 10 L24 4 C24 4 29 2 32 8Z" fill="#00ff88" />
      <path d="M18 18 C14 24 14 36 18 42" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// useSearchParams를 쓰는 부분만 별도 컴포넌트로 분리 → Suspense로 감싸야 함
function NavSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [val, setVal] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setVal(searchParams.get('q') ?? '');
  }, [searchParams]);

  const update = (v: string) => {
    setVal(v);
    const qs = v ? `?q=${encodeURIComponent(v)}` : '';
    if (pathname === '/') {
      router.replace(`/${qs}`, { scroll: false });
    } else {
      router.push(`/${qs}`);
    }
  };

  return (
    <div className="flex-1 relative max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
      <input
        type="text"
        placeholder="팀, 리그, 국가 검색..."
        value={val}
        onChange={e => update(e.target.value)}
        className="w-full h-9 bg-black/[0.04] border border-black/[0.07] text-slate-800 text-[13px] font-medium pl-9 pr-8 rounded-xl focus:outline-none focus:border-indigo-400/60 focus:bg-black/[0.06] transition-all placeholder:text-slate-400"
      />
      {val && (
        <button
          onClick={() => update('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function NavTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 shrink-0">
      {NAV_TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3.5 py-1.5 rounded-xl text-[12px] font-black transition-all border ${
            pathname === tab.href
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-black/5'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { isTomatoMode, toggleMode } = useTheme();

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[var(--bg-base)]/95 backdrop-blur-2xl border-b border-black/[0.06]">

      {/* ── Row 1: 로고 + 검색 + 탭 + 토마토 ── */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-3" style={{ height: 52 }}>

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <TomatoIcon className="w-full h-full drop-shadow-[0_0_12px_rgba(255,0,0,0.3)]" />
            </div>
            <span className="text-[18px] font-black tracking-[-0.04em] uppercase italic leading-none">
              <span className="text-slate-800">Tomato</span><span className="text-red-500">Score</span>
            </span>
          </Link>

          {/* 검색창 — Suspense로 감싸야 useSearchParams 작동 */}
          <Suspense fallback={
            <div className="flex-1 max-w-xs h-9 rounded-xl bg-black/[0.04] border border-black/[0.06]" />
          }>
            <NavSearch />
          </Suspense>

          {/* 라이브스코어 / 분석 탭 */}
          <Suspense fallback={null}>
            <NavTabs />
          </Suspense>

          {/* Tomato / Zen 토글 — 젤 오른쪽 */}
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-black transition-all border shrink-0 ${
              isTomatoMode
                ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                : 'bg-black/5 border-black/10 text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="text-sm">{isTomatoMode ? '🍅' : '🧘'}</span>
            <span className="hidden sm:inline">{isTomatoMode ? 'Tomato' : 'Zen'}</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: 스포츠 카테고리 ── */}
      <div className="border-t border-black/[0.05]">
        <div className="px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-stretch h-9">
            {SPORTS.map((sport) => (
              <button
                key={sport.label}
                disabled={!sport.active}
                title={sport.active ? sport.label : `${sport.label} — Coming Soon`}
                className={`flex items-center gap-1.5 px-4 h-full shrink-0 border-b-2 text-[12px] whitespace-nowrap transition-colors ${
                  sport.active
                    ? 'border-indigo-500 text-slate-800 font-black'
                    : 'border-transparent text-slate-300 cursor-default'
                }`}
              >
                <span className="text-sm leading-none">{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </nav>
  );
}
