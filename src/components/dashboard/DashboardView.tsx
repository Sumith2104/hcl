'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore, type AppNotification, type NotificationType as AppNotificationType, type EarnedAchievement } from '@/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Target, TrendingUp, Clock, BookOpen, CheckCircle2,
  ArrowRight, Sparkles, Map, RefreshCw, Zap, Flame, Award,
  Keyboard, LayoutDashboard, BarChart3, Compass, BookMarked, Activity, GitBranch, Brain, Users, Gamepad2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// Lazy-load non-overview panels - they only load when tab is opened
const DailyTipsPanel = dynamic(() => import('./DailyTipsPanel').then(m => ({ default: m.DailyTipsPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card> })
const WeeklySummaryCard = dynamic(() => import('./WeeklySummaryCard').then(m => ({ default: m.WeeklySummaryCard })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card> })
const AchievementsPanel = dynamic(() => import('./AchievementsPanel').then(m => ({ default: m.AchievementsPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card> })
const NotesPanel = dynamic(() => import('./NotesPanel').then(m => ({ default: m.NotesPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const LeaderboardPanel = dynamic(() => import('./LeaderboardPanel').then(m => ({ default: m.LeaderboardPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const PomodoroTimer = dynamic(() => import('./PomodoroTimer').then(m => ({ default: m.PomodoroTimer })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6 flex items-center justify-center"><Skeleton className="h-48 w-48 rounded-full" /></CardContent></Card> })
const SkillExplorerPanel = dynamic(() => import('./SkillExplorerPanel'), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card> })
const LearningAnalyticsPanel = dynamic(() => import('./LearningAnalyticsPanel').then(m => ({ default: m.LearningAnalyticsPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card> })
const GoalTrackerPanel = dynamic(() => import('./GoalTrackerPanel').then(m => ({ default: m.GoalTrackerPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const ResourceLibraryPanel = dynamic(() => import('./ResourceLibraryPanel').then(m => ({ default: m.ResourceLibraryPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const ActivityHeatmap = dynamic(() => import('./ActivityHeatmap').then(m => ({ default: m.ActivityHeatmap })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card> })
const SkillRecommendationsPanel = dynamic(() => import('./SkillRecommendationsPanel').then(m => ({ default: m.SkillRecommendationsPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const StudySessionLogger = dynamic(() => import('./StudySessionLogger').then(m => ({ default: m.StudySessionLogger })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })
const SkillTreeVisualization = dynamic(() => import('./SkillTreeVisualization').then(m => ({ default: m.SkillTreeVisualization })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card> })
const FlashcardStudyTool = dynamic(() => import('./FlashcardStudyTool').then(m => ({ default: m.FlashcardStudyTool })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card> })
const QuizChallengePanel = dynamic(() => import('./QuizChallengePanel').then(m => ({ default: m.QuizChallengePanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card> })
const CommunityFeedPanel = dynamic(() => import('./CommunityFeedPanel').then(m => ({ default: m.CommunityFeedPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card> })
const StreakCalendarPanel = dynamic(() => import('./StreakCalendarPanel').then(m => ({ default: m.StreakCalendarPanel })), { loading: () => <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card> })

const proficiencyMap: Record<string, number> = {
  beginner: 25, intermediate: 50, advanced: 75, expert: 100,
}
const proficiencyLabels: Record<string, string> = {
  beginner: 'BEG', intermediate: 'INT', advanced: 'ADV', expert: 'EXP',
}
const proficiencyColors: Record<string, string> = {
  beginner: 'bg-neutral-100', intermediate: 'bg-neutral-100', advanced: 'bg-neutral-100', expert: 'bg-neutral-100',
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function DashboardView() {
  const { user, setView, dashboardStats, setDashboardStats, profile, setRoadmapLoading, earnedAchievements, streakData, setStreakData, setNotifications, setEarnedAchievements } = useAppStore()
  const [userSkills, setUserSkills] = useState<any[]>([])
  const [dashboardTab, setDashboardTab] = useState('overview')
  const [progressHistory, setProgressHistory] = useState<Array<{ week: string; progress: number }>>([])
  const mounted = useIsMounted()

  // Load dashboard data in background - NO blocking spinner
  useEffect(() => {
    if (!user?.id) return
    loadDashboard()
  }, [user?.id])

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return

    // Fire all requests with 8s timeout - don't block on failures
    const [profileRes, roadmapRes, streakRes, notifRes, achRes] = await Promise.all([
      fetchWithTimeout(`/api/profile?userId=${user.id}`),
      fetchWithTimeout(`/api/roadmap?userId=${user.id}`),
      fetchWithTimeout(`/api/streak?userId=${user.id}`),
      fetchWithTimeout(`/api/notifications?userId=${user.id}`).catch(() => null),
      fetchWithTimeout(`/api/achievements?userId=${user.id}`).catch(() => null),
    ])

    // Process profile
    if (profileRes?.ok) {
      try {
        const profileData = await profileRes.json()
        if (profileData.userSkills) setUserSkills(profileData.userSkills)
      } catch { /* ignore */ }
    }

    // Process roadmap
    if (roadmapRes?.ok) {
      try {
        const roadmapData = await roadmapRes.json()
        if (roadmapData.roadmap) {
          const items = roadmapData.roadmap.items || []
          const completed = items.filter((i: any) => i.status === 'completed').length
          const total = items.length
          const phases = Math.max(...items.map((i: any) => i.phase), 0)
          const currentPhaseItem = items.find((i: any) => i.status === 'in_progress') ||
            items.find((i: any) => i.status === 'available')
          setDashboardStats({
            overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
            currentPhase: currentPhaseItem?.phase || 1,
            totalPhases: phases,
            completedItems: completed,
            totalItems: total,
            currentSkill: currentPhaseItem?.title || 'Not started',
            nextMilestone: currentPhaseItem?.milestone || '',
            weeklyGoal: 10,
            weeklyProgress: Math.round((completed / Math.max(1, total)) * 10),
          })
        }
      } catch { /* ignore */ }
    }

    // Process streak
    if (streakRes?.ok) {
      try {
        const streakDataResult = await streakRes.json()
        setStreakData(streakDataResult)
      } catch { /* ignore */ }
    }

    // Process notifications
    if (notifRes?.ok) {
      try {
        const notifData = await notifRes.json()
        if (notifData.notifications && Array.isArray(notifData.notifications)) {
          const mapped: AppNotification[] = notifData.notifications.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            type: (n.type as AppNotificationType) || 'system',
            title: n.title as string,
            description: (n.description as string) || '',
            timestamp: new Date(n.createdAt as string),
            read: (n.isRead as boolean) || false,
          }))
          setNotifications(mapped)
        }
      } catch { /* ignore */ }
    }

    // Process achievements
    if (achRes?.ok) {
      try {
        const achData = await achRes.json()
        if (achData.earnedAchievements && Array.isArray(achData.earnedAchievements)) {
          const mapped: EarnedAchievement[] = achData.earnedAchievements.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            achievementId: a.achievementId as string,
            earnedAt: new Date(a.earnedAt as string),
          }))
          setEarnedAchievements(mapped)
        }
      } catch { /* ignore */ }
    }
  }, [user?.id, setDashboardStats, setStreakData, setNotifications, setEarnedAchievements])

  // Load analytics separately (lower priority)
  useEffect(() => {
    if (!mounted || !user?.id) return
    let cancelled = false
    fetch(`/api/analytics?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const raw = (data.progressHistory || []) as Array<{ week: string; progress: number }>
        setProgressHistory(raw.map((item) => ({
          week: formatWeekLabel(item.week),
          progress: item.progress,
        })))
      })
      .catch(() => { /* silent */ })
    return () => { cancelled = true }
  }, [mounted, user?.id])

  const handleGenerateRoadmap = async () => {
    setRoadmapLoading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120_000)
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, profile }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success(`Roadmap generated: ${data.phasesCount} phases, ${data.skillsCount} skills`)
      loadDashboard()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('Generation timed out. Please try again.')
      } else {
        toast.error('Failed to generate roadmap. Please try again.')
      }
    }
    finally { setRoadmapLoading(false) }
  }

  const hasRoadmap = dashboardStats.totalItems > 0

  const statCards = [
    { label: 'Overall Progress', value: `${dashboardStats.overallProgress}%`, icon: TrendingUp, color: 'text-neutral-900' },
    { label: 'Current Phase', value: `${dashboardStats.currentPhase} / ${dashboardStats.totalPhases || '?'}`, icon: Target, color: 'text-neutral-700' },
    { label: 'Items Completed', value: `${dashboardStats.completedItems} / ${dashboardStats.totalItems}`, icon: CheckCircle2, color: 'text-neutral-700' },
    { label: 'Weekly Goal', value: `${dashboardStats.weeklyProgress}h / ${dashboardStats.weeklyGoal}h`, icon: Clock, color: 'text-neutral-700' },
  ]

  const radarData = userSkills.slice(0, 8).map((us: any) => ({
    skill: us.skill?.name || us.skillName || 'Unknown',
    proficiency: proficiencyMap[us.proficiencyLevel] || 25,
    fullMark: 100,
  }))

  // NO loading guard - render immediately!
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 mb-8 shadow-sm overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-600">
                {hasRoadmap
                  ? `Current focus: ${dashboardStats.currentSkill}`
                  : profile?.targetGoal
                  ? `Goal: ${profile.targetGoal}. Let's create your learning path!`
                  : 'Let\'s start your learning journey!'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 border border-gray-200">
                <Award className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">{earnedAchievements.length}/12</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 border border-gray-200">
                <Flame className={`h-4 w-4 ${streakData && streakData.streak > 0 ? 'text-gray-700 animate-flame' : 'text-gray-300'}`} />
                <span className="text-xs font-medium text-gray-700">{streakData && streakData.streak > 0 ? `${streakData.streak} day streak` : 'Start your streak!'}</span>
              </div>
              {!hasRoadmap && profile?.targetGoal && (
                <Button onClick={handleGenerateRoadmap} variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Roadmap
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keyboard shortcut hint */}
      <KeyboardShortcutHint />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="h-full bg-white/60 backdrop-blur-xl border border-white/40 transition-all duration-300 hover:-translate-y-0.5 press-scale shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold stat-value">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="w-full">
        <TabsList className="mb-8 h-auto p-0 bg-transparent border-0 rounded-none w-fit mx-auto lg:mx-0 gap-1 border-b border-gray-200">
          <TabsTrigger value="overview" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explore Skills</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <BookMarked className="h-4 w-4" />
            <span className="hidden sm:inline">Resources & Goals</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Study Tools</span>
          </TabsTrigger>
          <TabsTrigger value="skilltree" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Skill Tree</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Community</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2 rounded-none px-4 py-2.5 text-sm text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-b-transparent data-[state=active]:border-b-gray-900 data-[state=active]:-mb-px">
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 space-y-6">
          <div className="grid gap-6 lg:grid-cols-5 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
              <DailyTipsPanel />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3">
              <Card className="h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">Learning Progress</CardTitle>
                    {hasRoadmap && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setView('roadmap')}>
                        View Roadmap <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasRoadmap ? (
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Phase {dashboardStats.currentPhase} Progress</span>
                          <span className="text-sm font-medium">{dashboardStats.overallProgress}%</span>
                        </div>
                        <Progress value={dashboardStats.overallProgress} className="h-3" />
                      </div>
                      {dashboardStats.nextMilestone && (
                        <div className="rounded-lg bg-muted/80 p-4 mt-4 mb-6 border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-neutral-700" />
                            <span className="text-sm font-medium">Next Milestone</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{dashboardStats.nextMilestone}</p>
                        </div>
                      )}
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Progress Over Time</h3>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progressHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#171717" stopOpacity={0.02} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} />
                              <YAxis tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'oklch(1 0 0)',
                                  border: '1px solid oklch(0.922 0 0)',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                                labelStyle={{ color: 'oklch(0.145 0 0)', fontWeight: 600 }}
                                formatter={(value: number) => [`${value}%`, 'Progress']}
                              />
                              <Area
                                type="monotone"
                                dataKey="progress"
                                stroke="#171717"
                                strokeWidth={2}
                                fill="url(#progressGradient)"
                                dot={{ r: 3, fill: '#171717', strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#171717', strokeWidth: 2, stroke: '#fff' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg viewBox="0 0 240 120" className="w-60 h-auto mx-auto mb-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 90 Q60 90 80 60 Q100 30 120 50 Q140 70 160 40 Q180 10 210 30" stroke="oklch(0.55 0 0)" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
                        <circle cx="30" cy="90" r="10" fill="oklch(0.4 0 0)" />
                        <path d="M25 90 L29 94 L36 86" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <circle cx="80" cy="60" r="10" fill="oklch(0.4 0 0)" />
                        <path d="M75 60 L79 64 L86 56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <circle cx="120" cy="50" r="12" fill="oklch(0.4 0 0)" opacity="0.2" />
                        <circle cx="120" cy="50" r="10" fill="oklch(0.4 0 0)" />
                        <circle cx="120" cy="50" r="4" fill="white" />
                        <circle cx="160" cy="40" r="10" fill="oklch(0.8 0 0)" stroke="oklch(0.55 0 0)" strokeWidth="2" />
                        <circle cx="210" cy="30" r="10" fill="oklch(0.8 0 0)" stroke="oklch(0.55 0 0)" strokeWidth="2" />
                        <text x="30" y="112" textAnchor="middle" className="text-[9px]" fill="oklch(0.556 0 0)">Basics</text>
                        <text x="80" y="82" textAnchor="middle" className="text-[9px]" fill="oklch(0.556 0 0)">Skills</text>
                        <text x="120" y="72" textAnchor="middle" className="text-[9px]" fill="oklch(0.556 0 0)">You</text>
                        <text x="160" y="62" textAnchor="middle" className="text-[9px]" fill="oklch(0.8 0 0)">Advanced</text>
                        <text x="210" y="52" textAnchor="middle" className="text-[9px]" fill="oklch(0.8 0 0)">Expert</text>
                      </svg>
                      <h3 className="text-lg font-semibold mb-2">Your Learning Path Awaits</h3>
                      <p className="text-muted-foreground mb-5 max-w-sm mx-auto">Complete onboarding to generate a personalized roadmap that adapts to your goals and pace.</p>
                      <Button onClick={() => profile?.targetGoal ? handleGenerateRoadmap() : setView('onboarding')} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        {profile?.targetGoal ? 'Generate Roadmap' : 'Start Onboarding'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* AI Weekly Summary */}
          <WeeklySummaryCard />

          {/* Achievements Panel */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <AchievementsPanel userSkills={userSkills} />
          </motion.div>

          {/* Three-column layout: Notes | Radar | Leaderboard */}
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <NotesPanel />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-900">Skill Proficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  {radarData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="oklch(0.8 0 0 / 40%)" />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'oklch(0.7 0 0)' }} tickFormatter={(v: number) => `${v}`} />
                          <Radar name="Proficiency" dataKey="proficiency" stroke="#404040" fill="#171717" fillOpacity={0.25} strokeWidth={2} />
                          <Tooltip contentStyle={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.922 0 0)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`${value}/100`, 'Proficiency']} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-center">
                      <div>
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">Add skills in your profile to see your proficiency radar.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <LeaderboardPanel />
            </motion.div>
          </div>

          {/* Bottom section: Quick Actions + Pomodoro Timer */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => setView('roadmap')}>
                    <Map className="h-4 w-4 text-neutral-900" />
                    <div className="text-left">
                      <div className="text-sm font-medium">View Roadmap</div>
                      <div className="text-xs text-muted-foreground">See your learning path</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => setView('assistant')}>
                    <Sparkles className="h-4 w-4 text-neutral-700" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Ask AI Mentor</div>
                      <div className="text-xs text-muted-foreground">Get help with your learning</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => setView('profile')}>
                    <BookOpen className="h-4 w-4 text-neutral-700" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Update Skills</div>
                      <div className="text-xs text-muted-foreground">Add new skills you've learned</div>
                    </div>
                  </Button>
                  {hasRoadmap && (
                    <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={handleGenerateRoadmap}>
                      <RefreshCw className="h-4 w-4 text-neutral-700" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Regenerate Roadmap</div>
                        <div className="text-xs text-muted-foreground">Create a fresh learning path</div>
                      </div>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <PomodoroTimer />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                    Your Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userSkills.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {userSkills.slice(0, 10).map((us: any, idx: number) => {
                        const level = us.proficiencyLevel || 'beginner'
                        const dotColor = proficiencyColors[level] || 'bg-neutral-100'
                        const levelLabel = proficiencyLabels[level] || 'BEG'
                        return (
                          <div key={us.id || idx} className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
                            <span className="text-sm text-foreground flex-1 truncate">
                              {us.skill?.name || us.skillName || 'Unknown'}
                            </span>
                            <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5 bg-neutral-100 text-neutral-700">
                              {levelLabel}
                            </span>
                          </div>
                        )
                      })}
                      {userSkills.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">+{userSkills.length - 10} more skills</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No skills yet. Go to Profile to add your first skill.</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setView('profile')}>
                        <BookOpen className="h-3.5 w-3.5" />
                        Add Skills
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Streak + Goals + Recommendations row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}>
              <ActivityHeatmap />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.76 }}>
              <GoalTrackerPanel />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <SkillRecommendationsPanel />
            </motion.div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <LearningAnalyticsPanel />
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <AchievementsPanel userSkills={userSkills} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <LeaderboardPanel />
            </motion.div>
          </div>
        </TabsContent>

        {/* Skills Explorer Tab */}
        <TabsContent value="skills" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SkillExplorerPanel />
          </motion.div>
        </TabsContent>

        {/* Resources & Goals Tab */}
        <TabsContent value="resources" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GoalTrackerPanel />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ResourceLibraryPanel />
            </motion.div>
          </div>
        </TabsContent>

        {/* Activity & Sessions Tab */}
        <TabsContent value="activity" className="mt-0 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ActivityHeatmap />
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StudySessionLogger />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SkillRecommendationsPanel />
            </motion.div>
          </div>
        </TabsContent>

        {/* Study Tools Tab */}
        <TabsContent value="study" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <FlashcardStudyTool />
          </motion.div>
        </TabsContent>

        {/* Skill Tree Tab */}
        <TabsContent value="skilltree" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SkillTreeVisualization />
          </motion.div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="mt-0 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CommunityFeedPanel />
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StreakCalendarPanel />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <LeaderboardPanel />
            </motion.div>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-0 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <QuizChallengePanel />
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <AchievementsPanel userSkills={userSkills} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StreakCalendarPanel />
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Keyboard Shortcut Hint
function KeyboardShortcutHint() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mb-6">
      <div className="flex items-center justify-between rounded-lg border border-gray-200/60 bg-white/40 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Keyboard className="h-4 w-4" />
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-xs font-mono">Ctrl+K</kbd>{' '}
            AI Assistant ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-xs font-mono">Ctrl+1-4</kbd>{' '}
            Navigate
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss">
          Dismiss
        </button>
      </div>
    </motion.div>
  )
}
