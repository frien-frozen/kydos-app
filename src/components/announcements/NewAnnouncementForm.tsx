'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement } from '@/server/announcements'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Section {
  id: string
  name: string
}

interface Props {
  schoolId: string
  sections: Section[]
}

export function NewAnnouncementForm({ schoolId, sections }: Props) {
  const router = useRouter()
  const [pending, setPending]   = useState(false)
  const [scope, setScope]       = useState<'school' | 'section'>('school')
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPending(true)

    const res = await createAnnouncement({
      title:     fd.get('title') as string,
      content:   fd.get('content') as string,
      schoolId,
      sectionId: scope === 'section' ? sectionId : undefined,
    })

    setPending(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Announcement posted')
    router.push(ROUTES.announcements)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Reminder: Portfolio Deadline" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Write your announcement here..."
          className="min-h-32 resize-none"
          required
        />
      </div>

      {sections.length > 0 && (
        <div className="space-y-2">
          <Label>Audience</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="school"
                checked={scope === 'school'}
                onChange={() => setScope('school')}
                className="accent-primary"
              />
              <span className="text-sm text-muted-foreground">Entire school</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="section"
                checked={scope === 'section'}
                onChange={() => setScope('section')}
                className="accent-primary"
              />
              <span className="text-sm text-muted-foreground">My section only</span>
            </label>
          </div>

          {scope === 'section' && (
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring mt-2"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Posting...' : 'Post announcement'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
