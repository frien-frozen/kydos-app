import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { requestSuspension, approveSuspension, liftSuspension } from '@/server/billing'
import type { SuspensionStatus } from '@prisma/client'

async function approveAction(suspensionId: string): Promise<void> {
  'use server'
  await approveSuspension(suspensionId)
}

async function liftAction(suspensionId: string): Promise<void> {
  'use server'
  await liftSuspension(suspensionId)
}

const STATUS_PILL: Record<SuspensionStatus, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-red-50 text-red-700 border border-red-200',
  LIFTED:   'bg-muted/50 text-muted-foreground border border-border',
}

async function FinanceAdminView({ schoolId }: { schoolId: string }) {
  const students = await prisma.student.findMany({
    where:   { user: { schoolId } },
    include: {
      user:        { select: { name: true, email: true } },
      suspensions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Suspensions</h1>
        <p className="text-sm text-muted-foreground mt-1">Request access suspensions for students with unpaid balances.</p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No students found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {students.map((student) => {
            const latest = student.suspensions[0]
            const isActive = latest && (latest.status === 'PENDING' || latest.status === 'APPROVED')

            async function handleRequest(formData: FormData) {
              'use server'
              const reason = formData.get('reason') as string
              await requestSuspension(student.id, reason)
            }

            return (
              <div key={student.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {student.user.name ?? student.user.email}
                  </p>
                  {latest && (
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[latest.status]}`}>
                      {latest.status.charAt(0) + latest.status.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>

                {!isActive && (
                  <form action={handleRequest} className="flex items-center gap-2 shrink-0">
                    <input
                      name="reason"
                      placeholder="Reason"
                      required
                      className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
                    />
                    <button
                      type="submit"
                      className="text-xs text-amber-700 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Request
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

async function PrincipalView({ schoolId }: { schoolId: string }) {
  const suspensions = await prisma.accessSuspension.findMany({
    where: {
      student: { user: { schoolId } },
      status:  { in: ['PENDING', 'APPROVED'] },
    },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending  = suspensions.filter((s) => s.status === 'PENDING')
  const approved = suspensions.filter((s) => s.status === 'APPROVED')

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Suspensions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} pending approval · {approved.length} active
        </p>
      </div>

      {suspensions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No pending suspensions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending approval</h2>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {pending.map((s) => {
                  const approve = approveAction.bind(null, s.id)
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.student.user.name ?? s.student.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                      </div>
                      <form action={approve}>
                        <button
                          type="submit"
                          className="text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                        >
                          Approve
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active suspensions</h2>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {approved.map((s) => {
                  const lift = liftAction.bind(null, s.id)
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.student.user.name ?? s.student.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                      </div>
                      <form action={lift}>
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground border border-border bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                        >
                          Lift
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default async function SuspensionsPage() {
  const user = await requireAuth()

  if (user.role === ROLES.FINANCE_ADMIN && user.schoolId) return <FinanceAdminView schoolId={user.schoolId} />
  if (user.role === ROLES.PRINCIPAL && user.schoolId)     return <PrincipalView schoolId={user.schoolId} />

  redirect(ROUTES.dashboard)
}
