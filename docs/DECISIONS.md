# Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 14 App Router | RSC, server actions, Vercel native |
| Auth | NextAuth v5 | Multi-role, Google SSO ready |
| DB | Prisma Postgres (db.prisma.io) | Native Prisma hosting, already provisioned |
| ORM | Prisma | Type-safe, single schema source of truth |
| UI | shadcn/ui + Tailwind | Fast, accessible, easy to override |
| State | Server state via RSC, optimistic via useOptimistic | No Redux, no complexity |
| Roles | Defined in roles.ts only | Change roles in one file, everywhere updates |
| Routes | Defined in routes.ts only | Change URLs in one file, everywhere updates |
