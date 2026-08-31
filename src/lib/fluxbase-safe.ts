/**
 * Safe wrapper for fluxbase that uses dynamic imports with caching.
 * This prevents module-level crashes from circular dependencies or
 * missing environment variables from taking down the entire route.
 */

// Cache the module import so we don't re-import on every API call
type FluxbaseClient = Awaited<ReturnType<typeof _loadFluxbase>>
let _cachedClient: FluxbaseClient | null = null
let _cachePromise: Promise<FluxbaseClient> | null = null

async function _loadFluxbase() {
  const mod = await import('./fluxbase')
  return {
    fluxbase: mod.fluxbase,
    escapeSql: mod.escapeSql as (val: unknown) => string,
    qid: mod.qid as () => string,
    generateId: mod.generateId as () => string,
    isConfigured: mod.isConfigured as () => boolean,
    FLUXBASE_API_KEY: mod.FLUXBASE_API_KEY as string | undefined,
    FLUXBASE_BASE_URL: mod.FLUXBASE_BASE_URL as string | undefined,
    FLUXBASE_PROJECT_ID: mod.FLUXBASE_PROJECT_ID as string | undefined,
  }
}

export async function getFluxbase(): Promise<FluxbaseClient> {
  // Return cached client immediately
  if (_cachedClient) return _cachedClient
  // If a load is in-flight, reuse the same promise
  if (_cachePromise) return _cachePromise
  _cachePromise = _loadFluxbase().then((client) => {
    _cachedClient = client
    return client
  })
  return _cachePromise
}

/** Helper to create a JSON error response */
export function dbError(error: unknown, context: string) {
  const msg = error instanceof Error ? error.message : 'Unknown error'
  console.error(`[${context}]`, msg, error)

  if (msg.includes('timed out'))
    return { error: 'Database request timed out. Please try again.', status: 504 }
  if (msg.includes('network error') || msg.includes('cannot reach'))
    return { error: 'Cannot connect to the database. Please try again later.', status: 503 }
  if (msg.includes('not configured'))
    return { error: 'Database is not configured. Please contact the administrator.', status: 503 }
  if (msg.includes('unique') || msg.includes('duplicate'))
    return { error: 'This record already exists.', status: 409 }

  return { error: `${context} failed: ${msg}`, status: 500 }
}
