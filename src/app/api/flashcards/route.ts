import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { seedFlashcards } from '@/lib/seed-data'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check if table has data
    const countRows = await fb.fluxbase.query(
      'SELECT COUNT(*) as cnt FROM flashcard'
    )
    const count = Number(countRows[0]?.cnt ?? 0)

    if (count === 0) {
      await seedFlashcards(fb)
    }

    const rows = await fb.fluxbase.query(
      'SELECT * FROM flashcard ORDER BY category'
    )

    const flashcards = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      category: r.category,
      question: r.question,
      answer: r.answer,
      difficulty: r.difficulty,
    }))

    return NextResponse.json({ flashcards })
  } catch (error) {
    const err = dbError(error, 'GetFlashcards')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
