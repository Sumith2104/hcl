const FLUXBASE_API_KEY = process.env.FLUXBASE_API_KEY!
const FLUXBASE_BASE_URL = process.env.FLUXBASE_BASE_URL!
const FLUXBASE_PROJECT_ID = process.env.FLUXBASE_PROJECT_ID!

const SCHEMA = `project_${FLUXBASE_PROJECT_ID}`

const ALL_CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS ${SCHEMA}.app_user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'learner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.skill (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.learner_profile (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  target_goal TEXT NOT NULL,
  experience_level TEXT DEFAULT 'beginner',
  available_hours_per_week INTEGER DEFAULT 10,
  preferred_learning_style TEXT DEFAULT 'mixed',
  interests TEXT DEFAULT '[]',
  target_duration_weeks INTEGER,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.skill_prerequisite (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES ${SCHEMA}.skill(id) ON DELETE CASCADE,
  prerequisite_skill_id TEXT NOT NULL REFERENCES ${SCHEMA}.skill(id) ON DELETE CASCADE,
  importance TEXT DEFAULT 'required',
  UNIQUE(skill_id, prerequisite_skill_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.role_skill_requirement (
  id TEXT PRIMARY KEY,
  target_role TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES ${SCHEMA}.skill(id) ON DELETE CASCADE,
  required_level TEXT DEFAULT 'intermediate',
  importance TEXT DEFAULT 'high',
  UNIQUE(target_role, skill_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.user_skill (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES ${SCHEMA}.skill(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'beginner',
  confidence_score REAL DEFAULT 0.5,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.resource (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  type TEXT DEFAULT 'article',
  difficulty TEXT DEFAULT 'beginner',
  estimated_hours REAL DEFAULT 2.0,
  quality_score REAL DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.resource_skill (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES ${SCHEMA}.resource(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES ${SCHEMA}.skill(id) ON DELETE CASCADE,
  UNIQUE(resource_id, skill_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.roadmap (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  target_goal TEXT NOT NULL,
  estimated_duration_weeks INTEGER DEFAULT 12,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.roadmap_item (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES ${SCHEMA}.roadmap(id) ON DELETE CASCADE,
  skill_id REFERENCES ${SCHEMA}.skill(id),
  sequence_order INTEGER NOT NULL,
  phase INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  estimated_hours REAL DEFAULT 5.0,
  milestone TEXT DEFAULT '',
  status TEXT DEFAULT 'locked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.roadmap_resource (
  id TEXT PRIMARY KEY,
  roadmap_item_id TEXT NOT NULL REFERENCES ${SCHEMA}.roadmap_item(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES ${SCHEMA}.resource(id) ON DELETE CASCADE,
  recommendation_reason TEXT DEFAULT '',
  UNIQUE(roadmap_item_id, resource_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  roadmap_item_id TEXT NOT NULL REFERENCES ${SCHEMA}.roadmap_item(id) ON DELETE CASCADE,
  completion_percentage REAL DEFAULT 0,
  assessment_score REAL,
  feedback TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, roadmap_item_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.onboarding_message (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  step INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.chat_message (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.learning_note (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.study_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  skill_name TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  type TEXT DEFAULT 'focus',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.quiz_question (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.flashcard (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.user_achievement (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.notification (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.learning_goal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline TIMESTAMP,
  progress REAL DEFAULT 0,
  category TEXT DEFAULT 'general',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${SCHEMA}.resource_bookmark (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ${SCHEMA}.app_user(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES ${SCHEMA}.resource(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, resource_id)
);
`

async function rawExec(sql: string): Promise<boolean> {
  try {
    const res = await fetch(`${FLUXBASE_BASE_URL}/api/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FLUXBASE_API_KEY}` },
      body: JSON.stringify({ projectId: FLUXBASE_PROJECT_ID, query: sql }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

// Migration: add password_hash column if it doesn't exist (safe to run repeatedly)
const MIGRATION_SQL = `ALTER TABLE ${SCHEMA}.app_user ADD COLUMN IF NOT EXISTS password_hash TEXT;`

export async function createFluxbaseTables(): Promise<boolean> {
  // Run migration first (add password_hash column to existing tables)
  const migrationOk = await rawExec(MIGRATION_SQL)
  if (migrationOk) {
    console.log('Fluxbase: Migration applied (password_hash column)')
  } else {
    console.log('Fluxbase: Migration skipped (column may already exist or table not yet created)')
  }

  // Try sending all CREATE TABLE statements in one request
  const ok = await rawExec(ALL_CREATE_TABLES_SQL)
  if (ok) {
    console.log('Fluxbase: All 16 tables ensured in single request')
    return true
  }
  // Fallback: try one by one
  const statements = ALL_CREATE_TABLES_SQL.trim().split(';').filter(s => s.trim())
  let created = 0
  for (const stmt of statements) {
    if (await rawExec(stmt + ';')) created++
  }
  console.log(`Fluxbase: Created/verified ${created}/${statements.length} tables (fallback)`)  
  return created === statements.length
}
