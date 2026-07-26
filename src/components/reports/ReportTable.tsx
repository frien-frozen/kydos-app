'use client'

import { useState } from 'react'

interface StudentStat {
  name:     string
  email:    string
  avgGrade: number | null
}

interface SectionStat {
  id:           string
  name:         string
  gradeLevel:   string
  studentCount: number
  avgGrade:     number | null
  highest:      number | null
  lowest:       number | null
  passRate:     number | null
  students:     StudentStat[]
}

interface Props {
  sections: SectionStat[]
}

function fmt(v: number | null) {
  return v !== null ? v.toFixed(1) : '—'
}

function gradePill(avg: number | null) {
  if (avg === null) return <span className="text-xs text-muted-foreground">—</span>
  const color =
    avg >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    avg >= 80 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
    avg >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {avg.toFixed(1)}
    </span>
  )
}

export function ReportTable({ sections }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedSection = sections.find((s) => s.id === selected)

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No sections with grade data for this period.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {['Section', 'Grade Level', 'Students', 'Avg Grade', 'Highest', 'Lowest', 'Pass Rate'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sections.map((sec) => (
                    <tr
                      key={sec.id}
                      onClick={() => setSelected(selected === sec.id ? null : sec.id)}
                      className={`cursor-pointer transition-colors ${
                        selected === sec.id ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{sec.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sec.gradeLevel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sec.studentCount}</td>
                      <td className="px-4 py-3">{gradePill(sec.avgGrade)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(sec.highest)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(sec.lowest)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sec.passRate !== null ? `${sec.passRate.toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedSection && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">
                {selectedSection.name} — student breakdown
              </h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        {['Student', 'Avg Grade'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedSection.students.map((s, i) => (
                        <tr key={i} className="hover:bg-muted transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {s.name || s.email}
                          </td>
                          <td className="px-4 py-3">{gradePill(s.avgGrade)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Print or export coming soon.</p>
        </>
      )}
    </div>
  )
}
