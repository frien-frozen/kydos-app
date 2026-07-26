import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const defaultPassword = 'KydosTest123!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  const roles = [
    { email: 'admin@kydos.test', name: 'Test Principal', role: 'PRINCIPAL' },
    { email: 'teacher@kydos.test', name: 'Test Teacher', role: 'TEACHER' },
    { email: 'student@kydos.test', name: 'Test Student', role: 'STUDENT' },
  ]

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {
        password: hashedPassword,
        name: r.name,
        role: r.role as any,
      },
      create: {
        email: r.email,
        password: hashedPassword,
        name: r.name,
        role: r.role as any,
      }
    })
  }
  
  console.log('Seeded test users successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
