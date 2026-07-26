import { auth } from './auth'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'
import { ROUTES } from './routes'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.login)
  return user
}

export async function requireRole(allowed: Role[]) {
  const user = await requireAuth()
  if (!allowed.includes(user.role)) redirect(ROUTES.dashboard)
  return user
}
