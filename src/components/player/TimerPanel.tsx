import { useEffect, useMemo, useRef, useState } from 'react'
import { TimerEngine } from '@/services/TimerEngine'
import { VoiceService } from '@/services/VoiceService'
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
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceVolume, setVoiceVolume] = useState(0.9)
  const [soundVolume, setSoundVolume] = useState(0.18)

  const resetDefaults = () => {
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

  const timerRef = useRef<TimerEngine | null>(null)
  const voiceRef = useRef(new VoiceService())
  const soundRef = useRef(new SoundService())
  const lastBeepSecondRef = useRef<number | null>(null)

  const displaySeconds = useMemo(() => Math.max(0, Math.ceil(remaining)), [remaining])
  const isEndingSoon = displaySeconds > 0 && displaySeconds <= 5

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
    }

    if (voiceEnabled) {
      voiceRef.current.speak(label, 'es-ES', voiceVolume)
    }

    timerRef.current = new TimerEngine(
      durationSeconds,
      (remainingSeconds) => {
        setRemaining(remainingSeconds)

        const currentSecond = Math.max(0, Math.ceil(remainingSeconds))
        if (soundEnabled && currentSecond <= 3 && currentSecond > 0) {
          if (lastBeepSecondRef.current !== currentSecond) {
            lastBeepSecondRef.current = currentSecond
            soundRef.current.beep({
              frequency: 900 + currentSecond * 40,
              durationMs: 120,
              volume: soundVolume,
              type: 'sine',
            })
          }
        }
      },
      () => {
        setRemaining(0)
        setState('COMPLETED')
        if (soundEnabled) {
          soundRef.current.beep({
            frequency: 520,
            durationMs: 420,
            volume: Math.min(soundVolume + 0.04, 0.6),
            type: 'triangle',
          })
        }
        if (voiceEnabled) {
          voiceRef.current.speak('Tiempo', 'es-ES', voiceVolume)
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
        <span className="text-xs text-ink-500">
          Sonido en 3-2-1 y tono final.
        </span>
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
          <Button
            onClick={resetDefaults}
            variant="ghost"
            className="w-full text-xs"
          >
            Resetear ajustes
          </Button>
        </div>
      </div>
    </div>
  )
}
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
