import crypto from 'crypto';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// Hash password using PBKDF2 with SHA-256
export function hashPassword(password: string): string {
  const salt = 'adaptive_learn_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return computed === hash;
}
