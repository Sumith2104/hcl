// FluxBase configuration with fallback defaults
// These can be overridden via environment variables (.env.local, deployment config)
const FALLBACK_API_KEY = 'fl_420392f791e71034a668fec0f5f85c822c4547697c7c4cbe'
const FALLBACK_BASE_URL = 'https://fluxbase.vercel.app'
const FALLBACK_PROJECT_ID = 'a3fdb50d092a4b97'

const FLUXBASE_API_KEY = process.env.FLUXBASE_API_KEY || FALLBACK_API_KEY
const FLUXBASE_BASE_URL = process.env.FLUXBASE_BASE_URL || FALLBACK_BASE_URL
const FLUXBASE_PROJECT_ID = process.env.FLUXBASE_PROJECT_ID || FALLBACK_PROJECT_ID

export { FLUXBASE_API_KEY, FLUXBASE_BASE_URL, FLUXBASE_PROJECT_ID }
const SCHEMA = `project_${FLUXBASE_PROJECT_ID}`

interface FluxbaseResponse {
  success: boolean
  result?: { rows: Record<string, unknown>[]; columns?: string[] }
  error?: { message: string; code?: string }
}

function esc(val: unknown): string {
  if (val == null) return ''
  return String(val).replace(/'/g, "''")
}
export { esc as escapeSql }

export function generateId(): string {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const f = (n: number) => { let s = ''; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s }
  return `${f(8)}-${f(4)}-${f(4)}-${f(4)}-${f(12)}`
}

/** Generate a SQL-safe quoted ID string */
export function qid(): string {
  return `'${generateId()}'`
}

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function mapRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v
  }
  return out
}

const TABLE_MAP: Record<string, string> = {
  User: 'app_user',
  LearnerProfile: 'learner_profile',
  Skill: 'skill',
  SkillPrerequisite: 'skill_prerequisite',
  RoleSkillRequirement: 'role_skill_requirement',
  UserSkill: 'user_skill',
  Resource: 'resource',
  ResourceSkill: 'resource_skill',
  Roadmap: 'roadmap',
  RoadmapItem: 'roadmap_item',
  RoadmapResource: 'roadmap_resource',
  Progress: 'progress',
  OnboardingMessage: 'onboarding_message',
  ChatMessage: 'chat_message',
  LearningNote: 'learning_note',
  StudySession: 'study_session',
}

function transformSql(sql: string): string {
  let s = sql.replace(/"([A-Z][a-zA-Z0-9_]+)"/g, '$1')
  // Protect string literals from table name replacement
  const stringLiterals: string[] = []
  s = s.replace(/'[^']*'/g, (match) => {
    stringLiterals.push(match)
    return `__STR_LIT_${stringLiterals.length - 1}__`
  })

  const sortedTables = Object.keys(TABLE_MAP).sort((a, b) => b.length - a.length)
  for (const t of sortedTables) {
    const snake = TABLE_MAP[t]
    const re = new RegExp(`(?<![a-zA-Z0-9_.])\\b${t}\\b(?![a-zA-Z0-9_])`, 'g')
    s = s.replace(re, `${SCHEMA}.${snake}`)
  }

  // Restore string literals
  for (let i = 0; i < stringLiterals.length; i++) {
    s = s.replace(`__STR_LIT_${i}__`, stringLiterals[i])
  }
  return s
}

// Table initialization: lazy, with retry, safe for serverless (re-entrant)
let initPromise: Promise<boolean> | null = null

async function ensureTables(): Promise<boolean> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      const { createFluxbaseTables } = await import('./fluxbase-schema')
      const ok = await createFluxbaseTables()
      return ok
    } catch (e) {
      console.error('[Fluxbase] Table init failed:', e)
      return false
    } finally {
      // Reset after 60s so serverless can re-init if needed
      setTimeout(() => { initPromise = null }, 60_000)
    }
  })()
  return initPromise
}

/** Check if an error is a "table does not exist" error */
function isTableMissingError(msg: string): boolean {
  const lower = msg.toLowerCase()
  return lower.includes('does not exist') ||
         lower.includes('relation') && lower.includes('does not exist') ||
         lower.includes('no such table') ||
         lower.includes('undefined table')
}

/** Check if env vars are configured */
export function isConfigured(): boolean {
  return !!(FLUXBASE_API_KEY && FLUXBASE_BASE_URL && FLUXBASE_PROJECT_ID)
}

const FETCH_TIMEOUT_MS = 15_000 // 15 second timeout for FluxBase API calls

/** Execute a raw SQL request to Fluxbase with timeout and error handling */
async function rawFluxbaseRequest(sql: string): Promise<FluxbaseResponse> {
  if (!FLUXBASE_API_KEY || !FLUXBASE_BASE_URL || !FLUXBASE_PROJECT_ID) {
    throw new Error('FluxBase not configured: missing FLUXBASE_API_KEY, FLUXBASE_BASE_URL, or FLUXBASE_PROJECT_ID environment variables')
  }

  const url = `${FLUXBASE_BASE_URL}/api/execute-sql`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLUXBASE_API_KEY}`,
      },
      body: JSON.stringify({ projectId: FLUXBASE_PROJECT_ID, query: sql }),
      signal: controller.signal,
    })

    // Read body once
    let bodyText: string
    try {
      bodyText = await res.text()
    } catch {
      throw new Error(`FluxBase HTTP ${res.status}: unable to read response body`)
    }

    // Check for non-OK HTTP status
    if (!res.ok) {
      throw new Error(`FluxBase HTTP ${res.status}: ${bodyText.substring(0, 200)}`)
    }

    // Safely parse JSON — FluxBase might return non-JSON on errors
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error(`FluxBase returned non-JSON response (${contentType}): ${bodyText.substring(0, 200)}`)
    }

    try {
      const data = JSON.parse(bodyText) as FluxbaseResponse
      return data
    } catch {
      throw new Error(`FluxBase returned invalid JSON: ${bodyText.substring(0, 200)}`)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`FluxBase request timed out after ${FETCH_TIMEOUT_MS / 1000}s`)
    }
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND'))) {
      throw new Error(`FluxBase network error: cannot reach ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export const fluxbase = {
  async query(sql: string): Promise<Record<string, unknown>[]> {
    const transformedSql = transformSql(sql)
    try {
      const data = await rawFluxbaseRequest(transformedSql)
      if (!data.success) {
        const errMsg = data.error?.message || 'Unknown FluxBase error'
        throw new Error(`FluxBase query error: ${errMsg}`)
      }
      return (data.result?.rows || []).map(mapRow)
    } catch (err) {
      const msg = (err as Error).message
      // If table doesn't exist, try creating tables and retry once
      if (isTableMissingError(msg)) {
        console.log('[Fluxbase] Table missing, creating...')
        const created = await ensureTables()
        if (created) {
          const retry = await rawFluxbaseRequest(transformedSql)
          if (retry.success) return (retry.result?.rows || []).map(mapRow)
          if (retry.error?.message) throw new Error(`FluxBase query error (after table creation): ${retry.error.message}`)
        }
      }
      throw err
    }
  },

  async execute(sql: string): Promise<{ rowCount: number }> {
    const transformedSql = transformSql(sql)
    try {
      const data = await rawFluxbaseRequest(transformedSql)
      if (!data.success) {
        const errMsg = data.error?.message || 'Unknown FluxBase error'
        throw new Error(`FluxBase execute error: ${errMsg}`)
      }
      return { rowCount: data.result?.rows?.length ?? 0 }
    } catch (err) {
      const msg = (err as Error).message
      if (isTableMissingError(msg)) {
        console.log('[Fluxbase] Table missing, creating...')
        const created = await ensureTables()
        if (created) {
          const retry = await rawFluxbaseRequest(transformedSql)
          if (retry.success) return { rowCount: retry.result?.rows?.length ?? 0 }
          if (retry.error?.message) throw new Error(`FluxBase execute error (after table creation): ${retry.error.message}`)
        }
      }
      throw err
    }
  },

  async run(sql: string): Promise<Record<string, unknown>[]> {
    try {
      return await this.query(sql)
    } catch (queryError) {
      try {
        await this.execute(sql)
      } catch {
        throw queryError
      }
      return []
    }
  },
}
