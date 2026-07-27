import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { computeGrade } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

function avg(vals: (number | null | undefined)[]): number | null {
  const clean = vals.filter((v): v is number => v !== null && v !== undefined)
  return clean.length ? Math.round((clean.reduce((a, b) => a + b, 0) / clean.length) * 10) / 10 : null
}

function fmt(v: number | null | undefined) {
  return v != null ? v.toFixed(1) : '—'
}

export default async function StudentProfilePage({ params }: Props) {
  const { id } = await params
  const sessionUser = await requireAuth()
  
  if (![ROLES.PRINCIPAL, ROLES.REGISTRAR, ROLES.TEACHER, ROLES.PARENT].includes(sessionUser.role as any)) {
    notFound()
  }

  const student = await prisma.student.findUnique({
    where:   { id },
    include: {
      user:    { select: { name: true, email: true, schoolId: true } },
      section: { select: { name: true, gradeLevel: true } },
      gradeEntries: {
        include: {
          subject: { select: { name: true } },
          period:  { select: { label: true, order: true } },
        },
        orderBy: [{ period: { order: 'asc' } }, { subject: { name: 'asc' } }],
      },
      suspensions: { where: { status: 'APPROVED' }, take: 1 },
      parent:      { include: { user: { select: { name: true, email: true } } } },
    },
  })

  if (!student) notFound()

  // Prevent parents from viewing other students
  if (sessionUser.role === ROLES.PARENT && student.parent?.userId !== sessionUser.id) {
    notFound()
  }

  // Group by period
  const periodMap = new Map<string, { label: string; entries: typeof student.gradeEntries }>()
  for (const entry of student.gradeEntries) {
    if (!periodMap.has(entry.periodId)) {
      periodMap.set(entry.periodId, { label: entry.period.label, entries: [] })
    }
    periodMap.get(entry.periodId)!.entries.push(entry)
  }
  const byPeriod = Array.from(periodMap.values())

  const isSuspended = student.suspensions.length > 0

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {student.user.name ?? student.user.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.user.email}
          {student.section ? ` · ${student.section.name} · ${student.section.gradeLevel}` : ''}
        </p>
      </div>

      {/* Suspension banner */}
      {isSuspended && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-700">Access suspended</p>
          <p className="text-xs text-red-500 mt-0.5">{student.suspensions[0].reason}</p>
        </div>
      )}

      {/* Parent Linking */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground mb-3">Parent / Guardian</h2>
        {student.parent ? (
          <p className="text-sm text-muted-foreground">
            Linked to: <span className="font-medium text-foreground">{student.parent.user.name || student.parent.user.email}</span>
          </p>
        ) : (
          <form 
            action={async (formData) => {
              'use server'
              const email = formData.get('email') as string
              if (!email) return

              // Find or create parent user
              let parentUser = await prisma.user.findUnique({ where: { email } })
              if (!parentUser) {
                parentUser = await prisma.user.create({
                  data: {
                    email,
                    name: 'Parent',
                    role: ROLES.PARENT,
                    schoolId: student.user.schoolId,
                  }
                })
              } else if (parentUser.role !== ROLES.PARENT) {
                await prisma.user.update({
                  where: { id: parentUser.id },
                  data: { role: ROLES.PARENT, schoolId: student.user.schoolId }
                })
              }

              const parentProfile = await prisma.parent.upsert({
                where: { userId: parentUser.id },
                update: {},
                create: { userId: parentUser.id }
              })

              await prisma.student.update({
                where: { id: student.id },
                data: { parentId: parentProfile.id }
              })

              import('next/cache').then(m => m.revalidatePath(`/students/${student.id}`))
            }}
            className="flex items-center gap-2"
          >
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="Parent's email..."
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
            <button type="submit" className="text-xs px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
              Link Parent
            </button>
          </form>
        )}
      </div>

      {/* Grade tables by period */}
      {byPeriod.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No grade entries yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {byPeriod.map(({ label, entries }) => {
            const trimAvgs = entries.map(computeGrade).filter((g): g is number => g !== null)
            const trimAvg  = trimAvgs.length
              ? Math.round((trimAvgs.reduce((a, b) => a + b, 0) / trimAvgs.length) * 10) / 10
              : null

            return (
              <div key={label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">{label}</h2>
                  {trimAvg !== null && (
                    <span className="text-xs text-muted-foreground font-medium">Avg {trimAvg}</span>
                  )}
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        {['Subject', 'Q Avg', 'S Avg', 'Portfolio', 'Finals', 'Grade'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries.map((e) => {
                        const qAvg  = avg([e.quiz1, e.quiz2, e.quiz3, e.quiz4, e.quiz5])
                        const sAvg  = avg([e.summative1, e.summative2, e.summative3, e.summative4, e.summative5])
                        const grade = computeGrade(e)
                        return (
                          <tr key={e.id} className="hover:bg-muted transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{e.subject.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmt(qAvg)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmt(sAvg)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmt(e.portfolio)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmt(e.finalExam)}</td>
                            <td className="px-4 py-3">
                              {grade !== null ? (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    grade >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    grade >= 80 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    grade >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                  'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {grade.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
