import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    if (payload.data?.attributes?.type === 'payment.paid') {
      const invoiceId = payload.data.attributes.data?.attributes?.description
      if (invoiceId) {
        const existing = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { student: true },
        })

        if (existing && existing.status !== 'PAID') {
          const currentPaidUntil =
            existing.student.paidUntil && existing.student.paidUntil > new Date()
              ? existing.student.paidUntil
              : new Date()

          const newPaidUntil = new Date(currentPaidUntil)
          newPaidUntil.setMonth(newPaidUntil.getMonth() + (existing.monthsPaid || 1))

          await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoiceId },
              data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod: existing.paymentMethod || 'PayMongo Online',
              },
            }),
            prisma.student.update({
              where: { id: existing.studentId },
              data: { paidUntil: newPaidUntil },
            }),
          ])
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
