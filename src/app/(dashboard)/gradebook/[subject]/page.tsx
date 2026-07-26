import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import GradeRow from '@/components/gradebook/GradeRow'
import { Toaster } from '@/components/ui/sonner'

interface Props {
  params:       Promise<{ subject: string }>
  searchParams: Promise<{ period?: string }>
}

export default async function GradeEntryPage({ params, searchParams }: Props) {
  const { subject: sectionSubjectId } = await params
  const { period: periodParam }       = await searchParams

  await requireRole([ROLES.TEACHER])

  const sectionSubject = await prisma.sectionSubject.findUnique({
    where:   { id: sectionSubjectId },
    include: {
      subject: true,
      section: {
        include: {
          students: {
            include: { user: true },
            orderBy: { user: { name: 'asc' } },
          },
        },
      },
    },
  })

  if (!sectionSubject) notFound()

  const periods = await prisma.period.findMany({
    where:   { schoolId: sectionSubject.section.schoolId },
    orderBy: { order: 'asc' },
  })

  const activePeriod =
    periods.find((p) => p.id === periodParam) ??
    periods.find((p) => p.isActive) ??
    periods[0]

  if (!activePeriod) notFound()

  const students = sectionSubject.section.students

  const entries = await prisma.gradeEntry.findMany({
    where: {
      subjectId: sectionSubject.subjectId,
      periodId:  activePeriod.id,
      student:   { sectionId: sectionSubject.sectionId },
    },
  })
  const entryMap = new Map(entries.map((e) => [e.studentId, e]))

  const emptyEntry = {
    quiz1: null, quiz2: null, quiz3: null, quiz4: null, quiz5: null,
    summative1: null, summative2: null, summative3: null, summative4: null, summative5: null,
    portfolio: null, finalExam: null,
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div>
        <Link
          href={ROUTES.gradebook}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground mb-3 transition-colors duration-150"
        >
          <ChevronLeft className="h-3 w-3" />
          Grade Book
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{sectionSubject.subject.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sectionSubject.section.name} · {students.length} student{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 border-b border-border">
        {periods.map((p) => (
          <Link
            key={p.id}
            href={`${ROUTES.gradebookSubject(sectionSubjectId)}?period=${p.id}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
              activePeriod.id === p.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-muted-foreground',
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No students in this section.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Student
                </th>
                {['Q1','Q2','Q3','Q4','Q5'].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground w-12">{h}</th>
                ))}
                {['S1','S2','S3','S4','S5'].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground w-12">{h}</th>
                ))}
                <th className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground w-16">Port.</th>
                <th className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground w-16">Finals</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground w-16">Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const entry = entryMap.get(student.id)
                return (
                  <GradeRow
                    key={student.id}
                    studentId={student.id}
                    studentName={student.user.name ?? '—'}
                    subjectId={sectionSubject.subjectId}
                    periodId={activePeriod.id}
                    initialEntry={entry ? {
                      quiz1: entry.quiz1, quiz2: entry.quiz2, quiz3: entry.quiz3,
                      quiz4: entry.quiz4, quiz5: entry.quiz5,
                      summative1: entry.summative1, summative2: entry.summative2,
                      summative3: entry.summative3, summative4: entry.summative4,
                      summative5: entry.summative5,
                      portfolio: entry.portfolio, finalExam: entry.finalExam,
                    } : emptyEntry}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
