import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { markInvoicePaid } from '@/server/billing'

async function handleMarkPaid(formData: FormData) {
  'use server'
  const invoiceId = formData.get('invoiceId') as string
  if (invoiceId) {
    await markInvoicePaid(invoiceId)
  }
}

export default async function PaymentsPage() {
  const user = await requireAuth()
  if (user.role !== ROLES.FINANCE_ADMIN || !user.schoolId) {
    redirect('/dashboard')
  }

  // Get invoices with payment proofs that are pending
  const pendingPayments = await prisma.invoice.findMany({
    where: {
      schoolId: user.schoolId,
      status: 'PENDING',
      paymentProofUrl: { not: null }
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } }
    },
    orderBy: { updatedAt: 'asc' }
  })

  // Also get some recently paid ones for context
  const recentPayments = await prisma.invoice.findMany({
    where: {
      schoolId: user.schoolId,
      status: 'PAID'
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } }
    },
    orderBy: { paidAt: 'desc' },
    take: 10
  })

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Review uploaded payment proofs and mark invoices as paid.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground">Requires Review</h2>
        {pendingPayments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
            <p className="text-sm text-muted-foreground">No pending payments require review.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {pendingPayments.map(invoice => (
              <div key={invoice.id} className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {invoice.student.user.name || invoice.student.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                  <p className="text-xs font-medium text-amber-600">${invoice.amount.toFixed(2)} due by {invoice.dueDate.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <a 
                    href={invoice.paymentProofUrl!} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors text-center flex-1 md:flex-none"
                  >
                    View Receipt
                  </a>
                  <form action={handleMarkPaid} className="flex-1 md:flex-none">
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <button type="submit" className="w-full text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
                      Mark as Paid
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-lg font-medium text-foreground">Recently Paid</h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {recentPayments.map(invoice => (
            <div key={invoice.id} className="p-5 flex items-center justify-between opacity-70">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {invoice.student.user.name || invoice.student.user.email}
                </p>
                <p className="text-xs text-muted-foreground">{invoice.description}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-foreground">${invoice.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Paid {invoice.paidAt?.toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {recentPayments.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent payments.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
