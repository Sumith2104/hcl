import { Skill, RoleSkillRequirement, ExperienceLevel } from '../db/schema';
import { fluxbase } from '../db/fluxbase';

export interface UserSkillAssessment {
  skillId: string;
  skillName: string;
  currentLevel: ExperienceLevel;
  confidence: number;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: Skill['category'];
  currentLevel: ExperienceLevel | 'none';
  requiredLevel: ExperienceLevel;
  gapType: 'missing' | 'upgrade_required' | 'satisfied';
  importance: RoleSkillRequirement['importance'];
  sequenceWeight: number;
}

export interface SkillGapAnalysisResult {
  targetRole: string;
  totalRequiredSkills: number;
  satisfiedSkillsCount: number;
  gapSkillsCount: number;
  gapPercentage: number;
  knownSkills: SkillGapItem[];
  gapSkills: SkillGapItem[];
}

const LEVEL_RANK: Record<ExperienceLevel | 'none', number> = {
  none: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
};

export class SkillGapEngine {
  public async analyzeGaps(
    targetRole: string,
    userSkills: UserSkillAssessment[]
  ): Promise<SkillGapAnalysisResult> {
    const roleRequirements = await fluxbase.getRoleRequirements(targetRole);
    const allSkills = await fluxbase.getAllSkills();
    const skillMap = new Map<string, Skill>(allSkills.map(s => [s.id, s]));

    const userSkillMap = new Map<string, UserSkillAssessment>();
    for (const us of userSkills) {
      userSkillMap.set(us.skillId, us);
    }

    const knownSkills: SkillGapItem[] = [];
    const gapSkills: SkillGapItem[] = [];

    for (const req of roleRequirements) {
      const skill = skillMap.get(req.skill_id);
      const skillName = skill ? skill.name : req.skill_id;
      const category = skill ? skill.category : 'ai_ml';
      const userSkill = userSkillMap.get(req.skill_id);
      const currentLevel = userSkill ? userSkill.currentLevel : 'none';

      const currentRank = LEVEL_RANK[currentLevel];
      const requiredRank = LEVEL_RANK[req.required_level];

      if (currentRank >= requiredRank) {
        knownSkills.push({
          skillId: req.skill_id,
          skillName,
          category,
          currentLevel,
          requiredLevel: req.required_level,
          gapType: 'satisfied',
          importance: req.importance,
          sequenceWeight: req.sequence_weight
        });
      } else {
        gapSkills.push({
          skillId: req.skill_id,
          skillName,
          category,
          currentLevel,
          requiredLevel: req.required_level,
          gapType: currentRank === 0 ? 'missing' : 'upgrade_required',
          importance: req.importance,
          sequenceWeight: req.sequence_weight
        });
      }
    }

    // Sort gaps by importance (must_have first) and sequence weight
    gapSkills.sort((a, b) => {
      const impWeight = { must_have: 3, core: 2, nice_to_have: 1 };
      if (impWeight[b.importance] !== impWeight[a.importance]) {
        return impWeight[b.importance] - impWeight[a.importance];
      }
      return a.sequenceWeight - b.sequenceWeight;
    });

    const totalRequired = roleRequirements.length;
    const satisfied = knownSkills.length;
    const gapCount = gapSkills.length;
    const gapPercentage = totalRequired > 0 ? Math.round((gapCount / totalRequired) * 100) : 0;

    return {
      targetRole,
      totalRequiredSkills: totalRequired,
      satisfiedSkillsCount: satisfied,
      gapSkillsCount: gapCount,
      gapPercentage,
      knownSkills,
      gapSkills
    };
  }
}

export const skillGapEngine = new SkillGapEngine();
