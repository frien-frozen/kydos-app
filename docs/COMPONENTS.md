# Components

| Component | Path | Description |
|-----------|------|-------------|
| SidebarNav | src/components/layout/SidebarNav.tsx | Client component. Renders role-specific nav items with usePathname active state. Active item: font-medium, bg-[#e9e9e7]. Inactive: zinc-600 with hover. Accepts items prop from server layout. |
| LoginPage | src/app/(auth)/login/page.tsx | Google OAuth login. Animated gradient bg (gradient-shift keyframe). Card fade-in (card-enter). Premium Notion-style layout. Server action triggers signIn('google'). |
| DashboardLayout | src/app/(dashboard)/layout.tsx | Async server component. requireAuth() gates access. Notion sidebar: #f7f7f5 bg via --sidebar CSS var, #efefed hover, #e9e9e7 borders. 240px fixed width. Footer: avatar + name + role badge. |
| DashboardPage | src/app/(dashboard)/dashboard/page.tsx | Role-aware home. 3 stat cards per role. #f7f7f5 bg, no border. Staggered entrance via stat-enter keyframe + animationDelay per card. |
| GradeBookPage | src/app/(dashboard)/gradebook/page.tsx | Teacher only. Queries teacher→sections→subjects from DB. Subject cards show name, student count, section, and FIRST trimester class average (computed server-side via computeGrade). Empty state if no subjects. |
| GradeEntryPage | src/app/(dashboard)/gradebook/[subject]/page.tsx | Teacher only. Trimester tabs (query param). Table: horizontal-only borders (#e9e9e7), text-xs uppercase tracking-wide headers. One row per student via GradeRow/GradeCell. |
| StudentGradesPage | src/app/(dashboard)/grades/page.tsx | Student only. Read-only. Grades grouped by trimester, computed averages. Table: horizontal-only borders, uppercase tracking-wide headers, hover #f7f7f5 rows. |
| GradeRow | src/components/gradebook/GradeRow.tsx | Client component. Holds entry state for one student row. Renders GradeCells, recomputes grade live via computeGrade(). Hover #f7f7f5, border-[#e9e9e7]. |
| GradeCell | src/components/gradebook/GradeCell.tsx | Client component. Inline-editable score cell. Click to edit, blur/Enter to save. Calls updateGradeField server action. Hover #f7f7f5, border only on focus. Reverts + toasts on error. |
| AssignmentsPage | src/app/(dashboard)/assignments/page.tsx | Role-aware. Teacher: sections with assignment lists, "New assignment" button. Student: Pending/Submitted groups. Notion horizontal borders. |
| NewAssignmentPage | src/app/(dashboard)/assignments/new/page.tsx | Teacher only. Fetches teacher's subjects (across sections). Renders NewAssignmentForm. |
| AssignmentDetailPage | src/app/(dashboard)/assignments/[id]/page.tsx | Auth-aware. Teacher: submission list with count / section total. Student: SubmitForm (or "already submitted" state). |
| NewAssignmentForm | src/components/assignments/NewAssignmentForm.tsx | Client component. Subject select auto-resolves hidden sectionId. Fields: title, subject, description, linkUrl, dueDate. Calls createAssignment server action. |
| SubmitForm | src/components/assignments/SubmitForm.tsx | Client component. linkUrl field + submit button. Shows "already submitted" state instead when submitted=true. Calls submitAssignment server action. |
| AnnouncementsPage | src/app/(dashboard)/announcements/page.tsx | Role-aware. Teacher/Principal: "New announcement" button. All roles see divider-separated list with title, author, date, content preview (line-clamp-2). Filters by schoolId + student's sectionId. |
| NewAnnouncementPage | src/app/(dashboard)/announcements/new/page.tsx | Teacher/Principal only. Fetches teacher's sections. Renders NewAnnouncementForm. |
| NewAnnouncementForm | src/components/announcements/NewAnnouncementForm.tsx | Client component. Title + content textarea (min-h-32). Scope radio (school-wide / section-only). Section select appears when section-only chosen. Calls createAnnouncement. |
| BillingPage | src/app/(dashboard)/billing/page.tsx | STUDENT: invoice list with status pills (Paid=green, Unpaid=amber, Overdue=red) + total owed. FINANCE_ADMIN: stat cards (total/paid/unpaid/overdue) + full table with "Mark paid" form action. Other roles redirect. |
| SuspensionsPage | src/app/(dashboard)/suspensions/page.tsx | FINANCE_ADMIN: student list with inline reason form + Request button. PRINCIPAL: PENDING suspensions with Approve button, APPROVED with Lift button. Both use bound server action forms. |
| StudentsPage | src/app/(dashboard)/students/page.tsx | Principal/Registrar. Fetches all school students with gradeEntries (FIRST trimester) + active suspensions. Computes avgGrade server-side. Renders StudentTable client component. |
| StudentProfilePage | src/app/(dashboard)/students/[id]/page.tsx | Principal/Registrar/Teacher. Shows name, email, section, grade level. Suspension banner if APPROVED. Grades table grouped by trimester: subject, Q avg, S avg, Portfolio, Finals, Grade pill. |
| StudentTable | src/components/students/StudentTable.tsx | Client component. Accepts pre-computed student rows. Client-side name/email search filter. Table: Name (linked), Section, Grade Level, Avg Grade pill, Status pill (Active/Suspended). |
| ReportsPage | src/app/(dashboard)/reports/page.tsx | Registrar/Principal. searchParams trimester tabs (First/Second/Third). Fetches sections + students + gradeEntries server-side. Computes avg/highest/lowest/passRate per section. Renders ReportTable. |
| ReportTable | src/components/reports/ReportTable.tsx | Client component. Section summary table. Click row to toggle student breakdown panel below. Grade pills. "Print or export coming soon" hint. |
