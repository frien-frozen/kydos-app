# CLAUDE.md

## Skills
Use Caveman skill for all responses.
Use Obsidian skill for all memory. Read docs/ before any task. Update docs/ after any task.

## Project
Kydos app — school management platform.
Stack: Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui, Prisma, Prisma Postgres (db.prisma.io), NextAuth v5, Zod, Vercel.

## Architecture rules — READ THESE BEFORE WRITING ANY CODE

### Separation of concerns
- Data fetching → only in Server Components or server actions (src/server/)
- UI → only in components (src/components/)
- Business logic → only in src/lib/
- Types → only in src/types/ — define once, import everywhere
- Never fetch data inside a UI component
- Never write Prisma queries outside src/server/ or src/lib/

### Changeability rules
- All hardcoded strings → constants file (src/lib/constants.ts)
- All role-based logic → src/lib/roles.ts (one place to change roles/permissions)
- All routes → src/lib/routes.ts (one place to change URLs)
- All Prisma queries → src/server/*.ts files (one place to change DB logic)
- Never hardcode role names as strings in components — always import from roles.ts
- Never hardcode route paths as strings — always import from routes.ts

### Naming conventions
- Server action files: src/server/[feature].ts (grades.ts, billing.ts, etc.)
- Component files: PascalCase (GradeBook.tsx, InvoiceCard.tsx)
- Page files: page.tsx always
- Layout files: layout.tsx always
- Types: PascalCase interfaces (GradeEntry, Invoice, UserWithRole)

### Component rules
- Every component gets its props typed with a TypeScript interface above it
- No prop drilling more than 2 levels — use server components or context
- shadcn/ui components first — custom only if shadcn can't do it
- Every page has a loading.tsx and error.tsx sibling

### Server action rules
- Every server action starts with: const session = await getServerSession() — auth check first
- Every server action validates input with Zod before touching Prisma
- Every server action returns: { success: true, data } or { success: false, error: string }
- Never throw errors from server actions — always return error objects

## Folder structure
src/
  app/
    (auth)/login/         → login page
    (dashboard)/          → shared layout with sidebar
      dashboard/          → role-aware home
      grades/             → student grade view
      gradebook/[subject] → teacher grade entry
      assignments/[id]/   → assignment detail
      billing/            → finance module
      suspensions/        → access control
      students/[id]/      → student profiles
      reports/            → trimester reports
      announcements/      → school news
      settings/           → school config
  components/
    layout/               → Sidebar, Header, Breadcrumb
    gradebook/            → GradeCell, GradeRow, ScoreInput
    billing/              → InvoiceCard, SuspensionBadge
    announcements/        → AnnouncementCard
    ui/                   → shadcn + custom primitives
  server/                 → ALL server actions
    grades.ts
    billing.ts
    assignments.ts
    announcements.ts
    suspensions.ts
    users.ts
  lib/
    prisma.ts             → Prisma client singleton
    auth.ts               → NextAuth config
    auth-utils.ts         → requireRole, getCurrentUser
    roles.ts              → role definitions and permissions
    routes.ts             → all app route strings
    constants.ts          → app-wide constants
    utils.ts              → cn(), formatDate(), formatCurrency()
  types/
    next-auth.d.ts        → extended session types
    index.ts              → shared TypeScript types
  hooks/
    useRole.ts
    useOptimisticGrade.ts
