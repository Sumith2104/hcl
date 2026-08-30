import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { chatWithAssistant } from '@/lib/ai-engine'

interface ChatBody {
  userId: string
  message: string
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json() as ChatBody
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 })
    }

    // Verify user exists
    const userRows = await fb.fluxbase.query(`SELECT * FROM User WHERE id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRows[0]

    // Save user message
    await fb.fluxbase.execute(`INSERT INTO ChatMessage (id, user_id, role, content, created_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', 'user', '${fb.escapeSql(message)}', CURRENT_TIMESTAMP)`)

    // Fetch conversation history (last 10 messages)
    const previousMessages = await fb.fluxbase.query(`SELECT * FROM ChatMessage WHERE user_id = '${fb.escapeSql(userId)}' ORDER BY created_at DESC LIMIT 10`)
    const history = [...previousMessages].reverse().map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Build context for the assistant
    const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(userId)}' LIMIT 1`)
    const profile = profileRows[0] || null

    // Get current roadmap info using simple queries
    const roadmapRows = await fb.fluxbase.query(`SELECT * FROM Roadmap WHERE user_id = '${fb.escapeSql(userId)}' AND status = 'active' LIMIT 1`)
    const roadmap = roadmapRows[0] || null

    let roadmapItems: Record<string, unknown>[] = []
    if (roadmap) {
      const itemRows = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmap.id)}' ORDER BY phase ASC, sequence_order ASC`)
      roadmapItems = itemRows
    }

    // Find current in-progress or available item
    const currentItem = roadmapItems.find(i => i.status === 'in_progress')
      || roadmapItems.find(i => i.status === 'available')

    const currentPhase = currentItem?.phase
      ? roadmapItems.filter(i => i.phase === currentItem.phase)[0]?.title
      : undefined

    // Calculate overall progress
    let overallProgress = 0
    if (roadmap && roadmapItems.length > 0) {
      const completedCount = roadmapItems.filter(i => i.status === 'completed').length
      overallProgress = Math.round((completedCount / roadmapItems.length) * 100)
    }

    // Call AI assistant
    const reply = await chatWithAssistant(
      message,
      {
        userName: user.name as string,
        targetGoal: (profile?.targetGoal as string) || 'their learning goal',
        currentPhase: currentPhase?.toString(),
        currentSkill: currentItem?.title as string,
        overallProgress,
        roadmapItems: roadmapItems.map(i => ({
          title: i.title,
          status: i.status,
          phase: i.phase,
        })),
      },
      history,
    )

    // Save assistant reply
    const savedReplyRows = await fb.fluxbase.run(`INSERT INTO ChatMessage (id, user_id, role, content, created_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', 'assistant', '${fb.escapeSql(reply)}', CURRENT_TIMESTAMP) RETURNING *`)

    return NextResponse.json({
      reply,
      id: savedReplyRows[0]?.id,
    })
  } catch (error) {
    const err = dbError(error, 'Chat')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
