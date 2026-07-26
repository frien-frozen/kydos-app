import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { ROUTES } from '@/lib/routes'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AnnouncementActions } from '@/components/announcements/AnnouncementActions'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AnnouncementsPage() {
  const user = await requireAuth()

  if (!user.schoolId) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">Not assigned to a school yet.</p>
      </div>
    )
  }

  // Determine which sectionId to filter by (student sees their section's announcements too)
  let sectionId: string | undefined
  if (user.role === ROLES.STUDENT) {
    const student = await prisma.student.findUnique({
      where:  { userId: user.id },
      select: { sectionId: true },
    })
    sectionId = student?.sectionId ?? undefined
  } else if (user.role === ROLES.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where:   { userId: user.id },
      include: { sectionSubjects: { select: { sectionId: true }, take: 1 } },
    })
    sectionId = teacher?.sectionSubjects[0]?.sectionId
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      schoolId: user.schoolId,
      OR: [
        { sectionId: null },
        ...(sectionId ? [{ sectionId }] : []),
      ],
      ...(user.role === ROLES.STUDENT || user.role === ROLES.PARENT 
          ? { status: 'APPROVED' } 
          : user.role === ROLES.TEACHER 
            ? { OR: [{ status: 'APPROVED' }, { authorId: user.id }] } 
            : {}),
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const canCreate = user.role === ROLES.TEACHER || user.role === ROLES.PRINCIPAL

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">School news and section updates.</p>
        </div>
        {canCreate && (
          <Link
            href={ROUTES.announcementsNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            New announcement
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {announcements.map((a) => (
            <div key={a.id} className="py-5 first:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  {(user.role === ROLES.PRINCIPAL || user.id === a.authorId) && (
                    <AnnouncementActions id={a.id} status={a.status} canApprove={user.role === ROLES.PRINCIPAL} />
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {a.author.name ?? 'Staff'}
                {a.sectionId ? ' · Section only' : ' · School-wide'}
              </p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
