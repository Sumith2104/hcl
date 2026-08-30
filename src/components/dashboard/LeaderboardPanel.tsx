'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trophy, TrendingUp, Crown, Users, Medal, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useIsMounted } from '@/hooks/use-is-mounted'

// ==================== TYPES ====================
type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert'

interface LeaderboardEntry {
  rank: number
  name: string
  initials: string
  points: number
  level: Level
  streak: number
  skillsCount: number
  label: string
  isCurrentUser?: boolean
}

interface LeaderboardPanelProps {
  className?: string
}

// ==================== LEVEL CONFIG ====================
const levelConfig: Record<Level, { label: string; bg: string; text: string }> = {
  beginner: {
    label: 'BEG',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
  intermediate: {
    label: 'INT',
    bg: 'bg-gray-200',
    text: 'text-gray-600',
  },
  advanced: {
    label: 'ADV',
    bg: 'bg-gray-300',
    text: 'text-gray-700',
  },
  expert: {
    label: 'EXP',
    bg: 'bg-gray-400',
    text: 'text-gray-800',
  },
}

// ==================== AVATAR COLORS ====================
const avatarColors = [
  'bg-gray-200',
  'bg-gray-200',
  'bg-gray-300',
  'bg-gray-300',
  'bg-gray-400',
  'bg-gray-400',
  'bg-gray-400',
  'bg-gray-500',
  'bg-gray-500',
  'bg-gray-500',
  'bg-gray-500',
  'bg-gray-600',
  'bg-gray-600',
  'bg-gray-200',
  'bg-gray-200',
]

// ==================== PODIUM MEDAL COLORS ====================
const medalConfig: Record<number, { bg: string; border: string; glow: string; iconColor: string }> = {
  1: {
    bg: 'bg-gray-200',
    border: 'border-gray-300',
    glow: 'shadow-gray-300/30 shadow-lg',
    iconColor: 'text-gray-700',
  },
  2: {
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    glow: 'shadow-gray-200/20 shadow-md',
    iconColor: 'text-gray-500',
  },
  3: {
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    glow: 'shadow-gray-200/20 shadow-md',
    iconColor: 'text-gray-500',
  },
}

// ==================== PODIUM ITEM ====================
function PodiumItem({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isFirst = entry.rank === 1
  const config = medalConfig[entry.rank]
  const avatarSize = isFirst ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'
  const fontSize = isFirst ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
  const pointsSize = isFirst ? 'text-sm' : 'text-xs'
  const colorIdx = entry.rank - 1

  return (
    <motion.div
      className="flex flex-col items-center gap-2 sm:gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Avatar with medal overlay */}
      <div className="relative">
        <div
          className={`${avatarSize} rounded-full flex items-center justify-center text-gray-600 font-bold ${isFirst ? 'text-base sm:text-lg' : 'text-sm'} ${avatarColors[colorIdx]} ring-2 ring-offset-2 ring-offset-background border-gray-300`}
        >
          {entry.initials}
        </div>
        {/* Medal overlay */}
        <div
          className={`absolute -bottom-1 -right-1 ${config.bg} ${config.glow} rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border border-gray-300`}
        >
          {entry.rank === 1 ? (
            <Crown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${config.iconColor}`} />
          ) : (
            <Medal className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${config.iconColor}`} />
          )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <p className={`${fontSize} font-semibold text-foreground leading-tight`}>{entry.name}</p>
        <p className={`${pointsSize} text-gray-500 font-medium`}>{entry.points.toLocaleString()} pts</p>
        <p className="text-xs text-gray-400 mt-0.5">{entry.label}</p>
      </div>
    </motion.div>
  )
}

// ==================== RANKINGS ROW ====================
function RankingRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const level = levelConfig[entry.level]
  const isHighlighted = entry.isCurrentUser

  return (
    <motion.div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isHighlighted ? 'bg-gray-50 border border-gray-200/50' : 'hover:bg-muted/50'}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.03, duration: 0.25 }}
    >
      {/* Rank number */}
      <span className="w-7 text-center text-sm font-semibold text-gray-500 tabular-nums">
        {entry.rank}
      </span>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold shrink-0 0024{avatarColors[entry.rank - 1]} ${isHighlighted ? 'ring-2 ring-gray-300' : ''}`}
      >
        {entry.initials}
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${isHighlighted ? 'text-gray-800' : 'text-foreground'}`}>
            {entry.name}
          </p>
          {isHighlighted && (
            <Badge className="bg-gray-800 text-white border-0 text-[10px] px-1.5 py-0 h-4">
              You
            </Badge>
          )}
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${level.bg} ${level.text} inline-block mt-0.5`}>
          {level.label}
        </span>
      </div>

      {/* Points */}
      <span className="text-sm font-semibold text-gray-500 tabular-nums shrink-0">
        {entry.points.toLocaleString()}
      </span>
    </motion.div>
  )
}

// ==================== EMPTY STATE ====================
function EmptyLeaderboard() {
  return (
    <div className="text-center py-8">
      <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Leaderboard coming soon</p>
      <p className="text-xs text-gray-400 mt-1">Start studying to climb the ranks!</p>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================
export function LeaderboardPanel({ className }: LeaderboardPanelProps) {
  const user = useAppStore((s) => s.user)
  const userId = user?.id
  const mounted = useIsMounted()
  const [learners, setLearners] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mounted || !userId) {
      setLoading(false)
      return
    }

    // Build leaderboard from real user data
    const fetchLeaderboard = async () => {
      try {
        const [analyticsRes, streakRes] = await Promise.all([
          fetch(`/api/analytics?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/streak?userId=${encodeURIComponent(userId)}`),
        ])
        const analytics = await analyticsRes.json().catch(() => ({ keyMetrics: {} }))
        const streak = await streakRes.json().catch(() => ({ streakData: null }))

        const metrics = analytics.keyMetrics || {}
        const totalHours = metrics.totalStudyHours || 0
        const totalSessions = metrics.totalSessions || 0
        const streakDays = streak.streakData?.streak || 0
        const skillsImproved = metrics.skillsImproved || 0

        // Calculate points from real activity
        const points = Math.round(totalHours * 10 + totalSessions * 5 + streakDays * 20 + skillsImproved * 50)

        // Determine level
        let level: Level = 'beginner'
        if (points >= 2000) level = 'expert'
        else if (points >= 1000) level = 'advanced'
        else if (points >= 300) level = 'intermediate'

        const name = user?.name || 'You'
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'YO'

        const entry: LeaderboardEntry = {
          rank: 1,
          name,
          initials,
          points,
          level,
          streak: streakDays,
          skillsCount: skillsImproved,
          label: streakDays > 0 ? `${streakDays} day streak` : `${totalSessions} sessions`,
          isCurrentUser: true,
        }

        setLearners([entry])
      } catch {
        // On error, show minimal entry
        const name = user?.name || 'You'
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'YO'
        setLearners([{
          rank: 1, name, initials, points: 0, level: 'beginner',
          streak: 0, skillsCount: 0, label: 'Get started!', isCurrentUser: true,
        }])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [mounted, userId, user?.name])

  const currentUser = learners.find((l) => l.isCurrentUser)

  // Adjust for display: if only 1 entry, show it differently
  const top3 = learners.slice(0, Math.min(3, learners.length))
  const rest = learners.slice(3)

  return (
    <Card className={`glass-card-hover ${className ?? ''}`}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gray-600" />
            </div>
            <CardTitle className="text-base">Your Progress</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            This Week
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : learners.length === 0 ? (
          <EmptyLeaderboard />
        ) : (
          <>
            {/* ===== TOP 3 PODIUM ===== */}
            {top3.length >= 3 ? (
              <div className="pt-2">
                <div className="flex items-end justify-center gap-4 sm:gap-8">
                  {/* #2 - left */}
                  <div className="flex flex-col items-center">
                    <PodiumItem entry={top3[1]} index={1} />
                    <motion.div
                      className="mt-3 w-20 sm:w-24 h-16 sm:h-20 bg-gray-100 rounded-t-lg flex items-end justify-center pb-2"
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      <span className="text-2xl sm:text-3xl font-bold text-gray-400">2</span>
                    </motion.div>
                  </div>

                  {/* #1 - center (taller) */}
                  <div className="flex flex-col items-center">
                    <PodiumItem entry={top3[0]} index={0} />
                    <motion.div
                      className="mt-3 w-20 sm:w-24 h-24 sm:h-28 bg-gray-200 rounded-t-lg flex items-end justify-center pb-2 border border-gray-300/50 border-b-0"
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      <span className="text-3xl sm:text-4xl font-bold text-gray-600">1</span>
                    </motion.div>
                  </div>

                  {/* #3 - right */}
                  <div className="flex flex-col items-center">
                    <PodiumItem entry={top3[2]} index={2} />
                    <motion.div
                      className="mt-3 w-20 sm:w-24 h-12 sm:h-16 bg-gray-100 rounded-t-lg flex items-end justify-center pb-2"
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      <span className="text-2xl sm:text-3xl font-bold text-gray-400">3</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            ) : (
              /* Single user card view */
              <div className="flex items-center justify-center pt-2">
                {top3[0] && (
                  <PodiumItem entry={top3[0]} index={0} />
                )}
              </div>
            )}

            {/* ===== FULL RANKINGS TABLE ===== */}
            {rest.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 mb-2">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Rankings
                  </span>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-1 pr-2">
                    {rest.map((entry, i) => (
                      <RankingRow key={entry.rank} entry={entry} index={i} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* ===== YOUR RANK CARD ===== */}
            {currentUser && (
              <motion.div
                className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 p-4 text-gray-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Your Stats</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold">{currentUser.points.toLocaleString()}</span>
                      <span className="text-sm text-gray-600">
                        pts
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentUser.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentUser.level.charAt(0).toUpperCase() + currentUser.level.slice(1)} level
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
