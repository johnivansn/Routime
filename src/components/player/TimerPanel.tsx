import { useMemo, useRef, useState } from 'react'
import { TimerEngine } from '@/services/TimerEngine'
import { SoundService } from '@/services/SoundService'
import { Button } from '@/components/shared/Button'
import { formatTime } from '@/utils/formatTime'

type PlayerState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function TimerPanel() {
  const [label, setLabel] = useState('Sentadillas')
  const [durationInput, setDurationInput] = useState(30)
  const [remaining, setRemaining] = useState(30)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState(0.18)
  const [soundPreset, setSoundPreset] = useState('punch')

  const timerRef = useRef<TimerEngine | null>(null)
  const soundRef = useRef(new SoundService())
  const lastBeepSecondRef = useRef<number | null>(null)
  const soundTestTimeoutRef = useRef<number | null>(null)

  const displaySeconds = useMemo(() => Math.max(0, Math.ceil(remaining)), [remaining])
  const isEndingSoon = displaySeconds > 0 && displaySeconds <= 5

  const resetDefaults = () => {
    setSoundEnabled(true)
    setSoundVolume(0.18)
    setSoundPreset('punch')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('routime:soundEnabled')
      window.localStorage.removeItem('routime:soundVolume')
      window.localStorage.removeItem('routime:soundPreset')
    }
  }

  const stopTimer = () => {
    timerRef.current?.stop()
    timerRef.current = null
    setState('IDLE')
    setRemaining(durationInput)
    lastBeepSecondRef.current = null
  }

  const startTimer = async () => {
    const durationSeconds = clamp(durationInput, 1, 600)
    setRemaining(durationSeconds)
    setState('PLAYING')
    lastBeepSecondRef.current = null

    if (soundEnabled) {
      await soundRef.current.unlock()
      const volume = Math.min(Math.max(soundVolume, 0), 1)
      if (soundPreset === 'alarm') {
        void soundRef.current.beepPattern([
          { frequency: 880, durationMs: 140, volume, type: 'sawtooth' },
          { frequency: 660, durationMs: 140, volume, type: 'sawtooth' },
        ])
      } else if (soundPreset === 'metal') {
        void soundRef.current.beep({
          frequency: 700,
          durationMs: 220,
          volume,
          type: 'triangle',
        })
      } else if (soundPreset === 'soft') {
        void soundRef.current.beep({
          frequency: 600,
          durationMs: 200,
          volume,
          type: 'sine',
        })
      } else {
        void soundRef.current.beep({
          frequency: 720,
          durationMs: 180,
          volume,
          type: 'square',
        })
      }
    }

    timerRef.current = new TimerEngine(
      durationSeconds,
      (remainingSeconds) => {
        setRemaining(remainingSeconds)

        const currentSecond = Math.max(0, Math.ceil(remainingSeconds))
        if (soundEnabled && currentSecond <= 3 && currentSecond > 0) {
          if (lastBeepSecondRef.current !== currentSecond) {
            lastBeepSecondRef.current = currentSecond
            const volume = Math.min(Math.max(soundVolume, 0), 1)
            if (soundPreset === 'alarm') {
              soundRef.current.beepPattern([
                { frequency: 900 + currentSecond * 20, durationMs: 120, volume, type: 'sawtooth' },
                { frequency: 700 + currentSecond * 20, durationMs: 120, volume, type: 'sawtooth' },
              ])
            } else if (soundPreset === 'metal') {
              soundRef.current.beep({
                frequency: 760,
                durationMs: 140,
                volume,
                type: 'triangle',
              })
            } else if (soundPreset === 'soft') {
              soundRef.current.beep({
                frequency: 660,
                durationMs: 140,
                volume,
                type: 'sine',
              })
            } else {
              soundRef.current.beep({
                frequency: 900 + currentSecond * 40,
                durationMs: 120,
                volume,
                type: 'square',
              })
            }
          }
        }
      },
      () => {
        setRemaining(0)
        setState('COMPLETED')
        if (soundEnabled) {
          const volume = Math.min(soundVolume + 0.08, 1)
          if (soundPreset === 'alarm') {
            soundRef.current.beepPattern([
              { frequency: 900, durationMs: 180, volume, type: 'sawtooth' },
              { frequency: 720, durationMs: 180, volume, type: 'sawtooth' },
              { frequency: 900, durationMs: 180, volume, type: 'sawtooth' },
            ])
          } else if (soundPreset === 'metal') {
            soundRef.current.beep({
              frequency: 560,
              durationMs: 420,
              volume,
              type: 'triangle',
            })
          } else if (soundPreset === 'soft') {
            soundRef.current.beep({
              frequency: 520,
              durationMs: 420,
              volume,
              type: 'sine',
            })
          } else {
            soundRef.current.beep({
              frequency: 520,
              durationMs: 420,
              volume,
              type: 'square',
            })
          }
        }
      }
    )

    timerRef.current.start()
  }

  const pauseTimer = () => {
    timerRef.current?.pause()
    setState('PAUSED')
  }

  const resumeTimer = () => {
    timerRef.current?.resume()
    setState('PLAYING')
  }

  return (
    <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Intervalo actual</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink-50">{label || 'Sin nombre'}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Tiempo restante</p>
          <div className={`mt-2 font-display text-5xl ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
            {formatTime(displaySeconds)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-ink-200">
          Nombre del ejercicio
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
            placeholder="Ej. Burpees"
          />
        </label>

        <label className="space-y-2 text-sm text-ink-200">
          Duración (segundos)
          <input
            type="number"
            min={1}
            max={600}
            value={durationInput}
            onChange={(event) => setDurationInput(Number(event.target.value))}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
          />
        </label>

        <div className="flex items-end gap-3">
          <Button
            onClick={startTimer}
            disabled={state === 'PLAYING'}
            className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            Iniciar
          </Button>
          <Button
            onClick={state === 'PAUSED' ? resumeTimer : pauseTimer}
            variant="ghost"
            disabled={state === 'IDLE' || state === 'COMPLETED'}
            className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === 'PAUSED' ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button onClick={stopTimer} variant="ghost" className="w-full">
            Detener
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-ink-300 md:grid-cols-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-ink-500 bg-ink-900 text-accent-500"
          />
          Sonidos de cuenta regresiva
        </label>
        <span className="text-xs text-ink-500">
          Sonido en inicio, 3-2-1 y tono final.
        </span>
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Volumen sonidos
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={soundVolume}
            onChange={(event) => {
              const value = Number(event.target.value)
              setSoundVolume(value)
              if (soundEnabled) {
                if (soundTestTimeoutRef.current) {
                  window.clearTimeout(soundTestTimeoutRef.current)
                }
                const timeoutId = window.setTimeout(() => {
                  const volume = Math.min(Math.max(value, 0), 1.5)
                  if (soundPreset === 'alarm') {
                    void soundRef.current.beepPattern([
                      { frequency: 880, durationMs: 160, volume, type: 'sawtooth' },
                      { frequency: 660, durationMs: 160, volume, type: 'sawtooth' },
                    ])
                  } else if (soundPreset === 'metal') {
                    void soundRef.current.beep({
                      frequency: 640,
                      durationMs: 220,
                      volume,
                      type: 'triangle',
                    })
                  } else if (soundPreset === 'soft') {
                    void soundRef.current.beep({
                      frequency: 600,
                      durationMs: 200,
                      volume,
                      type: 'sine',
                    })
                  } else {
                    void soundRef.current.beep({
                      frequency: 760,
                      durationMs: 160,
                      volume,
                      type: 'square',
                    })
                  }
                }, 200)
                soundTestTimeoutRef.current = timeoutId
              }
            }}
            className="w-full accent-ember-500"
          />
        </label>
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Preset de sonido
          <select
            value={soundPreset}
            onChange={(event) => setSoundPreset(event.target.value)}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-2 text-ink-50 outline-none focus:border-accent-500"
          >
            <option value="punch">Punch</option>
            <option value="alarm">Alarma</option>
            <option value="metal">Metálico</option>
            <option value="soft">Suave</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button onClick={resetDefaults} variant="ghost" className="w-full text-xs">
            Resetear ajustes
          </Button>
        </div>
      </div>
    </div>
  )
}
