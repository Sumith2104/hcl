import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { onboardingChatStep } from '@/lib/ai-engine'

interface OnboardingBody {
  userId: string
  message: string
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json() as OnboardingBody
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 })
    }

    // Verify user exists
    const userRows = await fb.fluxbase.query(`SELECT * FROM User WHERE id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch conversation history
    const previousMessages = await fb.fluxbase.query(`SELECT * FROM OnboardingMessage WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at ASC`)
    const conversationHistory = previousMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Save user message
    const nextStep = previousMessages.length > 0
      ? Math.max(...previousMessages.map(m => Number(m.step))) + 1
      : 1

    await fb.fluxbase.execute(`INSERT INTO OnboardingMessage (id, user_id, role, content, step, created_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', 'user', '${fb.escapeSql(message)}', ${nextStep}, CURRENT_TIMESTAMP)`)

    // Call AI onboarding step
    const result = await onboardingChatStep(userId, message, conversationHistory)

    // Save assistant reply
    await fb.fluxbase.execute(`INSERT INTO OnboardingMessage (id, user_id, role, content, step, created_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', 'assistant', '${fb.escapeSql(result.reply)}', ${nextStep}, CURRENT_TIMESTAMP)`)

    // If profile is complete, create/update LearnerProfile and UserSkills
    if (result.profileComplete && result.profileData) {
      const pd = result.profileData

      await fb.fluxbase.execute(`INSERT INTO LearnerProfile (id, user_id, target_goal, experience_level, available_hours_per_week, preferred_learning_style, interests, target_duration_weeks, onboarding_completed, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(pd.target_goal || '')}', 'beginner', ${pd.available_hours_per_week || 10}, '${fb.escapeSql(pd.preferred_learning_style || 'mixed')}', '${fb.escapeSql(JSON.stringify([]))}', ${pd.target_duration_weeks !== null && pd.target_duration_weeks !== undefined ? pd.target_duration_weeks : 'NULL'}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (user_id) DO UPDATE SET target_goal = EXCLUDED.target_goal, available_hours_per_week = EXCLUDED.available_hours_per_week, preferred_learning_style = EXCLUDED.preferred_learning_style, target_duration_weeks = EXCLUDED.target_duration_weeks, onboarding_completed = true, updated_at = CURRENT_TIMESTAMP`)

      // Create user skills from profile data
      if (Array.isArray(pd.current_skills)) {
        for (const cs of pd.current_skills) {
          const skillRows = await fb.fluxbase.query(`SELECT * FROM Skill WHERE name = '${fb.escapeSql(cs.skill)}' LIMIT 1`)
          if (skillRows.length > 0) {
            const skillId = skillRows[0].id as string
            await fb.fluxbase.execute(`INSERT INTO UserSkill (id, user_id, skill_id, proficiency_level, confidence_score, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(skillId)}', '${fb.escapeSql(cs.level || 'beginner')}', 0.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level`)
          }
        }
      }
    }

    return NextResponse.json({
      reply: result.reply,
      profileComplete: result.profileComplete,
      profileData: result.profileData || null,
    })
  } catch (error) {
    const err = dbError(error, 'Onboarding')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
