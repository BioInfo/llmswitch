import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// In development, use a global variable to prevent multiple instances
// In production (Vercel), create a new client for each request
export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  if (!global.prisma) {
    global.prisma = prisma
  }
}