export default function Loading() {
  return (
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-accent rounded-full" />
          <div className="h-5 w-24 bg-accent rounded-full" />
        </div>
        <div className="h-7 w-64 bg-accent rounded" />
        <div className="h-4 w-48 bg-accent rounded" />
      </div>
      <div className="h-28 w-full bg-accent rounded-xl" />
      <div className="space-y-3">
        <div className="h-4 w-28 bg-accent rounded" />
        <div className="h-10 w-full bg-accent rounded-lg" />
        <div className="h-9 w-40 bg-accent rounded-lg" />
      </div>
    </div>
  )
}
