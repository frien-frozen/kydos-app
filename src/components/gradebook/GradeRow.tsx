'use client'

import { useState } from 'react'
import GradeCell from './GradeCell'
import { computeGrade, gradeStatus, cn } from '@/lib/utils'
import type { GradeField } from '@/server/grades'

interface GradeRowEntry {
  quiz1: number | null; quiz2: number | null; quiz3: number | null
  quiz4: number | null; quiz5: number | null
  summative1: number | null; summative2: number | null; summative3: number | null
  summative4: number | null; summative5: number | null
  portfolio: number | null; finalExam: number | null
}

interface GradeRowProps {
  studentId:    string
  studentName:  string
  subjectId:    string
  periodId:     string
  initialEntry: GradeRowEntry
}

const GRADE_PILL: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good:      'bg-blue-100 text-blue-700',
  fair:      'bg-amber-100 text-amber-700',
  failing:   'bg-red-100 text-red-700',
  none:      'bg-muted text-muted-foreground',
}

export default function GradeRow({
  studentId, studentName, subjectId, periodId, initialEntry,
}: GradeRowProps) {
  const [entry, setEntry] = useState<GradeRowEntry>(initialEntry)

  const handleUpdate = (field: GradeField, value: number | null) => {
    setEntry((prev) => ({ ...prev, [field]: value }))
  }

  const grade  = computeGrade(entry)
  const status = gradeStatus(grade)

  const cellProps = (field: GradeField) => ({
    value: entry[field],
    studentId,
    subjectId,
    periodId,
    field,
    onUpdate: handleUpdate,
  })

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted transition-colors duration-100">
      <td className="px-3 py-2 text-sm font-medium text-foreground whitespace-nowrap">
        {studentName}
      </td>
      <GradeCell {...cellProps('quiz1')} />
      <GradeCell {...cellProps('quiz2')} />
      <GradeCell {...cellProps('quiz3')} />
      <GradeCell {...cellProps('quiz4')} />
      <GradeCell {...cellProps('quiz5')} />
      <GradeCell {...cellProps('summative1')} />
      <GradeCell {...cellProps('summative2')} />
      <GradeCell {...cellProps('summative3')} />
      <GradeCell {...cellProps('summative4')} />
      <GradeCell {...cellProps('summative5')} />
      <GradeCell {...cellProps('portfolio')} />
      <GradeCell {...cellProps('finalExam')} />
      <td className="px-3 py-2 text-center">
        <span
          className={cn(
            'inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            GRADE_PILL[status],
          )}
        >
          {grade !== null ? grade : '—'}
        </span>
      </td>
    </tr>
  )
}
