'use client'

import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Map,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Search,
  Flame,
} from 'lucide-react'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { StudyBuddiesLogo } from '@/components/icons/StudyBuddiesLogo'
import { useState, useSyncExternalStore, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function AppHeader() {
  const { isAuthenticated, user, currentView, setView, logout, earnedAchievements, streakData } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Ctrl+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Navigate to assistant with search query
      setSearchOpen(false)
      setSearchQuery('')
    }
  }, [searchQuery])

  if (!isAuthenticated) return null

  const navItems = [
    { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { view: 'roadmap' as const, label: 'Roadmap', icon: Map },
    { view: 'assistant' as const, label: 'AI Assistant', icon: MessageSquare },
    { view: 'profile' as const, label: 'Profile', icon: User },
  ]

  const achievementCount = earnedAchievements.length
  const streakDays = streakData?.streak ?? 0
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-header">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-2.5 group">
              <div className="text-gray-800 dark:text-gray-200">
                <StudyBuddiesLogo size={22} />
              </div>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.view
              return (
                <Button
                  key={item.view}
                  variant="ghost"
                  size="sm"
                  onClick={() => setView(item.view)}
                  className={`gap-2 relative rounded-md transition-all duration-200 h-9 px-3 ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gray-800 dark:bg-gray-300 rounded-full"
                      transition={{ type: 'spring' as const, stiffness: 350, damping: 30 }}
                    />
                  )}
                </Button>
              )
            })}
          </nav>

          {/* Right side: search + actions */}
          <div className="flex items-center gap-1">
            {/* Collapsible Search Bar */}
            <div className="hidden lg:flex items-center gap-1">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' as const }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-white/[0.04] focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-gray-200 dark:focus-within:ring-gray-700 transition-all">
                      <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search anything..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        autoFocus
                      />
                      <kbd className="hidden xl:inline-flex h-4 items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 font-mono text-[10px] text-gray-400">ESC</kbd>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {!searchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/[0.06] transition-colors"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Achievement count - subtle gray pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
              <Zap className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{achievementCount}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">/12</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <NotificationsPanel />
            </div>

            {/* User Dropdown - clean avatar, no ring */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-1 hover:ring-gray-300/50 dark:hover:ring-gray-600/50 transition-all p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount asChild>
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold leading-none truncate text-gray-900 dark:text-gray-100">{user?.name}</p>
                        <span className="inline-flex items-center rounded bg-gray-800 dark:bg-gray-200 px-1.5 py-0.5 text-[9px] font-bold text-white dark:text-gray-800 leading-none">PRO</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{user?.email}</p>
                      {streakDays > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Flame className="h-3 w-3 text-gray-700 dark:text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{streakDays} day streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.view
                    return (
                      <DropdownMenuItem key={item.view} onClick={() => setView(item.view)} className={`gap-2.5 cursor-pointer ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-800 dark:bg-gray-300" />}
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="gap-2.5 cursor-pointer text-gray-500 dark:text-gray-400 focus:text-gray-700 dark:focus:text-gray-200">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 rounded-md text-gray-600 dark:text-gray-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Nav - glass panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' as const }}
              className="md:hidden border-t border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
            >
              <nav className="flex flex-col p-3 gap-1 mobile-menu-blur bg-white/80 dark:bg-[#111318]/80">
                {/* Mobile search */}
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-white/[0.04] mb-2">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                {navItems.map((item, i) => {
                  const Icon = item.icon
                  const isActive = currentView === item.view
                  return (
                    <motion.div
                      key={item.view}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05, ease: 'easeOut' as const }}
                    >
                      <Button
                        variant="ghost"
                        className={`justify-start gap-3 w-full rounded-md h-9 ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'}`}
                        onClick={() => {
                          setView(item.view)
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {isActive && (
                          <span className="ml-auto flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-800 dark:bg-gray-300" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )
                })}
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.length * 0.05, ease: 'easeOut' as const }}
                >
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 w-full rounded-md h-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
