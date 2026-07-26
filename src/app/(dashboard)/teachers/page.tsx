import { requireAuth } from '@/lib/auth-utils'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { createTeacher, removeTeacherRole } from '@/server/teachers'

async function handleAddTeacher(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  if (name && email) {
    await createTeacher({ name, email })
  }
}

async function handleRemoveTeacher(formData: FormData) {
  'use server'
  const userId = formData.get('userId') as string
  if (userId) {
    await removeTeacherRole(userId)
  }
}

export default async function TeachersPage() {
  const user = await requireAuth()
  if (user.role !== ROLES.PRINCIPAL && user.role !== ROLES.REGISTRAR) {
    redirect('/dashboard')
  }

  const schoolId = user.schoolId
  if (!schoolId) {
    return <div>No school context found.</div>
  }

  const teachers = await prisma.teacher.findMany({
    where: { user: { schoolId } },
    include: {
      user: true,
      sectionSubjects: {
        include: { subject: true, section: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Teachers</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage teaching staff for your school.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4 text-foreground">Add New Teacher</h2>
        <form action={handleAddTeacher} className="flex gap-4 items-end">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-foreground">Name</label>
            <input 
              name="name" 
              required 
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="e.g. john@school.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            Add Teacher
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Assigned Subjects</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">{teacher.user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{teacher.user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {teacher.sectionSubjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {teacher.sectionSubjects.map(ss => (
                        <span key={ss.id} className="px-2 py-0.5 bg-muted rounded-md text-xs border border-border">
                          {ss.subject.name} ({ss.section.name})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No subjects</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={handleRemoveTeacher}>
                    <input type="hidden" name="userId" value={teacher.userId} />
                    <button type="submit" className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No teachers found. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
