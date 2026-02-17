import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExerciseCard } from './ExerciseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useExercises } from '@/hooks/useExercises'
import { Button } from '@/components/shared/Button'
import { Check } from 'lucide-react'

export function ExerciseList() {
  const navigate = useNavigate()
  const { exercises, loading, query, setQuery, removeExercise } = useExercises()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [previewExercise, setPreviewExercise] = useState<{
    name: string
    videoUrl?: string
    imageUrls?: string[]
    imageSlideSeconds?: number
    localImageUrls?: string[]
  } | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null)
  const [sortKey, setSortKey] = useState<'name' | 'created'>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(9)
  const [page, setPage] = useState(1)

  const allSelected = useMemo(
    () => exercises.length > 0 && selectedIds.length === exercises.length,
    [exercises.length, selectedIds.length]
  )

  useEffect(() => {
    if (!previewExercise) return
    setPreviewIndex(0)
    if (!previewExercise.imageUrls || previewExercise.imageUrls.length <= 1) {
      return
    }
    const delay = Math.max(1, previewExercise.imageSlideSeconds ?? 5) * 1000
    const timer = window.setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewExercise.imageUrls!.length)
    }, delay)
    return () => window.clearInterval(timer)
  }, [previewExercise])

  useEffect(() => {
    return () => {
      if (previewExercise?.localImageUrls) {
        previewExercise.localImageUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }
  }, [previewExercise])

  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(exercises.map((item) => item.id))
    }
  }

  const handleBulkDelete = async () => {
    const ids =
      bulkDeleteMode === 'all' ? exercises.map((item) => item.id) : selectedIds
    if (ids.length === 0) {
      setBulkDeleteMode(null)
      return
    }
    await Promise.all(ids.map((id) => removeExercise(id)))
    setSelectedIds([])
    setBulkDeleteMode(null)
  }

  const sortedExercises = useMemo(() => {
    const sorted = [...exercises].sort((a, b) => {
      if (sortKey === 'name') {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        return aName.localeCompare(bName)
      }
      return (a.createdAt ?? 0) - (b.createdAt ?? 0)
    })
    return sortDir === 'desc' ? sorted.reverse() : sorted
  }, [exercises, sortDir, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedExercises.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pagedExercises = sortedExercises.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage)
    }
  }, [currentPage, page])

  return (
    <div className="space-y-6">
      <div>
        <div className="surface-card section-stack p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="form-label">Biblioteca</p>
              <h3 className="mt-1 font-display text-2xl text-ink-50">Ejercicios</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-ink-300" htmlFor="exercise-sort">
                  Orden
                </label>
                <select
                  id="exercise-sort"
                  value={`${sortKey}:${sortDir}`}
                  onChange={(event) => {
                    const [key, dir] = event.target.value.split(':') as ['name' | 'created', 'asc' | 'desc']
                    setSortKey(key)
                    setSortDir(dir)
                    setPage(1)
                  }}
                  className="input-field min-w-[160px] text-xs"
                >
                  <option value="created:desc">Más recientes</option>
                  <option value="created:asc">Más antiguos</option>
                  <option value="name:asc">Nombre A-Z</option>
                  <option value="name:desc">Nombre Z-A</option>
                </select>
                <label className="text-xs text-ink-300" htmlFor="exercise-size">
                  Por página
                </label>
                <select
                  id="exercise-size"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value))
                    setPage(1)
                  }}
                  className="input-field w-[88px] text-xs"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                </select>
              </div>
              <label className="group flex items-center gap-2 text-xs text-ink-300">
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="peer sr-only"
                  />
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-ink-600 bg-ink-900/60 text-transparent opacity-0 transition group-hover:opacity-100 peer-checked:opacity-100 peer-focus-visible:opacity-100 peer-checked:border-accent-400 peer-checked:bg-accent-500 peer-checked:text-ink-900">
                    <Check className="h-4 w-4 text-current" />
                  </span>
                </span>
              </label>
              <Button
                variant="ghost"
                onClick={() => setBulkDeleteMode('selected')}
                disabled={selectedIds.length === 0}
              >
                Eliminar seleccionados
              </Button>
              <Button variant="ghost" onClick={() => setBulkDeleteMode('all')}>
                Eliminar todo
              </Button>
              <Button onClick={() => navigate('/ejercicios/nuevo')}>Nuevo ejercicio</Button>
            </div>
          </div>
        </div>
        <div className="sticky top-20 z-30 mt-3 bg-[color:var(--surface-panel-bg)]/90 pb-3 pt-2 backdrop-blur">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ejercicio"
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="surface-panel mt-4 rounded-2xl p-4 text-sm text-ink-300">
            Cargando ejercicios...
          </div>
        ) : exercises.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Sin ejercicios cargados"
              description="Crea tu primer ejercicio para empezar a construir rutinas."
              actionLabel="Nuevo ejercicio"
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pagedExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onDelete={handleDelete}
                selected={selectedIds.includes(exercise.id)}
                onToggleSelect={toggleSelect}
                onPreview={(item) => {
                  const hasRemoteImages = Boolean(item.imageUrls && item.imageUrls.length > 0)
                  const localUrls =
                    !hasRemoteImages && item.imageFiles && item.imageFiles.length > 0
                      ? item.imageFiles.map((file) => URL.createObjectURL(file))
                      : undefined
                  setPreviewExercise({
                    name: item.name,
                    videoUrl: item.videoUrl,
                    imageUrls: hasRemoteImages ? item.imageUrls : localUrls,
                    imageSlideSeconds: item.imageSlideSeconds,
                    localImageUrls: localUrls,
                  })
                }}
                onEdit={(item) => navigate(`/ejercicios/editar/${item.id}`)}
              />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-300">
              <span>
                Mostrando {sortedExercises.length === 0 ? 0 : pageStart + 1}-
                {Math.min(pageStart + pageSize, sortedExercises.length)} de {sortedExercises.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-ink-200">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Eliminar ejercicio"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (pendingDeleteId) {
            void removeExercise(pendingDeleteId)
          }
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmDialog
        open={Boolean(bulkDeleteMode)}
        title={bulkDeleteMode === 'all' ? 'Eliminar todos los ejercicios' : 'Eliminar ejercicios seleccionados'}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => void handleBulkDelete()}
        onCancel={() => setBulkDeleteMode(null)}
      />
      {previewExercise && (
        <div className="overlay-scrim fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="dialog-surface w-full max-w-4xl space-y-4 rounded-3xl border p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="form-label">Previsualización</p>
                <h3 className="mt-1 font-display text-xl text-ink-50">{previewExercise.name}</h3>
              </div>
              <Button variant="ghost" onClick={() => setPreviewExercise(null)}>
                Cerrar
              </Button>
            </div>
            <div className="media-frame aspect-video overflow-hidden rounded-3xl">
              {previewExercise.videoUrl ? (
                <video
                  src={previewExercise.videoUrl}
                  className="h-full w-full object-cover"
                  controls
                  autoPlay
                  playsInline
                />
              ) : previewExercise.imageUrls && previewExercise.imageUrls.length > 0 ? (
                <img
                  src={previewExercise.imageUrls[previewIndex]}
                  className="h-full w-full object-contain bg-ink-950"
                  alt={previewExercise.name}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-900 via-ink-900/40 to-ink-800" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
