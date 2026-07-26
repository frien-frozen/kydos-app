# Progress

## Setup
- [x] CLAUDE.md created
- [x] docs/ created
- [x] Next.js scaffolded
- [x] Prisma schema written
- [x] NextAuth configured
- [x] roles.ts + routes.ts + constants.ts created

## Features
- [x] Login page
- [x] Sidebar layout (role-aware nav)
- [x] Student: grades page
- [x] Teacher: grade book entry
- [x] Assignments module
- [x] Announcements module
- [x] Finance: invoices
- [x] Finance: suspension system
- [x] Principal: school overview
- [x] Registrar: reports
- [x] MVP complete — polish pass done

## Log
| Date | What |
|------|------|
| 2026-07-24 | Installed nvm + Node v24.18.0 / npm 11.16.0. Dev server: `npm run dev` → http://localhost:3000 |
| 2026-07-23 | Dev server started: next dev on http://localhost:3000 (Cursor helper node — system npm/node not on PATH) |
| init | Repo created |
| 2026-04-26 | Scaffolded Next.js, installed deps, init Prisma + shadcn, created lib/roles.ts, lib/routes.ts, lib/constants.ts, types/index.ts, .env.local |
| 2026-04-26 | Auth: prisma.ts, auth.ts, auth-utils.ts, middleware.ts, next-auth.d.ts, API route, login page, dashboard layout + page |
| 2026-04-26 | Fixed Prisma Edge middleware error (replaced auth() with getToken); wrote full Prisma schema; prisma generate ✓ |
| 2026-04-26 | Prisma Postgres adapter setup: installed @prisma/adapter-pg + pg, updated prisma.ts with PrismaPg adapter, added driverAdapters previewFeature, dev server compiles clean ✓ |
| 2026-04-26 | Status check: dev server clean, /login 200, /dashboard 307→login, Google OAuth button present — cannot confirm OAuth end-to-end without live browser |
| 2026-04-26 | Grade book feature complete: src/server/grades.ts, computeGrade/gradeStatus utils, GradeCell + GradeRow components, gradebook list + entry pages, student grades page, all loading skeletons, tsc clean |
| 2026-04-26 | UI upgrade complete: Notion-style design across all pages. globals.css: card-enter/gradient-shift/stat-enter keyframes + sidebar CSS vars (#f7f7f5/#efefed/#e9e9e7). Login: animated gradient bg + card fade-in. Sidebar: warm gray bg. Dashboard: borderless stat cards with staggered entrance. Grade book + grades: horizontal-only table borders, uppercase tracking headers. GradeRow/GradeCell: #f7f7f5 hover. tsc clean. |
| 2026-04-26 | Auth fixes: added AUTH_SECRET, removed NEXTAUTH_SECRET + NEXTAUTH_URL, deleted src/middleware.ts, created proxy.ts using NextAuth v5 auth() handler |
| 2026-04-26 | Realistic seed: 1 school, 3 teachers (Ismatulloh/Ana/Mark), 4 sections, 8 subjects, 14 students. Grade 9-A has 5 students with varied FIRST trimester grade entries for Math + Science. |
| 2026-04-28 | Students + Reports modules complete. /students: Principal/Registrar, fetches all school students with gradeEntries (FIRST), computes avgGrade server-side, passes to StudentTable client component (search filter, grade pills, suspension status). /students/[id]: name/email/section header, suspension banner, grades table grouped by trimester (Q avg, S avg, Portfolio, Finals, computed Grade). /reports: trimester tabs via searchParams, section summary table (avg/highest/lowest/pass rate), ReportTable client component with click-to-expand student breakdown. 6 loading/error files. ROLE_NAV already had correct entries — no roles.ts change needed. tsc clean. |
| 2026-04-28 | Announcements + Finance modules complete. Server actions: announcements.ts, billing.ts (adapted to schema — APPROVED not ACTIVE, no liftedAt, studentId lookup for Invoice). Pages: /announcements (role-aware, teacher/principal get New button), /announcements/new (scope toggle school/section), /billing (student: invoice list + total owed; finance_admin: stat cards + table + Mark Paid), /suspensions (finance_admin: request per student; principal: approve/lift). 3 announcements + 3 invoices seeded. 6 loading/error files. tsc clean. |
| 2026-04-27 | Fixed: seed now creates Student profile for ismatullohbakhtiyorov@gmail.com in Grade 9-A with Math/Science grade entries. assignments/loading.tsx uses shadcn Skeleton. TeacherView distinguishes "no sections" from "no assignments" and queries assignments directly. StudentView queries assignments directly (no Section relation include). tsc clean. |
| 2026-04-28 | Schema redesign: dropped Trimester enum → Period model (school-configurable periods). Subject moved school-wide (schoolId, no sectionId). Section lost teacherId → teacher now assigned per subject via SectionSubject junction. GradeEntry.teacherId removed, trimester→periodId. School gains logo/address/periodType/periodCount/periodLabels/currentPeriod/schoolYear. db push --force-reset ✓, prisma generate ✓. SCHEMA.md updated. |
| 2026-04-28 | Polish pass complete. Dashboard: all hardcoded stats replaced with real Prisma queries per role (student grade avg + pending assignments + billing status; teacher section/student/subject counts; finance paid/overdue counts; principal student count + school avg + pending suspensions; registrar student/section counts). Sidebar: SidebarNav client component with usePathname active state highlighting (font-medium, bg-[#e9e9e7]). Mobile: overflow-x-auto added to all table wrappers (grades, billing admin, StudentTable, ReportTable). tsc clean. |
| 2026-04-26 | Assignments module complete: schema updated (linkUrl + sectionId on Assignment), server actions (createAssignment/submitAssignment/getAssignmentsBySection/getAssignmentsForStudent), list page (teacher section view + student pending/submitted tabs), new assignment form, detail page (teacher sees submission list, student sees submit form), 6 loading/error files, 3 seed assignments for Grade 9-A Math. tsc clean. |
