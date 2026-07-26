import { requireRole } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { SettingsTabs } from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
  const user = await requireRole([ROLES.PRINCIPAL, ROLES.REGISTRAR])
  if (!user.schoolId) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-muted rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-2">No School Assigned</h2>
          <p className="text-muted-foreground">You must be assigned to a school to access settings.</p>
        </div>
      </div>
    )
  }
  const schoolId = user.schoolId

  const [school, periods, subjects, sections, teachers] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, periodType: true, schoolYear: true, logo: true },
    }),
    prisma.period.findMany({
      where: { schoolId },
      orderBy: { order: 'asc' },
    }),
    prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    }),
    prisma.section.findMany({
      where: { schoolId },
      include: {
        sectionSubjects: {
          include: {
            subject: true,
            teacher: {
              select: { id: true, user: { select: { name: true } } },
            },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      select: { id: true, user: { select: { name: true, email: true } } },
      orderBy: { user: { name: 'asc' } },
    }),
  ])

  if (!school) {
    return (
      <div className="max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">School not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your school configuration.</p>
      </div>

      <SettingsTabs
        school={school}
        periods={periods}
        subjects={subjects}
        sections={sections as any}
        teachers={teachers}
      />
    </div>
  )
}
