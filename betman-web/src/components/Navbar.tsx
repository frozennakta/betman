"use client";

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

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

export default function Navbar() {
  const { isTomatoMode, toggleMode } = useTheme();

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[var(--bg-base)]/95 backdrop-blur-2xl border-b border-white/[0.06]">

      {/* ── Row 1: 로고 + 토글 ── */}
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <TomatoIcon className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]" />
            </div>
            <div className="flex flex-col leading-none border-l border-white/10 pl-2.5">
              <span className="text-[22px] font-black tracking-[-0.05em] uppercase italic">
                <span className="text-white">tomato</span>
                <span className="text-red-500 ml-1">score</span>
              </span>
              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-[#55556a] hidden sm:block">
                Global Sports Engine
              </span>
            </div>
          </Link>

          {/* Tomato / Zen 스위치 */}
          <div className="relative group">
            <button
              onClick={toggleMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border ${
                isTomatoMode
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:grayscale-0'
              }`}
            >
              <span className="text-sm">{isTomatoMode ? '🍅' : '🧘'}</span>
              <span className="hidden sm:inline">{isTomatoMode ? 'Tomato' : 'Zen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: 스포츠 카테고리 (Polymarket 스타일) ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-full px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-stretch h-10 gap-0">
            {SPORTS.map((sport) => (
              <button
                key={sport.label}
                disabled={!sport.active}
                title={sport.active ? sport.label : `${sport.label} — Coming Soon`}
                className={`flex items-center gap-1.5 px-4 h-full shrink-0 border-b-2 text-[13px] whitespace-nowrap transition-colors ${
                  sport.active
                    ? 'border-indigo-500 text-white font-black'
                    : 'border-transparent text-[#55556a] cursor-default'
                }`}
              >
                <span className="text-base leading-none">{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </nav>
  );
}
