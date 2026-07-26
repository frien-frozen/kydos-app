'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import type { ServerActionResponse } from '@/types'
import type { Assignment, Submission } from '@prisma/client'

const AssignmentSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  subjectId:   z.string().min(1, 'Subject is required'),
  sectionId:   z.string().min(1),
  dueDate:     z.string().optional(),
  linkUrl:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

const SubmitSchema = z.object({
  assignmentId: z.string().min(1),
  linkUrl:      z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export async function createAssignment(
  formData: FormData
): Promise<ServerActionResponse<Assignment>> {
  const user = await requireRole([ROLES.TEACHER])

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return { success: false, error: 'Teacher profile not found' }

  const raw = {
    title:       formData.get('title'),
    description: formData.get('description') || undefined,
    subjectId:   formData.get('subjectId'),
    sectionId:   formData.get('sectionId'),
    dueDate:     formData.get('dueDate') || undefined,
    linkUrl:     formData.get('linkUrl') || undefined,
  }

  const parsed = AssignmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { title, description, subjectId, sectionId, dueDate, linkUrl } = parsed.data

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      subjectId,
      sectionId,
      teacherId: teacher.id,
      dueDate:   dueDate ? new Date(dueDate) : undefined,
      linkUrl:   linkUrl || null,
    },
  })

  revalidatePath(ROUTES.assignments)
  return { success: true, data: assignment }
}

export async function getAssignmentsBySection(sectionId: string) {
  return prisma.assignment.findMany({
    where: { sectionId },
    include: {
      subject:     true,
      teacher:     { include: { user: true } },
      _count:      { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAssignmentsForStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { sectionId: true, submissions: { select: { assignmentId: true } } },
  })
  if (!student?.sectionId) return []

  const assignments = await prisma.assignment.findMany({
    where: { sectionId: student.sectionId },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const submittedIds = new Set(student.submissions.map((s) => s.assignmentId))
  return assignments.map((a) => ({ ...a, submitted: submittedIds.has(a.id) }))
}

export async function submitAssignment(
  formData: FormData
): Promise<ServerActionResponse<Submission>> {
  const user = await requireRole([ROLES.STUDENT])

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return { success: false, error: 'Student profile not found' }

  const raw = {
    assignmentId: formData.get('assignmentId'),
    linkUrl:      formData.get('linkUrl') || undefined,
  }

  const parsed = SubmitSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: parsed.data.assignmentId, studentId: student.id } },
  })
  if (existing) return { success: false, error: 'Already submitted' }

  const portfolio = formData.get('portfolio') as File | null;
  const portfolioUrl = portfolio && portfolio.name ? `/uploads/mock-portfolio-${portfolio.name}` : undefined;

  const submission = await prisma.submission.create({
    data: {
      assignmentId: parsed.data.assignmentId,
      studentId:    student.id,
      linkUrl:      parsed.data.linkUrl || null,
      portfolioUrl: portfolioUrl || null,
    },
  })

  revalidatePath(ROUTES.assignments)
  revalidatePath(ROUTES.assignment(parsed.data.assignmentId))
  return { success: true, data: submission }
}
