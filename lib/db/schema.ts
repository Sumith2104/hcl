export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'mentor' | 'admin';
  created_at: string;
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LearningStyle = 'visual' | 'hands-on' | 'reading' | 'structured';

export interface LearnerProfile {
  id: string;
  user_id: string;
  target_goal: string;
  experience_level: ExperienceLevel;
  available_hours_per_week: number;
  preferred_learning_style: LearningStyle;
  interests: string[];
  target_duration_weeks: number;
  current_skills_raw?: string[];
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'programming' | 'math_theory' | 'ai_ml' | 'engineering_devops' | 'systems_data' | 'security';
  description: string;
  aliases: string[];
  difficulty_base: ExperienceLevel;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: ExperienceLevel;
  confidence_score: number; // 0.0 - 1.0
  verified: boolean;
  notes?: string;
  updated_at: string;
}

export interface SkillPrerequisite {
  id: string;
  skill_id: string;
  prerequisite_skill_id: string;
  importance: 'critical' | 'recommended' | 'optional';
}

export interface RoleSkillRequirement {
  id: string;
  target_role: string;
  skill_id: string;
  required_level: ExperienceLevel;
  importance: 'must_have' | 'core' | 'nice_to_have';
  sequence_weight: number;
}

export type ResourceType = 'course' | 'interactive_project' | 'documentation' | 'video_series' | 'book';

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  platform: string;
  type: ResourceType;
  difficulty: ExperienceLevel;
  estimated_hours: number;
  quality_score: number; // 0.0 - 1.0
  tags: string[];
  skill_ids: string[];
  is_free: boolean;
}

export interface RoadmapResource {
  id: string;
  roadmap_item_id: string;
  resource_id: string;
  recommendation_reason: string;
  ranking_score: number;
  resource?: Resource;
  match_breakdown: {
    skill_match: number;
    difficulty_match: number;
    preference_match: number;
    quality_score: number;
  };
}

export interface RoadmapItem {
  id: string;
  roadmap_id: string;
  skill_id: string;
  skill_name: string;
  sequence_order: number;
  phase: number;
  phase_title: string;
  estimated_hours: number;
  status: 'locked' | 'in_progress' | 'completed' | 'skipped';
  milestone: string;
  milestone_project: string;
  prerequisite_skill_ids: string[];
  ai_explanation?: string;
  resources: RoadmapResource[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  target_goal: string;
  target_role: string;
  total_phases: number;
  estimated_duration_weeks: number;
  total_hours: number;
  status: 'draft' | 'active' | 'completed' | 'adapted';
  created_at: string;
  updated_at: string;
  adaptation_notes?: string;
  items: RoadmapItem[];
}

export interface Progress {
  id: string;
  user_id: string;
  roadmap_item_id: string;
  completion_percentage: number;
  assessment_score?: number; // 0 - 100
  time_spent_hours: number;
  feedback?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  updated_at: string;
}

export interface AsyncJob {
  id: string;
  user_id: string;
  job_type: 'generate_roadmap' | 'adapt_roadmap' | 'extract_profile';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result_ref?: string;
  error_message?: string;
  progress_percentage: number;
  step_description: string;
  created_at: string;
  updated_at: string;
}

export interface LLMUsageLog {
  id: string;
  user_id: string;
  endpoint: string;
  model: string;
  provider: 'aws_bedrock' | 'simulated_bedrock';
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface AssessmentQuiz {
  id: string;
  skill_id: string;
  skill_name: string;
  questions: QuizQuestion[];
}

export interface AdaptationHistory {
  id: string;
  roadmap_id: string;
  timestamp: string;
  trigger_reason: string;
  user_feedback: string;
  changes_summary: string[];
  previous_item_count: number;
  new_item_count: number;
}
