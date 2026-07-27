'use client'

import { usePathname } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  isSuspended: boolean
  reason: string | null
  children: React.ReactNode
}

export function SuspensionGuard({ isSuspended, reason, children }: Props) {
  const pathname = usePathname()

  if (isSuspended && pathname !== '/billing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Account Suspended</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          {reason || 'Your account access has been temporarily suspended due to unpaid balances.'}
        </p>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Please settle your balances to restore access.</p>
          <Link 
            href="/billing" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go to Billing
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
