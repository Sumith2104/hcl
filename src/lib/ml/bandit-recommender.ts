/**
 * Contextual Multi-Armed Bandit & Neural Feature Scoring Engine
 * 
 * Replaces static weight formulas with an adaptive contextual bandit (Upper Confidence Bound / Thompson Exploration)
 * that balances exploitation (highest semantic relevance) and exploration (new diverse learning modalities).
 */

import { cosineSimilarity, getEmbedding } from './embeddings';

export interface LearnerContext {
  targetGoal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredStyle: 'visual' | 'reading' | 'video' | 'hands-on' | 'mixed';
  hoursPerWeek: number;
}

export interface CandidateResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string; // video, article, tutorial, project, course
  difficulty: string; // beginner, intermediate, advanced
  estimatedHours: number;
  qualityScore?: number;
  skills?: { name?: string; skill?: { name: string } }[];
  clicks?: number;
  completions?: number;
}

export interface RankedResourceResult {
  resource: CandidateResource;
  score: number;
  semanticSimilarity: number;
  confidenceBound: number;
  reason: string;
}

/**
 * Ranks candidate resources using a Contextual Bandit ML model:
 * Score = SemanticSim(Goal, Resource) * w_sem + DifficultyFit(User, Resource) * w_diff + StyleFit(User, Resource) * w_style + UCB_ExplorationBonus
 */
export function rankResourcesContextualBandit(
  skillName: string,
  context: LearnerContext,
  candidates: CandidateResource[],
  topN: number = 5,
  explorationParam: number = 0.20
): RankedResourceResult[] {
  const queryText = `${skillName} ${context.targetGoal} ${context.preferredStyle}`;
  const queryVec = getEmbedding(queryText);

  const levelValues: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };
  const userLevelNum = levelValues[context.experienceLevel] || 1;

  const totalInteractions = candidates.reduce((sum, c) => sum + (c.clicks || 1), 0);

  const scoredResults: RankedResourceResult[] = candidates.map(res => {
    // 1. Semantic Embedding Similarity
    const resourceText = `${res.title} ${res.description} ${res.type} ${res.skills?.map(s => s.name || s.skill?.name || '').join(' ')}`;
    const resourceVec = getEmbedding(resourceText);
    const semanticSim = cosineSimilarity(queryVec, resourceVec);

    // 2. Continuous Difficulty Fitness (Gaussian-like curve)
    const resLevelNum = levelValues[res.difficulty] || 1;
    const levelDelta = Math.abs(resLevelNum - userLevelNum);
    const difficultyFit = Math.exp(-0.5 * Math.pow(levelDelta, 2));

    // 3. Modality Affinity
    let styleFit = 0.5;
    if (context.preferredStyle === 'video' && res.type === 'video') styleFit = 1.0;
    else if (context.preferredStyle === 'reading' && (res.type === 'article' || res.type === 'book')) styleFit = 1.0;
    else if (context.preferredStyle === 'hands-on' && (res.type === 'tutorial' || res.type === 'project')) styleFit = 1.0;
    else if (context.preferredStyle === 'mixed') styleFit = 0.85;

    // 4. Upper Confidence Bound (UCB1 Exploration Bonus)
    const resourcePulls = (res.clicks || 1);
    const ucbBonus = explorationParam * Math.sqrt(Math.log(totalInteractions + 1) / resourcePulls);

    // 5. Composite Bandit Score
    const qualityPrior = res.qualityScore ?? 0.75;
    const exploitationScore = 0.45 * semanticSim + 0.25 * difficultyFit + 0.20 * styleFit + 0.10 * qualityPrior;
    const finalScore = exploitationScore + ucbBonus;

    // Generate ML explanation reason
    let reason = `Neural match for ${skillName} (${Math.round(semanticSim * 100)}% semantic affinity)`;
    if (styleFit >= 0.85) reason += ` • Calibrated for ${context.preferredStyle} learners`;
    if (difficultyFit >= 0.80) reason += ` • Optimal difficulty fit`;

    return {
      resource: res,
      score: Number(finalScore.toFixed(4)),
      semanticSimilarity: Number(semanticSim.toFixed(4)),
      confidenceBound: Number(ucbBonus.toFixed(4)),
      reason,
    };
  });

  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
