import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const messages = await fb.fluxbase.query(`SELECT * FROM ChatMessage WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at ASC`)

    return NextResponse.json({ messages })
  } catch (error) {
    const err = dbError(error, 'GetChatHistory')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
