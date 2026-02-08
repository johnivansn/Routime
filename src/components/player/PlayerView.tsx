import { useEffect, useMemo, useState } from 'react'
import { useRoutines } from '@/hooks/useRoutines'
import { usePlayer } from '@/hooks/usePlayer'
import { Button } from '@/components/shared/Button'
import { formatTime } from '@/utils/formatTime'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Routine } from '@/types'

export function PlayerView() {
  const { routines, loading } = useRoutines()
  const [selectedId, setSelectedId] = useState<string>('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceVolume, setVoiceVolume] = useState(0.9)
  const [soundVolume, setSoundVolume] = useState(0.18)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedVoice = window.localStorage.getItem('routime:voiceVolume')
    const storedSound = window.localStorage.getItem('routime:soundVolume')
    const storedVoiceEnabled = window.localStorage.getItem('routime:voiceEnabled')
    const storedSoundEnabled = window.localStorage.getItem('routime:soundEnabled')
    if (storedVoice) {
      const value = Number(storedVoice)
      if (!Number.isNaN(value)) {
        setVoiceVolume(Math.min(Math.max(value, 0), 1))
      }
    }
    if (storedSound) {
      const value = Number(storedSound)
      if (!Number.isNaN(value)) {
        setSoundVolume(Math.min(Math.max(value, 0), 0.6))
      }
    }
    if (storedVoiceEnabled) {
      setVoiceEnabled(storedVoiceEnabled === 'true')
    }
    if (storedSoundEnabled) {
      setSoundEnabled(storedSoundEnabled === 'true')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:voiceVolume', String(voiceVolume))
  }, [voiceVolume])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:soundVolume', String(soundVolume))
  }, [soundVolume])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:voiceEnabled', String(voiceEnabled))
  }, [voiceEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:soundEnabled', String(soundEnabled))
  }, [soundEnabled])

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedId) ?? null,
    [routines, selectedId]
  )

  const {
    state,
    currentInterval,
    currentExercise,
    timeRemaining,
    progress,
    videoUrl,
    play,
    pause,
    resume,
    stop,
    skip,
  } = usePlayer(selectedRoutine, { voiceEnabled, soundEnabled, voiceVolume, soundVolume })

  const handleReset = () => {
    setVoiceEnabled(true)
    setSoundEnabled(true)
    setVoiceVolume(0.9)
    setSoundVolume(0.18)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('routime:voiceEnabled')
      window.localStorage.removeItem('routime:soundEnabled')
      window.localStorage.removeItem('routime:voiceVolume')
      window.localStorage.removeItem('routime:soundVolume')
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
        Cargando rutinas...
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <EmptyState
        title="Sin rutinas disponibles"
        description="Crea una rutina para comenzar a entrenar."
        actionLabel="Ir a rutinas"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm text-ink-200">Selecciona una rutina</label>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
        >
          <option value="">Elige una rutina...</option>
          {routines.map((routine: Routine) => (
            <option key={routine.id} value={routine.id}>
              {routine.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedRoutine ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Selecciona una rutina para comenzar.
        </div>
      ) : (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Intervalo actual</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink-50">
                {currentInterval?.type === 'REST'
                  ? 'Descanso'
                  : currentExercise?.name ?? 'Ejercicio'}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Tiempo restante</p>
              <div className="mt-2 font-display text-5xl text-ink-50">
                {formatTime(Math.max(0, Math.ceil(timeRemaining)))}
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-900/80">
            <div
              className="h-full bg-accent-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="aspect-video overflow-hidden rounded-2xl bg-ink-900">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="h-full w-full object-cover"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-500">
                  Sin video (descanso)
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3 md:col-span-2">
              <Button
                onClick={play}
                disabled={state === 'PLAYING' || !currentInterval}
                className="w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                Iniciar
              </Button>
              <Button
                onClick={state === 'PAUSED' ? resume : pause}
                variant="ghost"
                disabled={state === 'IDLE' || state === 'COMPLETED'}
                className="w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === 'PAUSED' ? 'Reanudar' : 'Pausar'}
              </Button>
              <Button onClick={skip} variant="ghost" className="w-full">
                Siguiente
              </Button>
              <Button onClick={stop} variant="ghost" className="w-full">
                Detener
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 text-sm text-ink-300 md:grid-cols-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(event) => setVoiceEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-ink-500 bg-ink-900 text-accent-500"
          />
          Voz activa
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-ink-500 bg-ink-900 text-accent-500"
          />
          Sonidos de cuenta regresiva
        </label>
        <span className="text-xs text-ink-500">Sonido en 3-2-1 y tono final.</span>
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Volumen voz
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={voiceVolume}
            onChange={(event) => setVoiceVolume(Number(event.target.value))}
            className="w-full accent-accent-500"
          />
        </label>
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Volumen sonidos
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={soundVolume}
            onChange={(event) => setSoundVolume(Number(event.target.value))}
            className="w-full accent-ember-500"
          />
        </label>
        <div className="flex items-end">
          <Button onClick={handleReset} variant="ghost" className="w-full text-xs">
            Resetear ajustes
          </Button>
        </div>
      </div>
    </div>
  )
}
