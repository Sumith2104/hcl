'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  BarChart3,
  Clock,
  TrendingUp,
  Target,
  Flame,
  BookOpen,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

interface LearningAnalyticsPanelProps {
  className?: string
}

interface WeeklyActivity {
  day: string
  hours: number
  tasks: number
}

interface CategoryData {
  category: string
  hours: number
  color: string
}

interface KeyMetric {
  icon: React.ComponentType<{ className?: string }>
  value: string
  label: string
  trend?: { value: string; positive: boolean }
  iconBg: string
  iconColor: string
}

const CATEGORY_PALETTE = ['#374151', '#6b7280', '#9ca3af', '#4b5563', '#6b7280', '#9ca3af', '#374151', '#4b5563']

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dateToDayAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_ABBR[d.getDay()]
}

// ==================== LOADING SKELETON ====================

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-0">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm p-3 space-y-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-6 flex-1 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== CUSTOM TOOLTIP ====================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string; dataKey: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.dataKey === 'hours' ? `${entry.value}h` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ==================== METRIC CARD ====================

function MetricCard({ metric, index }: { metric: KeyMetric; index: number }) {
  const IconComp = metric.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.06, ease: 'easeOut' }}
      className="rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm p-3 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', metric.iconBg)}>
          <IconComp className={cn('h-4 w-4', metric.iconColor)} />
        </div>
        {metric.trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold',
              metric.trend.positive
                ? 'text-gray-700'
                : 'text-gray-500'
            )}
          >
            <ArrowUpRight className="h-3 w-3" />
            {metric.trend.value}
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <p className="text-lg font-bold leading-tight tracking-tight text-foreground">
          {metric.value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{metric.label}</p>
      </div>
    </motion.div>
  )
}

// ==================== CATEGORY BAR ====================

function CategoryBar({
  data,
  maxHours,
  index,
}: {
  data: CategoryData
  maxHours: number
  index: number
}) {
  const widthPercent = (data.hours / maxHours) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.5 + index * 0.06, ease: 'easeOut' }}
      className="flex items-center gap-3"
    >
      <span className="text-xs text-muted-foreground w-16 shrink-0 text-right font-medium">
        {data.category}
      </span>
      <div className="flex-1 h-6 rounded-md bg-gray-100 overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.6, delay: 0.6 + index * 0.08, ease: 'easeOut' }}
          className="h-full rounded-md"
          style={{ backgroundColor: data.color }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-10 shrink-0">
        {data.hours}h
      </span>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

export function LearningAnalyticsPanel({ className }: LearningAnalyticsPanelProps) {
  const { user } = useAppStore()
  const mounted = useIsMounted()
  const [timePeriod, setTimePeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([])
  const [keyMetrics, setKeyMetrics] = useState<KeyMetric[]>([])

  useEffect(() => {
    if (!mounted || !user?.id) return
    let cancelled = false
    fetch(`/api/analytics?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return

        // Map weeklyActivity: API returns { date, hours, tasks }
        const rawWeekly = (data.weeklyActivity || []) as Array<{ date: string; hours: number; tasks: number }>
        const mappedWeekly: WeeklyActivity[] = rawWeekly.map((w) => ({
          day: dateToDayAbbr(w.date),
          hours: w.hours,
          tasks: w.tasks,
        }))
        setWeeklyActivity(mappedWeekly)

        // Map categoryDistribution with colors
        const rawCats = (data.categoryDistribution || []) as Array<{ category: string; hours: number }>
        const mappedCats: CategoryData[] = rawCats.map((c, i) => ({
          category: c.category,
          hours: c.hours,
          color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        }))
        setCategoryDistribution(mappedCats)

        // Map keyMetrics
        const m = data.keyMetrics || {}
        const totalSessions = m.totalSessions || 0
        const totalStudyHours = m.totalStudyHours || 0
        const avgSession = totalSessions > 0 ? (totalStudyHours / totalSessions).toFixed(1) : '0'
        const mappedMetrics: KeyMetric[] = [
          {
            icon: Clock,
            value: `${totalStudyHours}h`,
            label: 'Total Learning Hours',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-700',
          },
          {
            icon: TrendingUp,
            value: `${m.thisWeekHours || 0}h`,
            label: 'This Week',
            trend: (m.thisWeekHours || 0) > 0 ? { value: '23%', positive: true } : undefined,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-700',
          },
          {
            icon: BookOpen,
            value: `${avgSession}h`,
            label: 'Avg Session',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
          },
          {
            icon: Target,
            value: `${m.skillsImproved || 0}`,
            label: 'Skills Improved',
            trend: (m.skillsImproved || 0) > 0 ? { value: '12%', positive: true } : undefined,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
          },
          {
            icon: CheckCircle,
            value: `${totalSessions}`,
            label: 'Tasks Completed',
            trend: totalSessions > 0 ? { value: '8%', positive: true } : undefined,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
          },
          {
            icon: Flame,
            value: `${m.currentStreak || 0} days`,
            label: 'Learning Streak',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
          },
        ]
        setKeyMetrics(mappedMetrics)
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mounted, user?.id])

  const maxCategoryHours = categoryDistribution.length > 0 ? Math.max(...categoryDistribution.map((c) => c.hours)) : 1
  const totalCategoryHours = categoryDistribution.reduce((sum, c) => sum + c.hours, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <BarChart3 className="h-4.5 w-4.5 text-gray-700" />
            </div>
            <CardTitle className="text-base">Learning Analytics</CardTitle>
          </div>
          <CardAction>
            <Tabs value={timePeriod} onValueChange={setTimePeriod}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-2.5 h-7">
                  This Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2.5 h-7">
                  This Month
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2.5 h-7">
                  All Time
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 pt-0">
          {loading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {keyMetrics.map((metric, i) => (
              <MetricCard key={metric.label} metric={metric} index={i} />
            ))}
          </div>

          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">Weekly Activity</h3>
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-700" />
                  <span className="text-[11px] text-muted-foreground">Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-[11px] text-muted-foreground">Tasks</span>
                </div>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyActivity}
                  margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
                  barGap={3}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    dy={6}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v: number) => `${v}h`}
                    width={32}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                  <Bar
                    dataKey="hours"
                    name="hours"
                    fill="#171717"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="tasks"
                    name="tasks"
                    fill="#9ca3af"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h3>
            <div className="flex flex-col gap-2.5">
              {categoryDistribution.length > 0 ? categoryDistribution.map((cat, i) => (
                <CategoryBar
                  key={cat.category}
                  data={cat}
                  maxHours={maxCategoryHours}
                  index={i}
                />
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No category data yet</p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-xs font-medium text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">{totalCategoryHours}h</span>
            </div>
          </motion.div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
