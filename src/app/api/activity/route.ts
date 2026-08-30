import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count >= 4) return 4
  if (count >= 3) return 3
  if (count >= 2) return 2
  if (count >= 1) return 1
  return 0
}

export async function GET(request: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Calculate date range: last 90 days
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 89)
    startDate.setHours(0, 0, 0, 0)

    // Format dates for SQL
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00:00`
    const endDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59:59`

    // Fetch all progress records for this user within the date range
    const progressRecords = await fb.fluxbase.query(`SELECT created_at FROM Progress WHERE user_id = '${fb.escapeSql(userId)}' AND created_at >= '${startDateStr}' AND created_at <= '${endDateStr}'`)

    // Count progress entries per day
    const countByDate = new Map<string, number>()
    for (const record of progressRecords) {
      const dateStr = toDateStr(new Date(record.createdAt as string))
      countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1)
    }

    // Build the 90-day array
    const dates: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = toDateStr(date)
      const count = countByDate.get(dateStr) ?? 0
      dates.push({
        date: dateStr,
        count,
        level: countToLevel(count),
      })
    }

    return NextResponse.json({ dates })
  } catch (error) {
    const err = dbError(error, 'GetActivity')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
