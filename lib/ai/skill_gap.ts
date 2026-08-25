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
    let roleRequirements = await fluxbase.getRoleRequirements(targetRole);

    // If role requirements are not found in DB for this custom role, dynamically synthesize a specialized competency matrix
    if (roleRequirements.length === 0) {
      roleRequirements = await this.synthesizeRoleRequirements(targetRole);
    }

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
      const skillName = skill ? skill.name : this.formatSkillName(req.skill_id);
      const category = skill ? skill.category : 'programming';
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

    const total = roleRequirements.length;
    const satisfied = knownSkills.length;
    const gapCount = gapSkills.length;
    const gapPct = total > 0 ? Math.round((gapCount / total) * 100) : 0;

    return {
      targetRole,
      totalRequiredSkills: total,
      satisfiedSkillsCount: satisfied,
      gapSkillsCount: gapCount,
      gapPercentage: gapPct,
      knownSkills,
      gapSkills
    };
  }

  private async synthesizeRoleRequirements(targetRole: string): Promise<RoleSkillRequirement[]> {
    const rLower = targetRole.toLowerCase();

    if (rLower.includes('dsa') || rLower.includes('data structure') || rLower.includes('algorithm')) {
      return [
        { id: `req_dsa_1`, target_role: targetRole, skill_id: 'prog_python', required_level: 'intermediate', importance: 'must_have', sequence_weight: 1 },
        { id: `req_dsa_2`, target_role: targetRole, skill_id: 'dsa_time_complexity', required_level: 'intermediate', importance: 'must_have', sequence_weight: 2 },
        { id: `req_dsa_3`, target_role: targetRole, skill_id: 'dsa_arrays_hashing', required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
        { id: `req_dsa_4`, target_role: targetRole, skill_id: 'dsa_two_pointers_sliding', required_level: 'advanced', importance: 'must_have', sequence_weight: 4 },
        { id: `req_dsa_5`, target_role: targetRole, skill_id: 'dsa_linked_lists_stacks', required_level: 'intermediate', importance: 'core', sequence_weight: 5 },
        { id: `req_dsa_6`, target_role: targetRole, skill_id: 'dsa_binary_trees_bst', required_level: 'advanced', importance: 'must_have', sequence_weight: 6 },
        { id: `req_dsa_7`, target_role: targetRole, skill_id: 'dsa_heaps_priority_queues', required_level: 'intermediate', importance: 'core', sequence_weight: 7 },
        { id: `req_dsa_8`, target_role: targetRole, skill_id: 'dsa_graph_algorithms', required_level: 'advanced', importance: 'must_have', sequence_weight: 8 },
        { id: `req_dsa_9`, target_role: targetRole, skill_id: 'dsa_dynamic_programming', required_level: 'advanced', importance: 'must_have', sequence_weight: 9 }
      ];
    }

    // Default dynamic requirements for arbitrary custom role
    const basePrefix = targetRole.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 8);
    return [
      { id: `req_${basePrefix}_1`, target_role: targetRole, skill_id: 'prog_python', required_level: 'intermediate', importance: 'must_have', sequence_weight: 1 },
      { id: `req_${basePrefix}_2`, target_role: targetRole, skill_id: `${basePrefix}_foundations`, required_level: 'intermediate', importance: 'must_have', sequence_weight: 2 },
      { id: `req_${basePrefix}_3`, target_role: targetRole, skill_id: `${basePrefix}_core_architecture`, required_level: 'advanced', importance: 'must_have', sequence_weight: 3 },
      { id: `req_${basePrefix}_4`, target_role: targetRole, skill_id: `${basePrefix}_advanced_patterns`, required_level: 'advanced', importance: 'core', sequence_weight: 4 },
      { id: `req_${basePrefix}_5`, target_role: targetRole, skill_id: `${basePrefix}_production_capstone`, required_level: 'expert', importance: 'must_have', sequence_weight: 5 }
    ];
  }

  private formatSkillName(skillId: string): string {
    return skillId
      .replace(/^(dsa_|prog_|sys_|ai_|req_)/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

export const skillGapEngine = new SkillGapEngine();
