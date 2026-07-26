import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>

      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-6 space-y-4">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
