import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const category = req.nextUrl.searchParams.get('category')
    const rolesParam = req.nextUrl.searchParams.get('roles')

    // If roles param is present, return available target roles
    if (rolesParam !== null) {
      const rows = await fb.fluxbase.query(`SELECT DISTINCT target_role FROM RoleSkillRequirement`)
      const roles = rows.map(r => r.targetRole as string)
      return NextResponse.json({ roles })
    }

    // List skills with optional category filter
    const whereClause = category ? `WHERE s.category = '${fb.escapeSql(category)}'` : ''
    const skills = await fb.fluxbase.query(`
      SELECT s.*
      FROM Skill s
      ${whereClause}
      ORDER BY s.name ASC
    `)

    // Fetch all prerequisites in a separate simple query
    const allPrereqs = await fb.fluxbase.query(`
      SELECT p.id, p.skill_id, p.prerequisite_skill_id, p.importance,
        ps.id as prereq_id, ps.name as prereq_name
      FROM SkillPrerequisite p
      JOIN Skill ps ON p.prerequisite_skill_id = ps.id
    `)

    // Group prerequisites by skill_id in JavaScript
    const prereqMap = new Map<string, Record<string, unknown>[]>()
    for (const pr of allPrereqs) {
      const sid = pr.skillId as string
      if (!prereqMap.has(sid)) {
        prereqMap.set(sid, [])
      }
      prereqMap.get(sid)!.push({
        id: pr.id,
        skillId: pr.skillId,
        prerequisiteSkillId: pr.prerequisiteSkillId,
        importance: pr.importance,
        prerequisite: {
          id: pr.prereqId,
          name: pr.prereqName,
        },
      })
    }

    // Attach prerequisites to each skill
    const skillsWithPrereqs = skills.map((skill: Record<string, unknown>) => ({
      ...skill,
      prerequisites: prereqMap.get(skill.id as string) || [],
    }))

    return NextResponse.json({ skills: skillsWithPrereqs })
  } catch (error) {
    const err = dbError(error, 'GetSkills')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
