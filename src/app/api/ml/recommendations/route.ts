import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase } from '@/lib/fluxbase-safe'
import { mlRecommendSkills, type MLSkillRecommendation } from '@/lib/ml-engine'

interface RecommendationsBody {
  userId: string
  goal: string
  experienceLevel: string
  learningStyle?: string
  maxRecommendations?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RecommendationsBody
    const {
      userId,
      goal,
      experienceLevel,
      learningStyle,
      maxRecommendations = 5,
    } = body

    if (!userId || !goal || !experienceLevel) {
      return NextResponse.json(
        { error: 'userId, goal, and experienceLevel are required' },
        { status: 400 },
      )
    }

    const fb = await getFluxbase()
    const { escapeSql } = fb

    // Fetch user skills via FluxBase
    const userSkillRows = await fb.fluxbase.query(`
      SELECT us.proficiency_level, s.name, s.category
      FROM UserSkill us
      JOIN Skill s ON us.skill_id = s.id
      WHERE us.user_id = '${escapeSql(userId)}'
    `)

    const userSkills = userSkillRows.map((row: Record<string, unknown>) => ({
      name: row.name as string,
      category: row.category as string,
      proficiencyLevel: row.proficiency_level as string,
    }))

    // Fetch all available skills via FluxBase
    const allSkillRows = await fb.fluxbase.query(`SELECT id, name, category, description, difficulty FROM Skill ORDER BY name ASC`)

    const availableSkills = allSkillRows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as string,
      description: row.description as string,
      difficulty: row.difficulty as string,
    }))

    const recommendations: MLSkillRecommendation[] = await mlRecommendSkills({
      userSkills,
      availableSkills,
      goal,
      experienceLevel,
      maxRecommendations,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('[MLRecommendations]', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `ML recommendations failed: ${msg}` },
      { status: 500 },
    )
  }
}
