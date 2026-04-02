"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutGrid, Layers, BarChart3, Menu, X, Trophy, BookOpen } from 'lucide-react';
import { useState } from 'react';

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
      {/* Tomato body with gradient */}
      <defs>
        <radialGradient id="tomatoGrad" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="50%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#cc2222" />
        </radialGradient>
        <radialGradient id="highlight" cx="30%" cy="25%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />
      {/* Tomato body */}
      <ellipse cx="32" cy="36" rx="24" ry="22" fill="url(#tomatoGrad)" />
      {/* Highlight shine */}
      <ellipse cx="24" cy="28" rx="10" ry="8" fill="url(#highlight)" />
      {/* Stem */}
      <path d="M32 14 C32 14 31 8 32 6 C33 4 33 4 32 6" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Leaves */}
      <path d="M28 16 C22 10 16 12 16 12 C16 12 18 18 24 18 Z" fill="#22c55e" />
      <path d="M36 16 C42 10 48 12 48 12 C48 12 46 18 40 18 Z" fill="#22c55e" />
      <path d="M30 15 C26 7 20 8 20 8 C20 8 22 14 28 16 Z" fill="#4ade80" opacity="0.7" />
      <path d="M34 15 C38 7 44 8 44 8 C44 8 42 14 36 16 Z" fill="#4ade80" opacity="0.7" />
      {/* Face - cute eyes */}
      <ellipse cx="24" cy="35" rx="3" ry="3.5" fill="#1a1a1f" />
      <ellipse cx="40" cy="35" rx="3" ry="3.5" fill="#1a1a1f" />
      {/* Eye highlights */}
      <ellipse cx="25.5" cy="33.5" rx="1.2" ry="1.4" fill="white" />
      <ellipse cx="41.5" cy="33.5" rx="1.2" ry="1.4" fill="white" />
      {/* Cheeky smile */}
      <path d="M26 42 Q32 48 38 42" stroke="#1a1a1f" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Blush cheeks */}
      <ellipse cx="18" cy="40" rx="4" ry="2.5" fill="rgba(255,150,150,0.4)" />
      <ellipse cx="46" cy="40" rx="4" ry="2.5" fill="rgba(255,150,150,0.4)" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/" className="tomato-logo group">
            <div className="tomato-icon w-9 h-9 sm:w-11 sm:h-11 animate-tomato-pulse transition-transform group-hover:scale-110">
              <TomatoIcon className="w-full h-full drop-shadow-lg" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[22px] sm:text-[26px] font-black tracking-[-0.04em]">
                <span className="text-[#f0f0f5]">tomato</span>
                <span className="tomato-text">score</span>
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#55556a] mt-0.5 hidden sm:block">
                Live Football Dashboard
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

          {/* ── Mobile hamburger ── */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/[0.06] text-[#8b8b9e] hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
            className="md:hidden bg-[#0e0e16] border-b border-white/[0.06]"
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
