# Kydos App

## What
School management platform MVP.
Private/independent schools in SEA. $5/student/year.

## Roles
STUDENT, TEACHER, REGISTRAR, PRINCIPAL, FINANCE_ADMIN

## Modules in MVP
1. Auth + RBAC — login, role-based routing
2. Grade Book — 5 quizzes, 5 summative, portfolio, finals, trimester reports
3. Assignment Hub — PDF/link uploads, submissions
4. Announcements — school-wide or per section
5. Finance — invoices, auto-reminders, access suspension

## Out of scope for MVP
Parental portal, AI features, mobile app, GCash/PayMongo

## Key files to know
- src/lib/roles.ts — all role logic lives here
- src/lib/routes.ts — all routes live here
- src/server/*.ts — all DB logic lives here
- prisma/schema.prisma — source of truth for data shape
