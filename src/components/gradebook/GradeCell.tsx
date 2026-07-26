'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { updateGradeField, type GradeField } from '@/server/grades'

interface GradeCellProps {
  value:     number | null
  studentId: string
  subjectId: string
  periodId:  string
  field:     GradeField
  onUpdate:  (field: GradeField, value: number | null) => void
}

export default function GradeCell({
  value, studentId, subjectId, periodId, field, onUpdate,
}: GradeCellProps) {
  const [isEditing, setIsEditing]   = useState(false)
  const [localValue, setLocalValue] = useState<string>(value !== null ? String(value) : '')
  const [saving, setSaving]         = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = async () => {
    setIsEditing(false)
    const prev   = value
    const parsed = localValue.trim() === '' ? null : parseFloat(localValue)
    const next   = parsed !== null && !isNaN(parsed) ? Math.min(100, Math.max(0, parsed)) : null

    if (next === prev) return

    setSaving(true)
    const result = await updateGradeField(studentId, subjectId, periodId, field, next)
    setSaving(false)

    if (result.success) {
      onUpdate(field, next)
    } else {
      setLocalValue(prev !== null ? String(prev) : '')
      toast.error(`Failed to save: ${result.error}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setLocalValue(value !== null ? String(value) : '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <td className="px-2 py-1">
        <input
          ref={inputRef}
          autoFocus
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-14 text-center text-sm bg-background text-foreground border border-border rounded-md px-1 py-0.5 outline-none focus:border-border transition-colors duration-100"
        />
      </td>
    )
  }

  return (
    <td
      className="px-2 py-1 text-center text-sm cursor-pointer select-none hover:bg-muted transition-colors duration-100"
      onClick={() => {
        setIsEditing(true)
        setLocalValue(value !== null ? String(value) : '')
      }}
    >
      <span className={saving ? 'opacity-30' : 'text-muted-foreground'}>
        {value !== null ? value : <span className="text-muted-foreground">—</span>}
      </span>
    </td>
  )
}
