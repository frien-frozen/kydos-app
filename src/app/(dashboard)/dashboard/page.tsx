import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { computeGrade } from '@/lib/utils'

interface StatCard {
  label: string
  value: string
  sub:   string
}

interface DashboardData {
  title:    string
  subtitle: string
  stats:    StatCard[]
}

async function getActivePeriodId(schoolId: string): Promise<string | null> {
  const period = await prisma.period.findFirst({
    where:  { schoolId, isActive: true },
    select: { id: true },
  })
  return period?.id ?? null
}

async function getStudentData(userId: string, name: string): Promise<DashboardData> {
  const student = await prisma.student.findUnique({
    where:  { userId },
    select: { id: true, sectionId: true, user: { select: { schoolId: true } } },
  })

  if (!student) {
    return {
      title:    `Welcome back, ${name.split(' ')[0]}.`,
      subtitle: "Here's how you're doing this trimester.",
      stats: [
        { label: 'Grade Average',   value: '—', sub: 'Current period' },
        { label: 'Assignments Due', value: '—', sub: 'Pending submission' },
        { label: 'Billing Status',  value: '—', sub: 'Current period' },
      ],
    }
  }

  const activePeriodId = student.user.schoolId
    ? await getActivePeriodId(student.user.schoolId)
    : null

  const [entries, latestInvoice] = await Promise.all([
    activePeriodId
      ? prisma.gradeEntry.findMany({
          where: { studentId: student.id, periodId: activePeriodId },
          select: {
            quiz1: true, quiz2: true, quiz3: true, quiz4: true, quiz5: true,
            summative1: true, summative2: true, summative3: true, summative4: true, summative5: true,
            portfolio: true, finalExam: true,
          },
        })
      : Promise.resolve([]),
    prisma.invoice.findFirst({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      select:  { status: true },
    }),
  ])

  const pendingCount = student.sectionId
    ? await prisma.assignment.count({
        where: {
          sectionId:   student.sectionId,
          submissions: { none: { studentId: student.id } },
        },
      })
    : 0

  const grades = entries.map(computeGrade).filter((g): g is number => g !== null)
  const avg    = grades.length
    ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
    : null

  const billingStatus =
    latestInvoice?.status === 'PAID'    ? 'Paid' :
    latestInvoice?.status === 'OVERDUE' ? 'Overdue' :
    latestInvoice                       ? 'Unpaid' : '—'

  return {
    title:    `Welcome back, ${name.split(' ')[0]}.`,
    subtitle: "Here's how you're doing this trimester.",
    stats: [
      { label: 'Grade Average',   value: avg !== null ? String(avg) : '—', sub: 'Current period' },
      { label: 'Assignments Due', value: String(pendingCount),              sub: 'Pending submission' },
      { label: 'Billing Status',  value: billingStatus,                     sub: 'Current period' },
    ],
  }
}

async function getTeacherData(userId: string): Promise<DashboardData> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      sectionSubjects: {
        include: {
          section: { include: { _count: { select: { students: true } } } },
        },
      },
    },
  })

  const sectionSubjects = teacher?.sectionSubjects ?? []
  const uniqueSections  = [...new Map(sectionSubjects.map((ss) => [ss.sectionId, ss])).values()]
  const sectionCount    = uniqueSections.length
  const studentCount    = uniqueSections.reduce((n, ss) => n + ss.section._count.students, 0)
  const subjectCount    = sectionSubjects.length

  return {
    title:    'Good morning.',
    subtitle: 'Your sections and pending grades at a glance.',
    stats: [
      { label: 'Sections',  value: String(sectionCount), sub: 'This school year' },
      { label: 'Students',  value: String(studentCount), sub: 'Across all sections' },
      { label: 'Subjects',  value: String(subjectCount), sub: 'Currently teaching' },
    ],
  }
}

async function getFinanceData(schoolId: string): Promise<DashboardData> {
  const [total, paid, overdue] = await Promise.all([
    prisma.invoice.count({ where: { schoolId } }),
    prisma.invoice.count({ where: { schoolId, status: 'PAID' } }),
    prisma.invoice.count({ where: { schoolId, status: 'OVERDUE' } }),
  ])

  const rate = total > 0 ? Math.round((paid / total) * 100) : 0

  return {
    title:    'Finance Overview',
    subtitle: 'Billing and payment status this period.',
    stats: [
      { label: 'Total Invoices', value: String(total),   sub: 'This billing cycle' },
      { label: 'Paid',           value: String(paid),    sub: `${rate}% collection rate` },
      { label: 'Overdue',        value: String(overdue), sub: 'Require follow-up' },
    ],
  }
}

async function getPrincipalData(schoolId: string): Promise<DashboardData> {
  const activePeriodId = await getActivePeriodId(schoolId)

  const [studentCount, pendingSuspensions, entries] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.accessSuspension.count({ where: { status: 'PENDING', student: { user: { schoolId } } } }),
    activePeriodId
      ? prisma.gradeEntry.findMany({
          where: { periodId: activePeriodId, student: { user: { schoolId } } },
          select: {
            quiz1: true, quiz2: true, quiz3: true, quiz4: true, quiz5: true,
            summative1: true, summative2: true, summative3: true, summative4: true, summative5: true,
            portfolio: true, finalExam: true,
          },
        })
      : Promise.resolve([]),
  ])

  const allGrades = entries.map(computeGrade).filter((g): g is number => g !== null)
  const schoolAvg = allGrades.length
    ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 10) / 10
    : null

  return {
    title:    'School Overview',
    subtitle: 'A snapshot of how the school is doing.',
    stats: [
      { label: 'Total Students',      value: String(studentCount),                           sub: 'Currently enrolled' },
      { label: 'School Average',      value: schoolAvg !== null ? String(schoolAvg) : '—',   sub: 'Current period' },
      { label: 'Pending Suspensions', value: String(pendingSuspensions),                      sub: 'Awaiting approval' },
    ],
  }
}

async function getRegistrarData(schoolId: string): Promise<DashboardData> {
  const [studentCount, sectionCount] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.section.count({ where: { schoolId } }),
  ])

  return {
    title:    'Registrar Dashboard',
    subtitle: 'Academic records and section management.',
    stats: [
      { label: 'Students', value: String(studentCount), sub: 'Total enrolled' },
      { label: 'Sections', value: String(sectionCount), sub: 'Active this year' },
      { label: 'Reports',  value: '→',                  sub: 'Use the Reports tab' },
    ],
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()

  let data: DashboardData

  switch (user.role) {
    case 'STUDENT':
      data = await getStudentData(user.id, user.name ?? 'there')
      break
    case 'TEACHER':
      data = await getTeacherData(user.id)
      break
    case 'FINANCE_ADMIN':
      data = await getFinanceData(user.schoolId ?? '')
      break
    case 'PRINCIPAL':
      data = await getPrincipalData(user.schoolId ?? '')
      break
    case 'REGISTRAR':
      data = await getRegistrarData(user.schoolId ?? '')
      break
    default:
      data = { title: 'Dashboard', subtitle: 'Welcome.', stats: [] }
  }

  const { title, subtitle, stats } = data

  return (
    <div className="max-w-4xl space-y-8">
      <div style={{ animation: 'card-enter 0.3s ease both' }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-xl bg-card border border-border shadow-sm px-5 py-5"
            style={{
              animation:      'stat-enter 0.45s ease both',
              animationDelay: `${i * 75}ms`,
              opacity:        0,
            }}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground mt-2">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
