import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  createPendingPaymentRequest,
  cancelPendingPaymentRequest,
} from '@/server/billing'
import { PaymentUpload } from '@/components/billing/PaymentUpload'
import { RecordPaymentForm } from '@/components/billing/RecordPaymentForm'
import {
  CreateInvoiceDialog,
  BillingSettingsDialog,
  AdminStudentBillingTable,
} from '@/components/billing/AdminBillingTools'

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDate(date: Date | null) {
  if (!date) return 'Not paid yet'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function computeStudentStatus(
  paidUntil: Date | null,
  gracePeriodDays: number
): 'Active' | 'Grace Period' | 'Suspended' {
  if (!paidUntil) return 'Suspended'
  const now = new Date()
  if (paidUntil > now) return 'Active'
  const graceEnd = new Date(paidUntil.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
  if (now > graceEnd) return 'Suspended'
  return 'Grace Period'
}

function getStatusBadge(paidUntil: Date | null, gracePeriodDays: number) {
  const status = computeStudentStatus(paidUntil, gracePeriodDays)
  if (status === 'Active') {
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
        Active
      </span>
    )
  }
  if (status === 'Grace Period') {
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
        Grace Period
      </span>
    )
  }
  return (
    <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
      Suspended
    </span>
  )
}

function getReminderBanner(paidUntil: Date | null, gracePeriodDays: number) {
  if (!paidUntil) return null
  const now = new Date()
  const diffDays = Math.ceil((paidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const graceLeft = gracePeriodDays + diffDays
    if (graceLeft >= 0) {
      return (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
          <span className="font-semibold">Grace Period Notice:</span> Tuition expired on{' '}
          {formatDate(paidUntil)}. You have <span className="font-semibold">{graceLeft} day(s)</span>{' '}
          remaining before account access is suspended.
        </div>
      )
    }
    return null
  }

  if (diffDays <= 2) {
    return (
      <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
        <span className="font-semibold">Urgent 2-Day Reminder:</span> Your tuition is due in{' '}
        <span className="font-semibold">{diffDays} day(s)</span> ({formatDate(paidUntil)}). Please settle
        your balance to prevent access interruption.
      </div>
    )
  }

  if (diffDays <= 7) {
    return (
      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900">
        <span className="font-semibold">7-Day Billing Reminder:</span> Your next tuition renewal is on{' '}
        {formatDate(paidUntil)} ({diffDays} days away).
      </div>
    )
  }

  return null
}

async function StudentBillingCard({ student, school }: { student: any; school: any }) {
  const invoices = await prisma.invoice.findMany({
    where:   { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  })

  const pendingRequest = invoices.find((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
  const effectiveMonthlyTuition = school.monthlyTuition > 0 ? school.monthlyTuition : 2500

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden p-6 mb-6 space-y-6">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{student.user.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paid Until:{' '}
              <span className="font-medium text-foreground">{formatDate(student.paidUntil)}</span>
            </p>
          </div>
          <div>{getStatusBadge(student.paidUntil, school.gracePeriodDays)}</div>
        </div>

        {getReminderBanner(student.paidUntil, school.gracePeriodDays)}

        {pendingRequest ? (
          <div className="bg-amber-50/90 rounded-xl border border-amber-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-amber-900 text-sm">
                  {pendingRequest.paymentProofUrl
                    ? 'Payment Receipt Under Review'
                    : 'Open Tuition Invoice / Payment Request'}
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {pendingRequest.description} —{' '}
                  <span className="font-semibold">{peso(pendingRequest.amount)}</span> (
                  {pendingRequest.monthsPaid || 1}{' '}
                  {(pendingRequest.monthsPaid || 1) === 1 ? 'month' : 'months'})
                  {pendingRequest.dueDate ? ` · Due ${formatDate(pendingRequest.dueDate)}` : ''}
                </p>
              </div>
              <form
                action={async () => {
                  'use server'
                  await cancelPendingPaymentRequest(pendingRequest.id)
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-amber-800 hover:text-red-700 underline underline-offset-2 cursor-pointer"
                >
                  Cancel Request
                </button>
              </form>
            </div>

            {!pendingRequest.paymentProofUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/70">
                <p className="text-xs text-amber-800">
                  Upload a photo or PDF of your bank transfer, GCash, or cash receipt for verification:
                </p>
                <PaymentUpload invoiceId={pendingRequest.id} />
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/70">
                <span className="text-xs font-medium text-emerald-800">
                  ✓ Receipt uploaded. Waiting for Finance Admin verification.
                </span>
                <a
                  href={pendingRequest.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  View Uploaded Receipt
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-medium text-foreground text-sm">Extend Tuition Subscription</h3>
              <span className="text-xs text-muted-foreground">
                Base rate: {peso(effectiveMonthlyTuition)} / month
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 3, 12].map((months) => {
                const amount = effectiveMonthlyTuition * months
                return (
                  <div
                    key={months}
                    className="border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">
                        {months} {months === 1 ? 'Month' : 'Months'}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{peso(amount)}</p>
                    </div>
                    <form
                      action={async () => {
                        'use server'
                        await createPendingPaymentRequest(
                          student.id,
                          school.id,
                          amount,
                          months,
                          `Tuition for ${months} ${months === 1 ? 'month' : 'months'}`,
                          'Bank Transfer / Cash / GCash'
                        )
                      }}
                      className="w-full"
                    >
                      <button
                        type="submit"
                        className="w-full text-xs py-2 font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        Select & Upload Receipt
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment & Invoice History */}
      <div className="pt-4 border-t border-border space-y-3">
        <h3 className="text-sm font-medium text-foreground">Payment & Invoice History</h3>
        {invoices.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No invoices or payments recorded yet.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {['Date', 'Description', 'Method', 'Amount', 'Status', 'Receipt'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/40">
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {(inv.paidAt || inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {inv.description || 'Tuition Payment'}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {inv.paymentMethod || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {peso(inv.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        {inv.status === 'PAID' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                            Paid
                          </span>
                        ) : inv.status === 'OVERDUE' ? (
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                            Overdue
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {inv.paymentProofUrl ? (
                          <a
                            href={inv.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function StudentBillingView({ userId }: { userId: string }) {
  const student = await prisma.student.findUnique({
    where:   { userId },
    include: { user: { include: { school: true } } },
  })

  if (!student || !student.user.school) return null

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Billing & Tuition
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your tuition subscription, upload payment receipts, and view payment history.
        </p>
      </div>
      <StudentBillingCard student={student} school={student.user.school} />
    </div>
  )
}

async function ParentBillingView({ userId }: { userId: string }) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      children: {
        include: {
          user: { include: { school: true } },
        },
      },
    },
  })

  if (!parent || parent.children.length === 0) {
    return (
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Billing Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage billing for your children.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You do not have any children linked to your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Children's Billing & Tuition
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage tuition payments, upload receipts, and track account status for your children.
        </p>
      </div>

      <div>
        {parent.children.map((child) => (
          <StudentBillingCard key={child.id} student={child} school={child.user.school} />
        ))}
      </div>
    </div>
  )
}

async function AdminBillingView({ schoolId }: { schoolId: string }) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return null

  const students = await prisma.student.findMany({
    where: { user: { schoolId } },
    include: {
      user:     true,
      section:  { select: { name: true } },
      invoices: { where: { status: { in: ['PENDING', 'OVERDUE'] } } },
    },
    orderBy: { user: { name: 'asc' } },
  })

  let activeCount = 0
  let graceCount = 0
  let suspendedCount = 0

  const rows = students.map((s) => {
    const status = computeStudentStatus(s.paidUntil, school.gracePeriodDays)
    if (status === 'Active') activeCount++
    else if (status === 'Grace Period') graceCount++
    else suspendedCount++

    const pendingAmount = s.invoices.reduce((sum, inv) => sum + inv.amount, 0)

    return {
      id:            s.id,
      name:          s.user.name || s.user.email,
      email:         s.user.email,
      sectionName:   s.section?.name ?? null,
      paidUntil:     s.paidUntil ? s.paidUntil.toISOString() : null,
      status,
      pendingAmount: pendingAmount > 0 ? pendingAmount : null,
    }
  })

  const effectiveMonthlyTuition = school.monthlyTuition > 0 ? school.monthlyTuition : 2500

  const stats = [
    { label: 'Total Students',       value: students.length, sub: `₱${effectiveMonthlyTuition.toLocaleString()}/mo rate` },
    { label: 'Active Subscriptions', value: activeCount,     sub: 'In good standing' },
    { label: 'In Grace Period',      value: graceCount,      sub: `${school.gracePeriodDays}-day window` },
    { label: 'Suspended Accounts',   value: suspendedCount,  sub: 'Can lift in 1 click' },
  ]

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Finance & Access Governance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue invoices, record payments, configure tuition rates, and manage student access suspensions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BillingSettingsDialog
            schoolId={schoolId}
            initialTuition={effectiveMonthlyTuition}
            initialGraceDays={school.gracePeriodDays}
          />
          <CreateInvoiceDialog
            schoolId={schoolId}
            students={students}
            monthlyTuition={effectiveMonthlyTuition}
          />
          <RecordPaymentForm
            schoolId={schoolId}
            students={students}
            monthlyTuition={effectiveMonthlyTuition}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border px-5 py-4 space-y-1 shadow-sm">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs font-medium text-foreground">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <AdminStudentBillingTable rows={rows} />
    </div>
  )
}

export default async function BillingPage() {
  const user = await requireAuth()

  if (user.role === ROLES.STUDENT) return <StudentBillingView userId={user.id} />
  if (user.role === ROLES.PARENT)  return <ParentBillingView userId={user.id} />
  if ((user.role === ROLES.FINANCE_ADMIN || user.role === ROLES.PRINCIPAL) && user.schoolId) {
    return <AdminBillingView schoolId={user.schoolId} />
  }

  redirect(ROUTES.dashboard)
}
