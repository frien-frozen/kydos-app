export default function Loading() {
  return (
    <div className="max-w-4xl space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-accent rounded" />
        <div className="h-4 w-64 bg-accent rounded" />
      </div>
      <div className="max-w-xl space-y-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-20 bg-accent rounded" />
            <div className="h-10 w-full bg-accent rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
