import { PlayerView } from '@/components/player/PlayerView'
import { ExerciseList } from '@/components/exercises/ExerciseList'
import { RoutineManager } from '@/components/routines/RoutineManager'

function App() {
  return (
    <div className="min-h-screen bg-ink-900 text-ink-50">
      <div className="relative overflow-hidden bg-hero-radial">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <header className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-accent-500 shadow-glow" />
              <span className="text-xs uppercase tracking-[0.3em] text-ink-300">
                Workout Timer
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold md:text-display">
                Rutinas precisas, voz clara y foco total.
              </h1>
              <p className="max-w-2xl text-base text-ink-200 md:text-lg">
                Crea ejercicios con video, arma intervalos y ejecuta rutinas sin mirar la
                pantalla.
              </p>
            </div>
          </header>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-6 pb-16 pt-8">
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink-100">Player</h2>
          <PlayerView />
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink-100">Ejercicios</h2>
            <ExerciseList />
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink-100">Rutinas</h2>
            <RoutineManager />
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
