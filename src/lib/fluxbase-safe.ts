/**
 * Safe wrapper for fluxbase that uses dynamic imports.
 * This prevents module-level crashes from circular dependencies or
 * missing environment variables from taking down the entire route.
 */

export async function getFluxbase() {
  try {
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
  } catch (importErr) {
    throw new Error(
      `Database module failed to load: ${importErr instanceof Error ? importErr.message : String(importErr)}`
    )
  }
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
