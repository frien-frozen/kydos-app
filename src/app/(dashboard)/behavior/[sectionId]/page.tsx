import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { ROLES } from '@/lib/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SectionBehaviorPage({ params }: { params: { sectionId: string } }) {
  const user = await getCurrentUser()
  if (!user || user.role === ROLES.STUDENT) redirect('/dashboard')

  const sectionId = (await params).sectionId;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      students: {
        include: {
          user: true,
          behaviorReports: true,
          flourishingAssessments: true,
        }
      }
    }
  })

  if (!section) return <div>Section not found</div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/behavior" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Sections</Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{section.name} - Behavior & Flourishing</h1>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Behavior Reports</th>
                <th className="px-6 py-4 font-medium">EQ Score</th>
                <th className="px-6 py-4 font-medium">Multiple Intelligences</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {section.students.map((student) => {
                const eqAssess = student.flourishingAssessments.find(a => a.type === 'EQ')
                const miAssess = student.flourishingAssessments.find(a => a.type === 'MI')
                return (
                  <tr key={student.id} className="hover:bg-muted transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{student.user.name}</div>
                      <div className="text-muted-foreground">{student.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${student.behaviorReports.length > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {student.behaviorReports.length} Reports
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{eqAssess ? eqAssess.score : '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{miAssess ? miAssess.score : '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="text-sm text-muted-foreground hover:text-foreground font-medium">Log Report</button>
                    </td>
                  </tr>
                )
              })}
              {section.students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No students found in this section.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
