import { EmptyState } from '@/components/shared/EmptyState'

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
                pantalla. Esto es la base del MVP y empezaremos con los módulos clave.
              </p>
            </div>
          </header>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 pt-8 md:grid-cols-3">
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink-100">Ejercicios</h2>
          <EmptyState
            title="Sin ejercicios cargados"
            description="Crea tu primer ejercicio con nombre y video para empezar a construir rutinas."
            actionLabel="Nuevo ejercicio"
          />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink-100">Rutinas</h2>
          <EmptyState
            title="Sin rutinas guardadas"
            description="Combina ejercicios y descansos con duraciones precisas."
            actionLabel="Nueva rutina"
          />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink-100">Player</h2>
          <EmptyState
            title="Selecciona una rutina"
            description="Cuando una rutina esté lista, podrás ejecutarla aquí con voz y temporizador."
            actionLabel="Ir a rutinas"
          />
        </section>
      </main>
    </div>
  )
}

export default App
