'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { z } from 'zod'
import { BehaviorType } from '@prisma/client'

const createBehaviorSchema = z.object({
  studentId: z.string(),
  type: z.nativeEnum(BehaviorType),
  incident: z.string().min(5, 'Incident description is required'),
  actionTaken: z.string().optional(),
})

export async function createBehaviorReport(data: z.infer<typeof createBehaviorSchema>) {
  try {
    const user = await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL])
    const parsed = createBehaviorSchema.parse(data)
    
    let teacherId = user.id
    if (user.role === ROLES.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) return { success: false, error: 'Teacher profile not found' }
      teacherId = teacher.id
    } else {
      // Principal logging behavior - they might not have a teacher profile, so we just use their userId or create a mock teacher mapping if needed.
      // For MVP, we will assume Principal can log it, but schema requires teacherId. We can just use their userId if we don't strictly enforce teacher profile in the DB for Principals.
      // Wait, schema says teacher Teacher @relation(...) so it must be a valid teacherId. 
      // If a principal logs it, we need a teacher profile for them, or we relax the schema.
      // Let's just create a teacher profile for the principal if it doesn't exist.
      let teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) {
        teacher = await prisma.teacher.create({ data: { userId: user.id } })
      }
      teacherId = teacher.id
    }

    const report = await prisma.behaviorReport.create({
      data: {
        studentId: parsed.studentId,
        teacherId: teacherId,
        type: parsed.type,
        incident: parsed.incident,
        actionTaken: parsed.actionTaken,
      }
    })

    return { success: true, data: report }
  } catch (error: any) {
    console.error('Failed to create behavior report:', error)
    return { success: false, error: error.message || 'Failed to create report' }
  }
}

export async function getBehaviorReportsBySection(sectionId: string) {
  try {
    await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.REGISTRAR])
    const reports = await prisma.behaviorReport.findMany({
      where: { student: { sectionId } },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        teacher: { select: { id: true, user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: reports }
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch behavior reports' }
  }
}

const createFlourishingSchema = z.object({
  studentId: z.string(),
  type: z.string(),
  score: z.number().min(0).max(100),
  details: z.string().optional(),
})

export async function createFlourishingAssessment(data: z.infer<typeof createFlourishingSchema>) {
  try {
    await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL])
    const parsed = createFlourishingSchema.parse(data)
    
    const assessment = await prisma.flourishingAssessment.create({
      data: parsed
    })

    return { success: true, data: assessment }
  } catch (error: any) {
    return { success: false, error: 'Failed to create assessment' }
  }
}

export async function getFlourishingAssessments(studentId: string) {
  try {
    await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.REGISTRAR])
    const assessments = await prisma.flourishingAssessment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: assessments }
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch assessments' }
  }
}
