import { fluxbase } from '../db/fluxbase';
import { Roadmap, RoadmapItem, LearnerProfile, UserSkill } from '../db/schema';
import { goalAnalyzer, ExtractedProfileData } from './goal_analyzer';
import { skillGapEngine, UserSkillAssessment } from './skill_gap';
import { prerequisiteEngine } from './prerequisites';
import { recommendationEngine } from './recommendation';
import { bedrock } from '../aws/bedrock';
import { costGuard } from './cost_guard';

export class LearningOrchestrator {
  public async generatePersonalizedRoadmap(
    userId: string,
    profile?: LearnerProfile
  ): Promise<Roadmap> {
    const userProfile = profile || (await fluxbase.getProfile(userId));
    if (!userProfile) {
      throw new Error(`Learner profile not found for user ${userId}.`);
    }

    await costGuard.checkBudget(userId);

    // 1. Convert profile current skills to assessments
    const allSkills = await fluxbase.getAllSkills();
    const userSkillAssessments: UserSkillAssessment[] = [];

    if (userProfile.current_skills_raw && userProfile.current_skills_raw.length > 0) {
      for (const raw of userProfile.current_skills_raw) {
        // Match canonical skill
        const matched = await fluxbase.findSkillByNameOrAlias(raw.split('(')[0].trim());
        if (matched) {
          const isIntermediate = raw.includes('intermediate') || raw.includes('advanced');
          userSkillAssessments.push({
            skillId: matched.id,
            skillName: matched.name,
            currentLevel: isIntermediate ? 'intermediate' : 'beginner',
            confidence: 0.85
          });
        }
      }
    }

    // Default basic python skill if none provided
    if (userSkillAssessments.length === 0) {
      userSkillAssessments.push({
        skillId: 'prog_python',
        skillName: 'Python Programming',
        currentLevel: 'intermediate',
        confidence: 0.8
      });
    }

    // 2. Deterministic Skill Gap Engine
    const targetRole = userProfile.target_goal || 'AI Engineer';
    const gapAnalysis = await skillGapEngine.analyzeGaps(targetRole, userSkillAssessments);

    // 3. Prerequisite Graph Ordering (Topological Sort)
    const phases = await prerequisiteEngine.orderAndPhaseSkills(
      gapAnalysis.gapSkills,
      userProfile.available_hours_per_week,
      userProfile.target_duration_weeks
    );

    // 4. Build Roadmap & Items
    const roadmapId = `rm_${Date.now()}`;
    const roadmapItems: RoadmapItem[] = [];
    let sequenceCounter = 1;

    for (const phase of phases) {
      for (const item of phase.skills) {
        const itemId = `item_${roadmapId}_${sequenceCounter}`;
        const isFirst = sequenceCounter === 1;

        // Rank resources for this skill
        const resources = await recommendationEngine.rankResourcesForSkill(
          {
            skillId: item.skillId,
            userLevel: item.currentLevel,
            preferredStyle: userProfile.preferred_learning_style,
            targetRole
          },
          itemId
        );

        roadmapItems.push({
          id: itemId,
          roadmap_id: roadmapId,
          skill_id: item.skillId,
          skill_name: item.skillName,
          sequence_order: sequenceCounter,
          phase: phase.phaseNumber,
          phase_title: phase.phaseTitle,
          estimated_hours: Math.round(phase.estimatedHours / Math.max(1, phase.skills.length)),
          status: isFirst ? 'in_progress' : 'locked',
          milestone: phase.milestone,
          milestone_project: phase.milestoneProject,
          prerequisite_skill_ids: [],
          ai_explanation: `Crucial foundation for mastering ${targetRole}. Builds required competency in ${item.skillName}.`,
          resources
        });

        sequenceCounter++;
      }
    }

    const totalHours = roadmapItems.reduce((acc, i) => acc + i.estimated_hours, 0);

    const fullRoadmap: Roadmap = {
      id: roadmapId,
      user_id: userId,
      target_goal: userProfile.target_goal,
      target_role: targetRole,
      total_phases: phases.length,
      estimated_duration_weeks: userProfile.target_duration_weeks || 16,
      total_hours: totalHours,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: roadmapItems
    };

    await fluxbase.saveRoadmap(fullRoadmap);

    // Log LLM orchestration usage
    await costGuard.logUsage({
      userId,
      endpoint: 'roadmaps/generate',
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      provider: 'simulated_bedrock',
      inputTokens: 420,
      outputTokens: 250,
      estimatedCostUsd: 0.005,
      latencyMs: 450
    });

    return fullRoadmap;
  }
}

export const orchestrator = new LearningOrchestrator();
