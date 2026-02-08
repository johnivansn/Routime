import { ExerciseCard } from './ExerciseCard'
import { ExerciseForm } from './ExerciseForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { useExercises } from '@/hooks/useExercises'

export function ExerciseList() {
  const { exercises, loading, query, setQuery, addExercise, removeExercise } = useExercises()

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('¿Eliminar este ejercicio?')
    if (confirmed) {
      void removeExercise(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ejercicio"
          className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
        />
        <ExerciseForm onSubmit={addExercise} />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Cargando ejercicios...
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          title="Sin ejercicios cargados"
          description="Crea tu primer ejercicio con nombre y video para empezar a construir rutinas."
          actionLabel="Nuevo ejercicio"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
