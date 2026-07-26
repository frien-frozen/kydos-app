import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AddEventDialog } from '@/components/calendar/AddEventDialog'
import { EventActions } from '@/components/calendar/EventActions'
import { ROLES } from '@/lib/roles'

export default async function CalendarPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (!user.schoolId) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-muted rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-2">No School Assigned</h2>
          <p className="text-muted-foreground">You must be assigned to a school to view the calendar.</p>
        </div>
      </div>
    )
  }

  const periods = await prisma.period.findMany({
    where: { schoolId: user.schoolId as string },
    orderBy: { order: 'asc' }
  })

  const events = await prisma.event.findMany({
    where: {
      schoolId: user.schoolId,
      ...(user.role === ROLES.STUDENT || user.role === ROLES.PARENT 
          ? { status: 'APPROVED' } 
          : user.role === ROLES.TEACHER 
            ? { OR: [{ status: 'APPROVED' }, { authorId: user.id }] } 
            : {}),
    },
    orderBy: { date: 'asc' },
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="text-muted-foreground">School-wide events and academic schedule.</p>
        </div>
        {user.role !== 'STUDENT' && user.role !== 'PARENT' && (
          <AddEventDialog />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-2xl">📅</div>
            <p className="text-muted-foreground font-medium">Interactive Calendar View</p>
            <p className="text-sm text-muted-foreground/70">Scheduled for Phase 2 Implementation</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-muted rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Academic Periods</h3>
            <div className="space-y-3">
              {periods.map(p => (
                <div key={p.id} className="p-4 bg-card border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{p.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  {p.isActive && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Active</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0 border border-border">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-foreground">{new Date(e.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground truncate">{e.title}</h4>
                        {(user.role === ROLES.PRINCIPAL || user.id === e.authorId) && (
                          <EventActions id={e.id} status={e.status} canApprove={user.role === ROLES.PRINCIPAL} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">School-wide event</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
