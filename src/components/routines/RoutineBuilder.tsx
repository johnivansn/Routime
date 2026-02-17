import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Interval, Routine, RoutineBlock } from '@/types'
import { Button } from '@/components/shared/Button'
import { Dropdown } from '@/components/shared/Dropdown'
import { IntervalItem } from './IntervalItem'
import { isValidIntervalDuration } from '@/utils/validators'
import { Check, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'

type ExerciseOption = { id: string; name: string }

type RoutineBuilderProps = {
  exercises: ExerciseOption[]
  routine?: Routine | null
  onSave: (routine: Routine) => Promise<void>
  onCancelEdit?: () => void
  hideFooterActions?: boolean
  intervalsLayout?: 'stack' | 'sidebar'
}

const MAX_INTERVALS = 50

const cloneBlockInterval = (interval: Interval) => ({
  ...interval,
  id: crypto.randomUUID(),
})

type SortableIntervalProps = {
  id: string
  interval: Interval
  exercise?: ExerciseOption
  onDelete: (id: string) => void
  onChangeDuration: (id: string, duration: number) => void
}

type NumberStepperProps = {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  className?: string
  ariaLabel: string
}

const clampNumber = (value: number, min?: number, max?: number) => {
  const lower = min ?? -Infinity
  const upper = max ?? Infinity
  return Math.min(Math.max(value, lower), upper)
}

function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  ariaLabel,
}: NumberStepperProps) {
  const handleChange = (next: number) => {
    const safe = Number.isNaN(next) ? min ?? 0 : next
    onChange(clampNumber(safe, min, max))
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => handleChange(Number(event.target.value))}
        className="input-field pr-9"
        aria-label={ariaLabel}
      />
      <div className="absolute right-1 top-1 bottom-1 flex flex-col">
        <button
          type="button"
          onClick={() => handleChange(value + step)}
          className="flex h-1/2 w-7 items-center justify-center rounded-t-md text-ink-300 transition hover:text-ink-50"
          aria-label="Incrementar"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleChange(value - step)}
          className="flex h-1/2 w-7 items-center justify-center rounded-b-md text-ink-300 transition hover:text-ink-50"
          aria-label="Disminuir"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
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

export type RoutineBuilderHandle = {
  save: () => Promise<void>
  reset: () => void
}

export const RoutineBuilder = forwardRef<RoutineBuilderHandle, RoutineBuilderProps>(
  (
    {
      exercises,
      routine,
      onSave,
      onCancelEdit,
      hideFooterActions = false,
      intervalsLayout = 'stack',
    },
    ref
  ) => {
  const [name, setName] = useState(routine?.name ?? '')
  const [blocks, setBlocks] = useState<RoutineBlock[]>([])
  const [exerciseId, setExerciseId] = useState('')
  const [duration, setDuration] = useState(30)
  const [restDuration, setRestDuration] = useState(20)
  const [intervalNotes, setIntervalNotes] = useState('')
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string>('')
  const [newBlockName, setNewBlockName] = useState('')
  const [newBlockRounds, setNewBlockRounds] = useState(1)
  const [dragSortEnabled, setDragSortEnabled] = useState(true)

  useEffect(() => {
    setName(routine?.name ?? '')
    const blocksFromRoutine = () => {
      if (routine?.blocks && routine.blocks.length > 0) {
        return routine.blocks.map((block) => ({
          ...block,
          rounds: block.rounds ?? 1,
        }))
      }
      if (routine?.intervals && routine.intervals.length > 0) {
        const warmup = routine.intervals.filter((item) => item.section === 'WARMUP')
        const work = routine.intervals.filter((item) => item.section === 'WORK' || !item.section)
        const cooldown = routine.intervals.filter((item) => item.section === 'COOLDOWN')
        const blocks: RoutineBlock[] = []
        if (warmup.length > 0) {
          blocks.push({
            id: crypto.randomUUID(),
            name: 'Calentamiento',
            rounds: 1,
            intervals: warmup.map((item) => ({ ...item })),
          })
        }
        if (work.length > 0) {
          blocks.push({
            id: crypto.randomUUID(),
            name: 'Trabajo',
            rounds: routine?.rounds ?? 1,
            intervals: work.map((item) => ({ ...item })),
          })
        }
        if (cooldown.length > 0) {
          blocks.push({
            id: crypto.randomUUID(),
            name: 'Enfriamiento',
            rounds: 1,
            intervals: cooldown.map((item) => ({ ...item })),
          })
        }
        if (blocks.length > 0) return blocks
      }
      return [
        {
          id: crypto.randomUUID(),
          name: 'Bloque 1',
          rounds: 1,
          intervals: [],
        },
      ]
    }

    const nextBlocks = blocksFromRoutine()
    setBlocks(nextBlocks)
    setActiveBlockId(nextBlocks[0]?.id ?? '')
    setExerciseId('')
    setDuration(30)
    setRestDuration(20)
    setIntervalNotes('')
    setError(null)
    setNewBlockName('')
    setNewBlockRounds(1)
  }, [routine])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('routime:intervalNotes')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setNoteSuggestions(parsed.filter((item) => typeof item === 'string') as string[])
        }
      } catch {
        setNoteSuggestions([])
      }
    }
  }, [])

  const activeBlock = useMemo(
    () => blocks.find((block) => block.id === activeBlockId) ?? blocks[0] ?? null,
    [activeBlockId, blocks]
  )

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]))
  }, [exercises])
  const activeBlockIntervals = activeBlock?.intervals ?? []
  const totalIntervals = blocks.reduce((sum, block) => sum + block.intervals.length, 0)
  const isCompact = intervalsLayout === 'sidebar'
  const canDragSort = dragSortEnabled && intervalsLayout === 'sidebar' && activeBlockIntervals.length > 1

  const resetForm = () => {
    setName('')
    const defaultBlock: RoutineBlock = {
      id: crypto.randomUUID(),
      name: 'Bloque 1',
      rounds: 1,
      intervals: [],
    }
    setBlocks([defaultBlock])
    setActiveBlockId(defaultBlock.id)
    setExerciseId('')
    setDuration(30)
    setRestDuration(20)
    setIntervalNotes('')
    setError(null)
    setNewBlockName('')
    setNewBlockRounds(1)
  }

  const saveNoteSuggestion = (note: string) => {
    if (typeof window === 'undefined') return
    const trimmed = note.trim()
    if (!trimmed) return
    const next = [trimmed, ...noteSuggestions.filter((item) => item !== trimmed)].slice(0, 12)
    setNoteSuggestions(next)
    window.localStorage.setItem('routime:intervalNotes', JSON.stringify(next))
  }

  const addBlock = () => {
    const name =
      newBlockName.trim() || `Bloque ${Math.min(9, blocks.length + 1)}`
    const rounds = Math.max(1, Math.floor(newBlockRounds || 1))
    const newBlock: RoutineBlock = {
      id: crypto.randomUUID(),
      name,
      rounds,
      intervals: [],
    }
    setBlocks((prev) => [...prev, newBlock])
    setActiveBlockId(newBlock.id)
    setNewBlockName('')
    setNewBlockRounds(1)
  }

  const updateBlockName = (id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, name: value } : block))
    )
  }

  const updateBlockRounds = (id: string, value: number) => {
    const rounds = Math.max(1, Math.floor(value || 1))
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, rounds } : block))
    )
  }

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return
    const nextBlocks = blocks.filter((block) => block.id !== id)
    setBlocks(nextBlocks)
    if (activeBlockId === id) {
      setActiveBlockId(nextBlocks[0]?.id ?? '')
    }
  }

  const moveBlock = (id: string, direction: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === id)
    if (index === -1) return
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= blocks.length) return
    const reordered = [...blocks]
    const [item] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, item)
    setBlocks(reordered)
  }

  const addExerciseInterval = () => {
    if (!activeBlock) {
      setError('Crea un bloque antes de agregar intervalos.')
      return
    }
    if (!exerciseId) {
      setError('Selecciona un ejercicio.')
      return
    }
    if (!isValidIntervalDuration(restDuration)) {
      setError('Duración inválida (1-600 segundos).')
      return
    }
    const totalIntervals = blocks.reduce((sum, block) => sum + block.intervals.length, 0)
    if (totalIntervals >= MAX_INTERVALS) {
      setError('Límite máximo de 50 intervalos por rutina.')
      return
    }
    const last = activeBlock.intervals[activeBlock.intervals.length - 1]
    if (last?.type === 'EXERCISE' && last.exerciseId === exerciseId) {
      setError('No puedes repetir el mismo ejercicio de forma consecutiva.')
      return
    }
    setError(null)
    const note = intervalNotes.trim()
    if (note) {
      saveNoteSuggestion(note)
    }
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlock.id
          ? {
              ...block,
              intervals: [
                ...block.intervals,
                {
                  id: crypto.randomUUID(),
                  type: 'EXERCISE',
                  duration,
                  exerciseId,
                  notes: note || undefined,
                },
              ],
            }
          : block
      )
    )
    setIntervalNotes('')
  }

  const addRestInterval = () => {
    if (!activeBlock) {
      setError('Crea un bloque antes de agregar intervalos.')
      return
    }
    if (!isValidIntervalDuration(duration)) {
      setError('Duración inválida (1-600 segundos).')
      return
    }
    const totalIntervals = blocks.reduce((sum, block) => sum + block.intervals.length, 0)
    if (totalIntervals >= MAX_INTERVALS) {
      setError('Límite máximo de 50 intervalos por rutina.')
      return
    }
    setError(null)
    const note = intervalNotes.trim()
    if (note) {
      saveNoteSuggestion(note)
    }
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlock.id
          ? {
              ...block,
              intervals: [
                ...block.intervals,
                {
                  id: crypto.randomUUID(),
                  type: 'REST',
                  duration: restDuration,
                  label: 'Descanso',
                  notes: note || undefined,
                },
              ],
            }
          : block
      )
    )
    setIntervalNotes('')
  }

  const updateDuration = (id: string, newDuration: number) => {
    setBlocks((prev) =>
      prev.map((block) => ({
        ...block,
        intervals: block.intervals.map((interval) =>
          interval.id === id ? { ...interval, duration: newDuration } : interval
        ),
      }))
    )
  }

  const removeInterval = (id: string) => {
    setBlocks((prev) =>
      prev.map((block) => ({
        ...block,
        intervals: block.intervals.filter((interval) => interval.id !== id),
      }))
    )
  }

  const handleActiveBlockDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    if (!event.over || !activeBlock) return
    const activeIndex = activeBlock.intervals.findIndex((interval) => interval.id === event.active.id)
    const overIndex = activeBlock.intervals.findIndex((interval) => interval.id === event.over?.id)
    if (activeIndex === -1 || overIndex === -1) return
    const reordered = arrayMove(activeBlock.intervals, activeIndex, overIndex)
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlock.id ? { ...block, intervals: reordered } : block
      )
    )
  }

  const handleSave = async () => {
    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }
    const totalIntervals = blocks.reduce((sum, block) => sum + block.intervals.length, 0)
    if (totalIntervals === 0) {
      setError('Agrega al menos un intervalo.')
      return
    }
    setError(null)
    const now = Date.now()
    const normalizedBlocks = blocks.map((block) => ({
      ...block,
      rounds: Math.max(1, block.rounds ?? 1),
    }))
    const intervalsToSave = normalizedBlocks.flatMap((block) => {
      const rounds = Math.max(1, block.rounds ?? 1)
      const repeated: Interval[] = []
      for (let round = 0; round < rounds; round += 1) {
        repeated.push(...block.intervals.map(cloneBlockInterval))
      }
      return repeated
    })

    const routineToSave: Routine = {
      id: routine?.id ?? crypto.randomUUID(),
      name: name.trim(),
      intervals: intervalsToSave,
      blocks: normalizedBlocks,
      createdAt: routine?.createdAt ?? now,
      updatedAt: now,
    }
    await onSave(routineToSave)
    if (!routine) {
      resetForm()
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
      reset: resetForm,
    }),
    [handleSave]
  )

  return (
    <div className={`surface-panel section-stack ${isCompact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}`}>
      <div
        className={
          intervalsLayout === 'sidebar'
            ? `grid ${isCompact ? 'gap-4 lg:grid-cols-[1.2fr_1fr]' : 'gap-6 lg:grid-cols-[1.1fr_1fr]'}`
            : 'space-y-6'
        }
      >
        <div className={`section-stack ${isCompact ? 'space-y-4' : ''}`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="form-label">Nombre de la rutina</label>
              {!hideFooterActions && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    title={routine ? 'Guardar cambios' : 'Guardar rutina'}
                    aria-label={routine ? 'Guardar cambios' : 'Guardar rutina'}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-700/60 bg-ink-900/60 text-ink-200 transition hover:border-ink-500/70 hover:text-ink-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  {onCancelEdit && (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      title="Cancelar"
                      aria-label="Cancelar"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-700/60 bg-ink-900/60 text-ink-200 transition hover:border-ink-500/70 hover:text-ink-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. HIIT 20 min"
              className="input-field"
            />
          </div>

          <div className={`surface-card ${isCompact ? 'space-y-3 p-3 sm:p-4' : 'space-y-4 p-4 sm:p-5'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="form-label">Bloques</p>
                {!isCompact && (
                  <p className="form-help">Cada bloque puede tener sus propias rondas.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => moveBlock(activeBlockId, -1)}>
                  ↑
                </Button>
                <Button variant="ghost" onClick={() => moveBlock(activeBlockId, 1)}>
                  ↓
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {blocks.map((block) => {
                const isActive = block.id === activeBlockId
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setActiveBlockId(block.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                      isActive
                        ? 'bg-accent-500 text-ink-900 shadow-sm'
                        : 'text-ink-200 hover:text-ink-50'
                    }`}
                  >
                    {block.name}
                  </button>
                )
              })}
            </div>
            {activeBlock && (
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_42px]">
                <label className="space-y-1">
                  <span className="form-label">Nombre del bloque</span>
                  <input
                    value={activeBlock.name}
                    onChange={(event) => updateBlockName(activeBlock.id, event.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="space-y-1">
                  <span className="form-label">Rondas</span>
                  <NumberStepper
                    value={activeBlock.rounds ?? 1}
                    min={1}
                    max={50}
                    onChange={(value) => updateBlockRounds(activeBlock.id, value)}
                    className="w-20 sm:w-24"
                    ariaLabel="Rondas del bloque"
                  />
                </label>
                <div className="flex items-end justify-end pb-[1px]">
                  <button
                    type="button"
                    onClick={() => removeBlock(activeBlock.id)}
                    title="Eliminar bloque"
                    aria-label="Eliminar bloque"
                    className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-ink-700/60 bg-ink-900/60 text-ink-200 transition hover:border-ink-500/70 hover:text-ink-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_42px]">
              <label className="space-y-1">
                <span className="form-label">Nuevo bloque</span>
                <input
                  value={newBlockName}
                  onChange={(event) => setNewBlockName(event.target.value)}
                  placeholder={`Bloque ${blocks.length + 1}`}
                  className="input-field"
                />
              </label>
              <label className="space-y-1">
                <span className="form-label">Rondas</span>
                <NumberStepper
                  value={newBlockRounds}
                  min={1}
                  max={50}
                  onChange={setNewBlockRounds}
                  className="w-20 sm:w-24"
                  ariaLabel="Rondas del nuevo bloque"
                />
              </label>
              <div className="flex items-end justify-end pb-[1px]">
                <button
                  type="button"
                  onClick={addBlock}
                  title="Agregar bloque"
                  aria-label="Agregar bloque"
                  className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-ink-700/60 bg-ink-900/60 text-ink-200 transition hover:border-ink-500/70 hover:text-ink-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="surface-card space-y-3 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="form-label">Agregar intervalo</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Ejercicio · Descanso
              </p>
            </div>
            <div className={`grid gap-3 ${isCompact ? 'sm:grid-cols-[1fr_7rem]' : 'sm:grid-cols-[1fr_8rem]'}`}>
              <label className="space-y-2">
                <span className="form-label">Ejercicio</span>
                <Dropdown
                  value={exerciseId}
                  onChange={setExerciseId}
                  placeholder="Selecciona..."
                  options={exercises.map((exercise) => ({
                    value: exercise.id,
                    label: exercise.name,
                  }))}
                />
              </label>
              <label className="space-y-2">
                <span className="form-label">Duración (seg)</span>
                <NumberStepper
                  value={duration}
                  min={1}
                  max={600}
                  onChange={setDuration}
                  className="w-full"
                  ariaLabel="Duración del ejercicio en segundos"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="form-label">Detalle del intervalo</span>
              <input
                list="interval-note-suggestions"
                value={intervalNotes}
                onChange={(event) => setIntervalNotes(event.target.value)}
                placeholder="Ej. Tempo 3-1-3, foco en talón"
                className="input-field"
              />
              <datalist id="interval-note-suggestions">
                {noteSuggestions.map((note) => (
                  <option key={note} value={note} />
                ))}
              </datalist>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={addExerciseInterval} className="text-xs">
                Agregar ejercicio
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-ink-700/60 bg-ink-900/50 px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                  Descanso
                </span>
                <NumberStepper
                  value={restDuration}
                  min={1}
                  max={600}
                  onChange={setRestDuration}
                  className="h-8 w-20 text-xs"
                  ariaLabel="Descanso (seg)"
                />
                <Button
                  variant="secondary"
                  onClick={addRestInterval}
                  className="text-xs"
                >
                  Agregar descanso
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-ember-400">{error}</p>}

        </div>

        <div className={`section-stack min-h-0 rounded-3xl border border-ink-700/60 bg-ink-900/30 ${isCompact ? 'p-3 sm:p-4' : 'p-4'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="form-label">Intervalos</p>
            {intervalsLayout === 'sidebar' && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDragSortEnabled((prev) => !prev)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition sm:text-xs ${
                    dragSortEnabled
                      ? 'border-accent-400 bg-accent-500/15 text-accent-200 hover:bg-accent-500/20'
                      : 'border-ink-600 text-ink-300 hover:text-ink-100'
                  }`}
                  aria-pressed={dragSortEnabled}
                  title={
                    dragSortEnabled
                      ? 'Desactivar ajuste de orden por arrastre'
                      : 'Activar ajuste de orden por arrastre'
                  }
                >
                  Arrastre {dragSortEnabled ? 'ON' : 'OFF'}
                </button>
                <div
                  role="tablist"
                  aria-label="Bloques"
                  className="surface-inset inline-flex items-center gap-1 rounded-full border p-1 text-xs"
                >
                  {blocks.map((block) => {
                    const isActive = block.id === activeBlockId
                    return (
                      <button
                        key={block.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveBlockId(block.id)}
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold transition sm:text-xs ${
                          isActive
                            ? 'bg-accent-500 text-ink-900 shadow-sm'
                            : 'text-ink-200 hover:text-ink-50'
                        }`}
                      >
                        {block.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {totalIntervals === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-700 px-4 py-6 text-sm text-ink-400">
              Todavía no hay intervalos.
            </div>
          ) : intervalsLayout === 'sidebar' && canDragSort ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleActiveBlockDragEnd}>
              <SortableContext
                items={activeBlockIntervals.map((interval) => interval.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`scroll-elegant ${isCompact ? 'max-h-[calc(100vh-210px)]' : 'max-h-[calc(100vh-230px)]'} space-y-3 overflow-auto pr-2 pb-1 pt-1`}>
                  {activeBlockIntervals.map((interval) => (
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
          ) : intervalsLayout === 'sidebar' ? (
            <div className={`scroll-elegant ${isCompact ? 'max-h-[calc(100vh-210px)]' : 'max-h-[calc(100vh-230px)]'} space-y-3 overflow-auto pr-2 pb-1 pt-1`}>
              {activeBlockIntervals.map((interval) => (
                <IntervalItem
                  key={interval.id}
                  interval={interval}
                  exercise={interval.exerciseId ? exerciseMap.get(interval.exerciseId) : undefined}
                  onDelete={removeInterval}
                  onChangeDuration={updateDuration}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <div key={block.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink-200">
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/20 text-accent-200">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                      {block.name}
                    </span>
                    <span className="text-[10px] text-ink-300">
                      {block.rounds ?? 1} ronda(s) · {block.intervals.length} intervalo(s)
                    </span>
                  </div>
                  {block.intervals.map((interval) => (
                    <IntervalItem
                      key={interval.id}
                      interval={interval}
                      exercise={interval.exerciseId ? exerciseMap.get(interval.exerciseId) : undefined}
                      onDelete={removeInterval}
                      onChangeDuration={updateDuration}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
  }
)

RoutineBuilder.displayName = 'RoutineBuilder'
