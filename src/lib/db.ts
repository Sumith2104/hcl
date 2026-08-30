// NOTE: Fluxbase is now the primary database for this project.
// This file is kept for documentation/reference purposes only.
// All database operations should use `import { fluxbase } from '@/lib/fluxbase'` instead.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
