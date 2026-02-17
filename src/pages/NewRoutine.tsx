import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { RoutineBuilder } from '@/components/routines/RoutineBuilder'
import { useExerciseOptions } from '@/hooks/useExerciseOptions'
import { useRoutines } from '@/hooks/useRoutines'

export function NewRoutine() {
  const navigate = useNavigate()
  const { addRoutine } = useRoutines()
  const { options: exercises, loading: exercisesLoading } = useExerciseOptions()

  if (exercisesLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
          Cargando ejercicios...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-edit flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Nueva</p>
          <h1 className="page-title">Rutina</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/crear">
            <Button variant="ghost">Volver a rutinas</Button>
          </Link>
        </div>
      </div>

      <RoutineBuilder
        exercises={exercises}
        onSave={async (routine) => {
          await addRoutine(routine)
          navigate('/crear')
        }}
        onCancelEdit={() => navigate('/crear')}
      />
    </div>
  )
}
