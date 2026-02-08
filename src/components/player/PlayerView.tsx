import { useEffect, useMemo, useRef, useState } from 'react'
import { useRoutines } from '@/hooks/useRoutines'
import { usePlayer } from '@/hooks/usePlayer'
import { Button } from '@/components/shared/Button'
import { formatTime } from '@/utils/formatTime'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Routine } from '@/types'
import { VoiceService } from '@/services/VoiceService'
import { SoundService } from '@/services/SoundService'

export function PlayerView() {
  const { routines, loading } = useRoutines()
  const [selectedId, setSelectedId] = useState<string>('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceVolume, setVoiceVolume] = useState(1)
  const [soundVolume, setSoundVolume] = useState(0.18)
  const [stageMode, setStageMode] = useState(false)
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const voiceTestTimeoutRef = useRef<number | null>(null)
  const soundTestTimeoutRef = useRef<number | null>(null)
  const soundTestRef = useRef(new SoundService())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedVoice = window.localStorage.getItem('routime:voiceVolume')
    const storedSound = window.localStorage.getItem('routime:soundVolume')
    const storedVoiceEnabled = window.localStorage.getItem('routime:voiceEnabled')
    const storedSoundEnabled = window.localStorage.getItem('routime:soundEnabled')
    const storedVoiceName = window.localStorage.getItem('routime:voiceName')
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
    if (storedVoiceName) {
      setVoiceName(storedVoiceName)
    }
  }, [])

  useEffect(() => {
    if (voiceEnabled && !VoiceService.isSupported()) {
      setVoiceEnabled(false)
    }
  }, [voiceEnabled])

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (voiceName) {
      window.localStorage.setItem('routime:voiceName', voiceName)
    }
  }, [voiceName])

  useEffect(() => {
    if (!VoiceService.isSupported()) {
      return
    }
    const updateVoices = () => {
      setVoices(VoiceService.getVoices())
    }
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedId) ?? null,
    [routines, selectedId]
  )

  const routineStats = useMemo(() => {
    if (!selectedRoutine) {
      return { totalSeconds: 0, exerciseCount: 0, restCount: 0 }
    }
    return selectedRoutine.intervals.reduce(
      (acc, interval) => {
        acc.totalSeconds += interval.duration
        if (interval.type === 'REST') {
          acc.restCount += 1
        } else {
          acc.exerciseCount += 1
        }
        return acc
      },
      { totalSeconds: 0, exerciseCount: 0, restCount: 0 }
    )
  }, [selectedRoutine])

  const {
    state,
    currentInterval,
    currentExercise,
    timeRemaining,
    progress,
    videoUrl,
    currentIndex,
    totalIntervals,
    play,
    pause,
    resume,
    stop,
    skip,
  } = usePlayer(selectedRoutine, {
    voiceEnabled,
    soundEnabled,
    voiceVolume,
    soundVolume,
    voiceName,
  })

  const displaySeconds = Math.max(0, Math.ceil(timeRemaining))
  const isEndingSoon = displaySeconds > 0 && displaySeconds <= 5

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      if (isEditable) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (!currentInterval) return
        if (state === 'PLAYING') {
          pause()
        } else if (state === 'PAUSED') {
          resume()
        } else {
          play()
        }
      }

      if (event.code === 'Escape') {
        event.preventDefault()
        stop()
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault()
        skip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentInterval, pause, play, resume, skip, state, stop])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state === 'PLAYING') {
        pause()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [pause, state])

  const handleReset = () => {
    setVoiceEnabled(true)
    setSoundEnabled(true)
    setVoiceVolume(1)
    setSoundVolume(0.18)
    setVoiceName(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('routime:voiceEnabled')
      window.localStorage.removeItem('routime:soundEnabled')
      window.localStorage.removeItem('routime:voiceVolume')
      window.localStorage.removeItem('routime:soundVolume')
      window.localStorage.removeItem('routime:voiceName')
    }
  }

  const handleStop = () => {
    if (state === 'PLAYING' || state === 'PAUSED') {
      const confirmed = window.confirm('¿Detener la rutina actual?')
      if (!confirmed) return
    }
    stop()
  }

  const canStage = Boolean(selectedRoutine)
  const isPlayingState = state === 'PLAYING' || state === 'PAUSED'

  useEffect(() => {
    if (isPlayingState && selectedRoutine) {
      setStageMode(true)
    }
  }, [isPlayingState, selectedRoutine])

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
      {stageMode && selectedRoutine && (
        <div className="fixed inset-0 z-50 bg-ink-900/95 backdrop-blur">
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Modo ejecución</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink-50">
                  {selectedRoutine.name}
                </h2>
              </div>
              <Button variant="ghost" onClick={() => setStageMode(false)}>
                Salir
              </Button>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Intervalo actual</p>
                  <h3 className="font-display text-3xl font-semibold text-ink-50">
                    {currentInterval?.type === 'REST'
                      ? currentInterval?.label ?? 'Descanso'
                      : currentExercise?.name ?? 'Ejercicio'}
                  </h3>
                  {currentInterval?.label && currentInterval.type === 'EXERCISE' && (
                    <p className="text-sm text-ink-300">{currentInterval.label}</p>
                  )}
                  <p className="text-sm text-ink-400">
                    Intervalo {Math.min(currentIndex + 1, totalIntervals)} de {totalIntervals}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Tiempo restante</p>
                  <div className={`mt-2 font-display text-timer ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                    {formatTime(displaySeconds)}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="aspect-video overflow-hidden rounded-3xl bg-ink-950">
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
                    <div className="flex h-full items-center justify-center text-sm text-ink-500">
                      Sin video (descanso)
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <Button
                    onClick={play}
                    disabled={state === 'PLAYING' || !currentInterval}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state === 'COMPLETED' ? 'Reiniciar' : 'Iniciar'}
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
                  <Button onClick={handleStop} variant="ghost" className="w-full">
                    Detener
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {voiceEnabled && !VoiceService.isSupported() && (
        <div className="rounded-2xl border border-ember-500/60 bg-ember-500/10 px-4 py-3 text-sm text-ember-200">
          Tu navegador no soporta Web Speech API. La voz se desactivará automáticamente.
        </div>
      )}
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
                  ? currentInterval?.label ?? 'Descanso'
                  : currentExercise?.name ?? 'Ejercicio'}
              </h3>
              {currentInterval?.label && currentInterval.type === 'EXERCISE' && (
                <p className="mt-1 text-sm text-ink-300">{currentInterval.label}</p>
              )}
              <p className="mt-1 text-xs text-ink-400">
                Intervalo {Math.min(currentIndex + 1, totalIntervals)} de {totalIntervals}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Tiempo restante</p>
              <div
                className={`mt-2 font-display text-5xl ${
                  isEndingSoon ? 'text-ember-500' : 'text-ink-50'
                }`}
              >
                {formatTime(displaySeconds)}
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-900/80">
            <div
              className="h-full bg-accent-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {state === 'COMPLETED' && (
            <div className="mt-4 rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-sm text-ink-200">
              Rutina completada.
            </div>
          )}

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
                {state === 'COMPLETED' ? 'Reiniciar' : 'Iniciar'}
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
              <Button onClick={handleStop} variant="ghost" className="w-full">
                Detener
              </Button>
              <Button
                onClick={() => setStageMode(true)}
                variant="ghost"
                className="w-full"
                disabled={!canStage}
              >
                Modo ejecución
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
        <span className="text-xs text-ink-500">
          Atajos: Espacio (Play/Pausa), → (Siguiente), Esc (Detener).
        </span>
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Volumen voz
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={voiceVolume}
            onChange={(event) => {
              const value = Number(event.target.value)
              setVoiceVolume(value)
              if (voiceEnabled && VoiceService.isSupported()) {
                if (voiceTestTimeoutRef.current) {
                  window.clearTimeout(voiceTestTimeoutRef.current)
                }
                const timeoutId = window.setTimeout(() => {
                  const utterance = new SpeechSynthesisUtterance('Prueba de volumen')
                  utterance.lang = 'es-ES'
                  utterance.volume = Math.min(Math.max(value, 0), 1)
                  if (voiceName) {
                    const picked = VoiceService.findVoiceByName(voiceName)
                    if (picked) {
                      utterance.voice = picked
                    }
                  }
                  window.speechSynthesis.cancel()
                  window.speechSynthesis.speak(utterance)
                }, 200)
                voiceTestTimeoutRef.current = timeoutId
              }
            }}
            className="w-full accent-accent-500"
          />
        </label>
        {VoiceService.isSupported() && voices.length > 0 && (
          <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
            Voz del sistema
            <select
              value={voiceName ?? ''}
              onChange={(event) => setVoiceName(event.target.value || null)}
              className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-2 text-ink-50 outline-none focus:border-accent-500"
            >
              <option value="">Automática</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-2 text-xs text-ink-300 md:col-span-1">
          Volumen sonidos
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={soundVolume}
            onChange={(event) => {
              const value = Number(event.target.value)
              setSoundVolume(value)
              if (soundEnabled) {
                if (soundTestTimeoutRef.current) {
                  window.clearTimeout(soundTestTimeoutRef.current)
                }
                const timeoutId = window.setTimeout(() => {
                  void soundTestRef.current.beep({
                    frequency: 720,
                    durationMs: 160,
                    volume: Math.min(Math.max(value, 0), 0.6),
                    type: 'sine',
                  })
                }, 200)
                soundTestTimeoutRef.current = timeoutId
              }
            }}
            className="w-full accent-ember-500"
          />
        </label>
        <div className="flex items-end">
          <Button onClick={handleReset} variant="ghost" className="w-full text-xs">
            Resetear ajustes
          </Button>
        </div>
      </div>

      {selectedRoutine && state === 'COMPLETED' && (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Resumen</p>
          <h4 className="mt-2 font-display text-xl font-semibold text-ink-50">
            {selectedRoutine.name}
          </h4>
          <div className="mt-3 grid gap-3 text-sm text-ink-200 md:grid-cols-3">
            <div className="rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3">
              <p className="text-xs text-ink-400">Duración total</p>
              <p className="mt-1 font-display text-lg">{formatTime(routineStats.totalSeconds)}</p>
            </div>
            <div className="rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3">
              <p className="text-xs text-ink-400">Ejercicios</p>
              <p className="mt-1 font-display text-lg">{routineStats.exerciseCount}</p>
            </div>
            <div className="rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3">
              <p className="text-xs text-ink-400">Descansos</p>
              <p className="mt-1 font-display text-lg">{routineStats.restCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
