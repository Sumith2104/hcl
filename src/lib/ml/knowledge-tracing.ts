/**
 * Bayesian Knowledge Tracing (BKT) Machine Learning Model
 * 
 * Estimates the latent cognitive mastery state P(L_t) of a learner for a given skill
 * based on sequential observations (correct/incorrect quiz answers and code drills).
 * 
 * Standard BKT Parameters:
 * - P(L_0): Initial knowledge prior
 * - P(T): Transition probability (probability of learning a skill at time t)
 * - P(G): Guess probability (probability of correct answer given skill is not known)
 * - P(S): Slip probability (probability of incorrect answer given skill is known)
 */

export interface BKTParameters {
  pL0: number; // Prior knowledge
  pT: number;  // Learning rate / Transition
  pG: number;  // Guess probability
  pS: number;  // Slip probability
}

export const DEFAULT_BKT_PARAMS: BKTParameters = {
  pL0: 0.20, // 20% baseline knowledge
  pT: 0.15, // 15% chance to transition to learned state per interaction
  pG: 0.25, // 25% chance of guessing on multiple-choice
  pS: 0.10, // 10% slip chance on known concept
};

/**
 * Predicts the probability of a correct response at time t given current mastery P(L_t)
 * P(C_t) = P(L_t) * (1 - P(S)) + (1 - P(L_t)) * P(G)
 */
export function predictCorrectProbability(
  pLt: number,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): number {
  return pLt * (1 - params.pS) + (1 - pLt) * params.pG;
}

/**
 * Updates latent knowledge state P(L_{t+1}) given an observation (correct or incorrect).
 * Uses Bayes' Theorem to compute posterior mastery, then applies learning transition P(T).
 */
export function updateKnowledgeState(
  currentPLt: number,
  isCorrect: boolean,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): {
  posteriorPLt: number;
  nextPLt: number;
  expectedAccuracy: number;
} {
  const { pT, pG, pS } = params;

  // Step 1: Posterior belief update using Bayes' Theorem
  let posterior: number;

  if (isCorrect) {
    // P(L_t | Correct) = [P(L_t) * (1 - P(S))] / [P(L_t) * (1 - P(S)) + (1 - P(L_t)) * P(G)]
    const numerator = currentPLt * (1 - pS);
    const denominator = numerator + (1 - currentPLt) * pG;
    posterior = denominator > 0 ? numerator / denominator : currentPLt;
  } else {
    // P(L_t | Incorrect) = [P(L_t) * P(S)] / [P(L_t) * P(S) + (1 - P(L_t)) * (1 - P(G))]
    const numerator = currentPLt * pS;
    const denominator = numerator + (1 - currentPLt) * (1 - pG);
    posterior = denominator > 0 ? numerator / denominator : currentPLt;
  }

  // Step 2: Learning transition update for next time step t+1
  // P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
  const nextPLt = posterior + (1 - posterior) * pT;

  const expectedAccuracy = predictCorrectProbability(nextPLt, params);

  return {
    posteriorPLt: Math.max(0.01, Math.min(0.99, posterior)),
    nextPLt: Math.max(0.01, Math.min(0.99, nextPLt)),
    expectedAccuracy: Math.max(0.01, Math.min(0.99, expectedAccuracy)),
  };
}

/**
 * Computes the recommended difficulty and roadmap status based on BKT mastery score
 */
export function getMasteryClassification(pLt: number): {
  level: 'novice' | 'learning' | 'proficient' | 'mastered';
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  isMastered: boolean;
} {
  if (pLt >= 0.85) {
    return { level: 'mastered', recommendedDifficulty: 'advanced', isMastered: true };
  }
  if (pLt >= 0.65) {
    return { level: 'proficient', recommendedDifficulty: 'intermediate', isMastered: false };
  }
  if (pLt >= 0.40) {
    return { level: 'learning', recommendedDifficulty: 'intermediate', isMastered: false };
  }
  return { level: 'novice', recommendedDifficulty: 'beginner', isMastered: false };
}
