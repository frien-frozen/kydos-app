import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { NewAssignmentForm } from '@/components/assignments/NewAssignmentForm'

export default async function NewAssignmentPage() {
  const user = await requireRole([ROLES.TEACHER])

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      sectionSubjects: {
        include: { section: true, subject: true },
        orderBy: [{ section: { name: 'asc' } }, { subject: { name: 'asc' } }],
      },
    },
  })

  const subjects = (teacher?.sectionSubjects ?? []).map((ss) => ({
    id:        ss.subject.id,
    name:      ss.subject.name,
    sectionId: ss.sectionId,
  }))

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Assignment</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below to create an assignment.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Ask a registrar to assign you to a section first.</p>
        </div>
      ) : (
        <NewAssignmentForm subjects={subjects} />
      )}
    </div>
  )
}
