import { NextRequest, NextResponse } from 'next/server'
import { getFluxbase, dbError } from '@/lib/fluxbase-safe'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/password'

interface SignUpBody {
  action: 'signup'
  name: string
  email: string
  password: string
}

interface LoginBody {
  action: 'login'
  email: string
  password: string
}

type AuthBody = SignUpBody | LoginBody

function makeError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const fb = await getFluxbase()

    let body: AuthBody
    try {
      body = await req.json() as AuthBody
    } catch {
      return makeError('Invalid request body.', 400)
    }

    if ('action' in body && body.action === 'login') {
      return handleLogin(body as LoginBody, fb)
    }

    return handleSignUp(body as SignUpBody, fb)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Auth] Unhandled error:', msg, error)
    return makeError(`Authentication failed: ${msg}`, 500)
  }
}

async function handleLogin(body: LoginBody, fb: Awaited<ReturnType<typeof getFluxbase>>) {
  const { email, password } = body

  if (!email) return makeError('Email is required', 400)
  if (!password) return makeError('Password is required', 400)

  try {
    const rows = await fb.fluxbase.query(`SELECT * FROM User WHERE email = '${fb.escapeSql(email.toLowerCase().trim())}' LIMIT 1`)
    const user = rows[0] || null

    if (!user) {
      return makeError('No account found with this email. Please sign up first.', 404)
    }

    // Verify password
    const storedHash = user.passwordHash as string || user.password as string
    if (!storedHash) {
      return makeError('This account was created without a password. Please sign up with a new account.', 400)
    }

    const isValid = await verifyPassword(password, storedHash)
    if (!isValid) {
      return makeError('Incorrect password. Please try again.', 401)
    }

    // Check if user has a learner profile
    let hasProfile = false
    try {
      const profileRows = await fb.fluxbase.query(`SELECT * FROM LearnerProfile WHERE user_id = '${fb.escapeSql(String(user.id))}' LIMIT 1`)
      hasProfile = profileRows.length > 0
    } catch (profileErr) {
      console.warn('[Auth] Profile check failed:', profileErr instanceof Error ? profileErr.message : profileErr)
    }

    // Return user data (excluding password hash)
    const { password: _pw, passwordHash: _ph, ...safeUser } = user as Record<string, unknown>

    return NextResponse.json({ user: safeUser, hasProfile })
  } catch (error) {
    const err = dbError(error, 'Login')
    return makeError(err.error, err.status)
  }
}

async function handleSignUp(body: SignUpBody, fb: Awaited<ReturnType<typeof getFluxbase>>) {
  const { name, email, password } = body

  if (!name || !name.trim()) return makeError('Name is required', 400)
  if (!email || !email.trim()) return makeError('Email is required', 400)
  if (!email.includes('@') || !email.includes('.')) return makeError('Please enter a valid email address', 400)
  if (!password) return makeError('Password is required', 400)

  // Validate password strength
  const strengthCheck = validatePasswordStrength(password)
  if (!strengthCheck.valid) {
    return makeError(strengthCheck.errors[0], 400)
  }

  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await fb.fluxbase.query(`SELECT * FROM User WHERE email = '${fb.escapeSql(normalizedEmail)}' LIMIT 1`)
    if (existing.length > 0) {
      return makeError('An account with this email already exists. Please log in instead.', 409)
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create user
    const cleanName = name.trim().replace(/[^a-zA-Z\s'-]/g, ' ').replace(/\s+/g, ' ').trim()
    const inserted = await fb.fluxbase.run(
      `INSERT INTO User (id, name, email, password_hash, role, created_at, updated_at) VALUES (${fb.qid()}, '${fb.escapeSql(cleanName)}', '${fb.escapeSql(normalizedEmail)}', '${fb.escapeSql(hashedPassword)}', 'learner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`
    )
    const user = inserted[0]
    if (!user) return makeError('Failed to create user account.', 500)

    // Return user data (excluding password hash)
    const { password: _pw, passwordHash: _ph, ...safeUser } = user as Record<string, unknown>

    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (error) {
    const err = dbError(error, 'Signup')
    return makeError(err.error, err.status)
  }
}
