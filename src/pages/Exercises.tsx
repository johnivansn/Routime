import { ExerciseList } from '@/components/exercises/ExerciseList'

export function Exercises() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-create flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Biblioteca</p>
          <h1 className="page-title">Ejercicios</h1>
          <p className="mt-2 text-sm text-ink-300">
            Crea, organiza y administra tus ejercicios con video opcional.
          </p>
        </div>
      </div>

      <ExerciseList />
    </div>
  )
}
