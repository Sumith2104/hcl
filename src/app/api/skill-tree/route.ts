import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const [skillRows, prereqRows, userSkillRows, roadmapItemRows] = await Promise.all([
      fb.fluxbase.query('SELECT * FROM Skill'),
      fb.fluxbase.query('SELECT * FROM SkillPrerequisite'),
      fb.fluxbase.query(
        `SELECT * FROM UserSkill WHERE user_id = '${fb.escapeSql(userId)}'`
      ),
      fb.fluxbase.query(
        `SELECT ri.skill_id FROM RoadmapItem ri
         JOIN Roadmap r ON r.id = ri.roadmap_id
         WHERE r.user_id = '${fb.escapeSql(userId)}' AND r.status = 'active'`
      ),
    ])

    // Build user proficiency lookup
    const proficiencyMap = new Map<string, string>()
    for (const us of userSkillRows as Record<string, unknown>[]) {
      proficiencyMap.set(
        us.skillId as string,
        (us.proficiencyLevel as string) || 'none'
      )
    }

    // Build roadmap focus set
    const roadmapItemIds = new Set<string>()
    for (const ri of roadmapItemRows as Record<string, unknown>[]) {
      if (ri.skillId) {
        roadmapItemIds.add(ri.skillId as string)
      }
    }

    const skills = (skillRows as Record<string, unknown>[]).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      proficiency: proficiencyMap.get(row.id as string) || 'none',
      inRoadmap: roadmapItemIds.has(row.id as string),
    }))

    const edges = (prereqRows as Record<string, unknown>[]).map((row) => ({
      from: row.prerequisiteSkillId,
      to: row.skillId,
      importance: row.importance,
    }))

    return NextResponse.json({ skills, edges, roadmapItemIds: [...roadmapItemIds] })
  } catch (error) {
    const err = dbError(error, 'GetSkillTree')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
