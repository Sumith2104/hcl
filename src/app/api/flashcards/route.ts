import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { seedFlashcards } from '@/lib/seed-data'
import { scheduleNextReview, calculateRetrievability, type ReviewGrade } from '@/lib/ml/spaced-repetition'

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cardId, grade, currentState } = body as {
      cardId: string
      grade: ReviewGrade
      currentState?: { stability?: number; difficulty?: number; reps?: number; lapses?: number; lastReview?: string }
    }

    if (!cardId || !grade) {
      return NextResponse.json({ error: 'cardId and grade (1-4) are required' }, { status: 400 })
    }

    const now = new Date()
    const updatedState = scheduleNextReview(
      currentState ? {
        ...currentState,
        lastReview: currentState.lastReview ? new Date(currentState.lastReview) : now
      } : {},
      grade,
      now
    )

    const retrievability = calculateRetrievability(0, updatedState.stability)

    return NextResponse.json({
      cardId,
      memoryState: updatedState,
      retrievability: Number((retrievability * 100).toFixed(1)),
      intervalDays: Math.round(updatedState.stability)
    })
  } catch (error) {
    const err = dbError(error, 'ScheduleFlashcardReview')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

