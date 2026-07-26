'use client'

import { useTransition } from 'react'
import { approveEvent, rejectEvent } from '@/server/calendar'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Props {
  id: string
  status: string
  canApprove: boolean
}

export function EventActions({ id, status, canApprove }: Props) {
  const [pending, startTransition] = useTransition()

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveEvent(id)
      if (res.success) toast.success('Event approved')
      else toast.error(res.error)
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectEvent(id)
      if (res.success) toast.success('Event rejected')
      else toast.error(res.error)
    })
  }

  if (status === 'APPROVED') {
    return <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-950/30">Approved</Badge>
  }
  
  if (status === 'REJECTED') {
    return <Badge variant="secondary" className="text-red-600 bg-red-50 dark:bg-red-950/30">Rejected</Badge>
  }

  if (canApprove) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-amber-600 bg-amber-50 dark:bg-amber-950/30">Pending</Badge>
        <button
          onClick={handleApprove}
          disabled={pending}
          className="text-xs bg-green-600 text-primary-foreground px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={pending}
          className="text-xs bg-red-600 text-primary-foreground px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    )
  }

  return <Badge variant="secondary" className="text-amber-600 bg-amber-50 dark:bg-amber-950/30">Pending</Badge>
}
