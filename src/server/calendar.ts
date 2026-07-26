'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import type { ServerActionResponse } from '@/types'
import type { Event } from '@prisma/client'

const EventSchema = z.object({
  title: z.string().min(1).max(100),
  date:  z.string().min(1),
})

export async function createEvent(
  input: z.infer<typeof EventSchema>
): Promise<ServerActionResponse<Event>> {
  try {
    const user = await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL])
    const data = EventSchema.parse(input)

    const event = await prisma.event.create({
      data: {
        title:    data.title,
        date:     new Date(data.date),
        schoolId: user.schoolId!,
        authorId: user.id,
        status:   user.role === ROLES.PRINCIPAL ? 'APPROVED' : 'PENDING',
      },
    })

    revalidatePath(ROUTES.calendar)
    return { success: true, data: event }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function approveEvent(id: string): Promise<ServerActionResponse<Event>> {
  try {
    const user = await requireRole([ROLES.PRINCIPAL])
    const event = await prisma.event.update({
      where: { id, schoolId: user.schoolId! },
      data: { status: 'APPROVED' }
    })
    revalidatePath(ROUTES.calendar)
    return { success: true, data: event }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function rejectEvent(id: string): Promise<ServerActionResponse<Event>> {
  try {
    const user = await requireRole([ROLES.PRINCIPAL])
    const event = await prisma.event.update({
      where: { id, schoolId: user.schoolId! },
      data: { status: 'REJECTED' }
    })
    revalidatePath(ROUTES.calendar)
    return { success: true, data: event }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
