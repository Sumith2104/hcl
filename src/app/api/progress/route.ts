import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { evaluateAdaptation, generateAdaptationExplanation, updateKnowledgeState, getMasteryClassification } from '@/lib/ai-engine'

interface ProgressBody {
  userId: string
  roadmapItemId: string
  completionPercentage?: number
  assessmentScore?: number | null
  feedback?: string
  timeSpentHours?: number
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()
    const body = await req.json() as ProgressBody
    const {
      userId,
      roadmapItemId,
      completionPercentage,
      assessmentScore = null,
      feedback = '',
      timeSpentHours = 0,
    } = body

    if (!userId || !roadmapItemId) {
      return NextResponse.json({ error: 'userId and roadmapItemId are required' }, { status: 400 })
    }

    // Verify roadmap item exists with roadmap and skill
    const itemRows = await fb.fluxbase.query(`
      SELECT ri.*, rm.id as roadmap_id, s.id as skill_id, s.name as skill_name, s.category as skill_category, s.description as skill_description
      FROM RoadmapItem ri
      JOIN Roadmap rm ON ri.roadmap_id = rm.id
      LEFT JOIN Skill s ON ri.skill_id = s.id
      WHERE ri.id = '${fb.escapeSql(roadmapItemId)}' LIMIT 1
    `)
    if (itemRows.length === 0) {
      return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 })
    }
    const roadmapItem = itemRows[0]

    // Upsert progress record
    const updateParts: string[] = [`feedback = '${fb.escapeSql(feedback)}'`]
    if (completionPercentage !== undefined) updateParts.push(`completion_percentage = ${completionPercentage}`)
    if (assessmentScore !== undefined) updateParts.push(`assessment_score = ${assessmentScore}`)

    const progressRows = await fb.fluxbase.run(`
      INSERT INTO Progress (id, user_id, roadmap_item_id, completion_percentage, assessment_score, feedback, created_at, updated_at)
      VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(roadmapItemId)}', ${completionPercentage ?? 0}, ${assessmentScore !== null ? assessmentScore : 'NULL'}, '${fb.escapeSql(feedback)}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, roadmap_item_id) DO UPDATE SET ${updateParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `)
    const progress = progressRows[0]

    // Bayesian Knowledge Tracing (BKT) ML Update
    let bktResult = null
    if (assessmentScore !== null && assessmentScore !== undefined && roadmapItem.skillId) {
      const isCorrect = Number(assessmentScore) >= 70
      
      // Fetch prior user skill mastery confidence
      const userSkillRows = await fb.fluxbase.query(`
        SELECT * FROM UserSkill 
        WHERE user_id = '${fb.escapeSql(userId)}' AND skill_id = '${fb.escapeSql(roadmapItem.skillId)}'
        LIMIT 1
      `)
      
      const priorConfidence = Number(userSkillRows[0]?.confidenceScore || 0.20)
      const bkt = updateKnowledgeState(priorConfidence, isCorrect)
      const mastery = getMasteryClassification(bkt.nextPLt)

      // Upsert UserSkill with new BKT confidence score
      await fb.fluxbase.run(`
        INSERT INTO UserSkill (id, user_id, skill_id, proficiency_level, confidence_score, verified, created_at, updated_at)
        VALUES (${fb.qid()}, '${fb.escapeSql(userId)}', '${fb.escapeSql(roadmapItem.skillId)}', '${mastery.level}', ${bkt.nextPLt.toFixed(4)}, ${mastery.isMastered ? 1 : 0}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, skill_id) DO UPDATE SET 
          proficiency_level = '${mastery.level}',
          confidence_score = ${bkt.nextPLt.toFixed(4)},
          verified = ${mastery.isMastered ? 1 : 0},
          updated_at = CURRENT_TIMESTAMP
      `)

      bktResult = {
        priorScore: priorConfidence,
        posteriorScore: bkt.posteriorPLt,
        newMasteryScore: bkt.nextPLt,
        masteryLevel: mastery.level,
        isMastered: mastery.isMastered
      }
    }

    // Update roadmap item status based on completion
    if (completionPercentage !== undefined) {
      let newStatus = roadmapItem.status as string
      if (completionPercentage >= 100) {
        newStatus = 'completed'
      } else if (completionPercentage > 0) {
        newStatus = 'in_progress'
      }

      if (newStatus !== (roadmapItem.status as string)) {
        await fb.fluxbase.execute(`UPDATE RoadmapItem SET status = '${fb.escapeSql(newStatus)}', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(roadmapItemId)}'`)
      }

      // If completed, unlock next locked item(s) in the roadmap
      if (completionPercentage >= 100) {
        const nextItemRows = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}' AND status = 'locked' ORDER BY phase ASC, sequence_order ASC LIMIT 1`)

        if (nextItemRows.length > 0) {
          await fb.fluxbase.execute(`UPDATE RoadmapItem SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(nextItemRows[0].id)}'`)
        }

        // Check if all items are completed
        const countRows = await fb.fluxbase.query(`SELECT COUNT(*) as count FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}' AND status NOT IN ('completed', 'skipped')`)
        const remaining = Number(countRows[0]?.count || 0)

        if (remaining === 0) {
          await fb.fluxbase.execute(`UPDATE Roadmap SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(roadmapItem.roadmapId)}'`)
        }
      }
    }

    // Trigger adaptive engine if we have assessment data
    let adaptationResult: {
      adaptation: string | null
      explanation: string
      changes: string
    } | null = null

    if (assessmentScore !== null && assessmentScore !== undefined) {
      const adaptation = evaluateAdaptation(
        completionPercentage ?? (progress?.completionPercentage as number),
        assessmentScore,
        feedback,
        timeSpentHours,
        roadmapItem.estimatedHours as number,
      )

      if (adaptation && adaptation !== 'on_track' && roadmapItem.skillId) {
        let changes = ''

        if (adaptation === 'struggling') {
          // Add more resources for struggling learners
          const extraResources = await fb.fluxbase.query(`
            SELECT DISTINCT r.* FROM Resource r
            JOIN ResourceSkill rs ON rs.resource_id = r.id
            WHERE r.difficulty = 'beginner' AND rs.skill_id = '${fb.escapeSql(roadmapItem.skillId)}'
            LIMIT 2
          `)

          for (const res of extraResources) {
            await fb.fluxbase.execute(`INSERT INTO RoadmapResource (id, roadmap_item_id, resource_id, recommendation_reason) VALUES (${fb.qid()}, '${fb.escapeSql(roadmapItemId)}', '${fb.escapeSql(res.id)}', 'Added additional beginner-friendly resource to help you build a stronger foundation')`)
          }

          changes = `Added ${extraResources.length} extra beginner resources for ${roadmapItem.skillName}.`
          const explanation = await generateAdaptationExplanation(adaptation, roadmapItem.skillName as string, changes)
          adaptationResult = { adaptation, explanation, changes }
        } else if (adaptation === 'excelling') {
          // Unlock the next item early
          const nextLocked = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}' AND status = 'locked' ORDER BY phase ASC, sequence_order ASC LIMIT 1`)

          if (nextLocked.length > 0) {
            await fb.fluxbase.execute(`UPDATE RoadmapItem SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(nextLocked[0].id)}'`)
            changes = `Unlocked the next phase early: ${nextLocked[0].title}. Keep up the great work!`
            const explanation = await generateAdaptationExplanation(adaptation, roadmapItem.skillName as string, changes)
            adaptationResult = { adaptation, explanation, changes }
          }
        }
      }
    }

    return NextResponse.json({ progress, adaptation: adaptationResult, bkt: bktResult })
  } catch (error) {
    const err = dbError(error, 'UpdateProgress')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
