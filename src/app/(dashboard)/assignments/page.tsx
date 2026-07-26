import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

function formatDate(date: Date | null) {
  if (!date) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function TeacherView({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      sectionSubjects: {
        include: { section: true },
        orderBy: { section: { name: 'asc' } },
      },
    },
  })

  const sectionSubjects = teacher?.sectionSubjects ?? []
  const sectionMap = new Map<string, typeof sectionSubjects[0]['section']>()
  for (const ss of sectionSubjects) {
    if (!sectionMap.has(ss.sectionId)) sectionMap.set(ss.sectionId, ss.section)
  }
  const sections = Array.from(sectionMap.values())

  const assignments = sections.length > 0
    ? await prisma.assignment.findMany({
        where: { sectionId: { in: sections.map((s) => s.id) } },
        include: {
          subject: true,
          _count:  { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const bySection = sections.map((section) => ({
    section,
    assignments: assignments.filter((a) => a.sectionId === section.id),
  }))

  const totalAssignments = assignments.length

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage assignments for your sections.</p>
        </div>
        <Link
          href={ROUTES.assignmentsNew}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New assignment
        </Link>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No sections assigned yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Ask a registrar to assign you to a section.</p>
        </div>
      ) : totalAssignments === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {bySection.map(({ section, assignments: sectionAssignments }) =>
            sectionAssignments.length === 0 ? null : (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground">{section.name}</h2>
                  <Badge variant="secondary">{section.gradeLevel}</Badge>
                </div>

                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {sectionAssignments.map((a) => (
                    <Link
                      key={a.id}
                      href={ROUTES.assignment(a.id)}
                      className="flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.subject.name}
                          {a.dueDate ? ` · Due ${formatDate(a.dueDate)}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">
                        {a._count.submissions} submitted
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

async function StudentView({ userId }: { userId: string }) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      sectionId:   true,
      submissions: { select: { assignmentId: true } },
    },
  })

  const assignments = student?.sectionId
    ? await prisma.assignment.findMany({
        where:   { sectionId: student.sectionId },
        include: { subject: true },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const submittedIds = new Set(student?.submissions.map((s) => s.assignmentId) ?? [])

  const pending   = assignments.filter((a) => !submittedIds.has(a.id))
  const submitted = assignments.filter((a) =>  submittedIds.has(a.id))

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} pending · {submitted.length} submitted
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending</h2>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {pending.map((a) => (
                  <Link
                    key={a.id}
                    href={ROUTES.assignment(a.id)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.subject.name}
                        {a.dueDate ? ` · Due ${formatDate(a.dueDate)}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-4 shrink-0">Pending</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {submitted.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</h2>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {submitted.map((a) => (
                  <Link
                    key={a.id}
                    href={ROUTES.assignment(a.id)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.subject.name}
                        {a.dueDate ? ` · Due ${formatDate(a.dueDate)}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-4 shrink-0 text-muted-foreground">Submitted</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default async function AssignmentsPage() {
  const user = await requireAuth()

  if (user.role === ROLES.TEACHER) return <TeacherView userId={user.id} />
  if (user.role === ROLES.STUDENT) return <StudentView userId={user.id} />

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
      <p className="text-sm text-muted-foreground">Not available for your role.</p>
    </div>
  )
}
