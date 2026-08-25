const BASE_URL = 'https://fluxbase.vercel.app';
const API_KEY = 'fl_420392f791e71034a668fec0f5f85c822c4547697c7c4cbe';
const PROJECT_ID = 'a3fdb50d092a4b97';

async function query(sql, params = []) {
  try {
    const res = await fetch(`${BASE_URL}/api/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ projectId: PROJECT_ID, query: sql, params })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: { message: err.message } };
  }
}

async function runRedesign() {
  console.log('=== STEP 1: DROPPING OLD VIEWS AND TABLES ===');
  
  const drops = [
    'DROP VIEW IF EXISTS v_learner_roadmap_analytics CASCADE;',
    'DROP VIEW IF EXISTS v_skill_dependency_dag CASCADE;',
    'DROP VIEW IF EXISTS v_role_curriculum_breakdown CASCADE;',
    'DROP TABLE IF EXISTS adaptation_history CASCADE;',
    'DROP TABLE IF EXISTS progress CASCADE;',
    'DROP TABLE IF EXISTS roadmap_items CASCADE;',
    'DROP TABLE IF EXISTS roadmaps CASCADE;',
    'DROP TABLE IF EXISTS assessment_quizzes CASCADE;',
    'DROP TABLE IF EXISTS resource_skills CASCADE;',
    'DROP TABLE IF EXISTS resources CASCADE;',
    'DROP TABLE IF EXISTS role_skill_requirements CASCADE;',
    'DROP TABLE IF EXISTS skill_prerequisites CASCADE;',
    'DROP TABLE IF EXISTS user_skills CASCADE;',
    'DROP TABLE IF EXISTS learner_profiles CASCADE;',
    'DROP TABLE IF EXISTS jobs CASCADE;',
    'DROP TABLE IF EXISTS llm_usage_log CASCADE;',
    'DROP TABLE IF EXISTS skills CASCADE;',
    'DROP TABLE IF EXISTS users CASCADE;'
  ];

  for (const sql of drops) {
    const res = await query(sql);
    console.log(`Executed: ${sql.split(' ')[2] || sql} -> ${res.success ? 'CLEARED' : res.error?.message}`);
  }

  console.log('\n=== STEP 2: CREATING NORMALIZED RELATIONAL SCHEMA WITH FOREIGN KEYS ===');

  const ddlList = [
    // 1. Users
    `CREATE TABLE users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '$2b$10$demoHashedPasswordPlaceholderSaltValue',
      role VARCHAR(32) NOT NULL DEFAULT 'learner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 2. Learner Profiles (FK -> users)
    `CREATE TABLE learner_profiles (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_goal TEXT NOT NULL,
      experience_level VARCHAR(32) NOT NULL DEFAULT 'intermediate',
      available_hours_per_week INT NOT NULL DEFAULT 14,
      preferred_learning_style VARCHAR(32) NOT NULL DEFAULT 'hands-on',
      interests TEXT,
      target_duration_weeks INT NOT NULL DEFAULT 16,
      current_skills_raw TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 3. Skills (Master catalog)
    `CREATE TABLE skills (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      category VARCHAR(64) NOT NULL,
      description TEXT NOT NULL,
      aliases TEXT,
      difficulty_base VARCHAR(32) NOT NULL DEFAULT 'beginner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 4. Skill Prerequisites (FK -> skills both sides, with unique constraint)
    `CREATE TABLE skill_prerequisites (
      id VARCHAR(64) PRIMARY KEY,
      skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      prerequisite_skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      importance VARCHAR(32) NOT NULL DEFAULT 'critical',
      CONSTRAINT uq_skill_prerequisite UNIQUE(skill_id, prerequisite_skill_id)
    );`,

    // 5. Role Skill Requirements (FK -> skills, with unique constraint)
    `CREATE TABLE role_skill_requirements (
      id VARCHAR(64) PRIMARY KEY,
      target_role VARCHAR(128) NOT NULL,
      skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      required_level VARCHAR(32) NOT NULL DEFAULT 'intermediate',
      importance VARCHAR(32) NOT NULL DEFAULT 'must_have',
      sequence_weight INT NOT NULL DEFAULT 1,
      CONSTRAINT uq_role_skill UNIQUE(target_role, skill_id)
    );`,

    // 6. User Skills (FK -> users, skills)
    `CREATE TABLE user_skills (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency_level VARCHAR(32) NOT NULL DEFAULT 'beginner',
      confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.800,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      assessment_score INT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_user_skill UNIQUE(user_id, skill_id)
    );`,

    // 7. Resources (Master catalog)
    `CREATE TABLE resources (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      platform VARCHAR(128) NOT NULL,
      type VARCHAR(32) NOT NULL,
      difficulty VARCHAR(32) NOT NULL DEFAULT 'intermediate',
      estimated_hours INT NOT NULL DEFAULT 10,
      quality_score NUMERIC(4, 3) NOT NULL DEFAULT 0.900,
      tags TEXT,
      skill_ids TEXT,
      is_free BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 8. Resource Skills (FK -> resources, skills)
    `CREATE TABLE resource_skills (
      id VARCHAR(64) PRIMARY KEY,
      resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      relevance_weight NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
      CONSTRAINT uq_resource_skill UNIQUE(resource_id, skill_id)
    );`,

    // 9. Roadmaps (FK -> users)
    `CREATE TABLE roadmaps (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_goal TEXT NOT NULL,
      target_role VARCHAR(128) NOT NULL,
      total_phases INT NOT NULL DEFAULT 3,
      estimated_duration_weeks INT NOT NULL DEFAULT 16,
      total_hours INT NOT NULL DEFAULT 60,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      adaptation_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 10. Roadmap Items (FK -> roadmaps, skills)
    `CREATE TABLE roadmap_items (
      id VARCHAR(64) PRIMARY KEY,
      roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      skill_id VARCHAR(64) REFERENCES skills(id) ON DELETE SET NULL,
      skill_name VARCHAR(128) NOT NULL,
      sequence_order INT NOT NULL,
      phase INT NOT NULL DEFAULT 1,
      phase_title VARCHAR(128) NOT NULL,
      estimated_hours INT NOT NULL DEFAULT 10,
      status VARCHAR(32) NOT NULL DEFAULT 'locked',
      milestone TEXT NOT NULL,
      milestone_project TEXT NOT NULL,
      prerequisite_skill_ids TEXT,
      ai_explanation TEXT,
      resources TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 11. Progress (FK -> users, roadmap_items)
    `CREATE TABLE progress (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roadmap_item_id VARCHAR(64) NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
      completion_percentage INT NOT NULL DEFAULT 0,
      assessment_score INT,
      time_spent_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
      feedback TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'not_started',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_user_roadmap_item_progress UNIQUE(user_id, roadmap_item_id)
    );`,

    // 12. Adaptation History (FK -> roadmaps, users)
    `CREATE TABLE adaptation_history (
      id VARCHAR(64) PRIMARY KEY,
      roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trigger_reason VARCHAR(64) NOT NULL,
      user_feedback TEXT NOT NULL,
      changes_summary TEXT,
      previous_item_count INT NOT NULL,
      new_item_count INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 13. Assessment Quizzes (FK -> skills)
    `CREATE TABLE assessment_quizzes (
      id VARCHAR(64) PRIMARY KEY,
      skill_id VARCHAR(64) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      skill_name VARCHAR(128) NOT NULL,
      questions TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 14. Jobs (FK -> users)
    `CREATE TABLE jobs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_type VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      result_ref VARCHAR(64),
      error_message TEXT,
      progress_percentage INT NOT NULL DEFAULT 0,
      step_description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 15. LLM Usage Log (FK -> users)
    `CREATE TABLE llm_usage_log (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint VARCHAR(128) NOT NULL,
      model VARCHAR(128) NOT NULL,
      provider VARCHAR(64) NOT NULL DEFAULT 'open_source_llm',
      input_tokens INT NOT NULL DEFAULT 0,
      output_tokens INT NOT NULL DEFAULT 0,
      estimated_cost_usd NUMERIC(8, 6) NOT NULL DEFAULT 0.000000,
      latency_ms INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  ];

  for (const ddl of ddlList) {
    const res = await query(ddl);
    const tableName = ddl.match(/CREATE TABLE (\w+)/i)?.[1];
    console.log(`Table '${tableName}' -> ${res.success ? 'CREATED WITH FK' : JSON.stringify(res.error)}`);
  }

  console.log('\n=== STEP 3: CREATING PERFORMANCE INDEXES ===');

  const indexes = [
    `CREATE INDEX idx_learner_profiles_user ON learner_profiles(user_id);`,
    `CREATE INDEX idx_user_skills_user ON user_skills(user_id);`,
    `CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);`,
    `CREATE INDEX idx_skill_prereq_source ON skill_prerequisites(skill_id);`,
    `CREATE INDEX idx_skill_prereq_target ON skill_prerequisites(prerequisite_skill_id);`,
    `CREATE INDEX idx_role_skills_role ON role_skill_requirements(target_role, sequence_weight);`,
    `CREATE INDEX idx_resources_platform ON resources(platform, type);`,
    `CREATE INDEX idx_resource_skills_skill ON resource_skills(skill_id);`,
    `CREATE INDEX idx_roadmaps_user_status ON roadmaps(user_id, status);`,
    `CREATE INDEX idx_roadmap_items_roadmap_phase ON roadmap_items(roadmap_id, phase, sequence_order);`,
    `CREATE INDEX idx_progress_user ON progress(user_id, status);`,
    `CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);`,
    `CREATE INDEX idx_llm_usage_user ON llm_usage_log(user_id, created_at);`
  ];

  for (const idxSql of indexes) {
    const res = await query(idxSql);
    const idxName = idxSql.match(/CREATE INDEX (\w+)/i)?.[1];
    console.log(`Index '${idxName}' -> ${res.success ? 'CREATED' : JSON.stringify(res.error)}`);
  }

  console.log('\n=== STEP 4: CREATING RELATIONAL ANALYTICAL VIEWS ===');

  const views = [
    `CREATE OR REPLACE VIEW v_learner_roadmap_analytics AS
    SELECT 
        r.id AS roadmap_id,
        r.user_id,
        u.name AS user_name,
        u.email AS user_email,
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
    GROUP BY r.id, r.user_id, u.name, u.email, r.target_role, r.status, r.updated_at;`,

    `CREATE OR REPLACE VIEW v_skill_dependency_dag AS
    SELECT 
        s.id AS skill_id,
        s.name AS skill_name,
        s.category,
        s.difficulty_base,
        p.prerequisite_skill_id,
        ps.name AS prerequisite_skill_name,
        p.importance AS prerequisite_importance
    FROM skills s
    LEFT JOIN skill_prerequisites p ON s.id = p.skill_id
    LEFT JOIN skills ps ON p.prerequisite_skill_id = ps.id;`,

    `CREATE OR REPLACE VIEW v_role_curriculum_breakdown AS
    SELECT 
        rsr.target_role,
        COUNT(rsr.skill_id) AS required_skills_count,
        ARRAY_AGG(s.name ORDER BY rsr.sequence_weight) AS sequenced_skill_names
    FROM role_skill_requirements rsr
    JOIN skills s ON rsr.skill_id = s.id
    GROUP BY rsr.target_role;`
  ];

  for (const vSql of views) {
    const res = await query(vSql);
    const vName = vSql.match(/CREATE OR REPLACE VIEW (\w+)/i)?.[1];
    console.log(`View '${vName}' -> ${res.success ? 'CREATED' : JSON.stringify(res.error)}`);
  }

  console.log('\n=== STEP 5: VERIFYING TABLE CONSTRAINTS ===');
  const fkRes = await query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name;
  `);

  console.log(`Total Foreign Keys Created: ${fkRes.result?.rows?.length || 0}`);
  fkRes.result?.rows?.forEach(r => {
    console.log(`🔗 [${r.table_name}.${r.column_name}] -> [${r.foreign_table_name}.${r.foreign_column_name}]`);
  });
}

runRedesign().catch(console.error);
