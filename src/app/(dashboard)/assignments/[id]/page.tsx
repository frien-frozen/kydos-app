import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { SubmitForm } from '@/components/assignments/SubmitForm'

function formatDate(date: Date | null) {
  if (!date) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireAuth()

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject:  true,
      section:  true,
      teacher:  { include: { user: true } },
      submissions: {
        include: { student: { include: { user: true } } },
        orderBy: { submittedAt: 'desc' },
      },
    },
  })

  if (!assignment) notFound()

  const isTeacher = user.role === ROLES.TEACHER
  const isStudent = user.role === ROLES.STUDENT

  let studentSubmitted = false
  if (isStudent) {
    const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
    studentSubmitted = assignment.submissions.some((s) => s.student.userId === user.id)
    void student
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{assignment.subject.name}</Badge>
          <Badge variant="secondary">{assignment.section.name}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{assignment.title}</h1>
        <p className="text-sm text-muted-foreground">
          By {assignment.teacher.user.name ?? 'Teacher'}
          {assignment.dueDate ? ` · Due ${formatDate(assignment.dueDate)}` : ''}
        </p>
      </div>

      {assignment.description && (
        <div className="rounded-xl bg-muted border border-border px-5 py-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
        </div>
      )}

      {assignment.linkUrl && (
        <div className="rounded-xl bg-muted border border-border px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Reference link</p>
          <a
            href={assignment.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            {assignment.linkUrl}
          </a>
        </div>
      )}

      {isStudent && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Your submission</h2>
          <SubmitForm assignmentId={assignment.id} submitted={studentSubmitted} />
        </div>
      )}

      {isTeacher && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Submissions
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {assignment.submissions.length} of{' '}
              {await prisma.student.count({ where: { sectionId: assignment.sectionId } })}
            </span>
          </h2>

          {assignment.submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {assignment.submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-5 py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {sub.student.user.name ?? sub.student.user.email}
                    </p>
                    {sub.linkUrl && (
                      <a
                        href={sub.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-muted-foreground"
                      >
                        {sub.linkUrl}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-4 shrink-0">
                    {sub.submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
