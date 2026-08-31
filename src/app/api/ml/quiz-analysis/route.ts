import { NextRequest, NextResponse } from 'next/server'
import { mlScoreQuizPerformance, type MLQuizScoring } from '@/lib/ml-engine'

interface QuizResult {
  isCorrect: boolean
  timeTaken: number
  category: string
  difficulty?: string
}

interface QuizAnalysisBody {
  results: QuizResult[]
  currentElo: number
  averageTime: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as QuizAnalysisBody
    const { results, currentElo, averageTime } = body

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'results array with at least one item is required' },
        { status: 400 },
      )
    }

    if (currentElo === undefined || averageTime === undefined) {
      return NextResponse.json(
        { error: 'currentElo and averageTime are required' },
        { status: 400 },
      )
    }

    const scoring: MLQuizScoring = await mlScoreQuizPerformance({
      results: results.map(r => ({
        isCorrect: Boolean(r.isCorrect),
        timeTaken: Number(r.timeTaken),
        category: String(r.category),
        difficulty: r.difficulty ? String(r.difficulty) : undefined,
      })),
      totalQuestions: results.length,
      currentElo: Number(currentElo),
      averageTime: Number(averageTime),
    })

    return NextResponse.json(scoring)
  } catch (error) {
    console.error('[MLQuizAnalysis]', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `ML quiz analysis failed: ${msg}` },
      { status: 500 },
    )
  }
}
