import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  markInvoicePaid,
  rejectPaymentProof,
  cancelPendingPaymentRequest,
} from '@/server/billing'

async function handleMarkPaid(formData: FormData) {
  'use server'
  const invoiceId = formData.get('invoiceId') as string
  if (invoiceId) {
    await markInvoicePaid(invoiceId)
  }
}

async function handleRejectProof(formData: FormData) {
  'use server'
  const invoiceId = formData.get('invoiceId') as string
  const reason = (formData.get('reason') as string) || 'Receipt unreadable or mismatched amount'
  if (invoiceId) {
    await rejectPaymentProof(invoiceId, reason)
  }
}

async function handleCancelInvoice(formData: FormData) {
  'use server'
  const invoiceId = formData.get('invoiceId') as string
  if (invoiceId) {
    await cancelPendingPaymentRequest(invoiceId)
  }
}

export default async function PaymentsPage() {
  const user = await requireAuth()
  if ((user.role !== ROLES.FINANCE_ADMIN && user.role !== ROLES.PRINCIPAL) || !user.schoolId) {
    redirect('/dashboard')
  }

  // 1. Invoices with uploaded payment proofs awaiting review
  const pendingProofs = await prisma.invoice.findMany({
    where: {
      schoolId:        user.schoolId,
      status:          { in: ['PENDING', 'OVERDUE'] },
      paymentProofUrl: { not: null },
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { updatedAt: 'asc' },
  })

  // 2. Open invoices awaiting payment or receipt upload
  const awaitingPayment = await prisma.invoice.findMany({
    where: {
      schoolId:        user.schoolId,
      status:          { in: ['PENDING', 'OVERDUE'] },
      paymentProofUrl: null,
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })

  // 3. All recently paid/verified payments (both uploaded receipts and walk-in manual payments)
  const recentPayments = await prisma.invoice.findMany({
    where: {
      schoolId: user.schoolId,
      status:   'PAID',
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { paidAt: 'desc' },
    take: 20,
  })

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payments & Receipt Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify or reject uploaded payment receipts, settle open invoices, and audit the payment ledger.
        </p>
      </div>

      {/* Section 1: Uploaded Receipts Requiring Verification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            Receipts Requiring Review ({pendingProofs.length})
          </h2>
        </div>

        {pendingProofs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center bg-card">
            <p className="text-sm text-muted-foreground">
              No uploaded payment receipts are currently waiting for verification.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {pendingProofs.map((invoice) => (
              <div
                key={invoice.id}
                className="p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {invoice.student.user.name || invoice.student.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                  <p className="text-xs font-medium text-amber-600">
                    ₱{invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} for{' '}
                    {invoice.monthsPaid || 1}{' '}
                    {(invoice.monthsPaid || 1) === 1 ? 'month' : 'months'}
                    {invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <a
                    href={invoice.paymentProofUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors text-center"
                  >
                    View Receipt
                  </a>
                  <form action={handleMarkPaid}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Verify & Extend Access
                    </button>
                  </form>
                  <form action={handleRejectProof}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input
                      type="hidden"
                      name="reason"
                      value="Please re-upload a clear receipt matching the billed amount"
                    />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Reject Receipt
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Open Invoices Awaiting Payment */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-medium text-foreground">
          Open Invoices Awaiting Payment ({awaitingPayment.length})
        </h2>
        {awaitingPayment.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
            <p className="text-sm text-muted-foreground">No open unpaid invoices.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {awaitingPayment.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {invoice.student.user.name || invoice.student.user.email}
                    </p>
                    {invoice.status === 'OVERDUE' && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {invoice.description}
                    {invoice.dueDate ? ` · Due ${invoice.dueDate.toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-foreground mr-2">
                    ₱{invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                  <form action={handleMarkPaid}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Mark Paid (Walk-in)
                    </button>
                  </form>
                  <form action={handleCancelInvoice}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-red-600 px-2 py-1.5 transition-colors cursor-pointer"
                    >
                      Void
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Payment Ledger (All Verified & Manual Payments) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-medium text-foreground">Verified Payment Ledger</h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {recentPayments.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/20"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {invoice.student.user.name || invoice.student.user.email}
                  </p>
                  {invoice.paymentMethod && (
                    <span className="bg-muted text-muted-foreground text-[11px] px-2 py-0.5 rounded-md font-medium">
                      {invoice.paymentMethod}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoice.description} ({invoice.monthsPaid || 1}{' '}
                  {(invoice.monthsPaid || 1) === 1 ? 'month' : 'months'})
                </p>
              </div>
              <div className="flex items-center gap-4 sm:text-right">
                {invoice.paymentProofUrl && (
                  <a
                    href={invoice.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Receipt
                  </a>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    ₱{invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paid {(invoice.paidAt || invoice.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {recentPayments.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No verified payments recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
