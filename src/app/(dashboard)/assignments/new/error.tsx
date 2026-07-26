'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Assignment</h1>
      <div className="rounded-xl border border-border bg-muted px-5 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">{error.message ?? 'Something went wrong.'}</p>
        <button
          onClick={reset}
          className="text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
