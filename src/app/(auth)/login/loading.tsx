import { Skeleton } from '@/components/ui/skeleton'

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-card px-4">
      <div className="w-full max-w-sm border border-border rounded-xl p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}
