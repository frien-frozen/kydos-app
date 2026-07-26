'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

interface StudentRow {
  id:          string
  name:        string
  email:       string
  sectionName: string | null
  gradeLevel:  string | null
  avgGrade:    number | null
  isSuspended: boolean
}

interface Props {
  students: StudentRow[]
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

export function StudentTable({ students }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? students.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
      )
    : students

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {query ? 'No students match your search.' : 'No students enrolled yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {['Name', 'Section', 'Grade Level', 'Avg Grade', 'Status'].map((h) => (
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
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.student(s.id)}
                      className="font-medium text-foreground hover:underline underline-offset-2"
                    >
                      {s.name || s.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.sectionName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.gradeLevel ?? '—'}</td>
                  <td className="px-4 py-3">{gradePill(s.avgGrade)}</td>
                  <td className="px-4 py-3">
                    {s.isSuspended ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
