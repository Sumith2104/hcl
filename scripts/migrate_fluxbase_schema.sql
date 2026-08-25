-- =========================================================================
-- ADAPTIVELEARN ENTERPRISE RELATIONAL SCHEMA FOR FLUXBASE (POSTGRESQL)
-- =========================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'mentor', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LEARNER PROFILES (1-to-1 with users)
CREATE TABLE IF NOT EXISTS learner_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_goal TEXT NOT NULL,
    target_role VARCHAR(128) NOT NULL,
    experience_level VARCHAR(32) NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    available_hours_per_week INT NOT NULL DEFAULT 14 CHECK (available_hours_per_week BETWEEN 1 AND 80),
    preferred_learning_style VARCHAR(32) NOT NULL DEFAULT 'hands-on' CHECK (preferred_learning_style IN ('hands-on', 'visual', 'reading', 'structured')),
    interests JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_duration_weeks INT NOT NULL DEFAULT 16 CHECK (target_duration_weeks BETWEEN 1 AND 52),
    current_skills_raw JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CANONICAL SKILLS TAXONOMY
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL CHECK (category IN ('programming', 'math_theory', 'ai_ml', 'engineering_devops', 'systems_data', 'security')),
    description TEXT NOT NULL,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    difficulty_base VARCHAR(32) NOT NULL DEFAULT 'beginner' CHECK (difficulty_base IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USER CLAIMED & VERIFIED SKILLS (N-to-N users <-> skills)
CREATE TABLE IF NOT EXISTS user_skills (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(32) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.800 CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    assessment_score INT CHECK (assessment_score BETWEEN 0 AND 100),
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_id)
);

-- 5. SKILL PREREQUISITE DAG (Directed Acyclic Graph)
CREATE TABLE IF NOT EXISTS skill_prerequisites (
    id VARCHAR(64) PRIMARY KEY,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    importance VARCHAR(32) NOT NULL DEFAULT 'critical' CHECK (importance IN ('critical', 'recommended', 'optional')),
    CONSTRAINT chk_no_self_prereq CHECK (skill_id <> prerequisite_skill_id),
    CONSTRAINT uq_skill_prereq UNIQUE (skill_id, prerequisite_skill_id)
);

-- 6. ROLE SKILL BENCHMARK REQUIREMENTS
CREATE TABLE IF NOT EXISTS role_skill_requirements (
    id VARCHAR(64) PRIMARY KEY,
    target_role VARCHAR(128) NOT NULL,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level VARCHAR(32) NOT NULL CHECK (required_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    importance VARCHAR(32) NOT NULL DEFAULT 'must_have' CHECK (importance IN ('must_have', 'core', 'nice_to_have')),
    sequence_weight INT NOT NULL DEFAULT 1 CHECK (sequence_weight >= 0),
    CONSTRAINT uq_role_skill UNIQUE (target_role, skill_id)
);

-- 7. CURATED LEARNING RESOURCES & PROJECTS
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    platform VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('course', 'interactive_project', 'documentation', 'video_series', 'book')),
    difficulty VARCHAR(32) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    estimated_hours INT NOT NULL DEFAULT 10 CHECK (estimated_hours > 0),
    quality_score NUMERIC(4, 3) NOT NULL DEFAULT 0.900 CHECK (quality_score BETWEEN 0.0 AND 1.0),
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RESOURCE SKILL MAPPING (Many-to-Many)
CREATE TABLE IF NOT EXISTS resource_skills (
    id VARCHAR(64) PRIMARY KEY,
    resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relevance_weight NUMERIC(4, 3) NOT NULL DEFAULT 1.000 CHECK (relevance_weight BETWEEN 0.0 AND 1.0),
    CONSTRAINT uq_resource_skill UNIQUE (resource_id, skill_id)
);

-- 9. PERSONALIZED ROADMAPS
CREATE TABLE IF NOT EXISTS roadmaps (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_goal TEXT NOT NULL,
    target_role VARCHAR(128) NOT NULL,
    total_phases INT NOT NULL DEFAULT 3 CHECK (total_phases >= 1),
    estimated_duration_weeks INT NOT NULL DEFAULT 16 CHECK (estimated_duration_weeks >= 1),
    total_hours INT NOT NULL DEFAULT 60 CHECK (total_hours >= 1),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'adapted')),
    adaptation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ROADMAP ITEMS / MILESTONES (Sequenced nodes in DAG)
CREATE TABLE IF NOT EXISTS roadmap_items (
    id VARCHAR(64) PRIMARY KEY,
    roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    skill_name VARCHAR(128) NOT NULL,
    sequence_order INT NOT NULL CHECK (sequence_order >= 1),
    phase INT NOT NULL CHECK (phase >= 1),
    phase_title VARCHAR(128) NOT NULL,
    estimated_hours INT NOT NULL DEFAULT 10 CHECK (estimated_hours >= 1),
    status VARCHAR(32) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'completed', 'skipped')),
    milestone TEXT NOT NULL,
    milestone_project TEXT NOT NULL,
    prerequisite_skill_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_explanation TEXT,
    CONSTRAINT uq_roadmap_seq UNIQUE (roadmap_id, sequence_order)
);

-- 11. ROADMAP ITEM RESOURCES (Multi-Criteria Ranked Resources)
CREATE TABLE IF NOT EXISTS roadmap_resources (
    id VARCHAR(64) PRIMARY KEY,
    roadmap_item_id VARCHAR(64) NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    recommendation_reason TEXT NOT NULL,
    ranking_score NUMERIC(5, 4) NOT NULL CHECK (ranking_score BETWEEN 0.0 AND 1.0),
    match_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_item_resource UNIQUE (roadmap_item_id, resource_id)
);

-- 12. PROGRESS TRACKING & VELOCITY
CREATE TABLE IF NOT EXISTS progress (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_item_id VARCHAR(64) NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    completion_percentage INT NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    assessment_score INT CHECK (assessment_score BETWEEN 0 AND 100),
    time_spent_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (time_spent_hours >= 0.0),
    feedback TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_progress UNIQUE (user_id, roadmap_item_id)
);

-- 13. ADAPTIVE LEARNING REPLANNING AUDIT
CREATE TABLE IF NOT EXISTS adaptation_history (
    id VARCHAR(64) PRIMARY KEY,
    roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trigger_reason VARCHAR(64) NOT NULL,
    user_feedback TEXT NOT NULL,
    changes_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    previous_item_count INT NOT NULL,
    new_item_count INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ASSESSMENT QUIZZES & QUESTIONS
CREATE TABLE IF NOT EXISTS assessment_quizzes (
    id VARCHAR(64) PRIMARY KEY,
    skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_name VARCHAR(128) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ASYNC BACKGROUND JOBS QUEUE
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(64) NOT NULL CHECK (job_type IN ('generate_roadmap', 'adapt_roadmap', 'extract_profile')),
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
    result_ref VARCHAR(64),
    error_message TEXT,
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    step_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. LLM USAGE & COSTGUARD AUDIT LOG
CREATE TABLE IF NOT EXISTS llm_usage_log (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(128) NOT NULL,
    model VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'aws_bedrock',
    input_tokens INT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    estimated_cost_usd NUMERIC(8, 6) NOT NULL DEFAULT 0.000000 CHECK (estimated_cost_usd >= 0.0),
    latency_ms INT NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- OPTIMIZED INDEXES FOR FAST GRAPH TRAVERSALS & QUERIES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON learner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_prereq_skill ON skill_prerequisites(skill_id);
CREATE INDEX IF NOT EXISTS idx_prereq_parent ON skill_prerequisites(prerequisite_skill_id);
CREATE INDEX IF NOT EXISTS idx_role_req_role ON role_skill_requirements(target_role);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_log_user_created ON llm_usage_log(user_id, created_at DESC);

-- =========================================================================
-- ANALYTICAL VIEWS
-- =========================================================================
CREATE OR REPLACE VIEW v_learner_roadmap_analytics AS
SELECT 
    r.id AS roadmap_id,
    r.user_id,
    u.name AS user_name,
    r.target_role,
    r.status AS roadmap_status,
    COUNT(ri.id) AS total_modules,
    COUNT(CASE WHEN ri.status = 'completed' THEN 1 END) AS completed_modules,
    COUNT(CASE WHEN ri.status = 'in_progress' THEN 1 END) AS active_modules,
    ROUND(
        (COUNT(CASE WHEN ri.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(ri.id), 0)) * 100, 
        1
    ) AS completion_percentage,
    COALESCE(SUM(ri.estimated_hours), 0) AS total_hours_planned,
    r.updated_at
FROM roadmaps r
JOIN users u ON r.user_id = u.id
LEFT JOIN roadmap_items ri ON r.id = ri.roadmap_id
GROUP BY r.id, r.user_id, u.name, r.target_role, r.status, r.updated_at;
