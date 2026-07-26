import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export default async function ResourcesPage() {
  const user = await getCurrentUser()
  if (!user) {
    return null;
  }

  const resources = [
    { type: 'Textbook', title: 'Mathematics Grade 9', url: '#', addedBy: 'Ismatulloh B.' },
    { type: 'Powerpoint', title: 'Chapter 4 - Cells', url: '#', addedBy: 'Ana Reyes' },
    { type: 'Document', title: 'Student Handbook 2025', url: '#', addedBy: 'Dr. Mendoza' },
    { type: 'Youtube', title: 'History Intro Video', url: 'https://youtube.com', addedBy: 'Mark Santos' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learning Resources</h1>
          <p className="text-muted-foreground">School-wide and class-specific study materials.</p>
        </div>
        {user.role !== 'STUDENT' && (
          <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm active:scale-95">
            Upload Resource
          </button>
        )}
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted flex gap-2 overflow-x-auto">
          {['All', 'Textbooks', 'Powerpoints', 'Documents', 'Videos'].map(filter => (
            <button key={filter} className={`px-3 py-1.5 text-sm font-medium rounded-full ${filter === 'All' ? 'bg-primary text-primary-foreground dark:bg-card dark:text-foreground' : 'bg-transparent text-muted-foreground border border-border hover:bg-muted'} transition-colors whitespace-nowrap`}>
              {filter}
            </button>
          ))}
        </div>
        
        <div className="divide-y divide-border">
          {resources.map((res, idx) => (
            <div key={idx} className="p-6 flex items-center justify-between hover:bg-muted transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0 border border-border">
                  {res.type === 'Textbook' && '📚'}
                  {res.type === 'Powerpoint' && '📊'}
                  {res.type === 'Document' && '📄'}
                  {res.type === 'Youtube' && '🎥'}
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                    <a href={res.url} target="_blank" rel="noreferrer">{res.title}</a>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                      {res.type}
                    </span>
                    <span className="text-xs text-muted-foreground">Added by {res.addedBy}</span>
                  </div>
                </div>
              </div>
              <div>
                <a href={res.url} className="p-2 text-muted-foreground hover:text-foreground bg-background rounded-lg border border-border shadow-sm transition-all hover:shadow inline-block">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 10.5L3.5 6.5H6.5V1.5H8.5V6.5H11.5L7.5 10.5ZM2.5 12.5H12.5V13.5H2.5V12.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
