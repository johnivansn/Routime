import { PlayerView } from '@/components/player/PlayerView'

export function StartRoutine() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-start flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Sesión</p>
          <h1 className="page-title">Empezar</h1>
          <p className="mt-2 text-sm text-ink-300">
            Selecciona una rutina y controla el ritmo en tiempo real.
          </p>
        </div>
      </div>

      <PlayerView />
    </div>
  )
}
