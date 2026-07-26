import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
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
    
    return NextResponse.json({ success: true, message: 'Seeded test users successfully.' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
