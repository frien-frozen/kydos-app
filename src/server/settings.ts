'use server'
import { prisma } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/auth-utils'
import { z } from 'zod'
import { ROLES } from '@/lib/roles'

// Update school info
export async function updateSchoolSettings(schoolId: string, data: {
  name?: string
  periodType?: string
  periodCount?: number
  schoolYear?: string
  logo?: string
}) {
  await requireRole([ROLES.PRINCIPAL])
  return prisma.school.update({ where: { id: schoolId }, data })
}

// Update period labels + dates
export async function updatePeriod(periodId: string, data: {
  label?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
}) {
  await requireRole([ROLES.PRINCIPAL])
  return prisma.period.update({
    where: { id: periodId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }
  })
}

// Set active period
export async function setActivePeriod(schoolId: string, periodId: string) {
  await requireRole([ROLES.PRINCIPAL])
  await prisma.period.updateMany({ where: { schoolId }, data: { isActive: false } })
  return prisma.period.update({ where: { id: periodId }, data: { isActive: true } })
}

// Add period
export async function addPeriod(schoolId: string, label: string, order: number) {
  await requireRole([ROLES.PRINCIPAL])
  return prisma.period.create({ data: { schoolId, label, order } })
}

// Delete period
export async function deletePeriod(periodId: string) {
  await requireRole([ROLES.PRINCIPAL])
  return prisma.period.delete({ where: { id: periodId } })
}

// Add subject
export async function addSubject(schoolId: string, name: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.subject.create({ data: { schoolId, name } })
}

// Delete subject
export async function deleteSubject(subjectId: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.subject.delete({ where: { id: subjectId } })
}

// Add section
export async function addSection(schoolId: string, name: string, gradeLevel: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.section.create({ data: { schoolId, name, gradeLevel } })
}

// Update section name
export async function updateSection(sectionId: string, name: string, gradeLevel: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.section.update({ where: { id: sectionId }, data: { name, gradeLevel } })
}

// Delete section
export async function deleteSection(sectionId: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.section.delete({ where: { id: sectionId } })
}

// Assign teacher to subject in section
export async function assignTeacher(sectionId: string, subjectId: string, teacherId: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.sectionSubject.upsert({
    where: { sectionId_subjectId: { sectionId, subjectId } },
    update: { teacherId },
    create: { sectionId, subjectId, teacherId }
  })
}

// Remove subject from section
export async function removeSectionSubject(sectionId: string, subjectId: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.sectionSubject.delete({
    where: { sectionId_subjectId: { sectionId, subjectId } }
  })
}

// Add subject to section
export async function addSubjectToSection(sectionId: string, subjectId: string) {
  await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  return prisma.sectionSubject.create({ data: { sectionId, subjectId } })
}

// Update user profile
export async function updateUserProfile(data: { name?: string; image?: string }) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  const nameValid = !data.name || data.name.trim().split(' ').filter(Boolean).length >= 2
  if (!nameValid) return { success: false, error: 'Please enter your full name (first and last)' }
  await prisma.user.update({ where: { id: user.id }, data })
  return { success: true }
}
