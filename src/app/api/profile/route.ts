import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

interface ProfileBody {
  userId: string
  targetGoal: string
  experienceLevel?: string
  availableHoursPerWeek?: number
  preferredLearningStyle?: string
  interests?: string[]
  targetDurationWeeks?: number | null
  currentSkills?: { skill: string; level: string }[]
}

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (profileRows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const profile = profileRows[0]

    const userSkills = await fb.fluxbase.query(`SELECT us.*, s.id as skill_id, s.name as skill_name, s.category as skill_category, s.description as skill_description FROM UserSkill us JOIN Skill s ON us.skill_id = s.id WHERE us.user_id = '${fb.escapeSql(userId)}'`)

    const formattedUserSkills = userSkills.map((row: Record<string, unknown>) => ({
      id: row.id,
      userId: row.userId,
      skillId: row.skillId,
      proficiencyLevel: row.proficiencyLevel,
      confidenceScore: row.confidenceScore,
      verified: row.verified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      skill: {
        id: row.skillId,
        name: row.skillName,
        category: row.skillCategory,
        description: row.skillDescription,
      },
    }))

    return NextResponse.json({ profile, userSkills: formattedUserSkills })
  } catch (error) {
    const err = dbError(error, 'GetProfile')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json() as ProfileBody

    const {
      userId,
      targetGoal,
      experienceLevel = 'beginner',
      availableHoursPerWeek = 10,
      preferredLearningStyle = 'mixed',
      interests = [],
      targetDurationWeeks = null,
      currentSkills = [],
    } = body

    if (!userId || !targetGoal) {
      return NextResponse.json({ error: 'userId and targetGoal are required' }, { status: 400 })
    }

    // Verify user exists
    const userRows = await fb.fluxbase.query(`SELECT * FROM User WHERE id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert profile
    const interestsStr = fb.escapeSql(JSON.stringify(interests))
    const profileRows = await fb.fluxbase.run(`INSERT INTO LearnerProfile (id, user_id, target_goal, experience_level, available_hours_per_week, preferred_learning_style, interests, target_duration_weeks, onboarding_completed, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(targetGoal)}', '${fb.escapeSql(experienceLevel)}', ${availableHoursPerWeek}, '${fb.escapeSql(preferredLearningStyle)}', '${interestsStr}', ${targetDurationWeeks !== null ? targetDurationWeeks : 'NULL'}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (user_id) DO UPDATE SET target_goal = EXCLUDED.target_goal, experience_level = EXCLUDED.experience_level, available_hours_per_week = EXCLUDED.available_hours_per_week, preferred_learning_style = EXCLUDED.preferred_learning_style, interests = EXCLUDED.interests, target_duration_weeks = EXCLUDED.target_duration_weeks, onboarding_completed = true, updated_at = CURRENT_TIMESTAMP RETURNING *`)
    const profile = profileRows[0]

    // Sync user skills from currentSkills array
    if (currentSkills.length > 0) {
      for (const us of currentSkills) {
        const skillRows = await fb.fluxbase.query(`SELECT * FROM Skill WHERE name = '${fb.escapeSql(us.skill)}' LIMIT 1`)
        if (skillRows.length > 0) {
          const skillId = skillRows[0].id as string
          await fb.fluxbase.execute(`INSERT INTO UserSkill (id, user_id, skill_id, proficiency_level, confidence_score, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(skillId)}', '${fb.escapeSql(us.level)}', 0.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level`)
        }
      }
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    const err = dbError(error, 'CreateUpdateProfile')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
