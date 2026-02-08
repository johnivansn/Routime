import { useMemo, useState } from 'react'
import type { Routine } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { RoutineBuilder } from './RoutineBuilder'
import { RoutineList } from './RoutineList'
import { useExerciseOptions } from '@/hooks/useExerciseOptions'
import { useRoutines } from '@/hooks/useRoutines'

export function RoutineManager() {
  const { routines, loading, addRoutine, updateRoutine, removeRoutine } = useRoutines()
  const { options: exercises, loading: exercisesLoading } = useExerciseOptions()
  const [editing, setEditing] = useState<Routine | null>(null)

  const handleSave = async (routine: Routine) => {
    if (editing) {
      await updateRoutine(routine)
      setEditing(null)
    } else {
      await addRoutine(routine)
    }
  }

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('¿Eliminar esta rutina?')
    if (confirmed) {
      void removeRoutine(id)
      if (editing?.id === id) {
        setEditing(null)
      }
    }
  }

  const sortedRoutines = useMemo(() => routines, [routines])

  const canBuild = exercises.length > 0

  return (
    <div className="space-y-6">
      {exercisesLoading ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Cargando ejercicios...
        </div>
      ) : !canBuild ? (
        <EmptyState
          title="Primero crea ejercicios"
          description="Necesitas ejercicios guardados para armar una rutina."
          actionLabel="Ir a ejercicios"
        />
      ) : (
        <RoutineBuilder
          exercises={exercises}
          routine={editing}
          onSave={handleSave}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Cargando rutinas...
        </div>
      ) : sortedRoutines.length === 0 ? (
        <EmptyState
          title="Sin rutinas guardadas"
          description="Combina ejercicios y descansos con duraciones precisas."
          actionLabel="Nueva rutina"
        />
      ) : (
        <RoutineList
          routines={sortedRoutines}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
