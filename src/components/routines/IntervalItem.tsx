import type { Interval } from '@/types'
import { Button } from '@/components/shared/Button'

type IntervalItemProps = {
  interval: Interval
  exercise?: { id: string; name: string }
  onDelete: (id: string) => void
  onChangeDuration: (id: string, duration: number) => void
}

export function IntervalItem({
  interval,
  exercise,
  onDelete,
  onChangeDuration,
}: IntervalItemProps) {
  const title = interval.type === 'REST' ? 'Descanso' : exercise?.name ?? 'Ejercicio'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400">
          {interval.type === 'REST' ? 'Descanso' : 'Ejercicio'}
        </p>
        <h4 className="font-display text-base font-semibold text-ink-50">{title}</h4>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={600}
          value={interval.duration}
          onChange={(event) => onChangeDuration(interval.id, Number(event.target.value))}
          className="w-24 rounded-2xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-accent-500"
        />
        <span className="text-xs text-ink-400">seg</span>
        <Button variant="ghost" onClick={() => onDelete(interval.id)}>
          Quitar
        </Button>
      </div>
    </div>
  )
}
