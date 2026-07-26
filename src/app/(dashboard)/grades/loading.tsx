import { Skeleton } from '@/components/ui/skeleton'

export default function StudentGradesLoading() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      {[1, 2].map((s) => (
        <div key={s} className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="rounded-xl border border-border p-3 space-y-2">
            <Skeleton className="h-8 w-full" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
