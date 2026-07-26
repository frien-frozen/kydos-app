import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { computeGrade } from '@/lib/utils'
import { StudentTable } from '@/components/students/StudentTable'

export default async function StudentsPage() {
  const user = await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])

  if (!user.schoolId) {
    return (
      <div className="max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">Not assigned to a school yet.</p>
      </div>
    )
  }

  const activePeriod = await prisma.period.findFirst({
    where:  { schoolId: user.schoolId, isActive: true },
    select: { id: true },
  })

  const students = await prisma.student.findMany({
    where: { user: { schoolId: user.schoolId } },
    include: {
      user:         { select: { name: true, email: true } },
      section:      { select: { name: true, gradeLevel: true } },
      gradeEntries: { where: { periodId: activePeriod?.id ?? '' } },
      suspensions:  { where: { status: 'APPROVED' }, take: 1 },
    },
    orderBy: { user: { name: 'asc' } },
  })

  const rows = students.map((s) => {
    const grades = s.gradeEntries.map(computeGrade).filter((g): g is number => g !== null)
    const avgGrade = grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
      : null

    return {
      id:          s.id,
      name:        s.user.name ?? '',
      email:       s.user.email,
      sectionName: s.section?.name ?? null,
      gradeLevel:  s.section?.gradeLevel ?? null,
      avgGrade,
      isSuspended: s.suspensions.length > 0,
    }
  })

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All enrolled students · {rows.length} total
        </p>
      </div>

      <StudentTable students={rows} />
    </div>
  )
}
