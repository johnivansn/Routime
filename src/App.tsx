import { useEffect, useState } from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { SyncButton } from '@/components/shared/SyncButton'
import { Home } from '@/pages/Home'
import { CreateRoutine } from '@/pages/CreateRoutine'
import { StartRoutine } from '@/pages/StartRoutine'
import { EditRoutine } from '@/pages/EditRoutine'
import { Exercises } from '@/pages/Exercises'
import { NewExercise } from '@/pages/NewExercise'
import { EditExercise } from '@/pages/EditExercise'
import { NewRoutine } from '@/pages/NewRoutine'

function App() {
  const [theme, setTheme] = useState<'night' | 'day'>(() => {
    if (typeof window === 'undefined') return 'night'
    const stored = window.localStorage.getItem('routime:theme')
    if (stored === 'day' || stored === 'night') return stored
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('routime:theme', theme)
    }
  }, [theme])

  return (
    <div
      className={`min-h-screen text-ink-50 ${
        theme === 'day'
          ? 'bg-[radial-gradient(900px_circle_at_15%_15%,rgba(13,148,136,0.32),transparent_55%),radial-gradient(900px_circle_at_85%_0%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(900px_circle_at_85%_10%,rgba(234,88,12,0.2),transparent_45%),linear-gradient(135deg,#e9eff6,rgba(226,233,241,0.96),#d6dfe9)]'
          : 'bg-ink-900 bg-hero-radial'
      }`}
    >
      <header className="sticky top-0 z-40 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-panel-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-card-bg)] text-ink-50 shadow-sm">
              <span className="font-display text-lg">R</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-400">Routime</p>
              <p className="font-display text-base text-ink-50">Entrena con ritmo</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-card-bg)]/80 p-1 text-xs font-semibold sm:text-sm">
            {[
              { to: '/', label: 'Inicio' },
              { to: '/crear', label: 'Rutinas' },
              { to: '/ejercicios', label: 'Ejercicios' },
              { to: '/empezar', label: 'Empezar' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-accent-500 text-ink-900 shadow-sm'
                      : 'text-ink-200 hover:text-ink-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SyncButton />
            <button
              type="button"
              onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
              aria-label={theme === 'day' ? 'Activar modo nocturno' : 'Activar modo diurno'}
              title={theme === 'day' ? 'Modo nocturno' : 'Modo diurno'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-panel-bg)] text-[color:var(--ink-50)] shadow-sm backdrop-blur transition hover:border-accent-400 hover:text-[color:var(--accent-400)] sm:h-12 sm:w-12"
            >
              {theme === 'day' ? (
                <Moon className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <Sun className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </button>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CreateRoutine />} />
        <Route path="/crear/nueva" element={<NewRoutine />} />
        <Route path="/ejercicios" element={<Exercises />} />
        <Route path="/ejercicios/nuevo" element={<NewExercise />} />
        <Route path="/ejercicios/editar/:id" element={<EditExercise />} />
        <Route path="/empezar" element={<StartRoutine />} />
        <Route path="/editar/:id" element={<EditRoutine />} />
      </Routes>
    </div>
  )
}

export default App
