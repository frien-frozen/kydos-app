'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import type { ServerActionResponse } from '@/types'
import type { Announcement } from '@prisma/client'

const AnnouncementSchema = z.object({
  title:     z.string().min(1).max(100),
  content:   z.string().min(1),
  schoolId:  z.string(),
  sectionId: z.string().optional(),
})

export async function createAnnouncement(
  input: z.infer<typeof AnnouncementSchema>
): Promise<ServerActionResponse<Announcement>> {
  try {
    const user = await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL])
    const data = AnnouncementSchema.parse(input)

    const teacher = user.role === ROLES.TEACHER
      ? await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null

    const announcement = await prisma.announcement.create({
      data: {
        title:     data.title,
        content:   data.content,
        schoolId:  data.schoolId,
        sectionId: data.sectionId ?? null,
        authorId:  user.id,
        teacherId: teacher?.id ?? null,
        status:    user.role === ROLES.PRINCIPAL ? 'APPROVED' : 'PENDING',
      },
    })

    revalidatePath(ROUTES.announcements)
    return { success: true, data: announcement }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getAnnouncements(schoolId: string, sectionId?: string) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [
          { sectionId: null },
          ...(sectionId ? [{ sectionId }] : []),
        ],
      },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: announcements }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function approveAnnouncement(id: string): Promise<ServerActionResponse<Announcement>> {
  try {
    const user = await requireRole([ROLES.PRINCIPAL])
    const announcement = await prisma.announcement.update({
      where: { id, schoolId: user.schoolId! },
      data: { status: 'APPROVED' }
    })
    revalidatePath(ROUTES.announcements)
    return { success: true, data: announcement }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function rejectAnnouncement(id: string): Promise<ServerActionResponse<Announcement>> {
  try {
    const user = await requireRole([ROLES.PRINCIPAL])
    const announcement = await prisma.announcement.update({
      where: { id, schoolId: user.schoolId! },
      data: { status: 'REJECTED' }
    })
    revalidatePath(ROUTES.announcements)
    return { success: true, data: announcement }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
