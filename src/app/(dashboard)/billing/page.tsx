import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { markInvoicePaid } from '@/server/billing'
import { createPaymongoCheckoutSession } from '@/server/payments'
import type { InvoiceStatus } from '@prisma/client'
import { PaymentUpload } from '@/components/billing/PaymentUpload'

async function markPaidAction(invoiceId: string): Promise<void> {
  'use server'
  await markInvoicePaid(invoiceId)
}

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_PILL: Record<InvoiceStatus, string> = {
  PAID:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  OVERDUE: 'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID:    'Paid',
  PENDING: 'Unpaid',
  OVERDUE: 'Overdue',
}

async function StudentBillingView({ userId }: { userId: string }) {
  const invoices = await prisma.invoice.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  })

  const totalOwed = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalOwed > 0 ? `Total outstanding: ${peso(totalOwed)}` : 'All payments up to date.'}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{inv.description}</p>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(inv.dueDate)}
                  {inv.paidAt ? ` · Paid ${formatDate(inv.paidAt)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <span className="text-sm font-medium text-foreground">{peso(inv.amount)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[inv.status]}`}>
                  {STATUS_LABEL[inv.status]}
                </span>
                {inv.status !== 'PAID' && (
                  <div className="flex flex-col gap-2 items-end">
                    <form action={async () => {
                      'use server'
                      const res = await createPaymongoCheckoutSession(inv.id)
                      if (res.success && res.data?.checkoutUrl) redirect(res.data.checkoutUrl)
                    }}>
                      <button className="text-xs px-3 py-1 bg-[#10a37f] text-primary-foreground rounded-full hover:bg-emerald-600 transition-colors">
                        Pay via GCash
                      </button>
                    </form>
                    {!inv.paymentProofUrl && <PaymentUpload invoiceId={inv.id} />}
                    {inv.paymentProofUrl && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        Receipt submitted
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function AdminBillingView({ schoolId }: { schoolId: string }) {
  const invoices = await prisma.invoice.findMany({
    where:   { schoolId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total   = invoices.length
  const paid    = invoices.filter((i) => i.status === 'PAID').length
  const unpaid  = invoices.filter((i) => i.status === 'PENDING').length
  const overdue = invoices.filter((i) => i.status === 'OVERDUE').length

  const stats = [
    { label: 'Total invoices', value: total },
    { label: 'Paid',           value: paid },
    { label: 'Unpaid',         value: unpaid },
    { label: 'Overdue',        value: overdue },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">All school invoices.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-muted px-5 py-4 space-y-1">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {['Student', 'Description', 'Amount', 'Due date', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const markPaid = markPaidAction.bind(null, inv.id)
                return (
                  <tr key={inv.id} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {inv.user.name ?? inv.user.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.description}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{peso(inv.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status !== 'PAID' && (
                        <form action={markPaid}>
                          <button
                            type="submit"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                          >
                            Mark paid
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function BillingPage() {
  const user = await requireAuth()

  if (user.role === ROLES.STUDENT)      return <StudentBillingView userId={user.id} />
  if (user.role === ROLES.FINANCE_ADMIN && user.schoolId) return <AdminBillingView schoolId={user.schoolId} />

  redirect(ROUTES.dashboard)
}
