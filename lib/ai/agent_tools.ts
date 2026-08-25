import { fluxbase } from '../db/fluxbase';
import { Skill, Resource, SkillPrerequisite, RoleSkillRequirement, LearnerProfile, Roadmap } from '../db/schema';
import { skillGapEngine } from './skill_gap';
import { prerequisiteEngine } from './prerequisites';
import { recommendationEngine } from './recommendation';

export interface AgentToolCall {
  tool: string;
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'failed';
}

export interface AgentReasoningStep {
  thought: string;
  action?: string;
  actionInput?: Record<string, any>;
  observation?: any;
}

// --- Live Fluxbase Agent Tools ---
export const AGENT_TOOLS = {
  // 1. Search Canonical Skills in Fluxbase
  async search_curriculum_skills(args: { keyword?: string; category?: string }): Promise<Skill[]> {
    let sql = 'SELECT id, name, category, description, aliases, difficulty_base FROM skills';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (args.category) {
      params.push(args.category);
      conditions.push(`category = $${params.length}`);
    }
    if (args.keyword) {
      params.push(`%${args.keyword.toLowerCase()}%`);
      conditions.push(`(LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(aliases) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY category, name;';

    const res = await fluxbase.executeSql<Skill>(sql, params);
    if (res.success && res.rows.length > 0) {
      return res.rows.map(r => ({
        ...r,
        aliases: typeof r.aliases === 'string' ? (r.aliases as string).split(',').map(s => s.trim()) : (r.aliases || [])
      }));
    }
    return await fluxbase.getAllSkills();
  },

  // 2. Fetch Prerequisite Graph Edges from Fluxbase
  async get_skill_prerequisites(args: { skillId?: string }): Promise<SkillPrerequisite[]> {
    let sql = 'SELECT id, skill_id, prerequisite_skill_id, importance FROM skill_prerequisites';
    const params: unknown[] = [];
    if (args.skillId) {
      sql += ' WHERE skill_id = $1';
      params.push(args.skillId);
    }
    const res = await fluxbase.executeSql<SkillPrerequisite>(sql, params);
    if (res.success && res.rows.length > 0) {
      return res.rows;
    }
    return await fluxbase.getPrerequisites();
  },

  // 3. Query Role Benchmarks from Fluxbase
  async get_role_benchmark(args: { targetRole: string }): Promise<RoleSkillRequirement[]> {
    const res = await fluxbase.executeSql<RoleSkillRequirement>(
      'SELECT id, target_role, skill_id, required_level, importance, sequence_weight FROM role_skill_requirements WHERE LOWER(target_role) LIKE $1 ORDER BY sequence_weight ASC;',
      [`%${args.targetRole.toLowerCase()}%`]
    );
    if (res.success && res.rows.length > 0) {
      return res.rows;
    }
    return await fluxbase.getRoleRequirements(args.targetRole);
  },

  // 4. Query Learning Resources from Fluxbase
  async search_resources(args: { skillId?: string; type?: string; difficulty?: string }): Promise<Resource[]> {
    let sql = 'SELECT * FROM resources';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (args.type) {
      params.push(args.type);
      conditions.push(`type = $${params.length}`);
    }
    if (args.difficulty) {
      params.push(args.difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY quality_score DESC;';

    const res = await fluxbase.executeSql<Resource>(sql, params);
    let resources = (res.success && res.rows.length > 0) ? res.rows : await fluxbase.getAllResources();

    if (args.skillId) {
      resources = resources.filter(r => {
        const skillIds = Array.isArray(r.skill_ids) ? r.skill_ids : typeof r.skill_ids === 'string' ? (r.skill_ids as string).split(',').map(s => s.trim()) : [];
        return skillIds.includes(args.skillId!);
      });
    }

    return resources;
  },

  // 5. Run Deterministic Skill Gap Analysis
  async analyze_skill_gaps(args: { targetRole: string; userSkills: Array<{ skill: string; level: string }> }) {
    const userAssessments = args.userSkills.map(s => ({
      skillId: s.skill.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      skillName: s.skill,
      currentLevel: s.level as any,
      confidence: 0.85
    }));

    return await skillGapEngine.analyzeGaps(args.targetRole, userAssessments);
  },

  // 6. Calculate Prerequisite DAG Ordering
  async calculate_topological_phases(args: { gapSkills: any[]; hoursPerWeek: number; targetDurationWeeks: number }) {
    return await prerequisiteEngine.orderAndPhaseSkills(
      args.gapSkills,
      args.hoursPerWeek || 14,
      args.targetDurationWeeks || 16
    );
  },

  // 7. Persist Learner Profile to Fluxbase
  async persist_learner_profile(args: { userId: string; profile: Partial<LearnerProfile> }) {
    const fullProfile: LearnerProfile = {
      id: `prof_${args.userId}`,
      user_id: args.userId,
      target_goal: args.profile.target_goal || 'Software Mastery',
      experience_level: args.profile.experience_level || 'intermediate',
      available_hours_per_week: args.profile.available_hours_per_week || 14,
      preferred_learning_style: args.profile.preferred_learning_style || 'hands-on',
      interests: args.profile.interests || [],
      target_duration_weeks: args.profile.target_duration_weeks || 16,
      current_skills_raw: args.profile.current_skills_raw || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await fluxbase.saveProfile(fullProfile);
  },

  // 8. Fetch Active Roadmap for User
  async get_active_roadmap(args: { userId: string }): Promise<Roadmap | null> {
    return await fluxbase.getActiveRoadmap(args.userId);
  }
};
