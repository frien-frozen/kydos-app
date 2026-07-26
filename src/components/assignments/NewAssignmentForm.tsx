'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAssignment } from '@/server/assignments'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Subject {
  id: string
  name: string
  sectionId: string
}

interface Props {
  subjects: Subject[]
}

export function NewAssignmentForm({ subjects }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? '')

  const selectedSectionId = subjects.find((s) => s.id === selectedSubjectId)?.sectionId ?? ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return
    setPending(true)
    const fd = new FormData(formRef.current)
    fd.set('sectionId', selectedSectionId)
    const res = await createAssignment(fd)
    setPending(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success('Assignment created')
    router.push(ROUTES.assignments)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Chapter 5 Review" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subjectId">Subject</Label>
        <select
          id="subjectId"
          name="subjectId"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Instructions, materials, rubric..."
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkUrl">Link (optional)</Label>
        <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dueDate">Due date (optional)</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create assignment'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
