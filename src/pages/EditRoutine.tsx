import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { RoutineBuilder } from '@/components/routines/RoutineBuilder'
import { useExerciseOptions } from '@/hooks/useExerciseOptions'
import { useRoutine } from '@/hooks/useRoutine'

export function EditRoutine() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routine, loading, update } = useRoutine(id)
  const { options: exercises, loading: exercisesLoading } = useExerciseOptions()

  if (loading || exercisesLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
          Cargando rutina...
        </div>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 section-stack">
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
          Rutina no encontrada.
        </div>
        <Link to="/crear">
          <Button variant="ghost">Volver a crear</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-edit flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Editar</p>
          <h1 className="page-title">{routine.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/crear">
            <Button variant="ghost">Volver a crear</Button>
          </Link>
          <Button onClick={() => navigate('/empezar')}>Ir a empezar</Button>
        </div>
      </div>

      <RoutineBuilder
        exercises={exercises}
        routine={routine}
        intervalsLayout="sidebar"
        onSave={async (next) => {
          await update(next)
          navigate('/crear')
        }}
        onCancelEdit={() => navigate('/crear')}
      />
    </div>
  )
}
