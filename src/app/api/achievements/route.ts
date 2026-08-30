import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const rows = await fb.fluxbase.query(
      `SELECT * FROM user_achievement WHERE user_id = '${fb.escapeSql(userId)}'`
    )

    const earnedAchievements = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      achievementId: r.achievementId,
      earnedAt: r.earnedAt,
    }))

    return NextResponse.json({ earnedAchievements })
  } catch (error) {
    const err = dbError(error, 'GetAchievements')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { userId, achievementId } = body

    if (!userId || !achievementId) {
      return NextResponse.json(
        { error: 'userId and achievementId are required' },
        { status: 400 }
      )
    }

    const id = fb.qid()
    await fb.fluxbase.run(
      `INSERT INTO user_achievement (id, user_id, achievement_id, earned_at) VALUES (${id}, '${fb.escapeSql(userId)}', '${fb.escapeSql(achievementId)}', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    const err = dbError(error, 'UnlockAchievement')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
