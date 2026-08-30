'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, RotateCcw, Clock, Timer, Coffee, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ==================== CONSTANTS ====================
const TIMER_MODES = {
  focus: { label: 'Focus', duration: 25 * 60, icon: Timer },
  shortBreak: { label: 'Short Break', duration: 5 * 60, icon: Coffee },
  longBreak: { label: 'Long Break', duration: 15 * 60, icon: Zap },
} as const

type TimerMode = keyof typeof TIMER_MODES

const RING_COLORS = {
  focus: {
    start: '#404040', // gray-700
    end: '#9ca3af', // gray-400
    glow: 'rgba(0, 0, 0, 0.08)',
    badge: 'bg-gray-100 text-gray-700',
    ring: 'text-gray-700',
  },
  shortBreak: {
    start: '#6b7280', // gray-500
    end: '#9ca3af', // gray-400
    glow: 'rgba(0, 0, 0, 0.06)',
    badge: 'bg-gray-100 text-gray-600',
    ring: 'text-gray-500',
  },
  longBreak: {
    start: '#4b5563', // gray-600
    end: '#9ca3af', // gray-400
    glow: 'rgba(0, 0, 0, 0.06)',
    badge: 'bg-gray-100 text-gray-600',
    ring: 'text-gray-600',
  },
} as const

const SVG_SIZE = 180
const STROKE_WIDTH = 8
const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SESSIONS_BEFORE_LONG_BREAK = 4

// ==================== AUDIO BEEP ====================
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || ((window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)
    const ctx = new AudioCtx()
    // Play 3 short beeps
    ;[0, 0.2, 0.4].forEach((delay) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.value = 660
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15)
      oscillator.start(ctx.currentTime + delay)
      oscillator.stop(ctx.currentTime + delay + 0.15)
    })
  } catch {
    // Audio not available, fail silently
  }
}

// ==================== COMPONENT ====================
export function PomodoroTimer() {
  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(1)
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0)
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0)
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false)

  // Refs to access latest state in interval callbacks
  const modeRef = useRef(mode)
  const sessionCountRef = useRef(sessionCount)
  const completedRef = useRef(completedFocusSessions)
  const focusMinutesRef = useRef(totalFocusMinutesToday)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { sessionCountRef.current = sessionCount }, [sessionCount])
  useEffect(() => { completedRef.current = completedFocusSessions }, [completedFocusSessions])
  useEffect(() => { focusMinutesRef.current = totalFocusMinutesToday }, [totalFocusMinutesToday])

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derived values
  const totalTime = TIMER_MODES[mode].duration
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const colors = RING_COLORS[mode]
  const ModeIcon = TIMER_MODES[mode].icon

  // Handle timer completion — called from interval via setTimeout to avoid lint
  const completeTimer = useCallback(() => {
    playBeep()
    const currentMode = modeRef.current
    const currentSession = sessionCountRef.current
    const currentCompleted = completedRef.current
    const currentMinutes = focusMinutesRef.current

    setShowCompleteAnimation(true)
    setTimeout(() => setShowCompleteAnimation(false), 2000)
    setIsRunning(false)

    if (currentMode === 'focus') {
      const newCompleted = currentCompleted + 1
      const newMinutes = currentMinutes + Math.round(TIMER_MODES.focus.duration / 60)
      setCompletedFocusSessions(newCompleted)
      setTotalFocusMinutesToday(newMinutes)

      toast.success('Focus session complete! Great work!', {
        description: `Session ${currentSession} done. ${newMinutes} minutes focused today.`,
      })

      // Auto-suggest long break after 4 focus sessions
      if (newCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
        toast('Time for a long break! You earned it.', {
          icon: '🎉',
          description: '15-minute break recommended.',
        })
        setMode('longBreak')
        setTimeLeft(TIMER_MODES.longBreak.duration)
        setSessionCount(1)
      } else {
        toast('Take a short break!', {
          icon: '☕',
          description: '5-minute breather before the next session.',
        })
        setMode('shortBreak')
        setTimeLeft(TIMER_MODES.shortBreak.duration)
      }
    } else {
      // Break complete → back to focus
      toast('Break is over! Ready to focus?', {
        icon: '🚀',
      })
      setMode('focus')
      setTimeLeft(TIMER_MODES.focus.duration)
      setSessionCount((prev) => prev + 1)
    }
  }, [])

  // Keep ref to completion handler
  const completeRef = useRef(completeTimer)
  useEffect(() => { completeRef.current = completeTimer }, [completeTimer])

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            // Schedule completion outside of React batch
            setTimeout(() => completeRef.current(), 0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // Controls
  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      setIsRunning(true)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(TIMER_MODES[mode].duration)
  }

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(TIMER_MODES[newMode].duration)
  }

  // Gradient ID (must be unique per render)
  const gradientId = `pomodoro-gradient-${mode}`

  return (
    <Card className="relative overflow-hidden backdrop-blur-xl bg-white/60 border border-white/40 shadow-sm">
      {/* Glassmorphism overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            Focus Timer
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{totalFocusMinutesToday}m</span>
            <span>focused today</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-col items-center gap-4 pb-5">
        {/* Mode Switch Tabs */}
        <div className="flex gap-1 rounded-full bg-muted/60 p-1">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === m
                  ? 'text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {mode === m && (
                <motion.div
                  layoutId="pomodoro-mode-tab"
                  className="absolute inset-0 rounded-full bg-gray-900"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{TIMER_MODES[m].label}</span>
            </button>
          ))}
        </div>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center">
          {/* Glow effect during focus mode when running */}
          {isRunning && mode === 'focus' && (
            <motion.div
              className="absolute inset-[-8px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            className="transform -rotate-90"
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.start} />
                <stop offset="100%" stopColor={colors.end} />
              </linearGradient>
            </defs>

            {/* Background ring */}
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              className="text-gray-200"
            />

            {/* Progress ring */}
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
              style={
                isRunning && mode === 'focus'
                  ? { filter: `drop-shadow(0 0 6px ${colors.glow})` }
                  : undefined
              }
            />
          </svg>

          {/* Time display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={timeDisplay}
                initial={showCompleteAnimation ? { scale: 1.3, opacity: 0 } : { opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: showCompleteAnimation ? 0.5 : 0.2 }}
                className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-gray-900"
              >
                {timeDisplay}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Mode indicator badge + Session counter */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={`gap-1.5 text-xs font-medium ${colors.badge}`}>
            <ModeIcon className="h-3 w-3" />
            {TIMER_MODES[mode].label}
          </Badge>
          {mode === 'focus' && (
            <span className="text-xs text-gray-500">
              Session {sessionCount} of {SESSIONS_BEFORE_LONG_BREAK}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-gray-300 bg-white hover:bg-gray-50"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4 text-gray-600" />
          </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-white border-2 border-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300"
              onClick={toggleTimer}
            >
              <motion.div
                animate={
                  isRunning
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }
                }
                transition={
                  isRunning
                    ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
              >
                {isRunning ? (
                  <Pause className="h-6 w-6 text-gray-900" />
                ) : (
                  <Play className="h-6 w-6 text-gray-900 ml-0.5" />
                )}
              </motion.div>
            </Button>
          </motion.div>

          {/* Invisible spacer for centering */}
          <div className="h-10 w-10" />
        </div>

        {/* Completed sessions indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                i < (completedFocusSessions % SESSIONS_BEFORE_LONG_BREAK)
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
              }`}
              animate={
                i === (completedFocusSessions % SESSIONS_BEFORE_LONG_BREAK) && showCompleteAnimation
                  ? { scale: [1, 1.8, 1] }
                  : {}
              }
              transition={{ duration: 0.5 }}
            />
          ))}
          <span className="text-[10px] text-gray-500 ml-1.5">
            {completedFocusSessions} {completedFocusSessions === 1 ? 'session' : 'sessions'} done
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
