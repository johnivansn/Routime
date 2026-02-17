import type { Routine } from '@/types'
import { useEffect, useRef, useState } from 'react'
import { Check, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { formatTime } from '@/utils/formatTime'
import { expandRoutineIntervals } from '@/utils/routineIntervals'

type RoutineListProps = {
  routines: Routine[]
  onEdit: (routine: Routine) => void
  onDelete: (id: string) => void
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
  columns?: 1 | 2 | 3
}

const getExpanded = (routine: Routine) => expandRoutineIntervals(routine)

const totalSeconds = (routine: Routine) =>
  getExpanded(routine).reduce((total, interval) => total + interval.duration, 0)

export function RoutineList({
  routines,
  onEdit,
  onDelete,
  selectedIds = [],
  onToggleSelect,
  columns = 3,
}: RoutineListProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!openId) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenId(null)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openId])

  const gridClass =
    columns === 1
      ? 'grid gap-4'
      : columns === 2
        ? 'grid gap-4 sm:grid-cols-2'
        : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'

  return (
    <div className={gridClass}>
      {routines.map((routine) => (
        <div
          key={routine.id}
          className="surface-card group flex flex-col gap-3 p-4 sm:gap-4 sm:p-5"
        >
          <div className="space-y-1">
            <h4 className="font-display text-lg font-semibold text-ink-50">{routine.name}</h4>
            <p className="text-xs text-ink-400">
              {getExpanded(routine).length} intervalos · {formatTime(totalSeconds(routine))}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            {onToggleSelect && (
              <label className="flex items-center gap-2 text-xs text-ink-300">
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(routine.id)}
                    onChange={() => onToggleSelect(routine.id)}
                    className="peer sr-only"
                    aria-label="Seleccionar rutina"
                  />
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-ink-600 bg-ink-900/60 text-transparent opacity-0 transition group-hover:opacity-100 peer-checked:opacity-100 peer-focus-visible:opacity-100 peer-checked:border-accent-400 peer-checked:bg-accent-500 peer-checked:text-ink-900">
                    <Check className="h-4 w-4 text-current" />
                  </span>
                </span>
              </label>
            )}
            <div className="relative" ref={openId === routine.id ? menuRef : null}>
              <Button
                variant="ghost"
                onClick={() => setOpenId(openId === routine.id ? null : routine.id)}
                title="Opciones"
                aria-haspopup="menu"
                aria-expanded={openId === routine.id}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {openId === routine.id && (
                <div
                  role="menu"
                  className="dropdown-menu absolute right-0 z-30 mt-2 w-44 rounded-2xl border shadow-xl backdrop-blur"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onEdit(routine)
                      setOpenId(null)
                    }}
                    className="dropdown-item flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onDelete(routine.id)
                      setOpenId(null)
                    }}
                    className="dropdown-item flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
