import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-64 rounded-xl" />
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border bg-muted px-4 py-3 flex gap-8">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
