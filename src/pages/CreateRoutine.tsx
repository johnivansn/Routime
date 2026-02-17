import { RoutineManager } from '@/components/routines/RoutineManager'

export function CreateRoutine() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-create flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Biblioteca</p>
          <h1 className="page-title">Rutinas</h1>
          <p className="mt-2 text-sm text-ink-300">
            Define intervalos, descansos y ordena la sesión completa.
          </p>
        </div>
      </div>

      <RoutineManager />
    </div>
  )
}
