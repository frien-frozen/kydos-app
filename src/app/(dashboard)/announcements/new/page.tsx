import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { NewAnnouncementForm } from '@/components/announcements/NewAnnouncementForm'

export default async function NewAnnouncementPage() {
  const user = await requireRole([ROLES.TEACHER, ROLES.PRINCIPAL])

  if (!user.schoolId && user.role !== ROLES.TEACHER) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-muted rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-2">No School Assigned</h2>
          <p className="text-muted-foreground">You must be assigned to a school to create announcements.</p>
        </div>
      </div>
    )
  }

  const sections =
    user.role === ROLES.TEACHER
      ? await prisma.teacher
          .findUnique({
            where:   { userId: user.id },
            include: { sectionSubjects: { include: { section: { select: { id: true, name: true } } }, orderBy: { section: { name: 'asc' } } } },
          })
          .then((t) => {
            const seen = new Map<string, { id: string; name: string }>()
            for (const ss of t?.sectionSubjects ?? []) {
              if (!seen.has(ss.sectionId)) seen.set(ss.sectionId, ss.section)
            }
            return Array.from(seen.values())
          })
      : []

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Announcement</h1>
        <p className="text-sm text-muted-foreground mt-1">Post a message to your school or section.</p>
      </div>

      <NewAnnouncementForm schoolId={user.schoolId as string} sections={sections} />
    </div>
  )
}
