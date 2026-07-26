import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ParentPortalPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'PARENT') redirect('/dashboard')

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      children: {
        include: {
          user: true,
          section: true,
          gradeEntries: { include: { subject: true } },
          behaviorReports: true,
          flourishingAssessments: true,
        }
      }
    }
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Parental Portal</h1>
          <p className="text-muted-foreground">View your children's academic and behavioral progress.</p>
        </div>
      </div>
      
      {!parent || parent.children.length === 0 ? (
        <div className="bg-muted rounded-xl p-8 border border-border text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No Linked Children</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Your account is not linked to any students. Please contact the registrar office to connect your children's profiles.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {parent.children.map(child => (
            <div key={child.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="bg-muted p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{child.user.name}</h2>
                  <p className="text-sm text-muted-foreground">{child.section?.name || 'Unassigned Section'} • {child.section?.gradeLevel || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">Enrolled</span>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grades */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2">Recent Grades</h3>
                  {child.gradeEntries.length > 0 ? (
                    <div className="space-y-3">
                      {child.gradeEntries.slice(0, 5).map(grade => (
                        <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <span className="font-medium text-sm text-foreground">{grade.subject.name}</span>
                          <span className="font-bold text-foreground">{grade.finalGrade || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No grades recorded yet.</p>
                  )}
                </div>

                {/* Behavior & Flourishing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2">Behavior & Flourishing</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Behavior Reports</div>
                      <div className="text-2xl font-bold text-foreground">{child.behaviorReports.length}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">EQ Score</div>
                      <div className="text-2xl font-bold text-foreground">
                        {child.flourishingAssessments.find(a => a.type === 'EQ')?.score || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
