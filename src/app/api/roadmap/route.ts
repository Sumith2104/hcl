import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { generateRoadmapWithAI } from '@/lib/ai-engine'

function sanitizeUrl(url: string): string {
  if (!url) return ''
  url = url.trim()
  // Fix common AI-generated URL mistakes: "https/example.com" → "https://example.com"
  // Also handles "http:/x", "https:x", "https:///x" etc.
  url = url.replace(/^(https?)[\/:]*/, '$1://')
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('www.')) return 'https://' + url
  if (url.includes('.') && !url.includes(' ')) return 'https://' + url
  return url
}

interface GenerateRoadmapBody {
  userId: string
}

type FluxbaseClient = Awaited<ReturnType<typeof getFluxbase>>

async function buildFullRoadmap(fb: FluxbaseClient, roadmapId: string, userId?: string) {
  const roadmapRows = await fb.fluxbase.query(`SELECT * FROM Roadmap WHERE id = '${fb.escapeSql(roadmapId)}' LIMIT 1`)
  if (roadmapRows.length === 0) return null
  const roadmap = roadmapRows[0]

  const itemRows = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapId)}' ORDER BY phase ASC, sequence_order ASC`)

  const itemIds = itemRows.map((ri: Record<string, unknown>) => `'${fb.escapeSql(ri.id as string)}'`).join(',')
  const skillRows = itemIds
    ? await fb.fluxbase.query(`SELECT ri.id as item_id, s.id, s.name, s.category, s.description FROM RoadmapItem ri LEFT JOIN Skill s ON ri.skill_id = s.id WHERE ri.id IN (${itemIds})`)
    : []
  const skillMap = new Map<string, Record<string, unknown>>() 
  for (const sr of skillRows) {  
    skillMap.set(sr.itemId as string, { id: sr.id, name: sr.name, category: sr.category, description: sr.description })
  }

  const resourceLinkRows = itemIds
    ? await fb.fluxbase.query(`SELECT rr.id, rr.roadmap_item_id, rr.resource_id, rr.recommendation_reason, res.id as res_id, res.title as res_title, res.description as res_description, res.url as res_url, res.type as res_type, res.difficulty as res_difficulty, res.estimated_hours as res_estimated_hours, res.quality_score as res_quality_score FROM RoadmapResource rr JOIN Resource res ON rr.resource_id = res.id WHERE rr.roadmap_item_id IN (${itemIds})`)
    : []
  const resourceMap = new Map<string, Record<string, unknown>[]>()
  for (const rr of resourceLinkRows) {
    const itemId = rr.roadmapItemId as string
    if (!resourceMap.has(itemId)) resourceMap.set(itemId, [])
    resourceMap.get(itemId)!.push({
      id: rr.id,
      roadmapItemId: rr.roadmapItemId,
      resourceId: rr.resourceId,
      recommendationReason: rr.recommendationReason,
      resource: {
        id: rr.resId,
        title: rr.resTitle,
        description: rr.resDescription,
        url: rr.resUrl,
        type: rr.resType,
        difficulty: rr.resDifficulty,
        estimatedHours: rr.resEstimatedHours,
        qualityScore: rr.resQualityScore,
      },
    })
  }

  let progressMap = new Map<string, Record<string, unknown>[]>()
  if (userId && itemIds) {
    const progressRows = await fb.fluxbase.query(`SELECT * FROM Progress WHERE user_id = '${fb.escapeSql(userId)}' AND roadmap_item_id IN (${itemIds})`)
    for (const p of progressRows) {
      const itemId = p.roadmapItemId as string
      if (!progressMap.has(itemId)) progressMap.set(itemId, [])
      progressMap.get(itemId)!.push(p)
    }
  }

  const items = itemRows.map((ri: Record<string, unknown>) => {
    const skill = skillMap.get(ri.id as string) || null
    const resources = resourceMap.get(ri.id as string) || []
    const progress = progressMap.get(ri.id as string) || []
    return {
      id: ri.id,
      roadmapId: ri.roadmapId,
      skillId: ri.skillId,
      sequenceOrder: ri.sequenceOrder,
      phase: ri.phase,
      title: ri.title,
      description: ri.description,
      estimatedHours: ri.estimatedHours,
      milestone: ri.milestone,
      status: ri.status,
      createdAt: ri.createdAt,
      updatedAt: ri.updatedAt,
      skill: skill ? {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        description: skill.description,
      } : null,
      resources,
      progress,
    }
  })

  return { ...roadmap, items }
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json() as GenerateRoadmapBody
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify user and profile exist
    const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(userId)}' LIMIT 1`)
    if (profileRows.length === 0) {
      return NextResponse.json({ error: 'Learner profile not found. Complete onboarding first.' }, { status: 404 })
    }
    const profile = profileRows[0]
    const targetGoal = profile.targetGoal as string

    // Get user's current skills for context
    const userSkillRows = await fb.fluxbase.query(`SELECT us.*, s.name as skill_name FROM UserSkill us JOIN Skill s ON us.skill_id = s.id WHERE us.user_id = '${fb.escapeSql(userId)}'`)
    const currentSkills = userSkillRows.map((us: Record<string, unknown>) => ({
      skill: us.skillName as string,
      level: us.proficiencyLevel as string,
    }))

    // Generate roadmap structure with AI (skills + topics only, resources attached locally)
    const aiRoadmap = await generateRoadmapWithAI(targetGoal, {
      availableHoursPerWeek: profile.availableHoursPerWeek as number,
      targetDurationWeeks: profile.targetDurationWeeks as number | null,
      experienceLevel: profile.experienceLevel as string,
      preferredLearningStyle: profile.preferredLearningStyle as string,
      currentSkills,
    })

    // Archive any existing active roadmaps
    await fb.fluxbase.execute(`UPDATE Roadmap SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE user_id = '${fb.escapeSql(userId)}' AND status = 'active'`)

    // Calculate total estimated weeks
    const totalWeeks = aiRoadmap.phases.reduce((sum, p) => sum + (p.durationWeeks || 2), 0)

    // Insert roadmap
    const roadmapRows = await fb.fluxbase.run(
      `INSERT INTO Roadmap (id, user_id, target_goal, estimated_duration_weeks, status, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(targetGoal)}', ${totalWeeks}, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`
    )
    const roadmap = roadmapRows[0]

    // ===== BATCH ALL INSERTS =====
    // Build all item INSERT values
    const itemValues: string[] = []
    const itemSkillMap: { idx: number; skill: typeof aiRoadmap.phases[0]['skills'][0]; phase: typeof aiRoadmap.phases[0]; seq: number }[] = []
    let sequenceOrder = 0

    for (const phase of aiRoadmap.phases) {
      const itemStatus = phase.phase === 1 ? 'available' : 'locked'
      const estimatedHours = (profile.availableHoursPerWeek as number) * (phase.durationWeeks || 2)
      const skillHours = phase.skills.length > 0 ? estimatedHours / phase.skills.length : estimatedHours

      for (const skill of phase.skills) {
        sequenceOrder++
        const idx = itemValues.length
        itemValues.push(
          `(${fb.qid()}, '${fb.escapeSql(String(roadmap.id))}', NULL, ${sequenceOrder}, ${phase.phase}, '${fb.escapeSql(skill.name)}', '${fb.escapeSql(skill.description || `Learn ${skill.name}`)}', ${Math.round(skillHours * 10) / 10}, '${fb.escapeSql(phase.milestone || '')}', '${fb.escapeSql(itemStatus)}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        itemSkillMap.push({ idx, skill, phase, seq: sequenceOrder })
      }
    }

    // Batch insert all items in one query
    let insertedItems: Record<string, unknown>[] = []
    if (itemValues.length > 0) {
      // Insert in chunks of 20 to avoid query size limits
      const chunkSize = 20
      for (let i = 0; i < itemValues.length; i += chunkSize) {
        const chunk = itemValues.slice(i, i + chunkSize)
        const rows = await fb.fluxbase.run(
          `INSERT INTO RoadmapItem (id, roadmap_id, skill_id, sequence_order, phase, title, description, estimated_hours, milestone, status, created_at, updated_at) VALUES ${chunk.join(', ')} RETURNING *`
        )
        insertedItems.push(...rows)
      }
    }

    // Build all resource INSERT values and link INSERT values
    const resourceValues: string[] = []
    const linkValues: string[] = []

    for (let i = 0; i < insertedItems.length; i++) {
      const item = insertedItems[i]
      const mapping = itemSkillMap[i]
      if (!mapping || !mapping.skill.resources) continue

      for (const resource of mapping.skill.resources) {
        const resId = fb.qid()
        const sanitizedUrl = sanitizeUrl(resource.url)
        resourceValues.push(
          `(${resId}, '${fb.escapeSql(resource.title)}', '${fb.escapeSql(resource.description)}', '${fb.escapeSql(sanitizedUrl)}', '${fb.escapeSql(resource.type)}', 'intermediate', ${resource.estimatedHours || 5}, 0.8, CURRENT_TIMESTAMP)`
        )
        linkValues.push(
          `(${fb.qid()}, '${fb.escapeSql(String(item.id))}', ${resId}, '${fb.escapeSql('Recommended for ' + mapping.skill.name)}')`
        )
      }
    }

    // Batch insert all resources and links
    if (resourceValues.length > 0) {
      const chunkSize = 15
      for (let i = 0; i < resourceValues.length; i += chunkSize) {
        const chunk = resourceValues.slice(i, i + chunkSize)
        await fb.fluxbase.run(
          `INSERT INTO Resource (id, title, description, url, type, difficulty, estimated_hours, quality_score, created_at) VALUES ${chunk.join(', ')}`
        )
      }
    }

    if (linkValues.length > 0) {
      const chunkSize = 20
      for (let i = 0; i < linkValues.length; i += chunkSize) {
        const chunk = linkValues.slice(i, i + chunkSize)
        await fb.fluxbase.run(
          `INSERT INTO RoadmapResource (id, roadmap_item_id, resource_id, recommendation_reason) VALUES ${chunk.join(', ')}`
        )
      }
    }

    // Build the response directly from AI data (avoid extra DB query)
    const totalSkills = aiRoadmap.phases.reduce((sum, p) => sum + (p.skills?.length || 0), 0)
    const totalResources = aiRoadmap.phases.reduce(
      (sum, p) => sum + (p.skills || []).reduce((s, sk) => s + (sk.resources?.length || 0), 0),
      0
    )

    // Build roadmap response from the in-memory data (no need for buildFullRoadmap query)
    const roadmapItems = []
    let seq = 0
    for (const phase of aiRoadmap.phases) {
      const itemStatus = phase.phase === 1 ? 'available' : 'locked'
      const estimatedHours = (profile.availableHoursPerWeek as number) * (phase.durationWeeks || 2)
      const skillHours = phase.skills.length > 0 ? estimatedHours / phase.skills.length : estimatedHours

      for (const skill of phase.skills) {
        seq++
        // Find the corresponding inserted item for its DB id
        const insertedItem = insertedItems[seq - 1]
        roadmapItems.push({
          id: insertedItem?.id,
          roadmapId: roadmap.id,
          skillId: null,
          sequenceOrder: seq,
          phase: phase.phase,
          title: skill.name,
          description: skill.description || `Learn ${skill.name}`,
          estimatedHours: Math.round(skillHours * 10) / 10,
          milestone: phase.milestone,
          status: itemStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skill: null,
          resources: (skill.resources || []).map(r => ({
            id: undefined,
            roadmapItemId: insertedItem?.id,
            resourceId: undefined,
            recommendationReason: `Recommended for ${skill.name}`,
            resource: {
              id: undefined,
              title: r.title,
              description: r.description,
              url: sanitizeUrl(r.url),
              type: r.type,
              difficulty: 'intermediate',
              estimatedHours: r.estimatedHours || 5,
              qualityScore: 0.8,
            },
          })),
          progress: [],
        })
      }
    }

    const fullRoadmap = {
      ...roadmap,
      items: roadmapItems,
    }

    return NextResponse.json({
      roadmap: fullRoadmap,
      skillsCount: totalSkills,
      resourcesCount: totalResources,
      phasesCount: aiRoadmap.phases.length,
    }, { status: 201 })
  } catch (error) {
    const err = dbError(error, 'GenerateRoadmap')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const roadmapRows = await fb.fluxbase.query(`SELECT * FROM Roadmap WHERE user_id = '${fb.escapeSql(userId)}' AND status = 'active' LIMIT 1`)
    if (roadmapRows.length === 0) {
      return NextResponse.json({ error: 'No active roadmap found' }, { status: 404 })
    }

    const fullRoadmap = await buildFullRoadmap(fb, roadmapRows[0].id as string, userId)

    return NextResponse.json({ roadmap: fullRoadmap })
  } catch (error) {
    const err = dbError(error, 'GetRoadmap')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
