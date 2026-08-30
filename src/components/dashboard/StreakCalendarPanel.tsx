'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
 Flame,
 Trophy,
 CalendarDays,
 ChevronLeft,
 ChevronRight,
 Target,
 Lock,
 Zap,
 Star,
 Crown,
 Rocket,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Types ---

interface ActivityDay {
 date: string
 day: number
 level: 0 | 1 | 2 | 3 | 4
 minutes: number
 isToday: boolean
 isFuture: boolean
 isCurrentMonth: boolean
}

interface MilestoneBadge {
 days: number
 title: string
 icon: typeof Flame
 colorClass: string
 gradientClass: string
}

// --- Constants ---

const LEVEL_COLORS = [
 'bg-gray-100',
 'bg-gray-200',
 'bg-gray-300',
 'bg-gray-400',
 'bg-gray-700',
] as const

const LEVEL_COLORS_DARK_STRIPE = [
 '',
 'border-l-gray-300',
 'border-l-gray-400',
 'border-l-gray-500',
 'border-l-gray-600',
] as const

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const MONTH_NAMES = [
 'January', 'February', 'March', 'April', 'May', 'June',
 'July', 'August', 'September', 'October', 'November', 'December',
] as const

const MILESTONES: MilestoneBadge[] = [
 { days: 7, title: 'Week Warrior', icon: Star, colorClass: 'text-gray-700', gradientClass: 'from-gray-200 to-gray-300' },
 { days: 14, title: 'Two-Week Titan', icon: Zap, colorClass: 'text-gray-700', gradientClass: 'from-gray-200 to-gray-300' },
 { days: 30, title: 'Monthly Master', icon: Trophy, colorClass: 'text-gray-600', gradientClass: 'bg-gray-200' },
 { days: 50, title: 'Iron Will', icon: Target, colorClass: 'text-gray-600', gradientClass: 'bg-gray-200' },
 { days: 100, title: 'Legendary Learner', icon: Crown, colorClass: 'text-gray-600', gradientClass: 'bg-gray-200' },
]

const MOTIVATIONAL_MESSAGES = [
 "Consistency beats intensity. You've got this!",
 'Small steps every day lead to massive results.',
 'Your future self will thank you for starting today.',
 "Every expert was once a beginner. Keep going!",
 'The best time to learn was yesterday. The next best is now.',
] as const

// --- Helpers ---

function computeStreak(activityData: Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>): number {
 let streak = 0
 const today = new Date()
 today.setHours(0, 0, 0, 0)

 for (let i = 0; i <= 365; i++) {
 const d = new Date(today)
 d.setDate(d.getDate() - i)
 const key = d.toISOString().split('T')[0]
 const entry = activityData.get(key)
 if (entry && entry.level > 0) {
 streak++
 } else if (i === 0) {
 // Allow today to be inactive
 continue
 } else {
 break
 }
 }
 return streak
}

function computeLongestStreak(activityData: Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>): number {
 let longest = 0
 let current = 0
 const today = new Date()
 today.setHours(0, 0, 0, 0)

 for (let i = 90; i >= 0; i--) {
 const d = new Date(today)
 d.setDate(d.getDate() - i)
 const key = d.toISOString().split('T')[0]
 const entry = activityData.get(key)
 if (entry && entry.level > 0) {
 current++
 longest = Math.max(longest, current)
 } else {
 current = 0
 }
 }
 return longest
}

function computeMonthActiveDays(
 activityData: Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>,
 year: number,
 month: number,
): number {
 let count = 0
 const daysInMonth = new Date(year, month + 1, 0).getDate()
 for (let day = 1; day <= daysInMonth; day++) {
 const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
 const entry = activityData.get(key)
 if (entry && entry.level > 0) count++
 }
 return count
}

function computeTotalActiveDays(activityData: Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>): number {
 let count = 0
 for (const entry of activityData.values()) {
 if (entry.level > 0) count++
 }
 return count
}

function levelToMinutes(level: number): number {
 if (level >= 4) return 90
 if (level >= 3) return 45
 if (level >= 2) return 25
 if (level >= 1) return 10
 return 0
}

// --- Component ---

export function StreakCalendarPanel(props: { className?: string }) {
 const mounted = useIsMounted()
 if (!mounted) {
 return (
 <Card className={cn('glass-card-hover overflow-hidden', props.className)}>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
 <div className="h-5 w-32 rounded bg-muted animate-pulse" />
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-4 gap-2">
 {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
 </div>
 <div className="h-48 rounded-lg bg-muted animate-pulse" />
 </CardContent>
 </Card>
 )
 }
 return <StreakCalendarPanelInner {...props} />
}

function StreakCalendarPanelInner({ className }: { className?: string }) {
 const { user } = useAppStore()
 const today = useMemo(() => {
 const d = new Date()
 d.setHours(0, 0, 0, 0)
 return d
 }, [])

 const [currentYear, setCurrentYear] = useState(today.getFullYear())
 const [currentMonth, setCurrentMonth] = useState(today.getMonth())
 const [slideDirection, setSlideDirection] = useState<1 | -1>(1)
 const [loading, setLoading] = useState(true)
 const calendarRef = useRef<HTMLDivElement>(null)

 // Fetch activity data from API
 const [activityData, setActivityData] = useState<Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>>(new Map())

 useEffect(() => {
 if (!user?.id) return
 let cancelled = false
 fetch(`/api/activity?userId=${user.id}`)
 .then((res) => res.json())
 .then((data) => {
 if (cancelled) return
 const dates = (data.dates || []) as Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>
 const map = new Map<string, { level: 0 | 1 | 2 | 3 | 4; minutes: number }>()
 for (const d of dates) {
 map.set(d.date, {
 level: d.level,
 minutes: levelToMinutes(d.level),
 })
 }
 setActivityData(map)
 })
 .catch(() => { /* silent */ })
 .finally(() => { if (!cancelled) setLoading(false) })
 return () => { cancelled = true }
 }, [user?.id])

 const currentStreak = useMemo(() => computeStreak(activityData), [activityData])
 const longestStreak = useMemo(() => computeLongestStreak(activityData), [activityData])
 const monthActiveDays = useMemo(
 () => computeMonthActiveDays(activityData, currentYear, currentMonth),
 [activityData, currentYear, currentMonth],
 )
 const totalActiveDays = useMemo(() => computeTotalActiveDays(activityData), [activityData])

 const motivationalMessage = useMemo(
 () => MOTIVATIONAL_MESSAGES[Math.floor(Date.now() / 86400000) % MOTIVATIONAL_MESSAGES.length],
 [],
 )

 // Build calendar days for the 42-cell grid
 const calendarDays = useMemo<ActivityDay[]>(() => {
 const firstDay = new Date(currentYear, currentMonth, 1)
 const startDow = firstDay.getDay()
 const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
 const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()

 const days: ActivityDay[] = []

 // Previous month fill
 for (let i = startDow - 1; i >= 0; i--) {
 const day = prevMonthDays - i
 const d = new Date(currentYear, currentMonth - 1, day)
 const key = d.toISOString().split('T')[0]
 const entry = activityData.get(key)
 days.push({
 date: key,
 day,
 level: (entry?.level ?? 0) as 0 | 1 | 2 | 3 | 4,
 minutes: entry?.minutes ?? 0,
 isToday: false,
 isFuture: false,
 isCurrentMonth: false,
 })
 }

 // Current month
 for (let day = 1; day <= daysInMonth; day++) {
 const d = new Date(currentYear, currentMonth, day)
 const key = d.toISOString().split('T')[0]
 const entry = activityData.get(key)
 const isToday = d.getTime() === today.getTime()
 const isFuture = d > today
 days.push({
 date: key,
 day,
 level: (entry?.level ?? 0) as 0 | 1 | 2 | 3 | 4,
 minutes: entry?.minutes ?? 0,
 isToday,
 isFuture,
 isCurrentMonth: true,
 })
 }

 // Next month fill
 const remaining = 42 - days.length
 for (let day = 1; day <= remaining; day++) {
 const d = new Date(currentYear, currentMonth + 1, day)
 const key = d.toISOString().split('T')[0]
 const entry = activityData.get(key)
 days.push({
 date: key,
 day,
 level: (entry?.level ?? 0) as 0 | 1 | 2 | 3 | 4,
 minutes: entry?.minutes ?? 0,
 isToday: false,
 isFuture: d > today,
 isCurrentMonth: false,
 })
 }

 return days
 }, [currentYear, currentMonth, activityData, today])

 const goToPrevMonth = useCallback(() => {
 setSlideDirection(-1 as const)
 setCurrentMonth((m) => {
 if (m === 0) {
 setCurrentYear((y) => y - 1)
 return 11
 }
 return m - 1
 })
 }, [])

 const goToNextMonth = useCallback(() => {
 setSlideDirection(1 as const)
 setCurrentMonth((m) => {
 if (m === 11) {
 setCurrentYear((y) => y + 1)
 return 0
 }
 return m + 1
 })
 }, [])

 const goToToday = useCallback(() => {
 setSlideDirection(1 as const)
 setCurrentYear(today.getFullYear())
 setCurrentMonth(today.getMonth())
 }, [today])

 // Keyboard navigation
 const handleKeyDown = useCallback(
 (e: React.KeyboardEvent) => {
 if (e.key === 'ArrowLeft') {
 e.preventDefault()
 goToPrevMonth()
 } else if (e.key === 'ArrowRight') {
 e.preventDefault()
 goToNextMonth()
 }
 },
 [goToPrevMonth, goToNextMonth],
 )

 const isCurrentMonthView = currentYear === today.getFullYear() && currentMonth === today.getMonth()

 const slideVariants = {
 enter: (dir: 1 | -1) => ({ x: dir * 30, opacity: 0 }),
 center: { x: 0, opacity: 1 },
 exit: (dir: 1 | -1) => ({ x: dir * -30, opacity: 0 }),
 }

 const slideEase = [0.25, 0.46, 0.45, 0.94] as const
 const staggerEase = [0.16, 1, 0.3, 1] as const
 const bounceEase = [0.34, 1.56, 0.64, 1] as const

 if (loading) {
 return (
 <Card className={cn('glass-card-hover overflow-hidden', className)}>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
 <div className="h-5 w-32 rounded bg-muted animate-pulse" />
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-4 gap-2">
 {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
 </div>
 <div className="h-48 rounded-lg bg-muted animate-pulse" />
 </CardContent>
 </Card>
 )
 }

 return (
 <Card className={cn('glass-card-hover overflow-hidden', className)}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2 text-lg">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
 <CalendarDays className="h-4 w-4 text-gray-700" />
 </div>
 Learning Streak
 </CardTitle>
 {!isCurrentMonthView && (
 <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-gray-700">
 Today
 </Button>
 )}
 </div>
 </CardHeader>

 <CardContent className="space-y-4">
 {/* --- Streak Stats Bar --- */}
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
 {[
 {
 icon: Flame,
 label: 'Current Streak',
 value: `${currentStreak}d`,
 highlight: currentStreak > 0,
 animate: currentStreak > 0 ? 'animate-flame' : '',
 },
 {
 icon: Trophy,
 label: 'Longest Streak',
 value: `${longestStreak}d`,
 highlight: false,
 animate: '',
 },
 {
 icon: CalendarDays,
 label: 'This Month',
 value: `${monthActiveDays}d`,
 highlight: false,
 animate: '',
 },
 {
 icon: Target,
 label: 'Total Active',
 value: `${totalActiveDays}d`,
 highlight: false,
 animate: '',
 },
 ].map((stat) => (
 <motion.div
 key={stat.label}
 className="glass-card flex items-center gap-2 rounded-lg p-2.5"
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, ease: staggerEase }}
 >
 <stat.icon
 className={cn(
 'h-4 w-4 shrink-0',
 stat.highlight
 ? 'text-gray-700'
 : 'text-muted-foreground',
 stat.animate,
 )}
 />
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
 <p className={cn('text-sm font-semibold leading-tight', stat.highlight && 'text-gray-700')}>
 {stat.value}
 </p>
 </div>
 </motion.div>
 ))}
 </div>

 {/* --- Month Navigation --- */}
 <div
 ref={calendarRef}
 tabIndex={0}
 role="grid"
 aria-label="Learning streak calendar"
 onKeyDown={handleKeyDown}
 className="outline-none rounded-lg"
 >
 <div className="flex items-center justify-between mb-2 px-1">
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7"
 onClick={goToPrevMonth}
 aria-label="Previous month"
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <h3 className="text-sm font-semibold tracking-tight">
 {MONTH_NAMES[currentMonth]} {currentYear}
 </h3>
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7"
 onClick={goToNextMonth}
 aria-label="Next month"
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 </div>

 {/* Weekday labels */}
 <div className="grid grid-cols-7 gap-0.5 mb-0.5">
 {WEEKDAY_LABELS.map((label) => (
 <div
 key={label}
 className="text-center text-[10px] font-medium text-muted-foreground py-1"
 >
 {label}
 </div>
 ))}
 </div>

 {/* Calendar Grid */}
 <AnimatePresence mode="wait" custom={slideDirection}>
 <motion.div
 key={`${currentYear}-${currentMonth}`}
 custom={slideDirection}
 variants={slideVariants}
 initial="enter"
 animate="center"
 exit="exit"
 transition={{ duration: 0.25, ease: slideEase }}
 className="grid grid-cols-7 gap-0.5"
 >
 {calendarDays.map((day, idx) => {
 const Icon = day.minutes >= 60 ? Flame : day.minutes >= 30 ? Zap : day.minutes >= 15 ? Star : null
 return (
 <motion.div
 key={day.date}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{
 duration: 0.2,
 delay: idx * 0.008,
 ease: staggerEase,
 }}
 >
 <Tooltip>
 <TooltipTrigger asChild>
 <div
 role="gridcell"
 aria-label={`${day.date}: ${day.minutes > 0 ? `${day.minutes} minutes of learning` : 'No activity'}`}
 className={cn(
 'relative flex flex-col items-center justify-center rounded-md aspect-square transition-colors cursor-default',
 LEVEL_COLORS[day.level],
 day.isToday && 'ring-2 ring-gray-400 ring-offset-1 ring-offset-background',
 day.isFuture && 'opacity-30',
 !day.isCurrentMonth && !day.isFuture && 'opacity-50',
 day.level > 0 && !day.isFuture && 'hover-lift',
 )}
 >
 <span
 className={cn(
 'text-[11px] font-medium leading-none',
 day.isToday && 'font-bold text-gray-700',
 day.isFuture && 'text-muted-foreground/50',
 !day.isCurrentMonth && 'text-muted-foreground/60',
 )}
 >
 {day.day}
 </span>
 {Icon && !day.isFuture && (
 <Icon className="h-2.5 w-2.5 mt-0.5 text-gray-600" />
 )}
 </div>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-xs">
 <div className="text-center">
 <p className="font-medium">{day.date}</p>
 <p className="text-gray-600">
 {day.minutes > 0
 ? `${day.minutes} min of learning`
 : 'No activity'}
 </p>
 <p className="text-muted-foreground">
 Level: {day.level}/4
 </p>
 </div>
 </TooltipContent>
 </Tooltip>
 </motion.div>
 )
 })}
 </motion.div>
 </AnimatePresence>
 </div>

 {/* --- Activity Legend --- */}
 <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
 <span>Less</span>
 {LEVEL_COLORS.map((color, i) => (
 <div
 key={i}
 className={cn('h-3 w-3 rounded-sm', color)}
 />
 ))}
 <span>More</span>
 </div>

 {/* --- Milestone Badges --- */}
 <div>
 <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Milestones
 </h4>
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
 {MILESTONES.map((milestone) => {
 const earned = longestStreak >= milestone.days
 const progress = Math.min(100, Math.round((longestStreak / milestone.days) * 100))
 const Icon = milestone.icon
 return (
 <motion.div
 key={milestone.days}
 className={cn(
 'glass-card relative flex flex-col items-center gap-1 rounded-lg p-2.5 text-center',
 earned ? 'hover-lift' : 'opacity-60',
 )}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35, delay: 0.1 + milestone.days * 0.005, ease: bounceEase }}
 >
 <div
 className={cn(
 'flex h-8 w-8 items-center justify-center rounded-full',
 earned
 ? `bg-gradient-to-br ${milestone.gradientClass} text-gray-700`
 : 'bg-gray-100 text-muted-foreground',
 )}
 >
 {earned ? (
 <Icon className="h-4 w-4" />
 ) : (
 <Lock className="h-3.5 w-3.5" />
 )}
 </div>
 <p className={cn('text-[10px] font-semibold leading-tight', earned ? milestone.colorClass : 'text-muted-foreground')}>
 {milestone.title}
 </p>
 <p className="text-[9px] text-muted-foreground leading-tight">
 {milestone.days} days
 </p>
 {!earned && (
 <div className="w-full h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
 <motion.div
 className={cn('h-full rounded-full bg-gradient-to-r', milestone.gradientClass)}
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 0.6, delay: 0.3 + milestone.days * 0.005, ease: staggerEase }}
 />
 </div>
 )}
 </motion.div>
 )
 })}
 </div>
 </div>

 {/* --- Streak Challenge Widget --- */}
 <motion.div
 className={cn(
 'glass-card rounded-xl p-4 text-center',
 'bg-white/60',
 'border border-gray-200/50',
 )}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, delay: 0.4, ease: bounceEase }}
 >
 <div className="flex items-center justify-center gap-2 mb-1.5">
 <Rocket className="h-5 w-5 text-gray-700" />
 <h4 className="text-sm font-semibold text-gray-700">
 {currentStreak > 0
 ? `Keep your ${currentStreak}-day streak going!`
 : 'Start a new streak today!'}
 </h4>
 </div>
 <p className="text-xs text-gray-500 mb-3">
 {motivationalMessage}
 </p>
 <Button
 size="sm"
 className={cn(
 'bg-gray-800 text-white hover:bg-gray-700',
 )}
 >
 {currentStreak > 0 ? 'Continue Learning' : 'Start Learning Now'}
 </Button>
 </motion.div>
 </CardContent>
 </Card>
 )
}
