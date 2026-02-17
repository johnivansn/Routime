import type { Exercise } from '@/types'
import { Check, Image, MoreVertical, Pencil, Play, Trash2, Video } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useEffect, useRef, useState } from 'react'

type ExerciseCardProps = {
  exercise: Exercise
  onDelete: (id: string) => void
  onEdit: (exercise: Exercise) => void
  onPreview: (exercise: Exercise) => void
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

export function ExerciseCard({
  exercise,
  onDelete,
  onEdit,
  onPreview,
  selected,
  onToggleSelect,
}: ExerciseCardProps) {
  const coverImage = exercise.imageUrls?.[0]
  const galleryCount = exercise.imageUrls?.length ?? 0
  const hasMedia = Boolean(
    exercise.videoUrl ||
      coverImage ||
      (exercise.imageFiles && exercise.imageFiles.length > 0)
  )
  const mediaLabel =
    exercise.mediaType === 'video'
      ? 'Video'
      : exercise.mediaType === 'gallery'
        ? `Galería (${galleryCount})`
        : exercise.mediaType === 'image'
          ? 'Imagen'
          : 'Sin media'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <div className="surface-card group flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-display text-base font-semibold text-ink-50">
            {exercise.name}
          </h4>
          <p className="text-xs text-ink-400">
            {new Date(exercise.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <label className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={() => onToggleSelect(exercise.id)}
                className="peer sr-only"
                aria-label="Seleccionar ejercicio"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-ink-600 bg-ink-900/60 text-transparent opacity-0 transition group-hover:opacity-100 peer-checked:opacity-100 peer-focus-visible:opacity-100 peer-checked:border-accent-400 peer-checked:bg-accent-500 peer-checked:text-ink-900">
                <Check className="h-4 w-4 text-current" />
              </span>
            </label>
          )}
          <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            onClick={() => setMenuOpen((open) => !open)}
            title="Opciones"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <div
              role="menu"
              className="dropdown-menu absolute right-0 z-30 mt-2 w-44 rounded-2xl border shadow-xl backdrop-blur"
            >
              {hasMedia && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onPreview(exercise)
                    setMenuOpen(false)
                  }}
                  className="dropdown-item flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
                >
                  <Play className="h-4 w-4" />
                  Previsualizar
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onEdit(exercise)
                  setMenuOpen(false)
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
                  onDelete(exercise.id)
                  setMenuOpen(false)
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
      <div className="flex items-center gap-2 text-xs text-ink-300">
        {exercise.mediaType === 'video' ? (
          <Video className="h-3.5 w-3.5" />
        ) : exercise.mediaType === 'gallery' || exercise.mediaType === 'image' ? (
          <Image className="h-3.5 w-3.5" />
        ) : null}
        <span>{mediaLabel}</span>
      </div>
    </div>
  )
}
