import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    // Fetch user and profile
    const userRows = await fb.fluxbase.query(`SELECT * FROM User WHERE id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRows[0]

    const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(userId)}' LIMIT 1`)
    const profile = profileRows[0] || null

    // Fetch progress data for the past 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekAgoStr = oneWeekAgo.toISOString()

    const recentProgress = await fb.fluxbase.query(`
      SELECT p.*, ri.title as item_title, s.id as skill_id, s.name as skill_name, s.category as skill_category, s.description as skill_description
      FROM Progress p
      JOIN RoadmapItem ri ON p.roadmap_item_id = ri.id
      LEFT JOIN Skill s ON ri.skill_id = s.id
      WHERE p.user_id = '${fb.escapeSql(userId)}'
      ORDER BY p.updated_at DESC
    `)

    // Fetch roadmap with items using simple queries
    const roadmapRows = await fb.fluxbase.query(`SELECT * FROM Roadmap WHERE user_id = '${fb.escapeSql(userId)}' AND status = 'active' LIMIT 1`)
    const roadmap = roadmapRows[0] || null

    let roadmapItems: Record<string, unknown>[] = []
    if (roadmap) {
      const itemRows = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmap.id)}' ORDER BY phase ASC, sequence_order ASC`)
      roadmapItems = itemRows
    }

    // Fetch user skills
    const userSkills = await fb.fluxbase.query(`SELECT us.*, s.name as skill_name, s.category as skill_category, s.description as skill_description FROM UserSkill us JOIN Skill s ON us.skill_id = s.id WHERE us.user_id = '${fb.escapeSql(userId)}'`)

    // Fetch chat messages from the past week
    const weeklyChatCountRows = await fb.fluxbase.query(`SELECT COUNT(*) as count FROM ChatMessage WHERE user_id = '${fb.escapeSql(userId)}' AND role = 'user' AND created_at >= '${oneWeekAgoStr}'`)
    const weeklyChatCount = Number(weeklyChatCountRows[0]?.count || 0)

    // Build progress summary
    const completedItems = roadmapItems.filter(i => i.status === 'completed')
    const inProgressItems = roadmapItems.filter(i => i.status === 'in_progress')
    const availableItems = roadmapItems.filter(i => i.status === 'available')
    const lockedItems = roadmapItems.filter(i => i.status === 'locked')
    const totalItems = roadmapItems.length
    const overallProgress = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0

    // Items completed this week
    const recentlyUpdated = recentProgress.filter(
      (p: Record<string, unknown>) => new Date(p.updatedAt as string) >= oneWeekAgo && (p.completionPercentage as number) >= 100
    )
    const completedThisWeek = recentlyUpdated.map((p: Record<string, unknown>) => p.itemTitle as string)

    // Items in progress
    const inProgressTitles = inProgressItems.map(i => i.title as string)

    // Assessment scores this week
    const weeklyAssessments = recentProgress.filter(
      (p: Record<string, unknown>) => new Date(p.updatedAt as string) >= oneWeekAgo && p.assessmentScore !== null
    )
    const avgAssessment = weeklyAssessments.length > 0
      ? Math.round(weeklyAssessments.reduce((sum, p) => sum + ((p.assessmentScore as number) || 0), 0) / weeklyAssessments.length)
      : null

    // Check if there's enough data to generate a meaningful summary
    const hasData = totalItems > 0 || userSkills.length > 0 || completedThisWeek.length > 0

    if (!hasData) {
      return NextResponse.json({
        summary: "It looks like you're just getting started on your learning journey! Complete your onboarding and generate a learning roadmap to unlock personalized weekly AI insights that track your progress and help you stay on course.",
        generatedAt: new Date().toISOString(),
        highlights: [
          'Complete onboarding to set your learning goals',
          'Generate your first personalized roadmap',
          'Start completing items to see your weekly progress',
        ],
      })
    }

    // Build the prompt for AI summary
    const systemPrompt = `You are an encouraging and insightful AI learning coach for a platform called Study Buddies. You analyze a learner's weekly progress and provide a concise, motivating weekly summary.

Your summary MUST include:
1. A brief encouraging opening (1-2 sentences)
2. Key accomplishments this week (2-3 bullet points)
3. Areas that need attention (1-2 points)
4. Suggested focus areas for next week (1-2 actionable suggestions)
5. A motivational closing quote or thought (1 sentence)

Rules:
- Be specific — reference actual skills, items, and progress data provided
- Be encouraging but honest about areas needing work
- Keep the total summary under 200 words
- Use a warm, supportive tone
- Format with clear line breaks between sections
- Also output exactly 3 highlight phrases (short, punchy, max 8 words each) as a JSON array

Respond in this exact format:
---SUMMARY---
[Your summary text here with line breaks between sections]
---HIGHLIGHTS---
["highlight 1", "highlight 2", "highlight 3"]`

    const dataSummary = `
Learner: ${user.name}
Target Goal: ${profile?.targetGoal || 'Not set yet'}
Experience Level: ${profile?.experienceLevel || 'Unknown'}
Available Hours/Week: ${profile?.availableHoursPerWeek || 'Not set'}
Learning Style: ${profile?.preferredLearningStyle || 'Not set'}

--- This Week's Activity ---
Items Completed This Week: ${completedThisWeek.length > 0 ? completedThisWeek.join(', ') : 'None'}
Items Currently In Progress: ${inProgressTitles.length > 0 ? inProgressTitles.join(', ') : 'None'}
AI Questions Asked This Week: ${weeklyChatCount}
Average Assessment Score: ${avgAssessment !== null ? avgAssessment + '%' : 'N/A'}

--- Overall Roadmap Status ---
Total Roadmap Items: ${totalItems}
Completed: ${completedItems.length}
In Progress: ${inProgressItems.length}
Available: ${availableItems.length}
Locked: ${lockedItems.length}
Overall Progress: ${overallProgress}%

--- Skills ---
User Skills: ${userSkills.length > 0 ? userSkills.map((us: Record<string, unknown>) => `${us.skillName} (${us.proficiencyLevel})`).join(', ') : 'None added yet'}`

    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: dataSummary },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || ''

    // Parse the response
    let summary = raw
    let highlights: string[] = []

    const summaryMatch = raw.match(/---SUMMARY---\s*([\s\S]*?)\s*---HIGHLIGHTS---/)
    const highlightsMatch = raw.match(/---HIGHLIGHTS---\s*([\s\S]*)/)

    if (summaryMatch) {
      summary = summaryMatch[1].trim()
    }

    if (highlightsMatch) {
      try {
        const parsed = JSON.parse(highlightsMatch[1].trim())
        highlights = Array.isArray(parsed) ? parsed.slice(0, 3) : []
      } catch {
        // If JSON parse fails, extract from text
        const items = highlightsMatch[1].match(/"([^"]+)"/g)
        highlights = items ? items.slice(0, 3).map(i => i.replace(/"/g, '')) : []
      }
    }

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString(),
      highlights,
    })
  } catch (error) {
    const err = dbError(error, 'WeeklySummary')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
