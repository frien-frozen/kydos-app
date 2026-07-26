import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('Clearing existing data...')
    
    // Clear related records first (cascade delete where possible)
    await prisma.flourishingAssessment.deleteMany()
    await prisma.behaviorReport.deleteMany()
    await prisma.accessSuspension.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.submission.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.gradeEntry.deleteMany()
    await prisma.sectionSubject.deleteMany()
    await prisma.announcement.deleteMany()
    
    await prisma.student.deleteMany()
    await prisma.teacher.deleteMany()
    await prisma.parent.deleteMany()
    
    await prisma.section.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.period.deleteMany()
    await prisma.school.deleteMany()
    
    // Do NOT delete users because they have our login credentials
    // But we need to link them to the new school
  
    console.log('Creating Kydos Demo Academy...')
    const school = await prisma.school.create({
      data: {
        name: 'Kydos Demo Academy',
        address: '123 Innovation Way, Tech District',
        periodType: 'Trimester',
        periodCount: 3,
        periodLabels: ['First', 'Second', 'Third'],
        schoolYear: '2025-2026',
        currentPeriod: 1,
      }
    })
  
    // Create Periods
    const p1 = await prisma.period.create({ data: { schoolId: school.id, label: 'First Trimester', order: 1, isActive: true, startDate: new Date('2025-08-01'), endDate: new Date('2025-11-30') } })
    const p2 = await prisma.period.create({ data: { schoolId: school.id, label: 'Second Trimester', order: 2, isActive: false, startDate: new Date('2025-12-01'), endDate: new Date('2026-03-15') } })
    const p3 = await prisma.period.create({ data: { schoolId: school.id, label: 'Third Trimester', order: 3, isActive: false, startDate: new Date('2026-03-16'), endDate: new Date('2026-06-30') } })
  
    // Create Subjects
    const subjMath = await prisma.subject.create({ data: { name: 'Advanced Mathematics', schoolId: school.id } })
    const subjSci = await prisma.subject.create({ data: { name: 'Biology 101', schoolId: school.id } })
    const subjEng = await prisma.subject.create({ data: { name: 'Literature & Composition', schoolId: school.id } })
  
    // Create Sections
    const secAlpha = await prisma.section.create({ data: { name: 'Alpha Cohort', gradeLevel: 'Grade 10', schoolId: school.id } })
    const secBeta = await prisma.section.create({ data: { name: 'Beta Cohort', gradeLevel: 'Grade 11', schoolId: school.id } })
  
    console.log('Linking test users to School...')
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@kydos.test' } })
    const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@kydos.test' } })
    const studentUser = await prisma.user.findUnique({ where: { email: 'student@kydos.test' } })
  
    if (adminUser) await prisma.user.update({ where: { id: adminUser.id }, data: { schoolId: school.id } })
    if (teacherUser) await prisma.user.update({ where: { id: teacherUser.id }, data: { schoolId: school.id } })
    if (studentUser) await prisma.user.update({ where: { id: studentUser.id }, data: { schoolId: school.id } })
  
    console.log('Creating Teacher and Student entities...')
    let teacherEntity;
    if (teacherUser) {
      teacherEntity = await prisma.teacher.create({
        data: { userId: teacherUser.id }
      })
  
      // Assign Teacher to Section Subjects
      await prisma.sectionSubject.createMany({
        data: [
          { sectionId: secAlpha.id, subjectId: subjMath.id, teacherId: teacherEntity.id },
          { sectionId: secAlpha.id, subjectId: subjSci.id, teacherId: teacherEntity.id },
          { sectionId: secBeta.id, subjectId: subjEng.id, teacherId: teacherEntity.id },
        ]
      })
    }
  
    let studentEntity;
    if (studentUser) {
      studentEntity = await prisma.student.create({
        data: { userId: studentUser.id, sectionId: secAlpha.id }
      })
  
      // Add some dummy grades for the student
      await prisma.gradeEntry.create({
        data: {
          studentId: studentEntity.id,
          subjectId: subjMath.id,
          periodId: p1.id,
          quiz1: 85,
          summative1: 90,
          portfolio: 95,
          finalGrade: 90,
        }
      })
    }
  
    // Create extra dummy students so the gradebook isn't empty
    const extraStudentUser1 = await prisma.user.create({
      data: { name: 'Alice Smith', email: 'alice.smith@demo.test', role: 'STUDENT', schoolId: school.id }
    })
    await prisma.student.create({ data: { userId: extraStudentUser1.id, sectionId: secAlpha.id } })
  
    const extraStudentUser2 = await prisma.user.create({
      data: { name: 'Bob Johnson', email: 'bob.johnson@demo.test', role: 'STUDENT', schoolId: school.id }
    })
    await prisma.student.create({ data: { userId: extraStudentUser2.id, sectionId: secAlpha.id } })
  
    // Add an announcement
    if (adminUser) {
      await prisma.announcement.create({
        data: {
          title: 'Welcome to Kydos LMS',
          content: 'We are excited to launch the new Kydos LMS for this academic year! Please verify your schedules.',
          schoolId: school.id,
          authorId: adminUser.id,
        }
      })
    }
  
    return NextResponse.json({ success: true, message: 'Test environment fully seeded with Kydos Demo Academy!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
