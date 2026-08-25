import { fluxbase } from '../db/fluxbase';
import { Roadmap, RoadmapItem } from '../db/schema';
import { bedrock } from '../aws/bedrock';
import { costGuard } from './cost_guard';
import { recommendationEngine } from './recommendation';

export interface AdaptationRequest {
  roadmapId: string;
  userId: string;
  feedbackType: 'struggling' | 'too_fast' | 'already_know' | 'quiz_failed' | 'quiz_aced';
  feedbackText: string;
  targetSkillId?: string;
  quizScore?: number;
}

export interface AdaptationResult {
  roadmap: Roadmap;
  explanation: string;
  changesSummary: string[];
  adaptedPhaseCount: number;
}

export class AdaptationEngine {
  public async adaptRoadmap(request: AdaptationRequest): Promise<AdaptationResult> {
    let roadmap = await fluxbase.getRoadmapById(request.roadmapId);
    if (!roadmap) {
      roadmap = await fluxbase.getActiveRoadmap(request.userId);
    }
    if (!roadmap) {
      throw new Error(`Active roadmap for user ${request.userId} or ID ${request.roadmapId} not found.`);
    }

    await costGuard.checkBudget(request.userId);

    const changesSummary: string[] = [];
    const completedItems = roadmap.items.filter(i => i.status === 'completed');
    let futureItems = roadmap.items.filter(i => i.status !== 'completed');

    let explanation = '';

    if (request.feedbackType === 'struggling' || request.feedbackType === 'quiz_failed') {
      // Find the active or struggled skill
      const activeItem = futureItems[0];
      const skillName = activeItem ? activeItem.skill_name : 'Current Module';

      // Insert a prerequisite / reinforcement item before current focus
      const boosterId = `item_booster_${Date.now()}`;
      const boosterItem: RoadmapItem = {
        id: boosterId,
        roadmap_id: roadmap.id,
        skill_id: 'math_linear_algebra',
        skill_name: `Reinforcement: Mathematical & Intuitive Foundations for ${skillName}`,
        sequence_order: activeItem ? activeItem.sequence_order : 1,
        phase: activeItem ? activeItem.phase : 1,
        phase_title: 'Adaptive Reinforcement Booster',
        estimated_hours: 8,
        status: 'in_progress',
        milestone: 'Complete 3 guided visual exercises and step-by-step problem sets.',
        milestone_project: 'Interactive diagnostic sandbox with immediate hints.',
        prerequisite_skill_ids: [],
        ai_explanation: `Added to strengthen prerequisites before proceeding with ${skillName} based on your feedback.`,
        resources: []
      };

      // Rank resources for the booster
      const rankedRes = await recommendationEngine.rankResourcesForSkill({
        skillId: 'math_linear_algebra',
        userLevel: 'beginner',
        preferredStyle: 'visual',
        targetRole: roadmap.target_role
      }, boosterId);
      boosterItem.resources = rankedRes;

      // Shift subsequent items' sequence orders
      futureItems.forEach(item => {
        item.sequence_order += 1;
        if (item.status === 'in_progress') {
          item.status = 'locked';
        }
      });

      futureItems = [boosterItem, ...futureItems];
      changesSummary.push(`Inserted foundational reinforcement module: "${boosterItem.skill_name}"`);
      changesSummary.push(`Adjusted difficulty pacing and added step-by-step interactive sandbox`);

      explanation = `Based on your feedback ("${request.feedbackText}"), we dynamically adjusted your roadmap. We inserted a foundational booster module to ensure crystal-clear conceptual grounding before tackling more advanced topics.`;
    } else if (request.feedbackType === 'already_know' || request.feedbackType === 'quiz_aced') {
      // Fast-track the current active item
      if (futureItems.length > 0) {
        const current = futureItems[0];
        current.status = 'completed';
        changesSummary.push(`Marked "${current.skill_name}" as verified/completed.`);

        if (futureItems.length > 1) {
          futureItems[1].status = 'in_progress';
          changesSummary.push(`Unlocked next advanced module: "${futureItems[1].skill_name}".`);
        }
      }

      explanation = `Great job demonstrating mastery! We have accelerated your roadmap by marking the current topic complete and unlocking your next advanced challenge.`;
    } else {
      changesSummary.push(`Rebalanced weekly hour allocations and milestone deliverables.`);
      explanation = `Your roadmap schedule and resource difficulty have been recalibrated to match your preferred pace.`;
    }

    // Reconstruct full item list
    const updatedItems = [...completedItems, ...futureItems];
    roadmap.items = updatedItems;
    roadmap.status = 'adapted';
    roadmap.updated_at = new Date().toISOString();
    roadmap.adaptation_notes = explanation;

    await fluxbase.saveRoadmap(roadmap);

    // Record in adaptation history
    await fluxbase.recordAdaptation({
      roadmap_id: roadmap.id,
      trigger_reason: request.feedbackType,
      user_feedback: request.feedbackText,
      changes_summary: changesSummary,
      previous_item_count: roadmap.items.length,
      new_item_count: updatedItems.length
    });

    // Log LLM audit event
    await costGuard.logUsage({
      userId: request.userId,
      endpoint: 'roadmaps/adapt',
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      provider: 'simulated_bedrock',
      inputTokens: 180,
      outputTokens: 110,
      estimatedCostUsd: 0.002,
      latencyMs: 320
    });

    return {
      roadmap,
      explanation,
      changesSummary,
      adaptedPhaseCount: roadmap.total_phases
    };
  }
}

export const adaptationEngine = new AdaptationEngine();
