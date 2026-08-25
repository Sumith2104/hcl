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
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-indigo-950 flex items-center justify-center text-white shadow-sm border border-neutral-800/80 group-hover:scale-105 transition-all shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4.5 h-4.5 text-indigo-400 shrink-0"
              style={{ width: '18px', height: '18px', display: 'block' }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-neutral-900">
              Adaptive<span className="text-indigo-600">Learn</span>
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
                className={cn(
                  "w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold shadow-sm hover:ring-2 hover:ring-neutral-300 transition-all focus:outline-none cursor-pointer",
                  dropdownOpen ? "ring-2 ring-neutral-900" : ""
                )}
                aria-label="User Profile"
                title="Open profile menu"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>

              {/* Dropdown Menu with Backdrop */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-neutral-200 p-1.5 shadow-xl space-y-0.5 animate-in fade-in zoom-in-95 z-50">
                    <div className="px-3 py-2 border-b border-neutral-100 mb-1 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                      </div>
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
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
