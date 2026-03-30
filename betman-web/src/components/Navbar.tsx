"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutGrid, Layers, BarChart3, Menu, X, ShieldCheck, Trophy, BookOpen } from 'lucide-react';
import { useState } from 'react';

const NavItems = [
  { href: '/', label: '홈', icon: Home, color: 'text-indigo-400' },
  { href: '/proto', label: '프로토', icon: LayoutGrid, color: 'text-emerald-400' },
  { href: '/toto', label: '토토', icon: Layers, color: 'text-blue-400' },
  { href: '/records', label: '경기결과', icon: BarChart3, color: 'text-amber-400' },
  { href: '/standings', label: '순위표', icon: Trophy, color: 'text-yellow-400' },
  { href: '/bet-tracker', label: '베팅기록', icon: BookOpen, color: 'text-purple-400' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/5 bg-[#030712]/85 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tighter">
              BETMAN<span className="text-indigo-500">PRO</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:ml-6 md:flex md:items-center space-x-2">
            {NavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-5 py-2 rounded-xl text-sm font-black transition-all group flex items-center space-x-2 ${
                    isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-500 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0f1d] border-b border-white/5"
          >
            <div className="px-4 py-8 space-y-4">
              {NavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-4 rounded-xl text-lg font-bold transition-all ${
                      isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
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
