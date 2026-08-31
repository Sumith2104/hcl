import { NextRequest, NextResponse } from 'next/server'
import { mlGeneratePersonalizedTip, type MLTip } from '@/lib/ml-engine'

interface TipsBody {
  userId: string
  currentSkill?: string
  currentPhase?: string
  goal?: string
  learningStyle?: string
  streakDays?: number
  overallProgress?: number
  recentStruggles?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TipsBody
    const {
      userId,
      currentSkill,
      currentPhase,
      goal,
      learningStyle,
      streakDays,
      overallProgress,
      recentStruggles,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      )
    }

    const tip: MLTip = await mlGeneratePersonalizedTip({
      userId,
      currentSkill,
      currentPhase,
      goal,
      recentStruggles,
      learningStyle,
      streakDays,
      overallProgress,
    })

    return NextResponse.json({ tip })
  } catch (error) {
    console.error('[MLTips]', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `ML tip generation failed: ${msg}` },
      { status: 500 },
    )
  }
}
