import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Cleaning up database...')
  await prisma.accessSuspension.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.gradeEntry.deleteMany()
  await prisma.sectionSubject.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.student.updateMany({ data: { sectionId: null } })
  await prisma.section.deleteMany()
  await prisma.student.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.period.deleteMany()
  await prisma.user.updateMany({ data: { schoolId: null } })
  await prisma.school.deleteMany()
  console.log('✓ Cleaned up')

  // Create Test Academy
  const school = await prisma.school.create({
    data: {
      name:         'Kydos Demo Academy',
      periodType:   'Trimester',
      periodCount:  3,
      periodLabels: ['First Trimester', 'Second Trimester', 'Third Trimester'],
      schoolYear:   '2025-2026',
      currentPeriod: 1,
    },
  })
  console.log(`✓ School created: ${school.name}`)

  const defaultPassword = await bcrypt.hash('password123', 10)

  // Define Test Accounts for ALL roles
  const testAccounts = [
    { name: 'Ismatulloh Principal', email: 'admin@kydos.test',      role: 'PRINCIPAL' },
    { name: 'Demo Registrar',       email: 'registrar@kydos.test',  role: 'REGISTRAR' },
    { name: 'Demo Finance',         email: 'finance@kydos.test',    role: 'FINANCE_ADMIN' },
    { name: 'Demo Teacher',         email: 'teacher@kydos.test',    role: 'TEACHER' },
    { name: 'Demo Student',         email: 'student@kydos.test',    role: 'STUDENT' },
    { name: 'Demo Parent',          email: 'parent@kydos.test',     role: 'PARENT' },
  ]

  for (const acc of testAccounts) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: { 
        name: acc.name, 
        role: acc.role as any, 
        schoolId: school.id,
        password: defaultPassword
      },
      create: { 
        name: acc.name, 
        email: acc.email, 
        role: acc.role as any, 
        schoolId: school.id,
        password: defaultPassword
      },
    })
    
    // Create necessary profiles based on role
    if (acc.role === 'TEACHER') {
      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      })
    } else if (acc.role === 'STUDENT') {
      await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      })
    }
    
    console.log(`✓ Created ${acc.role} account: ${acc.email} (password: password123)`)
  }

  // Create some basic structure for testing
  const period = await prisma.period.create({
    data: {
      schoolId: school.id,
      label: 'First Trimester',
      order: 1,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-09-30'),
      isActive: true,
    }
  })

  const section = await prisma.section.create({
    data: { name: 'Grade 10 - A', gradeLevel: 'Grade 10', schoolId: school.id }
  })

  const subject = await prisma.subject.create({
    data: { name: 'Mathematics', schoolId: school.id }
  })

  // Assign student to section
  const studentUser = await prisma.user.findUnique({ where: { email: 'student@kydos.test' } })
  if (studentUser) {
    await prisma.student.update({
      where: { userId: studentUser.id },
      data: { sectionId: section.id }
    })
  }

  console.log('\n✓ Seed complete. You can login with the emails above and password: password123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
