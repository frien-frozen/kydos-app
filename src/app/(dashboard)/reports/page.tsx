import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { computeGrade } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'
import { ReportTable } from '@/components/reports/ReportTable'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ period?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const user = await requireRole([ROLES.REGISTRAR, ROLES.PRINCIPAL])
  const { period: periodParam } = await searchParams

  if (!user.schoolId) {
    return (
      <div className="max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Not assigned to a school yet.</p>
      </div>
    )
  }

  const periods = await prisma.period.findMany({
    where:   { schoolId: user.schoolId },
    orderBy: { order: 'asc' },
  })

  const activePeriod =
    periods.find((p) => p.id === periodParam) ??
    periods.find((p) => p.isActive) ??
    periods[0]

  if (!activePeriod) {
    return (
      <div className="max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">No periods configured yet.</p>
      </div>
    )
  }

  const sections = await prisma.section.findMany({
    where:   { schoolId: user.schoolId },
    include: {
      students: {
        include: {
          user:         { select: { name: true, email: true } },
          gradeEntries: { where: { periodId: activePeriod.id } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const sectionStats = sections.map((sec) => {
    const studentStats = sec.students.map((s) => {
      const grades   = s.gradeEntries.map(computeGrade).filter((g): g is number => g !== null)
      const avgGrade = grades.length
        ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
        : null
      return { name: s.user.name ?? '', email: s.user.email, avgGrade }
    })

    const graded   = studentStats.map((s) => s.avgGrade).filter((g): g is number => g !== null)
    const avgGrade = graded.length
      ? Math.round((graded.reduce((a, b) => a + b, 0) / graded.length) * 10) / 10
      : null
    const highest  = graded.length ? Math.max(...graded) : null
    const lowest   = graded.length ? Math.min(...graded) : null
    const passRate = graded.length
      ? Math.round((graded.filter((g) => g >= 75).length / graded.length) * 100)
      : null

    return {
      id:           sec.id,
      name:         sec.name,
      gradeLevel:   sec.gradeLevel,
      studentCount: sec.students.length,
      avgGrade,
      highest,
      lowest,
      passRate,
      students:     studentStats,
    }
  })

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">School-wide period summary.</p>
      </div>

      {/* Period tabs */}
      {periods.length > 0 && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {periods.map((p) => (
            <Link
              key={p.id}
              href={`${ROUTES.reports}?period=${p.id}`}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePeriod.id === p.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label.replace(' Trimester', '')}
            </Link>
          ))}
        </div>
      )}

      <ReportTable sections={sectionStats} />
    </div>
  )
}
