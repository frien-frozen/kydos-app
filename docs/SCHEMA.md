# Database Schema

## Status: applied (db push --force-reset 2026-04-28)

## Models

| Model | Key fields | Notes |
|-------|-----------|-------|
| School | id, name, logo, address, periodType, periodCount, periodLabels[], currentPeriod, schoolYear | Customizable period system. periodLabels default ["First","Second","Third"] |
| Period | id, schoolId, label, order, startDate, endDate, isActive | Replaces hardcoded Trimester enum. One active period at a time. |
| User | id, email, role, schoolId | Role: STUDENT/TEACHER/REGISTRAR/PRINCIPAL/FINANCE_ADMIN. NextAuth base. |
| Student | id, userId, sectionId | Profile linked to User. sectionId nullable. |
| Teacher | id, userId | Profile linked to User. Subjects assigned via SectionSubject. |
| Section | id, name, gradeLevel, schoolId | No direct teacherId — teacher assigned per subject via SectionSubject. |
| Subject | id, name, schoolId | School-wide (not section-bound). Assigned to sections via SectionSubject. |
| SectionSubject | id, sectionId, subjectId, teacherId | Junction: teacher→subject→section. @@unique([sectionId, subjectId]). |
| GradeEntry | id, studentId, subjectId, periodId, quiz1-5, summative1-5, portfolio, finalExam, finalGrade | @@unique([studentId, subjectId, periodId]). No teacherId. |
| Assignment | id, title, subjectId, sectionId, teacherId, dueDate, linkUrl | Still teacher-owned per section. |
| Submission | id, assignmentId, studentId, linkUrl | @@unique([assignmentId, studentId]). |
| Announcement | id, title, content, schoolId, sectionId, authorId, teacherId | schoolId/sectionId nullable for scoping. |
| Invoice | id, studentId, userId, schoolId, amount, dueDate, status | status: PENDING/PAID/OVERDUE. |
| AccessSuspension | id, studentId, invoiceId, reason, status, requestedBy | status: PENDING/APPROVED/LIFTED. |

## Removed from old schema
- `Trimester` enum (replaced by Period model)
- `Subject.sectionId` (subjects are now school-wide)
- `Section.teacherId` (teacher now assigned per subject via SectionSubject)
- `Teacher.sections[]` relation (replaced by Teacher.sectionSubjects[])
- `Teacher.gradeEntries[]` relation (GradeEntry no longer has teacherId)
- `GradeEntry.teacherId` (teacher context lives in SectionSubject)

## Key relationships
- School → Period[] (customizable academic periods)
- School → Subject[] (school-wide subject library)
- Section → SectionSubject[] → Subject + Teacher (flexible per-subject teacher assignment)
- GradeEntry → unique per (student, subject, period)
- Student → Section (one home section)
- Invoice → Student + User + School
- AccessSuspension → Student (approved by Principal)
