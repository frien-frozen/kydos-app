'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import type { ServerActionResponse } from '@/types'
import type { Invoice, AccessSuspension } from '@prisma/client'

const InvoiceSchema = z.object({
  userId:      z.string().min(1),
  schoolId:    z.string().min(1),
  amount:      z.number().positive(),
  description: z.string().min(1),
  dueDate:     z.string().min(1),
})

export async function createInvoice(
  input: z.infer<typeof InvoiceSchema>
): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN])
    const data = InvoiceSchema.parse(input)

    const student = await prisma.student.findUnique({ where: { userId: data.userId } })
    if (!student) return { success: false, error: 'Student profile not found' }

    const invoice = await prisma.invoice.create({
      data: {
        userId:      data.userId,
        studentId:   student.id,
        schoolId:    data.schoolId,
        amount:      data.amount,
        description: data.description,
        dueDate:     new Date(data.dueDate),
      },
    })

    revalidatePath(ROUTES.billing)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function markInvoicePaid(invoiceId: string): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN])
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data:  { status: 'PAID', paidAt: new Date() },
    })
    revalidatePath(ROUTES.billing)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function uploadPaymentProof(invoiceId: string, url: string): Promise<ServerActionResponse<Invoice>> {
  try {
    const user = await requireRole([ROLES.STUDENT, ROLES.PARENT])
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId, userId: user.id },
      data:  { paymentProofUrl: url },
    })
    revalidatePath(ROUTES.billing)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getInvoicesForSchool(schoolId: string) {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const invoices = await prisma.invoice.findMany({
      where:   { schoolId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: invoices }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getInvoicesForStudent(userId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: invoices }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function requestSuspension(
  studentId: string,
  reason: string
): Promise<ServerActionResponse<AccessSuspension>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN])
    const user = await getCurrentUser()

    const existing = await prisma.accessSuspension.findFirst({
      where: { studentId, status: { in: ['PENDING', 'APPROVED'] } },
    })

    const suspension = existing
      ? await prisma.accessSuspension.update({
          where: { id: existing.id },
          data:  { reason, status: 'PENDING', requestedBy: user!.id, approvedBy: null },
        })
      : await prisma.accessSuspension.create({
          data: { studentId, reason, status: 'PENDING', requestedBy: user!.id },
        })

    revalidatePath(ROUTES.suspensions)
    return { success: true, data: suspension }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function approveSuspension(
  suspensionId: string
): Promise<ServerActionResponse<AccessSuspension>> {
  try {
    const user = await requireRole([ROLES.PRINCIPAL])
    const suspension = await prisma.accessSuspension.update({
      where: { id: suspensionId },
      data:  { status: 'APPROVED', approvedBy: user.id },
    })
    revalidatePath(ROUTES.suspensions)
    return { success: true, data: suspension }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function liftSuspension(
  suspensionId: string
): Promise<ServerActionResponse<AccessSuspension>> {
  try {
    await requireRole([ROLES.PRINCIPAL, ROLES.FINANCE_ADMIN])
    const suspension = await prisma.accessSuspension.update({
      where: { id: suspensionId },
      data:  { status: 'LIFTED' },
    })
    revalidatePath(ROUTES.suspensions)
    return { success: true, data: suspension }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
