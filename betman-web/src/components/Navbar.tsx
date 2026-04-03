"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutGrid, Layers, BarChart3, Menu, X, Trophy, BookOpen, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

const NavItems = [
  { href: '/', label: 'Home', icon: Home, color: 'text-red-400' },
  { href: '/proto', label: 'Proto', icon: LayoutGrid, color: 'text-emerald-400' },
  { href: '/toto', label: 'Toto', icon: Layers, color: 'text-blue-400' },
  { href: '/records', label: 'Results', icon: BarChart3, color: 'text-amber-400' },
  { href: '/standings', label: 'Standings', icon: Trophy, color: 'text-yellow-400' },
  { href: '/bet-tracker', label: 'Bet Log', icon: BookOpen, color: 'text-purple-400' },
];

/* ── Inline SVG Tomato Logo ── */
function TomatoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tomatoBody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#cc0000" />
        </radialGradient>
        <linearGradient id="latticeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>

      {/* Main Tomato Shape - Slightly flattened like a professional ball */}
      <circle cx="32" cy="34" r="26" fill="url(#tomatoBody)" />

      {/* Soccer Ball Lattice Overlay (Concept #1: Football Integration) */}
      <path d="M32 8 L32 20 M32 48 L32 60 M8 34 L20 34 M44 34 L56 34" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      
      {/* Central Hexagon Pattern */}
      <path d="M32 22 L40 28 L40 40 L32 46 L24 40 L24 28 Z" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      
      {/* Surrounding Pentagon Segments */}
      <path d="M32 22 L44 14 M40 28 L54 26 M40 40 L54 42 M32 46 L44 54 M24 40 L10 42 M24 28 L10 26 M32 22 L20 14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />

      {/* Stem - Minimalist & Modern Crown Style */}
      <path d="M32 8 C35 2 40 4 40 4 L34 10 L32 14 L30 10 L24 4 C24 4 29 2 32 8Z" fill="#00ff88" className="drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]" />
      
      {/* Highlight Shine */}
      <path d="M18 18 C14 24 14 36 18 42" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isTomatoMode, toggleMode } = useTheme();

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-[var(--bg-base)]/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <TomatoIcon className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]" />
            </div>
            <div className="flex flex-col leading-none border-l border-white/10 pl-2.5 sm:pl-3">
              <span className="text-[24px] sm:text-[28px] font-black tracking-[-0.05em] uppercase italic">
                <span className="text-white drop-shadow-md">tomato</span>
                <span className="text-red-500 ml-1">score</span>
              </span>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#55556a] mt-1 hidden sm:block">
                Global Sports Engine
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:ml-6 md:flex md:items-center space-x-1">
            {NavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-xl text-[13px] font-bold transition-all group flex items-center gap-2 ${
                    isActive
                      ? 'text-white bg-white/[0.07] shadow-sm'
                      : 'text-[#8b8b9e] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? item.color : 'text-[#55556a] group-hover:text-[#8b8b9e]'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop & Mobile Toggles ── */}
          <div className="flex items-center gap-3">
            {/* Tomato / Zen 스위치 */}
            <div className="relative group">
              <button
                onClick={toggleMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border ${
                  isTomatoMode 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 grayscale hover:grayscale-0'
                }`}
              >
                <span className="text-sm">{isTomatoMode ? '🍅' : '🧘'}</span>
                <span className="hidden sm:inline">{isTomatoMode ? 'Tomato' : 'Zen'}</span>
              </button>

              {/* Tooltip */}
              <div className={`absolute top-full right-0 mt-3 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[110]`}>
                <div className={`rounded-2xl p-4 text-xs shadow-2xl ${
                  isTomatoMode
                    ? 'bg-[var(--bg-card)] border border-red-500/30 text-slate-300 ring-1 ring-red-500/10'
                    : 'bg-white border border-zinc-200 text-slate-600 shadow-xl'
                }`}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-xl leading-none">{isTomatoMode ? '🍅' : '🧘'}</span>
                    <span className={`font-black text-[13px] uppercase tracking-wider ${isTomatoMode ? 'text-red-400' : 'text-slate-800'}`}>
                      {isTomatoMode ? 'Tomato Mode' : 'Zen Mode'}
                    </span>
                  </div>
                  <p className="leading-relaxed mb-3.5 opacity-90 font-medium">
                    {isTomatoMode
                      ? 'Experience sports with dark mode and dynamic goal celebration effects.'
                      : 'Focused viewing experience with clean light theme for data analysis.'}
                  </p>
                  <div className={`flex items-center gap-1.5 pt-3 border-t ${isTomatoMode ? 'border-white/10 text-slate-500' : 'border-zinc-100 text-zinc-400'}`}>
                    <span className="font-bold">Switch to</span>
                    <span className={`px-2 py-0.5 rounded-md font-black ${
                      isTomatoMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/10 text-red-500 font-black'
                    }`}>
                      {isTomatoMode ? 'Zen' : 'Tomato'}
                    </span>
                  </div>
                </div>
                {/* Tooltip Arrow */}
                <div className={`absolute top-[-5px] right-5 w-2.5 h-2.5 rotate-45 ${
                  isTomatoMode ? 'bg-[var(--bg-card)] border-l border-t border-red-500/30' : 'bg-white border-l border-t border-zinc-200'
                }`} />
              </div>
            </div>

            {/* ── Mobile hamburger ── */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-white/[0.06] text-[#8b8b9e] hover:text-white transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Nav ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--bg-card)] border-b border-white/[0.06]"
          >
            <div className="px-4 py-6 space-y-2">
              {NavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all ${
                      isActive
                        ? 'bg-red-500/10 text-white border border-red-500/20'
                        : 'text-[#8b8b9e] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
