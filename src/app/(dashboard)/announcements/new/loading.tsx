import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="max-w-xl space-y-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className={`w-full rounded-lg ${i === 1 ? 'h-32' : 'h-10'}`} />
          </div>
        ))}
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
    </div>
  )
}
