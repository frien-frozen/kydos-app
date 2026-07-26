import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma_new: PrismaClient | undefined }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma =
  globalForPrisma.prisma_new ?? new PrismaClient({ adapter, log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_new = prisma
