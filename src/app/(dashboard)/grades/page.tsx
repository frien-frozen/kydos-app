import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { computeGrade, gradeStatus, cn } from '@/lib/utils'

const GRADE_PILL: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good:      'bg-blue-100 text-blue-700',
  fair:      'bg-amber-100 text-amber-700',
  failing:   'bg-red-100 text-red-700',
  none:      'bg-muted text-muted-foreground',
}

export default async function StudentGradesPage() {
  const user = await requireRole([ROLES.STUDENT])

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      gradeEntries: {
        include: { subject: true, period: true },
        orderBy: [{ period: { order: 'asc' } }, { subject: { name: 'asc' } }],
      },
    },
  })

  if (!student) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Grades</h1>
        <p className="text-sm text-muted-foreground">No student profile found. Contact your registrar.</p>
      </div>
    )
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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Grades</h1>
        <p className="text-sm text-muted-foreground mt-1">Your academic performance by trimester.</p>
      </div>

      {byPeriod.map(({ label, entries }) => {
        const grades = entries.map((e) => computeGrade(e)).filter((g): g is number => g !== null)
        const avg    = grades.length
          ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
          : null
        const avgStatus = gradeStatus(avg)

        return (
          <div key={label} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{label}</h2>
              {avg !== null && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', GRADE_PILL[avgStatus])}>
                  Average: {avg}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Quizzes</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Summative</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Portfolio</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Finals</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const avg5 = (vals: (number | null)[]) => {
                      const clean = vals.filter((v): v is number => v !== null)
                      return clean.length ? Math.round((clean.reduce((a, b) => a + b, 0) / clean.length) * 10) / 10 : null
                    }
                    const quizAvg = avg5([entry.quiz1, entry.quiz2, entry.quiz3, entry.quiz4, entry.quiz5])
                    const summAvg = avg5([entry.summative1, entry.summative2, entry.summative3, entry.summative4, entry.summative5])
                    const grade   = computeGrade(entry)
                    const status  = gradeStatus(grade)

                    return (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted transition-colors duration-100">
                        <td className="px-4 py-2.5 font-medium text-foreground">{entry.subject.name}</td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">
                          {quizAvg !== null ? quizAvg : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">
                          {summAvg !== null ? summAvg : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">
                          {entry.portfolio !== null ? entry.portfolio : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">
                          {entry.finalExam !== null ? entry.finalExam : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', GRADE_PILL[status])}>
                            {grade !== null ? grade : '—'}
                          </span>
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

      {byPeriod.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
        </div>
      )}
    </div>
  )
}
