import type { Routine } from '@/types'
import { Button } from '@/components/shared/Button'
import { formatTime } from '@/utils/formatTime'

type RoutineListProps = {
  routines: Routine[]
  onEdit: (routine: Routine) => void
  onDelete: (id: string) => void
}

const totalSeconds = (routine: Routine) =>
  routine.intervals.reduce((total, interval) => total + interval.duration, 0)

export function RoutineList({ routines, onEdit, onDelete }: RoutineListProps) {
  return (
    <div className="space-y-4">
      {routines.map((routine) => (
        <div
          key={routine.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink-700 bg-ink-800/70 p-4"
        >
          <div>
            <h4 className="font-display text-lg font-semibold text-ink-50">{routine.name}</h4>
            <p className="text-xs text-ink-400">
              {routine.intervals.length} intervalos · {formatTime(totalSeconds(routine))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onEdit(routine)}>
              Editar
            </Button>
            <Button variant="ghost" onClick={() => onDelete(routine.id)}>
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
