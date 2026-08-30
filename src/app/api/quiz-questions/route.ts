import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { seedQuizQuestions } from '@/lib/seed-data'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check if table has data
    const countRows = await fb.fluxbase.query(
      'SELECT COUNT(*) as cnt FROM quiz_question'
    )
    const count = Number(countRows[0]?.cnt ?? 0)

    if (count === 0) {
      await seedQuizQuestions(fb)
    }

    const rows = await fb.fluxbase.query(
      'SELECT * FROM quiz_question ORDER BY category, RANDOM()'
    )

    const questions = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      category: r.category,
      question: r.question,
      options: JSON.parse(r.options as string),
      correctAnswer: r.correctAnswer,
      explanation: r.explanation,
      difficulty: r.difficulty,
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    const err = dbError(error, 'GetQuizQuestions')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
