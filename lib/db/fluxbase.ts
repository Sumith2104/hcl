import {
  User,
  LearnerProfile,
  Skill,
  SkillPrerequisite,
  RoleSkillRequirement,
  Resource,
  Roadmap,
  RoadmapItem,
  Progress,
  AsyncJob,
  LLMUsageLog,
  AdaptationHistory,
  AssessmentQuiz
} from './schema';
import {
  SEED_SKILLS,
  SEED_PREREQUISITES,
  SEED_ROLE_REQUIREMENTS,
  SEED_RESOURCES,
  SEED_QUIZZES
} from './seed';

// Fluxbase Client connecting directly to https://fluxbase.vercel.app/api/execute-sql
class FluxbaseService {
  private baseUrl: string;
  private apiKey: string;
  private projectId: string;

  // Local caching & fallbacks
  private users: Map<string, User> = new Map();
  private profiles: Map<string, LearnerProfile> = new Map();
  private skills: Map<string, Skill> = new Map();
  private prerequisites: SkillPrerequisite[] = [];
  private roleRequirements: RoleSkillRequirement[] = [];
  private resources: Map<string, Resource> = new Map();
  private roadmaps: Map<string, Roadmap> = new Map();
  private progress: Map<string, Progress> = new Map();
  private jobs: Map<string, AsyncJob> = new Map();
  private usageLogs: LLMUsageLog[] = [];
  private adaptationHistory: AdaptationHistory[] = [];
  private quizzes: Map<string, AssessmentQuiz> = new Map();
  private isRemoteConfigured = false;

  constructor() {
    this.baseUrl = process.env.FLUXBASE_BASE_URL || 'https://fluxbase.vercel.app';
    this.apiKey = process.env.FLUXBASE_API_KEY || 'fl_420392f791e71034a668fec0f5f85c822c4547697c7c4cbe';
    this.projectId = process.env.FLUXBASE_PROJECT_ID || 'a3fdb50d092a4b97';
    this.isRemoteConfigured = Boolean(this.apiKey && this.projectId);

    this.initLocal();
  }

  private initLocal() {
    SEED_SKILLS.forEach(s => this.skills.set(s.id, { ...s }));
    this.prerequisites = [...SEED_PREREQUISITES];
    this.roleRequirements = [...SEED_ROLE_REQUIREMENTS];
    SEED_RESOURCES.forEach(r => this.resources.set(r.id, { ...r }));
    SEED_QUIZZES.forEach(q => this.quizzes.set(q.skill_id, { ...q }));

    const defaultUser: User = {
      id: 'usr_demo_101',
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      role: 'learner',
      created_at: new Date().toISOString()
    };
    this.users.set(defaultUser.id, defaultUser);

    const defaultProfile: LearnerProfile = {
      id: 'prof_demo_101',
      user_id: defaultUser.id,
      target_goal: 'Become an AI Engineer and build production-grade LLM applications on AWS',
      experience_level: 'intermediate',
      available_hours_per_week: 14,
      preferred_learning_style: 'hands-on',
      interests: ['AI Engineering', 'LLMs', 'Vector Databases', 'AWS Cloud'],
      target_duration_weeks: 16,
      current_skills_raw: ['Python', 'SQL', 'Data Analysis with Pandas'],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.profiles.set(defaultUser.id, defaultProfile);
  }

  // --- Direct SQL Execution against Remote Fluxbase ---
  public async executeSql<T = Record<string, unknown>>(
    query: string,
    params: unknown[] = []
  ): Promise<{ success: boolean; rows: T[]; error?: string; executionTime?: string }> {
    if (!this.isRemoteConfigured) {
      return { success: false, rows: [], error: 'Fluxbase API key or Project ID not configured' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/execute-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          projectId: this.projectId,
          query,
          params
        })
      });

      const json = await res.json();
      if (!json.success) {
        return { success: false, rows: [], error: json.error?.message || 'Query execution failed' };
      }

      return {
        success: true,
        rows: (json.result?.rows || []) as T[],
        executionTime: json.executionInfo?.time
      };
    } catch (err) {
      console.warn('Fluxbase remote query failed, continuing with cached data:', (err as Error).message);
      return { success: false, rows: [], error: (err as Error).message };
    }
  }

  public getStatus() {
    return {
      connected: this.isRemoteConfigured,
      baseUrl: this.baseUrl,
      projectId: this.projectId,
      hasApiKey: Boolean(this.apiKey)
    };
  }

  // --- Users & Profiles ---
  public async getUser(userId: string): Promise<User | null> {
    const remote = await this.executeSql<User>('SELECT * FROM users WHERE id = $1 LIMIT 1;', [userId]);
    if (remote.success && remote.rows.length > 0) {
      return remote.rows[0];
    }
    return this.users.get(userId) || null;
  }

  public async getOrCreateDefaultUser(): Promise<User> {
    const user = this.users.get('usr_demo_101')!;
    // Upsert into remote Fluxbase
    await this.executeSql(
      `INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING;`,
      [user.id, user.name, user.email, user.role]
    );
    return user;
  }

  public async getProfile(userId: string): Promise<LearnerProfile | null> {
    const remote = await this.executeSql<LearnerProfile>(
      'SELECT * FROM learner_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1;',
      [userId]
    );
    if (remote.success && remote.rows.length > 0) {
      const p = remote.rows[0];
      return {
        ...p,
        interests: typeof p.interests === 'string' ? (p.interests as string).split(',').map(s => s.trim()) : p.interests,
        current_skills_raw: typeof p.current_skills_raw === 'string' ? (p.current_skills_raw as string).split(',').map(s => s.trim()) : p.current_skills_raw
      };
    }
    return this.profiles.get(userId) || null;
  }

  public async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    this.profiles.set(profile.user_id, {
      ...profile,
      updated_at: new Date().toISOString()
    });

    // Persist to remote Fluxbase
    const interestsStr = Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests;
    const skillsRawStr = Array.isArray(profile.current_skills_raw) ? profile.current_skills_raw.join(', ') : profile.current_skills_raw;

    await this.executeSql(
      `INSERT INTO learner_profiles (id, user_id, target_goal, experience_level, available_hours_per_week, preferred_learning_style, interests, target_duration_weeks, current_skills_raw, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         target_goal = EXCLUDED.target_goal,
         experience_level = EXCLUDED.experience_level,
         available_hours_per_week = EXCLUDED.available_hours_per_week,
         preferred_learning_style = EXCLUDED.preferred_learning_style,
         interests = EXCLUDED.interests,
         target_duration_weeks = EXCLUDED.target_duration_weeks,
         current_skills_raw = EXCLUDED.current_skills_raw,
         updated_at = NOW();`,
      [
        profile.id,
        profile.user_id,
        profile.target_goal,
        profile.experience_level,
        profile.available_hours_per_week,
        profile.preferred_learning_style,
        interestsStr,
        profile.target_duration_weeks,
        skillsRawStr
      ]
    );

    return this.profiles.get(profile.user_id)!;
  }

  // --- Skills & Taxonomy ---
  public async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  public async getSkillById(id: string): Promise<Skill | null> {
    return this.skills.get(id) || null;
  }

  public async findSkillByNameOrAlias(query: string): Promise<Skill | null> {
    const clean = query.trim().toLowerCase();
    for (const skill of this.skills.values()) {
      if (skill.name.toLowerCase() === clean) return skill;
      if (skill.aliases.some(a => a.toLowerCase() === clean || clean.includes(a.toLowerCase()))) {
        return skill;
      }
    }
    return null;
  }

  public async getPrerequisites(): Promise<SkillPrerequisite[]> {
    return [...this.prerequisites];
  }

  public async getRoleRequirements(targetRole?: string): Promise<RoleSkillRequirement[]> {
    if (!targetRole) return [...this.roleRequirements];
    const clean = targetRole.toLowerCase();
    return this.roleRequirements.filter(r => 
      r.target_role.toLowerCase().includes(clean) || clean.includes(r.target_role.toLowerCase())
    );
  }

  public async getAvailableRoles(): Promise<string[]> {
    const set = new Set(this.roleRequirements.map(r => r.target_role));
    return Array.from(set);
  }

  // --- Resources ---
  public async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  public async getResourcesForSkill(skillId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.skill_ids.includes(skillId));
  }

  public async getResourceById(id: string): Promise<Resource | null> {
    return this.resources.get(id) || null;
  }

  // --- Roadmaps & Items ---
  public async getActiveRoadmap(userId: string): Promise<Roadmap | null> {
    const userRoadmaps = Array.from(this.roadmaps.values())
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return userRoadmaps[0] || null;
  }

  public async getRoadmapById(id: string): Promise<Roadmap | null> {
    return this.roadmaps.get(id) || null;
  }

  public async saveRoadmap(roadmap: Roadmap): Promise<Roadmap> {
    this.roadmaps.set(roadmap.id, {
      ...roadmap,
      updated_at: new Date().toISOString()
    });

    // Persist to remote Fluxbase
    await this.executeSql(
      `INSERT INTO roadmaps (id, user_id, target_goal, target_role, total_phases, estimated_duration_weeks, total_hours, status, adaptation_notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         adaptation_notes = EXCLUDED.adaptation_notes,
         updated_at = NOW();`,
      [
        roadmap.id,
        roadmap.user_id,
        roadmap.target_goal,
        roadmap.target_role,
        roadmap.total_phases,
        roadmap.estimated_duration_weeks,
        roadmap.total_hours,
        roadmap.status,
        roadmap.adaptation_notes || null
      ]
    );

    return this.roadmaps.get(roadmap.id)!;
  }

  public async updateRoadmapItemStatus(
    roadmapId: string,
    itemId: string,
    status: RoadmapItem['status']
  ): Promise<RoadmapItem | null> {
    const roadmap = this.roadmaps.get(roadmapId);
    if (!roadmap) return null;
    const item = roadmap.items.find(i => i.id === itemId);
    if (!item) return null;
    item.status = status;
    
    if (status === 'completed') {
      const nextItem = roadmap.items.find(i => i.sequence_order === item.sequence_order + 1 && i.status === 'locked');
      if (nextItem) {
        nextItem.status = 'in_progress';
      }
    }
    
    roadmap.updated_at = new Date().toISOString();

    // Persist status change to Fluxbase
    await this.executeSql(
      `INSERT INTO progress (id, user_id, roadmap_item_id, completion_percentage, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();`,
      [`prog_${Date.now()}`, roadmap.user_id, itemId, status === 'completed' ? 100 : 50, status]
    );

    return item;
  }

  // --- Progress ---
  public async getProgress(userId: string): Promise<Progress[]> {
    const remote = await this.executeSql<Progress>(
      'SELECT * FROM progress WHERE user_id = $1 ORDER BY updated_at DESC;',
      [userId]
    );
    if (remote.success && remote.rows.length > 0) {
      return remote.rows;
    }
    return Array.from(this.progress.values()).filter(p => p.user_id === userId);
  }

  public async recordProgress(item: Progress): Promise<Progress> {
    const key = `${item.user_id}_${item.roadmap_item_id}`;
    this.progress.set(key, {
      ...item,
      updated_at: new Date().toISOString()
    });

    await this.executeSql(
      `INSERT INTO progress (id, user_id, roadmap_item_id, completion_percentage, assessment_score, time_spent_hours, feedback, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET
         completion_percentage = EXCLUDED.completion_percentage,
         assessment_score = EXCLUDED.assessment_score,
         time_spent_hours = EXCLUDED.time_spent_hours,
         feedback = EXCLUDED.feedback,
         status = EXCLUDED.status,
         updated_at = NOW();`,
      [
        item.id,
        item.user_id,
        item.roadmap_item_id,
        item.completion_percentage,
        item.assessment_score || null,
        item.time_spent_hours,
        item.feedback || null,
        item.status
      ]
    );

    return this.progress.get(key)!;
  }

  // --- Async Jobs ---
  public async createJob(job: Omit<AsyncJob, 'id' | 'created_at' | 'updated_at'>): Promise<AsyncJob> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullJob: AsyncJob = {
      ...job,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.jobs.set(id, fullJob);
    return fullJob;
  }

  public async getJob(id: string): Promise<AsyncJob | null> {
    return this.jobs.get(id) || null;
  }

  public async updateJob(id: string, updates: Partial<AsyncJob>): Promise<AsyncJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    const updated = {
      ...job,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.jobs.set(id, updated);
    return updated;
  }

  // --- LLM Usage Log & Budget ---
  public async logLLMUsage(log: Omit<LLMUsageLog, 'id' | 'created_at'>): Promise<LLMUsageLog> {
    const fullLog: LLMUsageLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString()
    };
    this.usageLogs.push(fullLog);

    await this.executeSql(
      `INSERT INTO llm_usage_log (id, user_id, endpoint, model, provider, input_tokens, output_tokens, estimated_cost_usd, latency_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());`,
      [
        fullLog.id,
        fullLog.user_id,
        fullLog.endpoint,
        fullLog.model,
        fullLog.provider,
        fullLog.input_tokens,
        fullLog.output_tokens,
        fullLog.estimated_cost_usd,
        fullLog.latency_ms
      ]
    );

    return fullLog;
  }

  public async getMonthlySpend(userId: string): Promise<{ totalUsd: number; totalTokens: number; logs: LLMUsageLog[] }> {
    const logs = this.usageLogs.filter(l => l.user_id === userId);
    const totalUsd = logs.reduce((acc, l) => acc + l.estimated_cost_usd, 0);
    const totalTokens = logs.reduce((acc, l) => acc + l.input_tokens + l.output_tokens, 0);
    return { totalUsd, totalTokens, logs };
  }

  public async getAllUsageLogs(): Promise<LLMUsageLog[]> {
    return [...this.usageLogs];
  }

  // --- Adaptation History ---
  public async recordAdaptation(record: Omit<AdaptationHistory, 'id' | 'timestamp'>): Promise<AdaptationHistory> {
    const fullRecord: AdaptationHistory = {
      ...record,
      id: `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.adaptationHistory.push(fullRecord);
    return fullRecord;
  }

  public async getAdaptationHistory(roadmapId: string): Promise<AdaptationHistory[]> {
    return this.adaptationHistory.filter(a => a.roadmap_id === roadmapId);
  }

  // --- Assessment Quizzes ---
  public async getQuizForSkill(skillId: string): Promise<AssessmentQuiz | null> {
    return this.quizzes.get(skillId) || null;
  }
}

// Singleton instance for Fluxbase service
export const fluxbase = new FluxbaseService();
