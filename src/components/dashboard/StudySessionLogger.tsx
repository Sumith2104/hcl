'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Timer, Plus, Trash2, Clock, Flame, BookOpen, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/store'

// ==================== TYPES ====================
type Category = 'Frontend' | 'Backend' | 'AI/ML' | 'Data Science' | 'DevOps' | 'General'

interface StudySession {
  id: string
  topic: string
  category: Category
  durationMinutes: number
  notes: string
  timestamp: Date
}

// ==================== CONSTANTS ====================
const CATEGORIES: Category[] = [
  'Frontend',
  'Backend',
  'AI/ML',
  'Data Science',
  'DevOps',
  'General',
]

const DURATION_PRESETS = [15, 30, 45, 60, 90]

const CATEGORY_COLORS: Record<Category, string> = {
  Frontend:
    'bg-gray-100 text-gray-600',
  Backend:
    'bg-gray-100 text-gray-600',
  'AI/ML':
    'bg-gray-100 text-gray-600',
  'Data Science':
    'bg-gray-100 text-gray-600',
  DevOps:
    'bg-gray-100 text-gray-600',
  General:
    'bg-gray-100 text-gray-600',
}

// ==================== HELPERS ====================
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1d ago'
  return `${diffDays}d ago`
}

function generateId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Monday = 0, Sunday = 6 in our calculation
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return date.getTime() >= monday.getTime() && date.getTime() <= sunday.getTime()
}

// ==================== ANIMATIONS ====================
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const

const sessionItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
} as const

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const

// ==================== COMPONENT ====================
export function StudySessionLogger({ className }: { className?: string }) {
  const { user } = useAppStore()
  // Session state
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [duration, setDuration] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load sessions from API on mount
  useEffect(() => {
    if (!user) return
    fetch(`/api/study-sessions?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.sessions && data.sessions.length > 0) {
          const mapped: StudySession[] = data.sessions.map((s: any) => ({
            id: s.id,
            topic: s.skillName || 'Study Session',
            category: (s.type === 'focus' ? 'General' : s.type === 'review' ? 'Backend' : s.type === 'practice' ? 'Frontend' : 'AI/ML') as Category,
            durationMinutes: s.duration || 0,
            notes: s.notes || '',
            timestamp: new Date(s.createdAt),
          }))
          setSessions(mapped)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [user])

  // Computed stats
  const stats = useMemo(() => {
    const todayMinutes = sessions
      .filter((s) => isToday(s.timestamp))
      .reduce((acc, s) => acc + s.durationMinutes, 0)
    const weekMinutes = sessions
      .filter((s) => isThisWeek(s.timestamp))
      .reduce((acc, s) => acc + s.durationMinutes, 0)
    const totalSessions = sessions.length
    const avgDuration =
      totalSessions > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / totalSessions)
        : 0
    return { todayMinutes, weekMinutes, totalSessions, avgDuration }
  }, [sessions])

  // Recent sessions (last 10)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  }, [sessions])

  // Handlers
  function handleLogSession() {
    if (!topic.trim()) {
      toast.error('Please enter a topic or skill name')
      return
    }
    if (!category) {
      toast.error('Please select a category')
      return
    }
    if (!duration || duration <= 0) {
      toast.error('Please enter a valid duration')
      return
    }

    const newSession: StudySession = {
      id: generateId(),
      topic: topic.trim(),
      category: category as Category,
      durationMinutes: Number(duration),
      notes: notes.trim(),
      timestamp: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setTopic('')
    setCategory('')
    setDuration('')
    setNotes('')
    setShowForm(false)

    // Persist to API
    if (user) {
      fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          skillName: topic.trim(),
          duration: Number(duration),
          notes: notes.trim(),
          type: 'focus',
        }),
      }).catch(() => { /* silent */ })
    }

    toast.success('Session logged successfully!')
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    // Delete from API
    if (user) {
      fetch(`/api/study-sessions?id=${id}`, { method: 'DELETE' }).catch(() => {})
    }
    toast.success('Session deleted')
  }

  // Stats items
  const statItems = [
    {
      icon: Flame,
      label: 'Today',
      value: formatDuration(stats.todayMinutes),
      color: 'text-gray-600',
    },
    {
      icon: Clock,
      label: 'This Week',
      value: formatDuration(stats.weekMinutes),
      color: 'text-gray-600',
    },
    {
      icon: BookOpen,
      label: 'Sessions',
      value: String(stats.totalSessions),
      color: 'text-gray-600',
    },
    {
      icon: TrendingUp,
      label: 'Avg Duration',
      value: formatDuration(stats.avgDuration),
      color: 'text-gray-600',
    },
  ]

  return (
    <motion.div
      className={className}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100">
                <Timer className="size-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                Study Sessions
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="size-3.5" />
              Log
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            {statItems.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-2"
                >
                  <Icon className={`size-3.5 ${stat.color}`} />
                  <span className="text-xs font-semibold leading-tight">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {stat.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Log Session Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' as const }}
                className="space-y-3 rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm p-3"
              >
                <div className="space-y-1.5">
                  <Input
                    placeholder="Topic or skill name"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as Category)}
                  >
                    <SelectTrigger className="h-8 flex-1 text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDuration(preset)}
                        className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                          duration === preset
                            ? 'border-gray-200 bg-gray-100 text-gray-600'
                            : 'border-border bg-background text-gray-500 hover:border-gray-200 hover:text-foreground'
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Or enter custom minutes"
                    min={1}
                    max={480}
                    value={duration === '' ? '' : duration}
                    onChange={(e) => {
                      const val = e.target.value
                      setDuration(val === '' ? '' : parseInt(val, 10))
                    }}
                    className="h-8 text-sm"
                  />
                </div>

                <Textarea
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-16 resize-none text-sm"
                />

                <Button
                  size="sm"
                  className="w-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  onClick={handleLogSession}
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Log Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session History */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent Sessions
            </h3>

            {recentSessions.length === 0 ? (
              <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
                className="flex flex-col items-center justify-center py-6 text-gray-400"
              >
                <Timer className="mb-2 size-8 opacity-30" />
                <p className="text-sm font-medium">No sessions yet</p>
                <p className="text-xs">Start logging your study sessions</p>
              </motion.div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                <AnimatePresence mode="popLayout">
                  {recentSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      variants={sessionItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{
                        duration: 0.25,
                        ease: 'easeOut' as const,
                      }}
                      layout
                      className="group relative flex items-start gap-3 rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm p-2.5 transition-colors hover:bg-gray-50/80"
                    >
                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {session.topic}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[session.category]}`}
                          >
                            {session.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="size-3" />
                          <span>{formatDuration(session.durationMinutes)}</span>
                          <span className="text-border">·</span>
                          <span>{formatRelativeTime(session.timestamp)}</span>
                        </div>
                        {session.notes && (
                          <p className="truncate text-xs text-gray-500/80">
                            {session.notes}
                          </p>
                        )}
                      </div>

                      {/* Delete button (hover-reveal) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1.5 top-1.5 size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
