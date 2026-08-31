import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { mlEvaluateAdaptation, mlGetAdaptiveIntervention, mlPredictProgression, MLAdaptationResult, MLIntervention } from '@/lib/ml-engine'

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
      SELECT ri.*, rm.id as roadmap_id, rm.user_id as roadmap_user_id, s.id as skill_id, s.name as skill_name, s.category as skill_category, s.description as skill_description
      FROM RoadmapItem ri
      JOIN Roadmap rm ON ri.roadmap_id = rm.id
      LEFT JOIN Skill s ON ri.skill_id = s.id
      WHERE ri.id = '${fb.escapeSql(roadmapItemId)}' LIMIT 1
    `)
    if (itemRows.length === 0) {
      return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 })
    }
    const roadmapItem = itemRows[0]

    // Fetch learner profile for ML context
    let learnerExperience = 'beginner'
    let preferredStyle = 'mixed'
    try {
      const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(userId)}' LIMIT 1`)
      if (profileRows.length > 0) {
        const profile = profileRows[0]
        if (profile.experienceLevel) learnerExperience = String(profile.experienceLevel)
        if (profile.preferredLearningStyle) preferredStyle = String(profile.preferredLearningStyle)
      }
    } catch { /* profile not required */ }

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

    // ML-Powered Progression: update status using ML prediction
    let mlIntervention: MLIntervention | null = null
    let mlAdaptation: MLAdaptationResult | null = null

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

      // On completion: use ML to decide which items to unlock
      if (completionPercentage >= 100) {
        // Fetch all roadmap items for ML progression prediction
        const allItems = await fb.fluxbase.query(`
          SELECT ri.id, ri.title, ri.status, ri.phase, ri.sequence_order, s.name as skill_name
          FROM RoadmapItem ri
          LEFT JOIN Skill s ON ri.skill_id = s.id
          WHERE ri.roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}'
          ORDER BY ri.phase ASC, ri.sequence_order ASC
        `)

        // Fetch user's skills for ML context
        const userSkillRows = await fb.fluxbase.query(`
          SELECT s.name FROM UserSkill us JOIN Skill s ON us.skill_id = s.id WHERE us.user_id = '${fb.escapeSql(userId)}'
        `)
        const userSkills = userSkillRows.map((r: any) => String(r.name))

        const progression = await mlPredictProgression({
          completedItemId: roadmapItemId,
          completedItemTitle: String(roadmapItem.title || ''),
          completedItemSkill: String(roadmapItem.skillName || ''),
          roadmapId: String(roadmapItem.roadmapId),
          allItems: allItems.map((r: any) => ({
            id: String(r.id),
            title: String(r.title || ''),
            status: String(r.status || ''),
            phase: Number(r.phase || 1),
            skillName: String(r.skillName || ''),
            sequenceOrder: Number(r.sequenceOrder || 0),
          })),
          userSkills,
          completionTimeHours: timeSpentHours,
          assessmentScore,
        })

        // Unlock items based on ML decision
        for (const itemId of progression.itemsToUnlock) {
          await fb.fluxbase.execute(`UPDATE RoadmapItem SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(itemId)}' AND status = 'locked'`)
        }

        // Check if roadmap should be completed
        if (progression.shouldCompleteRoadmap) {
          await fb.fluxbase.execute(`UPDATE Roadmap SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(roadmapItem.roadmapId)}'`)
        }

        // Store progression insight in response
        mlIntervention = {
          type: 'unlock_ahead',
          message: progression.progressionInsight,
          actionDetails: progression.itemsToUnlock.length > 0
            ? `Unlocked ${progression.itemsToUnlock.length} item(s) based on your demonstrated mastery.`
            : 'All remaining items are in progress.',
        }
      }
    }

    // ML-Powered Adaptive Engine: evaluate learner state and generate interventions
    if (assessmentScore !== null && assessmentScore !== undefined) {
      mlAdaptation = await mlEvaluateAdaptation({
        completionPercentage: completionPercentage ?? Number(progress?.completionPercentage ?? 0),
        assessmentScore,
        feedback,
        timeSpentHours,
        estimatedHours: Number(roadmapItem.estimatedHours || 10),
        skillName: String(roadmapItem.skillName || 'Unknown'),
        learnerExperience,
      })

      if (mlAdaptation.state !== 'on_track') {
        // Fetch available resources for intervention
        let availableResources: { title: string; url: string; type: string; difficulty: string }[] = []
        if (roadmapItem.skillId) {
          const resRows = await fb.fluxbase.query(`
            SELECT r.title, r.url, r.type, r.difficulty
            FROM Resource r
            JOIN ResourceSkill rs ON rs.resource_id = r.id
            WHERE rs.skill_id = '${fb.escapeSql(String(roadmapItem.skillId))}'
            LIMIT 15
          `)
          availableResources = resRows.map((r: any) => ({
            title: String(r.title || ''),
            url: String(r.url || ''),
            type: String(r.type || 'article'),
            difficulty: String(r.difficulty || 'beginner'),
          }))
        }

        // Get total phases for context
        const phaseCount = await fb.fluxbase.query(`SELECT MAX(phase) as max_phase FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}'`)
        const totalPhases = Number(phaseCount[0]?.maxPhase || 1)

        mlIntervention = await mlGetAdaptiveIntervention({
          adaptationResult: mlAdaptation,
          skillName: String(roadmapItem.skillName || 'Unknown'),
          skillDescription: String(roadmapItem.skillDescription || roadmapItem.title || ''),
          learnerExperience,
          preferredStyle,
          currentPhase: Number(roadmapItem.phase || 1),
          totalPhases,
          availableResources,
        })

        // Execute intervention actions
        if (mlIntervention && mlIntervention.type === 'add_resources' && mlIntervention.resources) {
          for (const res of mlIntervention.resources.slice(0, 3)) {
            if (!res.url) continue
            // Find matching resource in DB or add as external
            const existingRes = await fb.fluxbase.query(`SELECT id FROM Resource WHERE url = '${fb.escapeSql(res.url)}' LIMIT 1`)
            if (existingRes.length > 0) {
              await fb.fluxbase.execute(`INSERT INTO RoadmapResource (id, roadmap_item_id, resource_id, recommendation_reason) VALUES (${fb.qid()}, '${fb.escapeSql(roadmapItemId)}', '${fb.escapeSql(String(existingRes[0].id))}', '${fb.escapeSql(res.reason || mlIntervention.message)}')`)
            }
          }
        }

        if (mlIntervention && mlIntervention.type === 'unlock_ahead' && !completionPercentage || completionPercentage < 100) {
          const nextLocked = await fb.fluxbase.query(`SELECT * FROM RoadmapItem WHERE roadmap_id = '${fb.escapeSql(roadmapItem.roadmapId)}' AND status = 'locked' ORDER BY phase ASC, sequence_order ASC LIMIT 1`)
          if (nextLocked.length > 0) {
            await fb.fluxbase.execute(`UPDATE RoadmapItem SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = '${fb.escapeSql(String(nextLocked[0].id))}'`)
            mlIntervention.actionDetails = `Unlocked: ${nextLocked[0].title}. ${mlIntervention.actionDetails}`
          }
        }
      }
    }

    return NextResponse.json({
      progress,
      adaptation: mlAdaptation ? {
        adaptation: mlAdaptation.state,
        explanation: mlIntervention?.message || '',
        changes: mlIntervention?.actionDetails || '',
        mlInsights: {
          confidence: mlAdaptation.confidence,
          riskFactors: mlAdaptation.riskFactors,
          strengths: mlAdaptation.strengths,
          predictedCompletionWeeks: mlAdaptation.predictedCompletionWeeks,
          dropoffRisk: mlAdaptation.dropoffRisk,
        },
      } : null,
    })
  } catch (error) {
    const err = dbError(error, 'UpdateProgress')
    return NextResponse.json({ error: err.error }, { status: err.status })
  }
}
