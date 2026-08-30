import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const sessions = await fb.fluxbase.query(`SELECT * FROM StudySession WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at DESC LIMIT 50`)

    // Compute summary stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00:00`

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')} 00:00:00`

    const allSessions = await fb.fluxbase.query(`SELECT * FROM StudySession WHERE user_id = '${fb.escapeSql(userId)}'`)

    const todayMinutes = allSessions
      .filter((s: Record<string, unknown>) => new Date(s.createdAt as string) >= today)
      .reduce((acc, s) => acc + (s.duration as number), 0)

    const weekMinutes = allSessions
      .filter((s: Record<string, unknown>) => new Date(s.createdAt as string) >= weekAgo)
      .reduce((acc, s) => acc + (s.duration as number), 0)

    const totalMinutes = allSessions.reduce((acc, s) => acc + (s.duration as number), 0)

    return NextResponse.json({
      sessions,
      stats: {
        totalSessions: allSessions.length,
        todayMinutes,
        weekMinutes,
        totalMinutes,
      },
    })
  } catch (error) {
    const err = dbError(error, 'GetStudySessions')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { userId, skillName = '', duration = 0, notes = '', type = 'focus' } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const rows = await fb.fluxbase.run(`INSERT INTO StudySession (id, user_id, skill_name, duration, notes, type, created_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(skillName)}', ${duration}, '${fb.escapeSql(notes)}', '${fb.escapeSql(type)}', CURRENT_TIMESTAMP) RETURNING *`)

    return NextResponse.json({ session: rows[0] }, { status: 201 })
  } catch (error) {
    const err = dbError(error, 'CreateStudySession')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Session id is required' }, { status: 400 })
    }

    await fb.fluxbase.execute(`DELETE FROM StudySession WHERE id = '${fb.escapeSql(id)}'`)
    return NextResponse.json({ success: true })
  } catch (error) {
    const err = dbError(error, 'DeleteStudySession')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
