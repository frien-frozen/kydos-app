'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

export async function createTeacher(data: { name: string; email: string }) {
  const user = await requireAuth()
  if (user.role !== ROLES.PRINCIPAL && user.role !== ROLES.REGISTRAR) {
    throw new Error('Unauthorized')
  }
  if (!user.schoolId) throw new Error('No school context')

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    // If they exist, update their role and school
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: ROLES.TEACHER, schoolId: user.schoolId },
    })
    
    // Create teacher profile if missing
    await prisma.teacher.upsert({
      where: { userId: existingUser.id },
      update: {},
      create: { userId: existingUser.id },
    })
  } else {
    // Create new user and teacher profile
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: ROLES.TEACHER,
        schoolId: user.schoolId,
      },
    })
    
    await prisma.teacher.create({
      data: { userId: newUser.id },
    })
  }

  revalidatePath('/teachers')
}

export async function removeTeacherRole(userId: string) {
  const user = await requireAuth()
  if (user.role !== ROLES.PRINCIPAL && user.role !== ROLES.REGISTRAR) {
    throw new Error('Unauthorized')
  }

  // Remove teacher role, fallback to STUDENT
  await prisma.user.update({
    where: { id: userId },
    data: { role: ROLES.STUDENT },
  })

  revalidatePath('/teachers')
}
