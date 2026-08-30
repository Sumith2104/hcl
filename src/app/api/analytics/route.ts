import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const escaped = fb.escapeSql(userId)

    // Date boundaries
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = `${dateStr(weekAgo)} 00:00:00`

    // Fetch all needed data in parallel
    const [allSessions, userSkills, progressRows] = await Promise.all([
      fb.fluxbase.query(
        `SELECT * FROM StudySession WHERE user_id = '${escaped}' ORDER BY created_at DESC`
      ),
      fb.fluxbase.query(
        `SELECT * FROM UserSkill WHERE user_id = '${escaped}'`
      ),
      fb.fluxbase.query(
        `SELECT * FROM Progress WHERE user_id = '${escaped}' ORDER BY created_at DESC`
      ),
    ])

    const sessions = allSessions as Record<string, unknown>[]

    // --- weeklyActivity ---
    const weekMap = new Map<string, { hours: number; tasks: number }>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo)
      d.setDate(d.getDate() + i)
      weekMap.set(dateStr(d), { hours: 0, tasks: 0 })
    }
    for (const s of sessions) {
      const createdAt = s.createdAt as string
      if (!createdAt) continue
      const dayKey = dateStr(new Date(createdAt))
      const entry = weekMap.get(dayKey)
      if (entry) {
        entry.hours += (s.duration as number || 0) / 60
        entry.tasks += 1
      }
    }
    const weeklyActivity = Array.from(weekMap.entries()).map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 100) / 100,
      tasks: data.tasks,
    }))

    // --- categoryDistribution ---
    const catMap = new Map<string, number>()
    for (const s of sessions) {
      const category = (s.skillName as string) || 'Uncategorized'
      catMap.set(category, (catMap.get(category) || 0) + (s.duration as number || 0) / 60)
    }
    const categoryDistribution = Array.from(catMap.entries()).map(([category, hours]) => ({
      category,
      hours: Math.round(hours * 100) / 100,
    }))

    // --- keyMetrics ---
    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration as number || 0), 0)
    const totalStudyHours = Math.round((totalDuration / 60) * 100) / 100

    const weekSessions = sessions.filter(
      (s) => new Date(s.createdAt as string) >= weekAgo
    )
    const thisWeekHours =
      Math.round(
        (weekSessions.reduce((acc, s) => acc + (s.duration as number || 0), 0) / 60) * 100
      ) / 100

    const skillsImproved = (userSkills as Record<string, unknown>[]).filter(
      (us) =>
        (us.proficiencyLevel as string) !== 'beginner' ||
        (us.confidenceScore as number) > 0.7
    ).length

    // currentStreak: count consecutive days with activity ending today
    const sessionDates = new Set<string>()
    for (const s of sessions) {
      sessionDates.add(dateStr(new Date(s.createdAt as string)))
    }
    let currentStreak = 0
    const checkDate = new Date(today)
    // Allow today to count even if no session yet (streak not broken)
    while (true) {
      const key = dateStr(checkDate)
      if (sessionDates.has(key)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    const totalSessions = sessions.length

    const progressList = progressRows as Record<string, unknown>[]
    const roadmapProgress =
      progressList.length > 0
        ? Math.round(
            (progressList.reduce(
              (acc, p) => acc + (p.completionPercentage as number || 0),
              0
            ) /
              progressList.length) *
              100
          ) / 100
        : 0

    const keyMetrics = {
      totalStudyHours,
      thisWeekHours,
      skillsImproved,
      currentStreak,
      totalSessions,
      roadmapProgress,
    }

    // --- progressHistory ---
    const weekProgressMap = new Map<string, number[]>()
    for (const p of progressList) {
      const createdAt = p.createdAt as string
      if (!createdAt) continue
      const d = new Date(createdAt)
      // Week key: Monday of that week (ISO week)
      const dayOfWeek = d.getUTCDay()
      const monday = new Date(d)
      monday.setUTCDate(d.getUTCDate() - ((dayOfWeek + 6) % 7))
      const weekKey = dateStr(monday)
      if (!weekProgressMap.has(weekKey)) {
        weekProgressMap.set(weekKey, [])
      }
      weekProgressMap.get(weekKey)!.push(p.completionPercentage as number || 0)
    }
    const progressHistory = Array.from(weekProgressMap.entries())
      .map(([week, percentages]) => ({
        week,
        progress:
          Math.round(
            (percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100
          ) / 100,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    return NextResponse.json({
      weeklyActivity,
      categoryDistribution,
      keyMetrics,
      progressHistory,
    })
  } catch (error) {
    const err = dbError(error, 'GetAnalytics')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
