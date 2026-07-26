'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { z } from 'zod'
import { ROLES } from '@/lib/roles'
import { ServerActionResponse } from '@/types'

const GradeEntrySchema = z.object({
  studentId:   z.string(),
  subjectId:   z.string(),
  periodId:    z.string(),
  quiz1:       z.number().min(0).max(100).nullable(),
  quiz2:       z.number().min(0).max(100).nullable(),
  quiz3:       z.number().min(0).max(100).nullable(),
  quiz4:       z.number().min(0).max(100).nullable(),
  quiz5:       z.number().min(0).max(100).nullable(),
  summative1:  z.number().min(0).max(100).nullable(),
  summative2:  z.number().min(0).max(100).nullable(),
  summative3:  z.number().min(0).max(100).nullable(),
  summative4:  z.number().min(0).max(100).nullable(),
  summative5:  z.number().min(0).max(100).nullable(),
  portfolio:   z.number().min(0).max(100).nullable(),
  finalExam:   z.number().min(0).max(100).nullable(),
})

export async function upsertGradeEntry(
  input: z.infer<typeof GradeEntrySchema>
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole([ROLES.TEACHER, ROLES.REGISTRAR])
    const data = GradeEntrySchema.parse(input)

    const entry = await prisma.gradeEntry.upsert({
      where: {
        studentId_subjectId_periodId: {
          studentId: data.studentId,
          subjectId: data.subjectId,
          periodId:  data.periodId,
        },
      },
      update: { ...data },
      create: { ...data },
    })
    return { success: true, data: entry }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export type GradeField =
  | 'quiz1' | 'quiz2' | 'quiz3' | 'quiz4' | 'quiz5'
  | 'summative1' | 'summative2' | 'summative3' | 'summative4' | 'summative5'
  | 'portfolio' | 'finalExam'

export async function updateGradeField(
  studentId: string,
  subjectId: string,
  periodId:  string,
  field:     GradeField,
  value:     number | null
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole([ROLES.TEACHER, ROLES.REGISTRAR])

    const existing = await prisma.gradeEntry.findUnique({
      where: { studentId_subjectId_periodId: { studentId, subjectId, periodId } },
    })

    if (existing) {
      const entry = await prisma.gradeEntry.update({
        where: { id: existing.id },
        data:  { [field]: value },
      })
      return { success: true, data: entry }
    }

    const entry = await prisma.gradeEntry.create({
      data: { studentId, subjectId, periodId, [field]: value },
    })
    return { success: true, data: entry }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getGradesBySubject(subjectId: string, periodId: string) {
  try {
    await requireRole([ROLES.TEACHER, ROLES.REGISTRAR, ROLES.PRINCIPAL])
    const entries = await prisma.gradeEntry.findMany({
      where:   { subjectId, periodId },
      include: { student: { include: { user: true } } },
      orderBy: { student: { user: { name: 'asc' } } },
    })
    return { success: true, data: entries }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getGradesByStudent(studentId: string) {
  try {
    const entries = await prisma.gradeEntry.findMany({
      where:   { studentId },
      include: { subject: true, period: true },
      orderBy: [{ period: { order: 'asc' } }, { subject: { name: 'asc' } }],
    })
    return { success: true, data: entries }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
