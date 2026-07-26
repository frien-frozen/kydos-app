import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-3 flex gap-8">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 px-4 py-3 border-b border-border last:border-0">
              {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 w-16" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
