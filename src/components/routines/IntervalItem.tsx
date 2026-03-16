import type { Interval } from '@/types'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'

type IntervalItemProps = {
  interval: Interval
  exercise?: { id: string; name: string }
  roundLabel?: string
  sectionLabel?: string
  readOnly?: boolean
  onChangeSection?: (id: string, section: Interval['section']) => void
  onDelete: (id: string) => void
  onChangeDuration: (id: string, duration: number) => void
}

export function IntervalItem({
  interval,
  exercise,
  roundLabel,
  sectionLabel,
  readOnly = false,
  onChangeSection,
  onDelete,
  onChangeDuration,
}: IntervalItemProps) {
  const title = interval.type === 'REST' ? 'Descanso' : exercise?.name ?? 'Ejercicio'
  const isUntimed = interval.type === 'EXERCISE' && interval.duration <= 0

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4">
      <div className="flex items-start gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2" />
          {sectionLabel && <p className="text-xs text-ink-400">{sectionLabel}</p>}
          {roundLabel && <p className="text-xs text-ink-400">{roundLabel}</p>}
          <h4 className="font-display text-base font-semibold text-ink-50">{title}</h4>
          {interval.notes && (
            <p className="text-xs text-ink-300">{interval.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {interval.type === 'EXERCISE' && !readOnly && (
          <label className="flex items-center gap-2 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={isUntimed}
              onChange={(event) => {
                const nextUntimed = event.target.checked
                onChangeDuration(interval.id, nextUntimed ? 0 : 30)
              }}
              className="h-3.5 w-3.5 rounded border-ink-500 bg-ink-900 text-accent-500"
            />
            Sin tiempo
          </label>
        )}
        {isUntimed ? (
          <span className="rounded-full border border-ink-700/60 bg-ink-900/50 px-3 py-1 text-xs text-ink-200">
            Sin tiempo
          </span>
        ) : (
          <>
            <input
              type="number"
              min={1}
              max={600}
              value={interval.duration}
              onChange={(event) => onChangeDuration(interval.id, Number(event.target.value))}
              className="input-field w-24 px-3 py-2 text-sm"
              disabled={readOnly}
            />
            <span className="text-xs text-ink-400">seg</span>
          </>
        )}
        {!readOnly && (
          <Button
            variant="ghost"
            onClick={() => onDelete(interval.id)}
            title="Quitar"
            aria-label="Quitar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
