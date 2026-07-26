import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/routes'
import { computeGrade } from '@/lib/utils'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function GradeBookPage() {
  const user = await requireRole([ROLES.TEACHER])

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      sectionSubjects: {
        include: {
          section: { include: { _count: { select: { students: true } } } },
          subject: true,
        },
        orderBy: [{ section: { name: 'asc' } }, { subject: { name: 'asc' } }],
      },
    },
  })

  const sectionSubjects = teacher?.sectionSubjects ?? []

  // Group by section
  const sectionMap = new Map<string, {
    sectionId:    string
    sectionName:  string
    gradeLevel:   string
    studentCount: number
    subjects:     { sectionSubjectId: string; subjectId: string; subjectName: string }[]
  }>()

  for (const ss of sectionSubjects) {
    if (!sectionMap.has(ss.sectionId)) {
      sectionMap.set(ss.sectionId, {
        sectionId:    ss.sectionId,
        sectionName:  ss.section.name,
        gradeLevel:   ss.section.gradeLevel,
        studentCount: ss.section._count.students,
        subjects:     [],
      })
    }
    sectionMap.get(ss.sectionId)!.subjects.push({
      sectionSubjectId: ss.id,
      subjectId:        ss.subjectId,
      subjectName:      ss.subject.name,
    })
  }

  const sections = Array.from(sectionMap.values())

  // Active period for averages
  const activePeriod = user.schoolId
    ? await prisma.period.findFirst({
        where: { schoolId: user.schoolId, isActive: true },
      })
    : null

  // Class average per sectionSubject for active period
  const ssAvg = new Map<string, number | null>()
  if (activePeriod) {
    for (const ss of sectionSubjects) {
      const entries = await prisma.gradeEntry.findMany({
        where: {
          subjectId: ss.subjectId,
          periodId:  activePeriod.id,
          student:   { sectionId: ss.sectionId },
        },
        select: {
          quiz1: true, quiz2: true, quiz3: true, quiz4: true, quiz5: true,
          summative1: true, summative2: true, summative3: true, summative4: true, summative5: true,
          portfolio: true, finalExam: true,
        },
      })
      if (entries.length === 0) { ssAvg.set(ss.id, null); continue }
      const grades = entries.map(computeGrade).filter((g): g is number => g !== null)
      ssAvg.set(ss.id, grades.length
        ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
        : null)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Grade Book</h1>
        <p className="text-sm text-muted-foreground mt-1">Select a subject to enter or review grades.</p>
      </div>

      {sectionSubjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Ask a registrar to assign you to a section.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.sectionId} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-foreground">{section.sectionName}</h2>
                <Badge variant="secondary">{section.gradeLevel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {section.studentCount} student{section.studentCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.subjects.map(({ sectionSubjectId, subjectName }) => {
                  const avg = ssAvg.get(sectionSubjectId) ?? null
                  return (
                    <Link
                      key={sectionSubjectId}
                      href={ROUTES.gradebookSubject(sectionSubjectId)}
                      className="rounded-xl bg-muted border border-border px-5 py-4 hover:bg-accent hover:border-border transition-colors duration-150 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-foreground">{subjectName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.studentCount} student{section.studentCount !== 1 ? 's' : ''} · {section.sectionName}
                      </p>
                      {avg !== null && (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          Avg: {avg} · {activePeriod?.label ?? 'Current period'}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
