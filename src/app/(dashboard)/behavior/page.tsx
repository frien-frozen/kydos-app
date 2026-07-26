import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { ROLES } from '@/lib/roles'
import { redirect } from 'next/navigation'

export default async function BehaviorPage() {
  const user = await getCurrentUser()
  if (!user || user.role === ROLES.STUDENT) redirect('/dashboard')
  
  if (!user.schoolId && user.role !== ROLES.TEACHER) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-muted rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-2">No School Assigned</h2>
          <p className="text-muted-foreground">You must be assigned to a school to view this page.</p>
        </div>
      </div>
    )
  }

  let sections = []
  
  if (user.role === ROLES.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { sectionSubjects: { include: { section: true } } }
    })
    
    if (teacher) {
      const sectionMap = new Map()
      teacher.sectionSubjects.forEach(ss => {
        sectionMap.set(ss.section.id, ss.section)
      })
      sections = Array.from(sectionMap.values())
    }
  } else {
    sections = await prisma.section.findMany({ where: { schoolId: user.schoolId as string } })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Behavior & Flourishing</h1>
        <p className="text-muted-foreground">Log disruptive behaviors or record flourishing assessments.</p>
      </div>
      
      <div className="bg-muted rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Select a Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map(sec => (
            <a key={sec.id} href={`/behavior/${sec.id}`} className="block p-4 bg-card rounded-lg border border-border hover:border-border dark:hover:border-zinc-700 shadow-sm transition-all hover:bg-muted/50 hover:bg-accent active:scale-[0.99]">
              <div className="font-medium text-foreground">{sec.name}</div>
              <div className="text-sm text-muted-foreground">{sec.gradeLevel}</div>
            </a>
          ))}
          {sections.length === 0 && (
            <div className="col-span-3 text-muted-foreground text-sm">No sections available.</div>
          )}
        </div>
      </div>
    </div>
  )
}
