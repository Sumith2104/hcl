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
      `SELECT * FROM notification WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at DESC LIMIT 50`
    )

    const notifications = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ notifications })
  } catch (error) {
    const err = dbError(error, 'GetNotifications')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json()
    const { userId, notificationId, isRead, markAllRead } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (markAllRead) {
      await fb.fluxbase.execute(
        `UPDATE notification SET is_read = TRUE WHERE user_id = '${fb.escapeSql(userId)}' AND is_read = FALSE`
      )
    } else {
      if (!notificationId) {
        return NextResponse.json(
          { error: 'notificationId is required' },
          { status: 400 }
        )
      }
      const readVal = isRead !== undefined ? (isRead ? 'TRUE' : 'FALSE') : 'TRUE'
      await fb.fluxbase.execute(
        `UPDATE notification SET is_read = ${readVal} WHERE id = '${fb.escapeSql(notificationId)}' AND user_id = '${fb.escapeSql(userId)}'`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const err = dbError(error, 'UpdateNotifications')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
