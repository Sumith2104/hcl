'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Compass, 
  LayoutDashboard, 
  Bot, 
  MessagesSquare, 
  LogOut, 
  Menu, 
  X, 
  Database, 
  Cpu, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar on standalone auth pages if needed, or show everywhere
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const navItems = [
    {
      label: 'AI Onboarding',
      href: '/onboarding',
      icon: MessagesSquare,
      badge: 'Agentic'
    },
    {
      label: 'My Roadmap',
      href: '/roadmap',
      icon: Compass,
      badge: 'DAG'
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'AI Learning Mentor',
      href: '/assistant',
      icon: Bot,
      badge: 'Bedrock'
    }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-neutral-900">
            Adaptive<span className="text-neutral-500">Learn</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-neutral-50/90 backdrop-blur-md border-r border-neutral-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header */}
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm group-hover:bg-neutral-800 transition-all">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-neutral-900 block leading-tight">
                  Adaptive<span className="text-neutral-500">Learn</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block leading-none mt-0.5">
                  AWS Bedrock · Fluxbase
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-900")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded-md font-semibold tracking-wide uppercase",
                        isActive
                          ? "bg-neutral-800 text-neutral-300"
                          : "bg-neutral-200/70 text-neutral-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Fluxbase Cloud Status & User Profile */}
        <div className="p-4 border-t border-neutral-200/80 space-y-3 bg-white/70">
          {/* Cloud Database Status Pill */}
          <div className="p-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-neutral-700">Fluxbase Cloud</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">PostgreSQL</span>
          </div>

          {/* User Account / Session */}
          {user ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-neutral-900 truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <Link href="/login" className="flex-1 btn-outline !py-1.5 !text-xs text-center">
                Sign In
              </Link>
              <Link href="/signup" className="flex-1 btn-black !py-1.5 !text-xs text-center">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
