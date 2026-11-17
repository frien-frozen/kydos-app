const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Excel data integration...');
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Get or create School
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Hawks Prairie Academy',
        periodType: 'Trimester',
        periodCount: 3,
        periodLabels: ['Trimester I', 'Trimester II', 'Trimester III'],
        schoolYear: '2026-2027',
        currentPeriod: 1,
        monthlyTuition: 2500,
        gracePeriodDays: 7,
      },
    });
  } else {
    school = await prisma.school.update({
      where: { id: school.id },
      data: {
        monthlyTuition: school.monthlyTuition > 0 ? school.monthlyTuition : 2500,
        schoolYear: '2026-2027',
      },
    });
  }
  console.log(`✓ School: ${school.name} (${school.id})`);

  // 2. Ensure active period
  let activePeriod = await prisma.period.findFirst({
    where: { schoolId: school.id, isActive: true },
  });
  if (!activePeriod) {
    activePeriod = await prisma.period.findFirst({
      where: { schoolId: school.id, order: 1 },
    });
    if (activePeriod) {
      activePeriod = await prisma.period.update({
        where: { id: activePeriod.id },
        data: { isActive: true },
      });
    } else {
      activePeriod = await prisma.period.create({
        data: {
          schoolId: school.id,
          label: 'Trimester I',
          order: 1,
          isActive: true,
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-11-30'),
        },
      });
    }
  }
  console.log(`✓ Active Period: ${activePeriod.label} (${activePeriod.id})`);

  // 3. Ensure the 4 primary demo accounts
  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kydos.test' },
    update: {
      name: 'Daniel Potot',
      role: 'PRINCIPAL',
      schoolId: school.id,
      password: defaultPassword,
    },
    create: {
      name: 'Daniel Potot',
      email: 'admin@kydos.test',
      role: 'PRINCIPAL',
      schoolId: school.id,
      password: defaultPassword,
    },
  });
  console.log('✓ Admin account ready: admin@kydos.test');

  // Accountant
  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@kydos.test' },
    update: {
      name: 'Demo Accountant',
      role: 'FINANCE_ADMIN',
      schoolId: school.id,
      password: defaultPassword,
    },
    create: {
      name: 'Demo Accountant',
      email: 'finance@kydos.test',
      role: 'FINANCE_ADMIN',
      schoolId: school.id,
      password: defaultPassword,
    },
  });
  console.log('✓ Accountant account ready: finance@kydos.test');

  // Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@kydos.test' },
    update: {
      name: 'Mr. Dariel Philip R. Potot',
      role: 'TEACHER',
      schoolId: school.id,
      password: defaultPassword,
    },
    create: {
      name: 'Mr. Dariel Philip R. Potot',
      email: 'teacher@kydos.test',
      role: 'TEACHER',
      schoolId: school.id,
      password: defaultPassword,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id },
  });
  console.log('✓ Teacher account ready: teacher@kydos.test');

  // Student (Jazzmine Syrille P. Abiva)
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@kydos.test' },
    update: {
      name: 'Abiva, Jazzmine Syrille P.',
      role: 'STUDENT',
      schoolId: school.id,
      password: defaultPassword,
    },
    create: {
      name: 'Abiva, Jazzmine Syrille P.',
      email: 'student@kydos.test',
      role: 'STUDENT',
      schoolId: school.id,
      password: defaultPassword,
    },
  });
  console.log('✓ Student demo account ready: student@kydos.test');

  // 4. Load Payload
  const payloadPath = '/Users/bakhtiyorov/.gemini/antigravity/brain/b6001331-0615-44f2-bf4a-cb06777f7c5c/scratch/seed_payload.json';
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

  // 5. Upsert All Subjects
  const subjectMap = {};
  for (const subjName of payload.allSubjects) {
    let subj = await prisma.subject.findFirst({
      where: { schoolId: school.id, name: subjName },
    });
    if (!subj) {
      subj = await prisma.subject.create({
        data: { name: subjName, schoolId: school.id },
      });
    }
    subjectMap[subjName] = subj.id;
  }
  console.log(`✓ All ${payload.allSubjects.length} subjects ready`);

  // 6. Process Sections, SectionSubjects, Students & Grades
  const thirtyDaysFuture = new Date();
  thirtyDaysFuture.setDate(thirtyDaysFuture.getDate() + 30);

  let totalStudentsCreated = 0;
  let totalGradesCreated = 0;

  for (const secData of payload.sections) {
    let section = await prisma.section.findFirst({
      where: { schoolId: school.id, name: secData.sectionName },
    });
    if (!section) {
      section = await prisma.section.create({
        data: {
          name: secData.sectionName,
          gradeLevel: secData.gradeLevel,
          schoolId: school.id,
        },
      });
    }
    console.log(`\nProcessing ${section.name} (${section.gradeLevel})...`);

    // Assign subjects to this section and link to teacher
    for (const subjName of secData.subjects) {
      const subjectId = subjectMap[subjName];
      await prisma.sectionSubject.upsert({
        where: {
          sectionId_subjectId: {
            sectionId: section.id,
            subjectId: subjectId,
          },
        },
        update: { teacherId: teacher.id },
        create: {
          sectionId: section.id,
          subjectId: subjectId,
          teacherId: teacher.id,
        },
      });
    }

    // Process Students
    let idx = 0;
    for (const stData of secData.students) {
      idx++;
      let u;
      if (stData.isDemo) {
        u = studentUser;
      } else {
        u = await prisma.user.upsert({
          where: { email: stData.email },
          update: {
            name: stData.name,
            role: 'STUDENT',
            schoolId: school.id,
            password: defaultPassword,
          },
          create: {
            name: stData.name,
            email: stData.email,
            role: 'STUDENT',
            schoolId: school.id,
            password: defaultPassword,
          },
        });
      }

      const studentProfile = await prisma.student.upsert({
        where: { userId: u.id },
        update: {
          sectionId: section.id,
          paidUntil: thirtyDaysFuture,
        },
        create: {
          userId: u.id,
          sectionId: section.id,
          paidUntil: thirtyDaysFuture,
        },
      });
      totalStudentsCreated++;

      // Create GradeEntries for all subjects
      for (const [subjName, gradeVal] of Object.entries(stData.grades)) {
        const subjectId = subjectMap[subjName];
        if (!subjectId) continue;

        await prisma.gradeEntry.upsert({
          where: {
            studentId_subjectId_periodId: {
              studentId: studentProfile.id,
              subjectId: subjectId,
              periodId: activePeriod.id,
            },
          },
          update: {
            quiz1: gradeVal,
            quiz2: gradeVal,
            summative1: gradeVal,
            portfolio: gradeVal,
            finalExam: gradeVal,
            finalGrade: gradeVal,
          },
          create: {
            studentId: studentProfile.id,
            subjectId: subjectId,
            periodId: activePeriod.id,
            quiz1: gradeVal,
            quiz2: gradeVal,
            summative1: gradeVal,
            portfolio: gradeVal,
            finalExam: gradeVal,
            finalGrade: gradeVal,
          },
        });
        totalGradesCreated++;
      }

      // Create realistic invoice for accountant dashboard
      const existingInvoice = await prisma.invoice.findFirst({
        where: { studentId: studentProfile.id },
      });
      if (!existingInvoice) {
        let status = 'PAID';
        let proofUrl = null;
        let paidAt = new Date();
        if (!stData.isDemo) {
          if (idx % 5 === 0) {
            status = 'PENDING';
            proofUrl = 'https://utfs.io/f/sample-receipt.png';
            paidAt = null;
          } else if (idx % 11 === 0) {
            status = 'OVERDUE';
            paidAt = null;
          }
        }

        await prisma.invoice.create({
          data: {
            studentId: studentProfile.id,
            userId: u.id,
            schoolId: school.id,
            amount: 2500,
            status: status,
            description: `Tuition Fee - Trimester I (1 month)`,
            monthsPaid: 1,
            paymentMethod: status === 'PAID' ? 'GCash' : (status === 'PENDING' ? 'Bank Transfer' : null),
            paymentProofUrl: proofUrl,
            paidAt: paidAt,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log(`  ✓ ${secData.students.length} students processed for ${section.name}`);
  }

  console.log('\n======================================================');
  console.log(`Integration Complete!`);
  console.log(`Total Students: ${totalStudentsCreated}`);
  console.log(`Total Grade Entries: ${totalGradesCreated}`);
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
