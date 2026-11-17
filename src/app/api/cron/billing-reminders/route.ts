import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppNotification } from '@/server/notifications'

export async function GET() {
  try {
    const now = new Date()
    const in2DaysStart = new Date(now)
    in2DaysStart.setDate(now.getDate() + 2)
    in2DaysStart.setHours(0, 0, 0, 0)
    const in2DaysEnd = new Date(in2DaysStart)
    in2DaysEnd.setHours(23, 59, 59, 999)

    const in7DaysStart = new Date(now)
    in7DaysStart.setDate(now.getDate() + 7)
    in7DaysStart.setHours(0, 0, 0, 0)
    const in7DaysEnd = new Date(in7DaysStart)
    in7DaysEnd.setHours(23, 59, 59, 999)

    // 1. Mark overdue PENDING invoices whose dueDate has passed
    const overdueResult = await prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    })

    // 2. Find students whose subscription expires in 7 days (Regular Reminder) or 2 days (Urgent Reminder)
    const students = await prisma.student.findMany({
      where: {
        paidUntil: { not: null },
      },
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
        parent: { include: { user: { select: { name: true, email: true, phoneNumber: true } } } },
      },
    })

    let regularRemindersSent = 0
    let urgentRemindersSent = 0

    for (const s of students) {
      if (!s.paidUntil) continue
      const paidUntilTime = s.paidUntil.getTime()
      const recipientPhone = s.parent?.user.phoneNumber || s.user.phoneNumber || s.user.email
      const studentName = s.user.name || s.user.email

      if (paidUntilTime >= in7DaysStart.getTime() && paidUntilTime <= in7DaysEnd.getTime()) {
        await sendWhatsAppNotification(
          recipientPhone,
          `[Kydos Regular Reminder] Tuition for ${studentName} is due in 7 days (${s.paidUntil.toLocaleDateString()}). Please visit the Billing portal to settle or upload a receipt.`
        )
        regularRemindersSent++
      } else if (paidUntilTime >= in2DaysStart.getTime() && paidUntilTime <= in2DaysEnd.getTime()) {
        await sendWhatsAppNotification(
          recipientPhone,
          `[Kydos Urgent Reminder] Tuition for ${studentName} is due in 2 days (${s.paidUntil.toLocaleDateString()}). To avoid account access interruptions, please complete payment promptly.`
        )
        urgentRemindersSent++
      }
    }

    return NextResponse.json({
      success: true,
      overdueMarked: overdueResult.count,
      regularRemindersSent,
      urgentRemindersSent,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
