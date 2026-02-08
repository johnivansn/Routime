import { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Interval, Routine } from '@/types'
import { Button } from '@/components/shared/Button'
import { IntervalItem } from './IntervalItem'
import { isValidIntervalDuration } from '@/utils/validators'

type ExerciseOption = { id: string; name: string }

type RoutineBuilderProps = {
  exercises: ExerciseOption[]
  routine?: Routine | null
  onSave: (routine: Routine) => Promise<void>
  onCancelEdit?: () => void
}

const MAX_INTERVALS = 50

type SortableIntervalProps = {
  id: string
  interval: Interval
  exercise?: ExerciseOption
  onDelete: (id: string) => void
  onChangeDuration: (id: string, duration: number) => void
}

function SortableInterval({
  id,
  interval,
  exercise,
  onDelete,
  onChangeDuration,
}: SortableIntervalProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IntervalItem
        interval={interval}
        exercise={exercise}
        onDelete={onDelete}
        onChangeDuration={onChangeDuration}
      />
    </div>
  )
}

export function RoutineBuilder({ exercises, routine, onSave, onCancelEdit }: RoutineBuilderProps) {
  const [name, setName] = useState(routine?.name ?? '')
  const [intervals, setIntervals] = useState<Interval[]>(routine?.intervals ?? [])
  const [exerciseId, setExerciseId] = useState('')
  const [duration, setDuration] = useState(30)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(routine?.name ?? '')
    setIntervals(routine?.intervals ?? [])
    setExerciseId('')
    setDuration(30)
    setError(null)
  }, [routine])

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]))
  }, [exercises])

  const resetForm = () => {
    setName('')
    setIntervals([])
    setExerciseId('')
    setDuration(30)
    setError(null)
  }

  const addExerciseInterval = () => {
    if (!exerciseId) {
      setError('Selecciona un ejercicio.')
      return
    }
    if (!isValidIntervalDuration(duration)) {
      setError('Duración inválida (1-600 segundos).')
      return
    }
    if (intervals.length >= MAX_INTERVALS) {
      setError('Límite máximo de 50 intervalos por rutina.')
      return
    }
    const last = intervals[intervals.length - 1]
    if (last?.type === 'EXERCISE' && last.exerciseId === exerciseId) {
      setError('No puedes repetir el mismo ejercicio de forma consecutiva.')
      return
    }
    setError(null)
    setIntervals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'EXERCISE', duration, exerciseId },
    ])
  }

  const addRestInterval = () => {
    if (!isValidIntervalDuration(duration)) {
      setError('Duración inválida (1-600 segundos).')
      return
    }
    if (intervals.length >= MAX_INTERVALS) {
      setError('Límite máximo de 50 intervalos por rutina.')
      return
    }
    setError(null)
    setIntervals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'REST', duration },
    ])
  }

  const updateDuration = (id: string, newDuration: number) => {
    setIntervals((prev) =>
      prev.map((interval) =>
        interval.id === id ? { ...interval, duration: newDuration } : interval
      )
    )
  }

  const removeInterval = (id: string) => {
    setIntervals((prev) => prev.filter((interval) => interval.id !== id))
  }

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    if (!event.over) return
    const activeIndex = intervals.findIndex((interval) => interval.id === event.active.id)
    const overIndex = intervals.findIndex((interval) => interval.id === event.over?.id)
    if (activeIndex === -1 || overIndex === -1) return
    setIntervals((prev) => arrayMove(prev, activeIndex, overIndex))
  }

  const handleSave = async () => {
    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }
    if (intervals.length === 0) {
      setError('Agrega al menos un intervalo.')
      return
    }
    setError(null)
    const now = Date.now()
    const routineToSave: Routine = {
      id: routine?.id ?? crypto.randomUUID(),
      name: name.trim(),
      intervals,
      createdAt: routine?.createdAt ?? now,
      updatedAt: now,
    }
    await onSave(routineToSave)
    if (!routine) {
      resetForm()
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-ink-700 bg-ink-800/70 p-6">
      <div className="space-y-2">
        <label className="text-sm text-ink-200">Nombre de la rutina</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. HIIT 20 min"
          className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-ink-200 md:col-span-2">
          Ejercicio
          <select
            value={exerciseId}
            onChange={(event) => setExerciseId(event.target.value)}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
          >
            <option value="">Selecciona...</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-ink-200">
          Duración (seg)
          <input
            type="number"
            min={1}
            max={600}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={addExerciseInterval}>Agregar ejercicio</Button>
        <Button variant="ghost" onClick={addRestInterval}>
          Agregar descanso
        </Button>
      </div>

      {error && <p className="text-sm text-ember-400">{error}</p>}

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Intervalos</p>
        {intervals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700 px-4 py-6 text-sm text-ink-400">
            Todavía no hay intervalos.
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={intervals.map((interval) => interval.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {intervals.map((interval) => (
                  <SortableInterval
                    key={interval.id}
                    id={interval.id}
                    interval={interval}
                    exercise={interval.exerciseId ? exerciseMap.get(interval.exerciseId) : undefined}
                    onDelete={removeInterval}
                    onChangeDuration={updateDuration}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave}>{routine ? 'Guardar cambios' : 'Guardar rutina'}</Button>
        {routine && onCancelEdit && (
          <Button variant="ghost" onClick={onCancelEdit}>
            Cancelar edición
          </Button>
        )}
      </div>
    </div>
  )
}
