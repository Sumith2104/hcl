'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Compass, 
  LayoutDashboard, 
  Bot, 
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/roadmap', label: 'My Roadmap', icon: Compass },
    { href: '/assistant', label: 'AI Mentor', icon: Bot },
    { href: '/onboarding', label: 'Onboarding', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-sm group-hover:bg-neutral-800 transition-colors">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-neutral-900">
              AdaptiveLearn
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-100/70 p-1 rounded-xl border border-neutral-200/50">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-white text-neutral-900 shadow-sm font-semibold border border-neutral-200/60'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-neutral-900' : 'text-neutral-500')} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Auth Controls / User Profile */}
        <div className="flex items-center gap-2.5">
          {!loading && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white shadow-sm transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-neutral-900 leading-none">{user.name}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Minimal Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-neutral-200 p-1.5 shadow-lg space-y-0.5 animate-in fade-in zoom-in-95 z-50">
                  <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                    <p className="text-xs font-bold text-neutral-900">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/roadmap"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-neutral-600" />
                    <span>My Roadmap</span>
                  </Link>
                  <Link
                    href="/assistant"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-neutral-600" />
                    <span>AI Mentor</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-medium transition-colors"
              >
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="btn-black !py-1.5 !px-3.5 !text-xs"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
