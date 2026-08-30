'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Flame, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

interface ActivityHeatmapProps {
  className?: string
}

interface ActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

const LEVEL_COLORS = [
  'bg-gray-100',
  'bg-gray-200',
  'bg-gray-300',
  'bg-gray-400',
  'bg-gray-700',
] as const

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const
const WEEKS = 12
const DAYS_PER_WEEK = 7

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function computeStreak(dates: ActivityDay[]): number {
  let streak = 0
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i].count > 0) {
      streak++
    } else {
      // Allow today to be inactive (streak is from yesterday if today has no activity)
      if (i === dates.length - 1) continue
      break
    }
  }
  return streak
}

export function ActivityHeatmap({ className }: ActivityHeatmapProps) {
  const user = useAppStore((s) => s.user)
  const [dates, setDates] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/activity?userId=${user.id}`)
      if (!res.ok) throw new Error('Failed to load activity')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setDates(json.dates ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  // Take last 84 days (12 weeks) from the 90-day response
  const heatmapData = dates.slice(-84)

  // Compute stats
  const activeDays = heatmapData.filter((d) => d.count > 0).length
  const currentStreak = computeStreak(heatmapData)

  // Build month labels - find first occurrence of each month across columns
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  for (let col = 0; col < WEEKS; col++) {
    const dayIndex = col // first row (Sunday) for each week column
    if (dayIndex < heatmapData.length) {
      const d = new Date(heatmapData[dayIndex].date + 'T00:00:00')
      const month = d.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTH_ABBR[month], col })
        lastMonth = month
      }
    }
  }

  // Build grid: weeks are columns, days are rows (0=Sun, 1=Mon, ... 6=Sat)
  // The data starts from the oldest date and goes forward.
  // We need to figure out the day-of-week offset for the first entry
  const grid: (ActivityDay | null)[][] = Array.from({ length: DAYS_PER_WEEK }, () =>
    Array.from({ length: WEEKS }, () => null)
  )

  if (heatmapData.length > 0) {
    const firstDayOfWeek = new Date(heatmapData[0].date + 'T00:00:00').getDay() // 0=Sun
    // Fill remaining days of first week with nulls
    let idx = 0
    for (let row = 0; row < DAYS_PER_WEEK && idx < heatmapData.length; row++) {
      if (row >= firstDayOfWeek) {
        grid[row][0] = heatmapData[idx]
        idx++
      }
    }
    // Fill subsequent weeks
    let week = 1
    while (idx < heatmapData.length && week < WEEKS) {
      for (let row = 0; row < DAYS_PER_WEEK && idx < heatmapData.length; row++) {
        grid[row][week] = heatmapData[idx]
        idx++
      }
      week++
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' as const }}
      className={className}
    >
      <Card className="overflow-hidden border-gray-200/50 bg-white/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-700" />
            </div>
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, r) => (
                  <div key={r} className="flex flex-col gap-1">
                    {Array.from({ length: 12 }).map((_, c) => (
                      <Skeleton key={c} className="w-3 h-3 rounded-sm" />
                    ))}
                  </div>
                ))}
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Heatmap */}
          {!loading && !error && heatmapData.length > 0 && (
            <>
              {/* Month labels */}
              <div className="flex mb-1.5" style={{ paddingLeft: '2rem' }}>
                {Array.from({ length: WEEKS }).map((_, col) => {
                  const monthInfo = monthLabels.find((m) => m.col === col)
                  return (
                    <div
                      key={col}
                      className="flex-1 text-[10px] text-muted-foreground truncate"
                    >
                      {monthInfo?.label ?? ''}
                    </div>
                  )
                })}
              </div>

              {/* Grid: day labels + cells */}
              <div className="flex gap-0">
                {/* Day-of-week labels */}
                <div className="flex flex-col gap-[3px] pr-2 shrink-0" style={{ paddingTop: '0' }}>
                  {DAY_LABELS.map((label, row) => (
                    <div
                      key={row}
                      className="h-3 sm:h-[10px] flex items-center justify-end text-[10px] leading-none text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-[3px] overflow-x-auto">
                  {Array.from({ length: WEEKS }).map((_, col) => (
                    <div key={col} className="flex flex-col gap-[3px]">
                      {Array.from({ length: DAYS_PER_WEEK }).map((_, row) => {
                        const day = grid[row][col]
                        const level = day?.level ?? 0
                        return (
                          <div
                            key={row}
                            title={
                              day
                                ? `${formatDateLabel(day.date)}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`
                                : 'No data'
                            }
                            className={`w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-sm cursor-default transition-transform hover:scale-125 ${LEVEL_COLORS[level]}`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <span className="text-[10px] text-muted-foreground mr-1">Less</span>
                {LEVEL_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${color}`}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">More</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-neutral-900" />
                  <span>
                    <span className="font-semibold text-foreground">{activeDays}</span>{' '}
                    active {activeDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-gray-500" />
                  <span>
                    <span className="font-semibold text-foreground">{currentStreak}</span>{' '}
                    day {currentStreak === 1 ? 'streak' : 'streak'}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
