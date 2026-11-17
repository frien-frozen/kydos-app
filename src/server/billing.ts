'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import type { ServerActionResponse } from '@/types'
import type { Invoice, Student, School } from '@prisma/client'

const PaymentSchema = z.object({
  studentId:     z.string().min(1),
  schoolId:      z.string().min(1),
  amount:        z.number().positive(),
  monthsPaid:    z.number().min(1).max(12),
  description:   z.string().min(1),
  paymentMethod: z.string().min(1),
})

const CreateInvoiceSchema = z.object({
  schoolId:    z.string().min(1),
  studentId:   z.string().min(1), // or 'ALL' for school-wide billing
  amount:      z.number().positive(),
  monthsPaid:  z.number().int().min(1).max(12),
  dueDate:     z.string().optional(),
  description: z.string().min(1),
})

const BillingSettingsSchema = z.object({
  schoolId:        z.string().min(1),
  monthlyTuition:  z.number().min(0),
  gracePeriodDays: z.number().int().min(0).max(90),
})

export async function recordPayment(
  input: z.infer<typeof PaymentSchema>
): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const data = PaymentSchema.parse(input)

    const student = await prisma.student.findUnique({ where: { id: data.studentId } })
    if (!student) return { success: false, error: 'Student profile not found' }

    const currentPaidUntil =
      student.paidUntil && student.paidUntil > new Date()
        ? student.paidUntil
        : new Date()

    const newPaidUntil = new Date(currentPaidUntil)
    newPaidUntil.setMonth(newPaidUntil.getMonth() + data.monthsPaid)

    const invoice = await prisma.$transaction(async (tx) => {
      const record = await tx.invoice.create({
        data: {
          userId:        student.userId,
          studentId:     student.id,
          schoolId:      data.schoolId,
          amount:        data.amount,
          description:   data.description,
          status:        'PAID',
          paidAt:        new Date(),
          monthsPaid:    data.monthsPaid,
          paymentMethod: data.paymentMethod,
        },
      })

      await tx.student.update({
        where: { id: student.id },
        data:  { paidUntil: newPaidUntil },
      })

      return record
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    revalidatePath(ROUTES.dashboard)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function createInvoice(
  input: z.infer<typeof CreateInvoiceSchema>
): Promise<ServerActionResponse<{ count: number }>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const data = CreateInvoiceSchema.parse(input)
    const parsedDueDate = data.dueDate ? new Date(data.dueDate) : undefined

    if (data.studentId === 'ALL') {
      const students = await prisma.student.findMany({
        where: { user: { schoolId: data.schoolId } },
        select: { id: true, userId: true },
      })
      if (students.length === 0) {
        return { success: false, error: 'No students enrolled in this school' }
      }

      await prisma.invoice.createMany({
        data: students.map((s) => ({
          studentId:   s.id,
          userId:      s.userId,
          schoolId:    data.schoolId,
          amount:      data.amount,
          monthsPaid:  data.monthsPaid,
          dueDate:     parsedDueDate,
          description: data.description,
          status:      'PENDING',
        })),
      })

      revalidatePath(ROUTES.billing)
      revalidatePath(ROUTES.payments)
      return { success: true, data: { count: students.length } }
    } else {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } })
      if (!student) return { success: false, error: 'Student not found' }

      await prisma.invoice.create({
        data: {
          studentId:   student.id,
          userId:      student.userId,
          schoolId:    data.schoolId,
          amount:      data.amount,
          monthsPaid:  data.monthsPaid,
          dueDate:     parsedDueDate,
          description: data.description,
          status:      'PENDING',
        },
      })

      revalidatePath(ROUTES.billing)
      revalidatePath(ROUTES.payments)
      return { success: true, data: { count: 1 } }
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateBillingSettings(
  input: z.infer<typeof BillingSettingsSchema>
): Promise<ServerActionResponse<School>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const data = BillingSettingsSchema.parse(input)

    const updated = await prisma.school.update({
      where: { id: data.schoolId },
      data: {
        monthlyTuition:  data.monthlyTuition,
        gracePeriodDays: data.gracePeriodDays,
      },
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.settings)
    return { success: true, data: updated }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function liftStudentSuspension(
  studentId: string,
  extensionDays: number = 14
): Promise<ServerActionResponse<Student>> {
  try {
    await requireRole([ROLES.PRINCIPAL, ROLES.FINANCE_ADMIN])
    const parsedId = z.string().min(1).parse(studentId)
    const parsedDays = z.number().int().min(1).max(365).parse(extensionDays)

    const newPaidUntil = new Date()
    newPaidUntil.setDate(newPaidUntil.getDate() + parsedDays)

    const updated = await prisma.student.update({
      where: { id: parsedId },
      data:  { paidUntil: newPaidUntil },
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.students)
    revalidatePath(ROUTES.dashboard)
    return { success: true, data: updated }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function suspendStudentAccess(
  studentId: string
): Promise<ServerActionResponse<Student>> {
  try {
    await requireRole([ROLES.PRINCIPAL, ROLES.FINANCE_ADMIN])
    const parsedId = z.string().min(1).parse(studentId)

    const student = await prisma.student.findUnique({
      where: { id: parsedId },
      include: { user: { include: { school: true } } },
    })
    if (!student) return { success: false, error: 'Student not found' }

    const graceDays = student.user.school?.gracePeriodDays ?? 7
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - (graceDays + 1))

    const updated = await prisma.student.update({
      where: { id: parsedId },
      data:  { paidUntil: expiredDate },
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.students)
    revalidatePath(ROUTES.dashboard)
    return { success: true, data: updated }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getPaymentsForSchool(schoolId: string) {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const invoices = await prisma.invoice.findMany({
      where:   { schoolId, status: 'PAID' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: invoices }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getPaymentsForStudent(userId: string) {
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

export async function uploadPaymentProof(
  invoiceId: string,
  url: string
): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.STUDENT, ROLES.PARENT])
    const parsedId = z.string().min(1).parse(invoiceId)
    const parsedUrl = z.string().url().parse(url)

    const invoice = await prisma.invoice.update({
      where: { id: parsedId },
      data:  { paymentProofUrl: parsedUrl, status: 'PENDING' },
    })
    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function rejectPaymentProof(
  invoiceId: string,
  reason?: string
): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const parsedId = z.string().min(1).parse(invoiceId)

    const existing = await prisma.invoice.findUnique({ where: { id: parsedId } })
    if (!existing) return { success: false, error: 'Invoice not found' }

    const baseDesc = (existing.description || 'Tuition Payment').replace(/ \[Receipt Rejected:.*\]$/, '')
    const updatedDesc = reason
      ? `${baseDesc} [Receipt Rejected: ${reason}]`
      : `${baseDesc} [Receipt Rejected: Please upload a clearer proof of payment]`

    const updated = await prisma.invoice.update({
      where: { id: parsedId },
      data: {
        paymentProofUrl: null,
        description:     updatedDesc,
      },
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    return { success: true, data: updated }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function cancelPendingPaymentRequest(
  invoiceId: string
): Promise<ServerActionResponse<{ deleted: boolean }>> {
  try {
    await requireRole([ROLES.STUDENT, ROLES.PARENT, ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const parsedId = z.string().min(1).parse(invoiceId)

    const existing = await prisma.invoice.findUnique({ where: { id: parsedId } })
    if (!existing) return { success: false, error: 'Invoice not found' }
    if (existing.status === 'PAID') return { success: false, error: 'Cannot cancel a paid invoice' }

    await prisma.invoice.delete({ where: { id: parsedId } })
    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    return { success: true, data: { deleted: true } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function markInvoicePaid(invoiceId: string): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.FINANCE_ADMIN, ROLES.PRINCIPAL])
    const parsedId = z.string().min(1).parse(invoiceId)

    const existing = await prisma.invoice.findUnique({
      where: { id: parsedId },
      include: { student: true },
    })
    if (!existing) return { success: false, error: 'Invoice not found' }

    const currentPaidUntil =
      existing.student.paidUntil && existing.student.paidUntil > new Date()
        ? existing.student.paidUntil
        : new Date()

    const newPaidUntil = new Date(currentPaidUntil)
    newPaidUntil.setMonth(newPaidUntil.getMonth() + (existing.monthsPaid || 1))

    const cleanDescription = existing.description?.replace(/ \[Receipt Rejected:.*\]$/, '')

    const invoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: parsedId },
        data: {
          status:      'PAID',
          paidAt:      new Date(),
          description: cleanDescription,
        },
      })
      await tx.student.update({
        where: { id: existing.studentId },
        data:  { paidUntil: newPaidUntil },
      })
      return updated
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    revalidatePath(ROUTES.dashboard)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function createPendingPaymentRequest(
  studentId: string,
  schoolId: string,
  amount: number,
  monthsPaid: number,
  description: string,
  paymentMethod: string
): Promise<ServerActionResponse<Invoice>> {
  try {
    await requireRole([ROLES.PARENT, ROLES.STUDENT])

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return { success: false, error: 'Student not found' }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    const invoice = await prisma.invoice.create({
      data: {
        userId:        student.userId,
        studentId:     student.id,
        schoolId:      schoolId,
        amount:        amount,
        dueDate:       dueDate,
        description:   description,
        status:        'PENDING',
        monthsPaid:    monthsPaid,
        paymentMethod: paymentMethod,
      },
    })

    revalidatePath(ROUTES.billing)
    revalidatePath(ROUTES.payments)
    return { success: true, data: invoice }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
