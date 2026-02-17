import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shared/Button'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { useExercises } from '@/hooks/useExercises'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export function EditExercise() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { exercises, loading, updateExercise, removeExercise } = useExercises()
  const exercise = useMemo(() => exercises.find((item) => item.id === id), [exercises, id])
  const [name, setName] = useState(exercise?.name ?? '')
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState<{
    mediaType: 'none' | 'video' | 'image' | 'gallery'
    videoUrl?: string | null
    imageUrls?: string[]
  } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [localImageUrls, setLocalImageUrls] = useState<string[] | null>(null)

  useEffect(() => {
    if (exercise) {
      setName(exercise.name)
    }
  }, [exercise])

  useEffect(() => {
    if (!exercise) return
    if (exercise.imageUrls && exercise.imageUrls.length > 0) {
      setLocalImageUrls((prev) => {
        prev?.forEach((url) => URL.revokeObjectURL(url))
        return null
      })
      return
    }
    if (!exercise.imageFiles || exercise.imageFiles.length === 0) {
      setLocalImageUrls((prev) => {
        prev?.forEach((url) => URL.revokeObjectURL(url))
        return null
      })
      return
    }
    const urls = exercise.imageFiles.map((file) => URL.createObjectURL(file))
    setLocalImageUrls((prev) => {
      prev?.forEach((url) => URL.revokeObjectURL(url))
      return urls
    })
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [exercise])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">Cargando ejercicio...</div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
          No se encontró el ejercicio.
        </div>
        <Link to="/ejercicios">
          <Button variant="ghost">Volver a ejercicios</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-edit flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Editar</p>
          <h1 className="page-title">Ejercicio</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setPendingDelete(true)}
          >
            Eliminar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (dirty) {
                const confirmLeave = window.confirm(
                  'Tienes cambios sin guardar. ¿Salir de todos modos?'
                )
                if (!confirmLeave) return
              }
              navigate('/ejercicios')
            }}
          >
            Volver
          </Button>
          <Button type="submit" form="edit-exercise-form">
            Guardar
          </Button>
        </div>
      </div>

      <div className="surface-card space-y-4 p-4 sm:p-6">
        <label className="form-label">Nombre del ejercicio</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={exercise.name}
          className="input-field font-display text-lg sm:text-2xl"
        />
      </div>

      <ExerciseForm
        formId="edit-exercise-form"
        initialName={exercise.name}
        hasVideo={Boolean(exercise.videoUrl || exercise.videoFile)}
        currentVideoUrl={exercise.videoUrl}
        hasImages={Boolean(exercise.imageUrls?.length || exercise.imageFiles?.length)}
        currentImageUrls={exercise.imageUrls && exercise.imageUrls.length > 0 ? exercise.imageUrls : localImageUrls ?? undefined}
        initialMediaType={exercise.mediaType ?? 'none'}
        initialSlideSeconds={exercise.imageSlideSeconds ?? 5}
        submitLabel="Actualizar ejercicio"
        layout="horizontal"
        hideNameField
        nameValue={name || exercise.name}
        onNameChange={setName}
        hideActions
        onDirtyChange={setDirty}
        onPreviewDataChange={setPreview}
        onPreviewClick={() => setPreviewOpen(true)}
        onSubmit={async (values) => {
          await updateExercise({
            id: exercise.id,
            name: values.name,
            mediaType: values.mediaType,
            videoFile: values.videoFile,
            imageFiles: values.imageFiles,
            imageSlideSeconds: values.imageSlideSeconds,
            removeVideo: values.removeVideo,
            removeImages: values.removeImages,
            removeImageIndexes: values.removeImageIndexes,
          })
          navigate('/ejercicios')
        }}
      />

      {previewOpen && (
        <div className="overlay-scrim fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="dialog-surface w-full max-w-4xl space-y-4 rounded-3xl border p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="form-label">Previsualización</p>
                <h3 className="mt-1 font-display text-xl text-ink-50">
                  {name || exercise.name}
                </h3>
              </div>
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </div>
            <div className="media-frame aspect-video overflow-hidden rounded-3xl">
              {preview?.mediaType === 'video' && preview.videoUrl ? (
                <video
                  src={preview.videoUrl}
                  className="h-full w-full object-cover"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (preview?.mediaType === 'image' || preview?.mediaType === 'gallery') &&
                preview.imageUrls &&
                preview.imageUrls.length > 0 ? (
                <img
                  src={preview.imageUrls[0]}
                  className="h-full w-full object-contain bg-ink-950"
                  alt={name || 'Previsualización'}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-900 via-ink-900/40 to-ink-800" />
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete}
        title="Eliminar ejercicio"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          await removeExercise(exercise.id)
          setPendingDelete(false)
          navigate('/ejercicios')
        }}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  )
}
