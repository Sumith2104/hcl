import { NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'

export async function GET() {
  try {
    const fb = await getFluxbase()
    const checks: Record<string, { status: string; detail?: string }> = {}

    // Check 1: Environment variables
    const configured = fb.isConfigured()
    checks.env = {
      status: configured ? 'ok' : 'error',
      detail: configured
        ? 'All FluxBase env vars are set'
        : `Missing: ${[
            !fb.FLUXBASE_API_KEY && 'FLUXBASE_API_KEY',
            !fb.FLUXBASE_BASE_URL && 'FLUXBASE_BASE_URL',
            !fb.FLUXBASE_PROJECT_ID && 'FLUXBASE_PROJECT_ID',
          ].filter(Boolean).join(', ')}`,
    }

    // Check 2: FluxBase API connectivity
    if (configured) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)

        const res = await fetch(`${fb.FLUXBASE_BASE_URL}/api/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fb.FLUXBASE_API_KEY}`,
          },
          body: JSON.stringify({ projectId: fb.FLUXBASE_PROJECT_ID, query: 'SELECT 1 as ok' }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          checks.fluxbase = { status: 'error', detail: `HTTP ${res.status}: ${text.substring(0, 200)}` }
        } else {
          const data = await res.json()
          if (data.success) {
            checks.fluxbase = { status: 'ok', detail: 'FluxBase API is reachable and responding' }
          } else {
            checks.fluxbase = { status: 'error', detail: `FluxBase returned error: ${data.error?.message || 'unknown'}` }
          }
        }
      } catch (err) {
        checks.fluxbase = {
          status: 'error',
          detail: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    } else {
      checks.fluxbase = { status: 'skipped', detail: 'Skipped because env vars are not configured' }
    }

    const allOk = Object.values(checks).every(c => c.status === 'ok')

    return NextResponse.json(
      { status: allOk ? 'healthy' : 'unhealthy', checks, timestamp: new Date().toISOString() },
      { status: allOk ? 200 : 503 }
    )
  } catch (error) {
    const err = dbError(error, 'Health')
    return NextResponse.json({ error: err.error, status: 'unhealthy', checks: {}, timestamp: new Date().toISOString() }, { status: err.status })
  }
}
