'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAssignment } from '@/server/assignments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  assignmentId: string
  submitted: boolean
}

export function SubmitForm({ assignmentId, submitted }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)

  if (submitted) {
    return (
      <div className="rounded-xl bg-muted border border-border px-5 py-4 text-sm text-muted-foreground">
        You have already submitted this assignment.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return
    setPending(true)
    const fd = new FormData(formRef.current)
    fd.set('assignmentId', assignmentId)
    const res = await submitAssignment(fd)
    setPending(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success('Submitted!')
    router.refresh()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="linkUrl">Submission link (optional)</Label>
        <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://docs.google.com/..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="portfolio">Digital Portfolio (optional)</Label>
        <Input id="portfolio" name="portfolio" type="file" className="cursor-pointer" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Submitting...' : 'Submit assignment'}
      </Button>
    </form>
  )
}
