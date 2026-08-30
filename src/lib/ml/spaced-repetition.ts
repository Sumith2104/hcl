/**
 * Free Spaced Repetition Scheduler (FSRS) & Forgetting Curve ML Model
 * 
 * Implements a modern power-law forgetting curve:
 * R(t, S) = (1 + factor * (t / S))^(-w)
 * 
 * Computes dynamic memory stability (S), difficulty (D), and retrievability (R).
 */

export interface FSRSCardState {
  stability: number;   // Days until retrievability falls to 90%
  difficulty: number;  // Inherent card difficulty [1, 10]
  reps: number;        // Review count
  lapses: number;      // Failure count
  lastReview: Date;    // Timestamp of last review
  nextReview: Date;    // Timestamp of scheduled next review
}

export type ReviewGrade = 1 | 2 | 3 | 4; // 1: Again (Fail), 2: Hard, 3: Good, 4: Easy

export const FSRS_DECAY_WEIGHT = 0.5;
export const FSRS_FACTOR = 19 / 81; // Calibration factor for 90% request retention

/**
 * Calculates current retrievability probability R at elapsed time t (in days)
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + FSRS_FACTOR * (elapsedDays / stability), -FSRS_DECAY_WEIGHT);
}

/**
 * Updates card memory state based on user review performance (Grade 1-4)
 */
export function scheduleNextReview(
  currentState: Partial<FSRSCardState> = {},
  grade: ReviewGrade = 3,
  now: Date = new Date()
): FSRSCardState {
  const currentStability = currentState.stability || 1.0;
  const currentDifficulty = currentState.difficulty || 5.0;
  const reps = (currentState.reps || 0) + 1;
  const lastReview = currentState.lastReview ? new Date(currentState.lastReview) : now;
  const elapsedDays = Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));

  let lapses = currentState.lapses || 0;
  let newDifficulty = currentDifficulty;
  let newStability = currentStability;

  // 1. Difficulty Update: D' = D - w * (Grade - 3)
  const difficultyDelta = (3 - grade) * 0.7;
  newDifficulty = Math.max(1.0, Math.min(10.0, currentDifficulty + difficultyDelta));

  // 2. Stability Update
  if (grade === 1) {
    // Lapse (failed recall)
    lapses += 1;
    newStability = Math.max(0.4, currentStability * 0.25);
  } else {
    // Successful recall
    const retrievability = calculateRetrievability(elapsedDays, currentStability);
    // Stability Growth: S' = S * (1 + C * (11 - D) * S^(-0.2) * (e^(w*(1-R)) - 1))
    const recallBonus = Math.exp((1 - retrievability) * 0.5) - 1;
    const gradeMultiplier = grade === 4 ? 1.4 : grade === 3 ? 1.0 : 0.7;
    const growth = 1 + (11 - newDifficulty) * 0.15 * Math.pow(currentStability, -0.2) * (1 + recallBonus) * gradeMultiplier;
    newStability = Math.max(0.5, currentStability * growth);
  }

  // 3. Next Review Interval (in days)
  const intervalDays = Math.max(1, Math.round(newStability));
  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    stability: Number(newStability.toFixed(2)),
    difficulty: Number(newDifficulty.toFixed(2)),
    reps,
    lapses,
    lastReview: now,
    nextReview,
  };
}
