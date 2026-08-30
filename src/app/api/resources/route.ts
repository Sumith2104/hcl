import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const resourceRows = await fb.fluxbase.query('SELECT * FROM Resource')
    const bookmarkRows = await fb.fluxbase.query(
      `SELECT resource_id FROM ResourceBookmark WHERE user_id = '${fb.escapeSql(userId)}'`
    )

    const bookmarkedIds: string[] = bookmarkRows.map(
      (row: Record<string, unknown>) => row.resourceId as string
    )

    const knownTypes = new Set(['course', 'video', 'article', 'tutorial', 'documentation', 'book', 'project'])

    const resources = resourceRows.map((row: Record<string, unknown>) => {
      const rawType = (row.type as string) || ''
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        url: row.url,
        type: knownTypes.has(rawType) ? rawType : 'tool',
        difficulty: row.difficulty,
        estimatedHours: row.estimatedHours,
        qualityScore: row.qualityScore,
      }
    })

    return NextResponse.json({ resources, bookmarkedIds })
  } catch (error) {
    const err = dbError(error, 'GetResources')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
