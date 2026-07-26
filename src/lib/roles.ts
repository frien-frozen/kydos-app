import { Role } from '@prisma/client'

export const ROLES = {
  STUDENT:      'STUDENT',
  TEACHER:      'TEACHER',
  REGISTRAR:    'REGISTRAR',
  PRINCIPAL:    'PRINCIPAL',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  PARENT:       'PARENT',
} as const

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT:      'Student',
  TEACHER:      'Teacher',
  REGISTRAR:    'Registrar',
  PRINCIPAL:    'Principal',
  FINANCE_ADMIN: 'Finance Admin',
  PARENT:       'Parent',
}

export const ROLE_NAV: Record<Role, { label: string; href: string }[]> = {
  STUDENT: [
    { label: 'Dashboard',     href: '/dashboard' },
    { label: 'My Grades',     href: '/grades' },
    { label: 'Assignments',   href: '/assignments' },
    { label: 'Announcements', href: '/announcements' },
    { label: 'Calendar',      href: '/calendar' },
    { label: 'Resources',     href: '/resources' },
    { label: 'Billing',       href: '/billing' },
  ],
  TEACHER: [
    { label: 'Dashboard',     href: '/dashboard' },
    { label: 'Grade Book',    href: '/gradebook' },
    { label: 'Assignments',   href: '/assignments' },
    { label: 'Announcements', href: '/announcements' },
    { label: 'Calendar',      href: '/calendar' },
    { label: 'Resources',     href: '/resources' },
    { label: 'Behavior',      href: '/behavior' },
  ],
  REGISTRAR: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Students',  href: '/students' },
    { label: 'Teachers',  href: '/teachers' },
    { label: 'Calendar',  href: '/calendar' },
    { label: 'Settings',  href: '/settings' },
  ],
  PRINCIPAL: [
    { label: 'Overview',      href: '/dashboard' },
    { label: 'Announcements', href: '/announcements' },
    { label: 'Students',      href: '/students' },
    { label: 'Suspensions',   href: '/suspensions' },
    { label: 'Behavior',      href: '/behavior' },
    { label: 'Calendar',      href: '/calendar' },
    { label: 'Reports',       href: '/reports' },
  ],
  FINANCE_ADMIN: [
    { label: 'Dashboard',   href: '/dashboard' },
    { label: 'Invoices',    href: '/billing' },
    { label: 'Payments',    href: '/payments' },
    { label: 'Suspensions', href: '/suspensions' },
  ],
  PARENT: [
    { label: 'Dashboard',   href: '/dashboard' },
    { label: 'Children',    href: '/parent-portal' },
  ],
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  STUDENT:      ['view:own_grades', 'view:own_assignments', 'view:announcements', 'view:own_billing'],
  TEACHER:      ['edit:gradebook', 'create:assignment', 'create:announcement', 'view:section_students'],
  REGISTRAR:    ['view:all_grades', 'view:all_students', 'generate:reports'],
  PRINCIPAL:    ['create:announcement:school_wide', 'approve:suspension', 'view:all'],
  FINANCE_ADMIN: ['create:invoice', 'request:suspension', 'view:billing'],
  PARENT:       ['view:child_grades', 'view:child_attendance'],
}
