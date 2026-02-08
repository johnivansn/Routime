import { Button } from './Button'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-start justify-between gap-6 rounded-3xl border border-ink-700 bg-ink-800/70 p-6">
      <div className="space-y-2">
        <h3 className="font-display text-xl font-semibold text-ink-50">{title}</h3>
        <p className="text-sm text-ink-300">{description}</p>
      </div>
      <Button onClick={onAction} variant="ghost">
        {actionLabel}
      </Button>
    </div>
  )
}
