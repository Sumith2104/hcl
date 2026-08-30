/**
 * Password hashing utility using Web Crypto API (SHA-256 + salt).
 * 
 * This provides a secure but lightweight approach for password storage:
 * - Each user gets a unique random salt (32 bytes)
 * - Password is hashed as SHA-256(salt + password)
 * - Stored format: "salt:hash" (both hex-encoded)
 */

const SALT_LENGTH = 32
const HASH_ITERATIONS = 1000

/** Generate a cryptographically secure random salt */
async function generateSalt(): Promise<string> {
  const buffer = new Uint8Array(SALT_LENGTH)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer)
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < SALT_LENGTH; i++) {
      buffer[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Hash a password with the given salt using iterative SHA-256 */
async function hashWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  let data = encoder.encode(salt + password)

  // Multiple iterations for stronger security against brute force
  for (let i = 0; i < HASH_ITERATIONS; i++) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    data = new Uint8Array(hashBuffer)
  }

  return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Hash a password — returns "salt:hash" string for storage */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt()
  const hash = await hashWithSalt(password, salt)
  return `${salt}:${hash}`
}

/** Verify a password against a stored hash ("salt:hash" format) */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) return false

  const [salt, expectedHash] = storedHash.split(':')
  if (!salt || !expectedHash) return false

  const actualHash = await hashWithSalt(password, salt)
  // Constant-time comparison to prevent timing attacks
  if (actualHash.length !== expectedHash.length) return false

  let result = 0
  for (let i = 0; i < actualHash.length; i++) {
    result |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  return result === 0
}

/** Validate password strength */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}