import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { computeGrade } from '@/lib/utils'
import Link from 'next/link'

interface StatCard {
  label: string
  value: string
  sub:   string
}

interface BillingAlert {
  level: 'regular' | 'urgent' | 'grace'
  title: string
  message: string
}

interface DashboardData {
  title:    string
  subtitle: string
  stats:    StatCard[]
  alerts?:  BillingAlert[]
}

function evaluateBillingAlert(paidUntil: Date | null, gracePeriodDays: number, studentLabel?: string): BillingAlert | null {
  if (!paidUntil) return null
  const now = new Date()
  const diffDays = Math.ceil((paidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const prefix = studentLabel ? `${studentLabel}: ` : ''

  if (diffDays < 0) {
    const graceRemaining = gracePeriodDays + diffDays
    if (graceRemaining >= 0) {
      return {
        level: 'grace',
        title: `${prefix}Grace Period Active`,
        message: `Tuition expired on ${paidUntil.toLocaleDateString()}. You have ${graceRemaining} day(s) of grace period remaining before account access is interrupted.`,
      }
    }
    return null
  }

  if (diffDays <= 2) {
    return {
      level: 'urgent',
      title: `${prefix}Urgent Billing Reminder (Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'})`,
      message: `Your tuition subscription is due on ${paidUntil.toLocaleDateString()}. Please settle your balance or upload a payment receipt to avoid access interruption.`,
    }
  }

  if (diffDays <= 7) {
    return {
      level: 'regular',
      title: `${prefix}Upcoming Tuition Reminder (Due in ${diffDays} days)`,
      message: `Your tuition subscription renews on ${paidUntil.toLocaleDateString()}. Visit Billing to extend or upload a receipt early.`,
    }
  }

  return null
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
    select: {
      id: true,
      sectionId: true,
      paidUntil: true,
      user: { select: { schoolId: true, school: { select: { gracePeriodDays: true } } } },
    },
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
      where:   { studentId: student.id },
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

  const now = new Date()
  const billingStatus =
    student.paidUntil && student.paidUntil > now ? 'Active' :
    latestInvoice?.status === 'PENDING'          ? 'Pending Review' :
    latestInvoice?.status === 'OVERDUE'          ? 'Overdue' :
    latestInvoice?.status === 'PAID'             ? 'Paid' : 'Unpaid'

  const alert = evaluateBillingAlert(
    student.paidUntil,
    student.user.school?.gracePeriodDays ?? 7
  )

  return {
    title:    `Welcome back, ${name.split(' ')[0]}.`,
    subtitle: "Here's how you're doing this trimester.",
    stats: [
      { label: 'Grade Average',   value: avg !== null ? String(avg) : '—', sub: 'Current period' },
      { label: 'Assignments Due', value: String(pendingCount),              sub: 'Pending submission' },
      { label: 'Billing Status',  value: billingStatus,                     sub: student.paidUntil ? `Until ${student.paidUntil.toLocaleDateString()}` : 'Action required' },
    ],
    alerts: alert ? [alert] : [],
  }
}

async function getParentData(userId: string, name: string): Promise<DashboardData> {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      children: {
        include: {
          user: { include: { school: true } },
          gradeEntries: true,
        },
      },
    },
  })

  const children = parent?.children ?? []
  const allGrades = children
    .flatMap((c) => c.gradeEntries.map(computeGrade))
    .filter((g): g is number => g !== null)
  const avg = allGrades.length
    ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 10) / 10
    : null

  const now = new Date()
  const activeChildren = children.filter((c) => c.paidUntil && c.paidUntil > now).length
  const alerts: BillingAlert[] = []

  for (const child of children) {
    const alert = evaluateBillingAlert(
      child.paidUntil,
      child.user.school?.gracePeriodDays ?? 7,
      child.user.name || child.user.email
    )
    if (alert) alerts.push(alert)
  }

  return {
    title:    `Welcome, ${name.split(' ')[0]}.`,
    subtitle: "Overview of your children's academic progress and tuition status.",
    stats: [
      { label: 'Linked Children', value: String(children.length),                sub: 'Enrolled students' },
      { label: 'Average Grade',   value: avg !== null ? String(avg) : '—',        sub: 'Across all subjects' },
      { label: 'Active Tuition',  value: `${activeChildren}/${children.length}`, sub: 'Accounts in good standing' },
    ],
    alerts,
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
  const [total, paid, pendingOrOverdue] = await Promise.all([
    prisma.invoice.count({ where: { schoolId } }),
    prisma.invoice.count({ where: { schoolId, status: 'PAID' } }),
    prisma.invoice.count({ where: { schoolId, status: { in: ['PENDING', 'OVERDUE'] } } }),
  ])

  const rate = total > 0 ? Math.round((paid / total) * 100) : 0

  return {
    title:    'Finance Overview',
    subtitle: 'Billing and payment status this period.',
    stats: [
      { label: 'Total Invoices',    value: String(total),            sub: 'All recorded bills' },
      { label: 'Paid',              value: String(paid),             sub: `${rate}% collection rate` },
      { label: 'Pending / Overdue', value: String(pendingOrOverdue), sub: 'Require review or follow-up' },
    ],
  }
}

async function getPrincipalData(schoolId: string): Promise<DashboardData> {
  const activePeriodId = await getActivePeriodId(schoolId)
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  const gracePeriodDays = school?.gracePeriodDays ?? 7
  
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - gracePeriodDays)

  const [studentCount, activeSuspensions, entries] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.student.count({ 
      where: { 
        user: { schoolId },
        OR: [
          { paidUntil: null },
          { paidUntil: { lt: thresholdDate } }
        ]
      } 
    }),
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
      { label: 'Total Students',      value: String(studentCount),                         sub: 'Currently enrolled' },
      { label: 'School Average',      value: schoolAvg !== null ? String(schoolAvg) : '—', sub: 'Current period' },
      { label: 'Active Suspensions',  value: String(activeSuspensions),                    sub: 'Manage in Finance tab' },
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
    case 'PARENT':
      data = await getParentData(user.id, user.name ?? 'there')
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

  const { title, subtitle, stats, alerts } = data

  return (
    <div className="max-w-4xl space-y-8">
      <div style={{ animation: 'card-enter 0.3s ease both' }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const styles =
              alert.level === 'grace'
                ? 'border-red-200 bg-red-50 text-red-800'
                : alert.level === 'urgent'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'

            return (
              <div key={idx} className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${styles}`}>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs opacity-90">{alert.message}</p>
                </div>
                <Link
                  href="/billing"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-background text-foreground border border-border hover:bg-muted transition-colors shrink-0 text-center"
                >
                  Go to Billing
                </Link>
              </div>
            )
          })}
        </div>
      )}

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
