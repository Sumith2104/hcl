import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { findTopKMatches, rankResourcesContextualBandit, type LearnerContext } from '@/lib/ai-engine'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    const query = req.nextUrl.searchParams.get('query')
    const style = req.nextUrl.searchParams.get('style') || 'mixed'
    const level = req.nextUrl.searchParams.get('level') || 'intermediate'

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

    let resources = resourceRows.map((row: Record<string, unknown>) => {
      const rawType = (row.type as string) || ''
      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        url: row.url as string,
        type: knownTypes.has(rawType) ? rawType : 'tool',
        difficulty: (row.difficulty as string) || 'beginner',
        estimatedHours: Number(row.estimatedHours || 2.0),
        qualityScore: Number(row.qualityScore || 0.8),
      }
    })

    // Apply Neural Semantic Vector Search if search query is present
    if (query && query.trim().length > 0) {
      const context: LearnerContext = {
        targetGoal: query,
        experienceLevel: level as any,
        preferredStyle: style as any,
        hoursPerWeek: 10
      }
      const ranked = rankResourcesContextualBandit(query, context, resources, 20)
      resources = ranked.map(r => ({
        ...r.resource,
        mlScore: r.score,
        semanticSimilarity: r.semanticSimilarity,
        recommendationReason: r.reason
      }))
    }

    return NextResponse.json({ resources, bookmarkedIds })
  } catch (error) {
    const err = dbError(error, 'GetResources')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

