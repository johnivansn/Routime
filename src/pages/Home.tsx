import { Link } from 'react-router-dom'
import { Button } from '@/components/shared/Button'

export function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-home rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div className="section-stack">
            <p className="page-kicker">Inicio</p>
            <h1 className="page-title-xl">Routime</h1>
            <p className="text-base text-ink-200">
              Diseña sesiones con intención, ejecútalas con foco y mide el ritmo en tiempo real.
            </p>
          </div>
          <div className="surface-panel panel-block p-5 sm:p-6">
            <p className="page-kicker">Estado rápido</p>
            <div className="mt-4 grid gap-3 text-sm text-ink-200">
              <div className="metric-chip">
                Rutinas listas para ejecutar y editar.
              </div>
              <div className="metric-chip">
                Control de intervalos, pausas y sonido desde un solo lugar.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/crear">
          <div className="group surface-card flex min-h-[200px] flex-col justify-between p-5 transition hover:border-accent-500 sm:min-h-[240px] sm:p-6">
            <div>
              <div className="page-kicker">Rutinas</div>
              <h2 className="mt-3 panel-title">Biblioteca</h2>
              <p className="mt-2 text-sm text-ink-300">
                Crea, edita y organiza rutinas con intervalos precisos.
              </p>
            </div>
            <div className="mt-4">
              <Button>Ir a rutinas</Button>
            </div>
          </div>
        </Link>
        <Link to="/ejercicios">
          <div className="group surface-card flex min-h-[200px] flex-col justify-between p-5 transition hover:border-accent-500 sm:min-h-[240px] sm:p-6">
            <div>
              <div className="page-kicker">Ejercicios</div>
              <h2 className="mt-3 panel-title">Biblioteca</h2>
              <p className="mt-2 text-sm text-ink-300">
                Crea y administra ejercicios con video opcional.
              </p>
            </div>
            <div className="mt-4">
              <Button>Ir a ejercicios</Button>
            </div>
          </div>
        </Link>
        <Link to="/empezar">
          <div className="group surface-card flex min-h-[200px] flex-col justify-between p-5 transition hover:border-accent-500 sm:min-h-[240px] sm:p-6">
            <div>
              <div className="page-kicker">Ejecutar</div>
              <h2 className="mt-3 panel-title">Empezar sesión</h2>
              <p className="mt-2 text-sm text-ink-300">
                Selecciona una rutina, elige el modo visual y empieza a entrenar.
              </p>
            </div>
            <div className="mt-4">
              <Button>Ir a empezar</Button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
