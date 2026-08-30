import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export interface StreakResponse {
  streak: number
  longestStreak: number
  activeDays: number
  thisWeekActive: number
  streakHistory: { date: string; active: boolean }[]
}

export async function GET(request: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch all progress records for this user, ordered by createdAt
    const progressRecords = await fb.fluxbase.query(`SELECT created_at FROM Progress WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at ASC`)

    // Build a set of unique active dates (YYYY-MM-DD strings)
    const activeDateSet = new Set<string>()
    for (const record of progressRecords) {
      const date = new Date(record.createdAt as string)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      activeDateSet.add(dateStr)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    // Calculate current streak: consecutive days ending today or yesterday
    let streak = 0
    let startDate = new Date(today)

    // Check if today is active. If not, check if yesterday is active (streak can still continue from yesterday)
    if (activeDateSet.has(todayStr)) {
      streak = 1
    } else if (activeDateSet.has(yesterdayStr)) {
      streak = 1
      startDate = yesterday
    } else {
      // No streak
      startDate = new Date(0)
    }

    // Count consecutive days backwards
    if (streak > 0) {
      let checkDate = new Date(startDate)
      checkDate.setDate(checkDate.getDate() - 1)
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        if (activeDateSet.has(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Calculate longest streak from all active dates
    let longestStreak = streak
    if (activeDateSet.size > 0) {
      const sortedDates = Array.from(activeDateSet).sort()
      let currentRun = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          currentRun++
        } else {
          longestStreak = Math.max(longestStreak, currentRun)
          currentRun = 1
        }
      }
      longestStreak = Math.max(longestStreak, currentRun)
    }

    // Total active days
    const activeDays = activeDateSet.size

    // This week active days (Monday to Sunday of current week)
    const dayOfWeek = today.getDay()
    // Adjust for Monday-based week: Sunday=6, Monday=0, etc.
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(monday.getDate() - mondayOffset)

    let thisWeekActive = 0
    for (let d = 0; d < 7; d++) {
      const checkDay = new Date(monday)
      checkDay.setDate(checkDay.getDate() + d)
      const dateStr = `${checkDay.getFullYear()}-${String(checkDay.getMonth() + 1).padStart(2, '0')}-${String(checkDay.getDate()).padStart(2, '0')}`
      if (activeDateSet.has(dateStr)) {
        thisWeekActive++
      }
    }

    // Build 30-day streak history
    const streakHistory: { date: string; active: boolean }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      streakHistory.push({
        date: dateStr,
        active: activeDateSet.has(dateStr),
      })
    }

    const response: StreakResponse = {
      streak,
      longestStreak,
      activeDays,
      thisWeekActive,
      streakHistory,
    }

    return NextResponse.json(response)
  } catch (error) {
    const err = dbError(error, 'GetStreak')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
