import type { Exercise } from '@/types'
import { Button } from '@/components/shared/Button'

type ExerciseCardProps = {
  exercise: Exercise
  onDelete: (id: string) => void
}

export function ExerciseCard({ exercise, onDelete }: ExerciseCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-ink-700 bg-ink-800/70 p-4">
      <div className="aspect-video overflow-hidden rounded-2xl bg-ink-900">
        <video
          src={exercise.videoUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-display text-base font-semibold text-ink-50">
            {exercise.name}
          </h4>
          <p className="text-xs text-ink-400">
            {new Date(exercise.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => onDelete(exercise.id)}>
          Eliminar
        </Button>
      </div>
    </div>
  )
}
