import { Resource, ExperienceLevel, LearningStyle, RoadmapResource } from '../db/schema';
import { fluxbase } from '../db/fluxbase';

export interface RecommendationContext {
  skillId: string;
  userLevel: ExperienceLevel | 'none';
  preferredStyle: LearningStyle;
  targetRole: string;
}

export class RecommendationEngine {
  public async rankResourcesForSkill(
    context: RecommendationContext,
    roadmapItemId: string
  ): Promise<RoadmapResource[]> {
    const candidateResources = await fluxbase.getResourcesForSkill(context.skillId);
    if (candidateResources.length === 0) {
      // Fallback to any high quality resource
      const all = await fluxbase.getAllResources();
      candidateResources.push(...all.slice(0, 2));
    }

    const ranked: RoadmapResource[] = [];

    for (const res of candidateResources) {
      // 1. Skill Match (0.40)
      const skillMatch = res.skill_ids.includes(context.skillId) ? 1.0 : 0.5;

      // 2. Difficulty Match (0.25)
      const diffScore = this.calculateDifficultyMatch(res.difficulty, context.userLevel);

      // 3. Preference Match (0.15)
      const prefScore = this.calculatePreferenceMatch(res.type, context.preferredStyle);

      // 4. Quality Score (0.20)
      const qualityScore = res.quality_score;

      const finalScore = Number(
        (skillMatch * 0.40 + diffScore * 0.25 + prefScore * 0.15 + qualityScore * 0.20).toFixed(3)
      );

      // Generate explainable rationale
      const reason = this.generateRecommendationReason(res, context, finalScore);

      ranked.push({
        id: `rm_res_${Date.now()}_${res.id}`,
        roadmap_item_id: roadmapItemId,
        resource_id: res.id,
        recommendation_reason: reason,
        ranking_score: finalScore,
        match_breakdown: {
          skill_match: skillMatch,
          difficulty_match: diffScore,
          preference_match: prefScore,
          quality_score: qualityScore
        }
      });
    }

    // Sort descending by ranking score
    ranked.sort((a, b) => b.ranking_score - a.ranking_score);
    return ranked;
  }

  private calculateDifficultyMatch(resDiff: ExperienceLevel, userLevel: ExperienceLevel | 'none'): number {
    const diffMap: Record<ExperienceLevel | 'none', number> = {
      none: 1,
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };
    const resRank = diffMap[resDiff];
    const userRank = diffMap[userLevel];
    const distance = Math.abs(resRank - userRank);
    if (distance === 0) return 1.0;
    if (distance === 1) return 0.8;
    if (distance === 2) return 0.5;
    return 0.3;
  }

  private calculatePreferenceMatch(resType: Resource['type'], style: LearningStyle): number {
    if (style === 'hands-on' && resType === 'interactive_project') return 1.0;
    if (style === 'visual' && (resType === 'video_series' || resType === 'course')) return 1.0;
    if (style === 'reading' && (resType === 'documentation' || resType === 'book')) return 1.0;
    if (style === 'structured' && resType === 'course') return 1.0;
    return 0.7;
  }

  private generateRecommendationReason(
    res: Resource,
    context: RecommendationContext,
    score: number
  ): string {
    const stylePhrases: Record<LearningStyle, string> = {
      'hands-on': 'provides practical coding exercises and direct implementation sandbox',
      'visual': 'features structured visual demonstrations and architectural diagrams',
      'reading': 'offers deep technical specifications and authoritative documentation',
      'structured': 'follows a comprehensive syllabus with rigorous milestone checkpoints'
    };

    return `Recommended (Match Score: ${(score * 100).toFixed(0)}%) because it ${stylePhrases[context.preferredStyle] || 'provides high quality domain coverage'} tailored for ${context.targetRole} requirements.`;
  }
}

export const recommendationEngine = new RecommendationEngine();
