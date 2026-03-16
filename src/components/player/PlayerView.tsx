import { useEffect, useMemo, useRef, useState } from 'react'
import { useRoutines } from '@/hooks/useRoutines'
import { usePlayer } from '@/hooks/usePlayer'
import { Button } from '@/components/shared/Button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatTime } from '@/utils/formatTime'
import { EmptyState } from '@/components/shared/EmptyState'
import { Dropdown } from '@/components/shared/Dropdown'
import type { Routine } from '@/types'
import { SoundService } from '@/services/SoundService'
import { ArrowRightLeft, Clock, Dumbbell, LayoutGrid, LayoutPanelTop, Pause, Play, SkipBack, SkipForward, Square, X } from 'lucide-react'
import { db } from '@/repositories/db'
import { expandRoutineIntervals } from '@/utils/routineIntervals'

const resolveProxyBaseUrl = () => {
  const raw = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_SYNC_URL || ''
  return raw.replace(/\/$/, '')
}

const normalizeDriveUrl = (url?: string | null) => {
  if (!url) return null
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  try {
    const resolved = new URL(url)
    if (!resolved.hostname.includes('drive.google.com')) {
      return url
    }
    let id = resolved.searchParams.get('id')
    if (!id) {
      const match = resolved.pathname.match(/\/d\/([^/]+)/)
      if (match) id = match[1]
    }
    const baseUrl = resolveProxyBaseUrl()
    if (id && baseUrl) {
      return `${baseUrl}/proxy?id=${encodeURIComponent(id)}`
    }
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
  } catch {
    return url
  }
}

export function PlayerView() {
  const { routines, loading } = useRoutines()
  const [selectedId, setSelectedId] = useState<string>('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState(0.18)
  const [soundPreset, setSoundPreset] = useState<'punch' | 'alarm' | 'metal' | 'soft'>('punch')
  const [stageMode, setStageMode] = useState(false)
  const [confirmStopOpen, setConfirmStopOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'gimnasio' | 'tablero' | 'reloj' | 'flujo'>('gimnasio')
  const [routineMenuOpen, setRoutineMenuOpen] = useState(false)
  const soundTestTimeoutRef = useRef<number | null>(null)
  const soundTestRef = useRef(new SoundService())
  const routineMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedSound = window.localStorage.getItem('routime:soundVolume')
    const storedSoundEnabled = window.localStorage.getItem('routime:soundEnabled')
    const storedSoundPreset = window.localStorage.getItem('routime:soundPreset')
    if (storedSound) {
      const value = Number(storedSound)
      if (!Number.isNaN(value)) {
        setSoundVolume(Math.min(Math.max(value, 0), 1.5))
      }
    }
    if (storedSoundEnabled) {
      setSoundEnabled(storedSoundEnabled === 'true')
    }
    if (
      storedSoundPreset === 'punch' ||
      storedSoundPreset === 'alarm' ||
      storedSoundPreset === 'metal' ||
      storedSoundPreset === 'soft'
    ) {
      setSoundPreset(storedSoundPreset)
    }
    const storedViewMode = window.localStorage.getItem('routime:viewMode')
    if (
      storedViewMode === 'tablero' ||
      storedViewMode === 'reloj' ||
      storedViewMode === 'gimnasio' ||
      storedViewMode === 'flujo'
    ) {
      setViewMode(storedViewMode)
    }
  }, [])

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
    window.localStorage.setItem('routime:soundEnabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:soundPreset', soundPreset)
  }, [soundPreset])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('routime:viewMode', viewMode)
  }, [viewMode])

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedId) ?? null,
    [routines, selectedId]
  )

  const expandedIntervals = useMemo(
    () => expandRoutineIntervals(selectedRoutine),
    [selectedRoutine]
  )

  const routineStats = useMemo(() => {
    if (!selectedRoutine) {
      return { totalSeconds: 0, exerciseCount: 0, restCount: 0 }
    }
    return expandedIntervals.reduce(
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
  }, [expandedIntervals, selectedRoutine])

  const {
    state,
    currentInterval,
    currentExercise,
    timeRemaining,
    progress,
    videoUrl,
    imageUrls,
    imageSlideSeconds,
    currentRound,
    totalRounds,
    currentBlockName,
    currentIndex,
    play,
    pause,
    resume,
    stop,
    skip,
    previous,
  } = usePlayer(selectedRoutine, {
    soundEnabled,
    soundVolume,
    soundPreset,
  })

  const intervalDuration = currentInterval?.duration ?? 0
  const isTimedInterval = intervalDuration > 0
  const displaySeconds = isTimedInterval ? Math.max(0, Math.ceil(timeRemaining)) : 0
  const timeLabel = isTimedInterval ? formatTime(displaySeconds) : '00:00'
  const isEndingSoon = isTimedInterval && displaySeconds > 0 && displaySeconds <= 5
  const [imageIndex, setImageIndex] = useState(0)
  const activeImageUrl = imageUrls.length > 0 ? imageUrls[imageIndex] : null
  const fallbackImageUrl = useMemo(() => {
    const url = currentExercise?.imageUrls?.[0]
    return url ? normalizeDriveUrl(url) : null
  }, [currentExercise])
  const displayImageUrl = activeImageUrl ?? fallbackImageUrl
  const imageKey = imageUrls.join('|')
  const hasMedia = Boolean(videoUrl || displayImageUrl)
  const nextInterval = expandedIntervals[currentIndex + 1]
  const [nextExerciseName, setNextExerciseName] = useState<string | null>(null)
  const [nextIntervalNote, setNextIntervalNote] = useState<string | null>(null)
  const roundText =
    currentRound && totalRounds && totalRounds > 1 ? `Ronda ${currentRound}/${totalRounds}` : null
  const legacySectionText =
    currentInterval?.section === 'WARMUP'
      ? 'Calentamiento'
      : currentInterval?.section === 'COOLDOWN'
        ? 'Enfriamiento'
        : currentInterval?.section === 'WORK'
          ? 'Trabajo'
          : null
  const sectionText = currentBlockName ?? legacySectionText
  const roundBadge = roundText ? (
    <span className="inline-flex items-center rounded-full border border-violet-300/60 bg-violet-400/25 px-3 py-1 text-xs font-semibold text-violet-100 sm:text-sm">
      {roundText}
    </span>
  ) : null

  useEffect(() => {
    setImageIndex(0)
  }, [currentInterval?.id])

  useEffect(() => {
    setImageIndex(0)
  }, [imageKey])

  useEffect(() => {
    let active = true
    const loadNext = async () => {
      if (!nextInterval) {
        setNextExerciseName(null)
        setNextIntervalNote(null)
        return
      }
      if (nextInterval.type === 'REST') {
        setNextExerciseName(nextInterval.label ?? 'Descanso')
        setNextIntervalNote(nextInterval.notes ?? null)
        return
      }
      if (!nextInterval.exerciseId) {
        setNextExerciseName('Ejercicio')
        setNextIntervalNote(nextInterval.notes ?? null)
        return
      }
      const exercise = await db.exercises.get(nextInterval.exerciseId)
      if (!active) return
      setNextExerciseName(exercise?.name ?? 'Ejercicio')
      setNextIntervalNote(nextInterval.notes ?? null)
    }
    void loadNext()
    return () => {
      active = false
    }
  }, [nextInterval])

  useEffect(() => {
    if (!imageUrls || imageUrls.length <= 1) {
      return
    }
    const delay = Math.max(1, imageSlideSeconds) * 1000
    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % imageUrls.length)
    }, delay)
    return () => window.clearInterval(timer)
  }, [imageSlideSeconds, imageUrls])

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

      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        previous()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentInterval, pause, play, previous, resume, skip, state, stop])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state === 'PLAYING') {
        pause()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [pause, state])

  useEffect(() => {
    if (!routineMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!routineMenuRef.current) return
      if (!routineMenuRef.current.contains(event.target as Node)) {
        setRoutineMenuOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRoutineMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [routineMenuOpen])

  const handleReset = () => {
    setSoundEnabled(true)
    setSoundVolume(0.18)
    setSoundPreset('punch')
    setViewMode('gimnasio')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('routime:soundEnabled')
      window.localStorage.removeItem('routime:soundVolume')
      window.localStorage.removeItem('routime:soundPreset')
      window.localStorage.removeItem('routime:viewMode')
    }
  }

  const handleStop = () => {
    if (state === 'PLAYING' || state === 'PAUSED') {
      if (state === 'PLAYING') {
        pause()
      }
      setConfirmStopOpen(true)
      return
    }
    stop()
  }

  const canStage = Boolean(selectedRoutine)
  const isPlayingState = state === 'PLAYING' || state === 'PAUSED'

  const renderMetaChips = (size: 'sm' | 'md' = 'sm') => {
    if (!sectionText && !roundText) return null
    const chipClass =
      size === 'md'
        ? 'rounded-full border px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold shadow-sm'
        : 'rounded-full border px-2.5 py-1 text-[10px]'

    const sectionChipClass =
      sectionText === 'Calentamiento'
        ? 'border-amber-300/60 bg-amber-400/20 text-amber-100'
        : sectionText === 'Enfriamiento'
          ? 'border-sky-300/60 bg-sky-400/20 text-sky-100'
          : sectionText === 'Trabajo'
            ? 'border-accent-400/60 bg-accent-500/20 text-accent-100'
            : 'border-ink-600/70 bg-ink-900/80 text-ink-100'

    return (
      <div className="flex flex-wrap items-center gap-2 text-ink-200">
        {sectionText && (
          <span className={`${chipClass} ${sectionChipClass}`}>
            {sectionText}
          </span>
        )}
        {roundText && (
          <span className={`${chipClass} border-violet-300/60 bg-violet-400/20 text-violet-100`}>
            {roundText}
          </span>
        )}
      </div>
    )
  }

  const renderMediaBadge = () => {
    if (!currentExercise) return null
    const imageCount = currentExercise.imageUrls?.length ?? 0
    const hasVideo = Boolean(currentExercise.videoUrl)
    const type =
      currentExercise.mediaType === 'video'
        ? 'Video'
        : currentExercise.mediaType === 'gallery'
          ? `Galería (${imageCount})`
          : currentExercise.mediaType === 'image'
            ? 'Imagen'
            : hasVideo || imageCount > 0
              ? 'Media'
              : null
    if (!type) return null
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/50 px-3 py-1 text-xs text-ink-200">
        {type}
      </span>
    )
  }

  const renderMediaBadgeLarge = () => {
    if (!currentExercise) return null
    const imageCount = currentExercise.imageUrls?.length ?? 0
    const hasVideo = Boolean(currentExercise.videoUrl)
    const type =
      currentExercise.mediaType === 'video'
        ? 'Video'
        : currentExercise.mediaType === 'gallery'
          ? `Galería (${imageCount})`
          : currentExercise.mediaType === 'image'
            ? 'Imagen'
            : hasVideo || imageCount > 0
              ? 'Media'
              : null
    if (!type) return null
    return (
      <span className="inline-flex items-center rounded-full border border-ink-700/60 bg-ink-900/50 px-4 py-2 text-sm font-semibold text-ink-100">
        {type}
      </span>
    )
  }

  const renderMediaFrame = (size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    if (!hasMedia) {
      return (
        <div className="flex h-full items-center justify-center rounded-3xl border border-ink-700/60 bg-ink-900/40 p-6 text-center text-sm text-ink-300">
          Sin media para mostrar
        </div>
      )
    }
    const sizeClass =
      size === 'xl'
        ? 'h-[52vh] min-h-[260px] max-h-[60vh]'
        : size === 'lg'
          ? 'aspect-[16/9] min-h-[220px] max-h-[520px]'
          : size === 'sm'
            ? 'aspect-[4/3] min-h-[180px] max-h-[360px]'
            : 'aspect-[16/10] min-h-[200px] max-h-[440px]'
    return (
      <div className={`media-frame w-full overflow-hidden rounded-3xl ${sizeClass} bg-ink-950`}>
        <div className="flex h-full w-full items-center justify-center">
        {videoUrl ? (
          <video
            src={videoUrl}
            className="max-h-full max-w-full object-contain"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : displayImageUrl ? (
          <img
            src={displayImageUrl}
            className="max-h-full max-w-full object-contain"
            alt={currentExercise?.name ?? 'Imagen de ejercicio'}
          />
        ) : null}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (isPlayingState && selectedRoutine) {
      setStageMode(true)
    }
  }, [isPlayingState, selectedRoutine])

  if (loading) {
    return (
      <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
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

  const renderPreview = () => {
    if (!selectedRoutine) {
      return (
        <div className="surface-panel p-4 text-sm text-ink-300 sm:p-6">
          Selecciona una rutina para comenzar.
        </div>
      )
    }

    if (viewMode === 'reloj') {
      return (
        <div className="surface-card grid gap-4 p-6 sm:gap-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center sm:gap-6">
            {roundText && <p className="text-xs text-ink-400">{roundText}</p>}
          <div
            className={`timer-display text-[clamp(3rem,8vw,6.5rem)] ${
              isEndingSoon ? 'text-ember-500' : 'text-ink-50'
            }`}
          >
            {timeLabel}
          </div>
            <div className="space-y-2">
              <p className="font-display text-2xl text-ink-50">
                {currentInterval?.type === 'REST'
                  ? currentInterval?.label ?? 'Descanso'
                  : currentExercise?.name ?? 'Ejercicio'}
              </p>
              {currentInterval?.notes && (
                <p className="text-sm text-ink-300">{currentInterval.notes}</p>
              )}
              {renderMetaChips()}
              {nextExerciseName && (
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                    Siguiente: {nextExerciseName}
                  </p>
                  {nextIntervalNote && (
                    <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-full">{renderMediaFrame('lg')}</div>
        </div>
      )
    }

    if (viewMode === 'flujo') {
      return (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="form-label">Ahora</p>
              {roundBadge}
            </div>
            <h3 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
              {currentInterval?.type === 'REST'
                ? currentInterval?.label ?? 'Descanso'
                : currentExercise?.name ?? 'Ejercicio'}
            </h3>
            {currentInterval?.notes && <p className="text-sm text-ink-300">{currentInterval.notes}</p>}
            <div className="surface-inset mt-2 rounded-2xl border p-3 sm:p-4">
              {renderMetaChips('md')}
              <div className={`mt-2 timer-display ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                {timeLabel}
              </div>
            </div>
          </div>
          <div className="surface-card flex flex-col justify-between gap-4 p-4 sm:p-6">
            <div>
              <p className="form-label">Siguiente</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-50">
                {nextExerciseName ?? 'Fin de rutina'}
              </p>
              {nextIntervalNote && <p className="mt-2 text-sm text-ink-300">{nextIntervalNote}</p>}
            </div>
            {renderMediaFrame('sm')}
            <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-xs text-ink-300">
              Prepárate: ajusta postura y equipo.
            </div>
          </div>
        </div>
      )
    }

    if (viewMode === 'tablero') {
      return (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] sm:gap-6">
          <div className="surface-card p-4 sm:p-6">
            <p className="form-label">Intervalo actual</p>
            <h3 className="mt-2 font-display text-3xl font-semibold text-ink-50">
              {currentInterval?.type === 'REST'
                ? currentInterval?.label ?? 'Descanso'
                : currentExercise?.name ?? 'Ejercicio'}
            </h3>
            <div className="surface-inset mt-4 rounded-2xl border p-3 sm:p-4">
              {renderMetaChips()}
              <div className={`mt-2 timer-display ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                {timeLabel}
              </div>
              {nextExerciseName && (
                <div className="mt-2 space-y-1">
                  <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                    Siguiente: {nextExerciseName}
                  </p>
                  {nextIntervalNote && (
                    <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="section-stack">
            {renderMediaFrame('md')}
            <div className="progress-track h-3 overflow-hidden rounded-full">
              <div className="h-full bg-accent-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )
    }

    if (hasMedia) {
      return (
        <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr] sm:gap-6">
          <div className="section-stack">
            {renderMediaFrame('lg')}
            <div className="progress-track h-3 overflow-hidden rounded-full">
              <div className="h-full bg-accent-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="surface-card flex flex-col justify-between gap-4 p-4 sm:gap-6 sm:p-6">
            <div className="space-y-3">
              <p className="form-label">Intervalo actual</p>
              <h3 className="font-display text-2xl font-semibold text-ink-50">
                {currentInterval?.type === 'REST'
                  ? currentInterval?.label ?? 'Descanso'
                  : currentExercise?.name ?? 'Ejercicio'}
              </h3>
              {currentInterval?.notes && (
                <p className="text-sm text-ink-300">{currentInterval.notes}</p>
              )}
            </div>
            <div>
              {renderMetaChips()}
              <div className={`mt-2 timer-display ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                {timeLabel}
              </div>
              {nextExerciseName && (
                <div className="mt-2 space-y-1">
                  <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                    Siguiente: {nextExerciseName}
                  </p>
                  {nextIntervalNote && (
                    <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="progress-track h-3 overflow-hidden rounded-full">
          <div className="h-full bg-accent-500" style={{ width: `${progress}%` }} />
        </div>
          <div className="surface-card grid gap-4 p-4 sm:gap-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-2 sm:space-y-3">
            <p className="form-label">Intervalo actual</p>
            <h3 className="font-display text-3xl font-semibold text-ink-50">
              {currentInterval?.type === 'REST'
                ? currentInterval?.label ?? 'Descanso'
                : currentExercise?.name ?? 'Ejercicio'}
            </h3>
            {currentInterval?.notes && (
              <p className="text-sm text-ink-300">{currentInterval.notes}</p>
            )}
          </div>
          <div className="text-right">
            {renderMetaChips()}
            <div className={`mt-2 timer-display ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
              {timeLabel}
            </div>
            {nextExerciseName && (
              <div className="mt-2 space-y-1">
                <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                  Siguiente: {nextExerciseName}
                </p>
                {nextIntervalNote && (
                  <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderViewModeToggle = (size: 'compact' | 'regular' = 'regular') => {
    const isCompact = size === 'compact'
    return (
      <div
        role="tablist"
        aria-label="Modo visual"
        className={`surface-inset inline-flex items-center gap-1 rounded-full border p-1 ${
          isCompact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {[
          { id: 'gimnasio', label: 'Gimnasio', icon: Dumbbell },
          { id: 'flujo', label: 'Flujo', icon: ArrowRightLeft },
          { id: 'tablero', label: 'Tablero', icon: LayoutPanelTop },
          { id: 'reloj', label: 'Reloj', icon: Clock },
        ].map((option) => {
          const isActive = viewMode === option.id
          const Icon = option.icon
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setViewMode(option.id as typeof viewMode)}
              className={`flex items-center gap-2 rounded-full px-3 py-1 font-semibold transition ${
                isCompact ? 'text-[11px] sm:text-sm px-3.5 py-1.5' : 'text-xs sm:text-sm px-4 py-1.5'
              } ${
                isActive
                  ? 'bg-accent-500 text-ink-900 shadow-sm'
                  : 'text-ink-200 hover:text-ink-50'
              }`}
            >
              <Icon className={isCompact ? 'h-4 w-4 sm:h-4.5 sm:w-4.5' : 'h-4 w-4 sm:h-5 sm:w-5'} />
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stageMode && selectedRoutine && (
        <div className="overlay-stage fixed inset-0 z-50 backdrop-blur">
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="form-label">Modo ejecución</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink-50">
                  {selectedRoutine.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {renderViewModeToggle('compact')}
                <Button variant="ghost" onClick={() => setStageMode(false)}>
                  Salir
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-4 sm:gap-6">
                {viewMode === 'reloj' ? (
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                  {renderMediaFrame('xl')}
                  <div className="surface-card flex flex-col items-center justify-center gap-4 p-4 text-center sm:gap-6 sm:p-6">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                    <div
                      className={`timer-display-xl text-[clamp(5rem,12vw,11rem)] ${
                        isEndingSoon ? 'text-ember-500' : 'text-ink-50'
                      }`}
                    >
                      {timeLabel}
                    </div>
                    </div>
                    {roundBadge}
                    {renderMetaChips('md')}
                    <div className="space-y-1 sm:space-y-2">
                      <p className="font-display text-3xl text-ink-50">
                        {currentInterval?.type === 'REST'
                          ? currentInterval?.label ?? 'Descanso'
                          : currentExercise?.name ?? 'Ejercicio'}
                      </p>
                    {currentInterval?.notes && (
                      <p className="text-sm text-ink-300">{currentInterval.notes}</p>
                    )}
                  </div>
                    {nextExerciseName && (
                      <div className="mt-3 space-y-1">
                        <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-base text-ink-200">
                          Siguiente: {nextExerciseName}
                        </p>
                        {nextIntervalNote && (
                          <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                ) : viewMode === 'flujo' ? (
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr_1fr]">
                  <div className="w-full">{renderMediaFrame('xl')}</div>
                    <div className="grid gap-4">
                      <div className="surface-card flex flex-col gap-4 p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="form-label">Ahora</p>
                          {roundBadge}
                        </div>
                        <h3 className="font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
                          {currentInterval?.type === 'REST'
                            ? currentInterval?.label ?? 'Descanso'
                            : currentExercise?.name ?? 'Ejercicio'}
                        </h3>
                        {currentInterval?.notes && <p className="text-sm text-ink-300">{currentInterval.notes}</p>}
                        <div className="surface-inset mt-2 rounded-2xl border p-3 sm:p-4">
                          {renderMetaChips('md')}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <div className={`timer-display-xl ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                              {timeLabel}
                            </div>
                            {renderMediaBadgeLarge()}
                          </div>
                        </div>
                      </div>
                      <div className="surface-card flex flex-col justify-between gap-4 p-4 sm:p-6">
                        <div>
                          <p className="form-label">Siguiente</p>
                          <p className="mt-2 font-display text-2xl font-semibold text-ink-50">
                            {nextExerciseName ?? 'Fin de rutina'}
                          </p>
                          {nextIntervalNote && <p className="mt-2 text-sm text-ink-300">{nextIntervalNote}</p>}
                        </div>
                        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-xs text-ink-300">
                          Prepárate: ajusta postura y equipo.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'tablero' ? (
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] sm:gap-6">
                <div className="surface-card p-4 sm:p-6">
                  <p className="form-label">Intervalo actual</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-ink-50">
                    {currentInterval?.type === 'REST'
                      ? currentInterval?.label ?? 'Descanso'
                      : currentExercise?.name ?? 'Ejercicio'}
                  </h3>
                  {currentInterval?.notes && (
                    <p className="mt-2 text-sm text-ink-300">{currentInterval.notes}</p>
                  )}
                  {renderMediaBadge()}
                  {nextExerciseName && (
                    <div className="mt-2 space-y-1">
                      <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                        Siguiente: {nextExerciseName}
                      </p>
                      {nextIntervalNote && (
                        <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                      )}
                    </div>
                  )}
                  <div className="surface-inset mt-4 rounded-2xl border p-3 sm:p-4">
                  <div className={`mt-2 timer-display-xl ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                    {timeLabel}
                  </div>
                  {roundBadge}
                  {renderMetaChips('md')}
                  {nextExerciseName && (
                    <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                      Siguiente: {nextExerciseName}
                    </p>
                  )}
                  </div>
                </div>
                  {renderMediaFrame('lg')}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <p className="form-label">Intervalo actual</p>
                    <h3 className="font-display text-3xl font-semibold text-ink-50">
                      {currentInterval?.type === 'REST'
                        ? currentInterval?.label ?? 'Descanso'
                        : currentExercise?.name ?? 'Ejercicio'}
                    </h3>
                    {currentInterval?.notes && (
                      <p className="text-sm text-ink-300">{currentInterval.notes}</p>
                    )}
                    {renderMediaBadge()}
            {nextExerciseName && (
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-900/40 px-4 py-1.5 text-sm text-ink-200">
                  Siguiente: {nextExerciseName}
                </p>
                {nextIntervalNote && (
                  <p className="text-xs text-ink-300">{nextIntervalNote}</p>
                )}
              </div>
            )}
                  </div>
                    <div className="text-right">
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
                      <div className={`timer-display-xl ${isEndingSoon ? 'text-ember-500' : 'text-ink-50'}`}>
                        {timeLabel}
                      </div>
                      {renderMediaBadgeLarge()}
                    </div>
                    {roundBadge}
                    {renderMetaChips('md')}
                    </div>
                </div>
              )}

              <div
                className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'gimnasio' ? 'md:grid-cols-2' : ''
                }`}
              >
                {viewMode === 'gimnasio' ? renderMediaFrame('xl') : null}
                <div className="flex items-end justify-end gap-2 sm:gap-3">
                    <Button
                      onClick={() => {
                        if (state === 'PAUSED') {
                          resume()
                        } else {
                          play()
                        }
                      }}
                      disabled={state === 'PLAYING' || !currentInterval}
                      className="h-12 w-12 p-0 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
                      title={state === 'COMPLETED' ? 'Reiniciar' : state === 'PAUSED' ? 'Reanudar' : 'Iniciar'}
                      aria-label={state === 'COMPLETED' ? 'Reiniciar' : state === 'PAUSED' ? 'Reanudar' : 'Iniciar'}
                    >
                      <Play className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                    <Button
                      onClick={state === 'PAUSED' ? resume : pause}
                      variant="ghost"
                      disabled={state === 'IDLE' || state === 'COMPLETED'}
                      className="h-12 w-12 p-0 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
                      title={state === 'PAUSED' ? 'Reanudar' : 'Pausar'}
                      aria-label={state === 'PAUSED' ? 'Reanudar' : 'Pausar'}
                    >
                      {state === 'PAUSED' ? (
                        <Play className="h-6 w-6 sm:h-7 sm:w-7" />
                      ) : (
                        <Pause className="h-6 w-6 sm:h-7 sm:w-7" />
                      )}
                    </Button>
                    <Button
                      onClick={skip}
                      variant="ghost"
                      className="h-12 w-12 p-0 sm:h-14 sm:w-14"
                      title="Siguiente"
                      aria-label="Siguiente"
                    >
                      <SkipForward className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                    <Button
                      onClick={previous}
                      variant="ghost"
                      className="h-12 w-12 p-0 sm:h-14 sm:w-14"
                      title="Anterior"
                      aria-label="Anterior"
                    >
                      <SkipBack className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                    <Button
                      onClick={handleStop}
                      variant="ghost"
                      className="h-12 w-12 p-0 sm:h-14 sm:w-14"
                      title="Detener"
                      aria-label="Detener"
                    >
                      <Square className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                    <Button
                      onClick={() => setStageMode(false)}
                      variant="ghost"
                      className="h-12 w-12 p-0 sm:h-14 sm:w-14"
                      title="Salir"
                      aria-label="Salir"
                    >
                      <X className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <div className="section-stack">
          {renderPreview()}
          {selectedRoutine && state === 'COMPLETED' && (
            <div className="surface-panel p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="form-label">Rutina finalizada</p>
                  <h4 className="mt-2 font-display text-xl font-semibold text-ink-50">
                    {selectedRoutine.name}
                  </h4>
                  <p className="mt-2 text-sm text-ink-300">
                    Buen trabajo. Puedes reiniciar o elegir otra rutina.
                  </p>
                </div>
                <Button variant="ghost" onClick={play}>
                  Reiniciar
                </Button>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-ink-200 sm:grid-cols-2 lg:grid-cols-4">
                <div className="metric-chip">
                  <p className="form-help">Duración total</p>
                  <p className="mt-1 font-display text-lg">{formatTime(routineStats.totalSeconds)}</p>
                </div>
                <div className="metric-chip">
                  <p className="form-help">Ejercicios</p>
                  <p className="mt-1 font-display text-lg">{routineStats.exerciseCount}</p>
                </div>
                <div className="metric-chip">
                  <p className="form-help">Descansos</p>
                  <p className="mt-1 font-display text-lg">{routineStats.restCount}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel section-stack panel-block p-4 sm:p-6">
              <div>
                <p className="form-label">Controles</p>
                <p className="form-help">
                  Atajos: Espacio (Play/Pausa), → (Siguiente), ← (Anterior), Esc (Detener).
                </p>
              </div>
              <div className="grid gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    if (state === 'PAUSED') {
                      resume()
                    } else {
                      play()
                    }
                  }}
                  disabled={state === 'PLAYING' || !currentInterval}
                  className="w-full text-[11px] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  <Play className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  {state === 'COMPLETED' ? 'Reiniciar' : state === 'PAUSED' ? 'Reanudar' : 'Iniciar'}
                </Button>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    onClick={state === 'PAUSED' ? resume : pause}
                    variant="ghost"
                    disabled={state === 'IDLE' || state === 'COMPLETED'}
                    className="w-full px-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm"
                  >
                    {state === 'PAUSED' ? (
                      <>
                        <Play className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                        Reanudar
                      </>
                    ) : (
                      <>
                        <Pause className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                        Pausar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="ghost"
                    className="w-full px-3 text-[11px] sm:px-5 sm:text-sm"
                  >
                    <Square className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    Detener
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    onClick={previous}
                    variant="ghost"
                    className="w-full px-3 text-[11px] sm:px-5 sm:text-sm"
                  >
                    <SkipBack className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    Anterior
                  </Button>
                  <Button
                    onClick={skip}
                    variant="ghost"
                    className="w-full px-3 text-[11px] sm:px-5 sm:text-sm"
                  >
                    <SkipForward className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    Siguiente
                  </Button>
                </div>
                <Button
                  onClick={() => setStageMode(true)}
                  variant="ghost"
                  className="w-full px-3 text-[11px] sm:px-5 sm:text-sm"
                  disabled={!canStage}
                >
                  Modo ejecución
                </Button>
              </div>
            </div>

            <div className="surface-panel section-stack panel-block p-4 sm:p-6">
              <div>
                <p className="form-label">Sonidos</p>
                <p className="form-help">
                  Sonido en inicio, cuenta 3-2-1 y tono final.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(event) => setSoundEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-ink-500 bg-ink-900 text-accent-500"
                />
                Sonidos activos
              </label>
              <label className="space-y-2 text-xs text-ink-300">
                <span className="form-label">Volumen sonidos</span>
                <div className="flex items-center gap-3">
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
                          if (soundPreset === 'alarm') {
                            void soundTestRef.current.beepPattern([
                              { frequency: 880, durationMs: 160, volume: Math.min(Math.max(value, 0), 1.5), type: 'sawtooth' },
                              { frequency: 660, durationMs: 160, volume: Math.min(Math.max(value, 0), 1.5), type: 'sawtooth' },
                            ])
                          } else if (soundPreset === 'metal') {
                            void soundTestRef.current.beep({
                              frequency: 640,
                              durationMs: 220,
                              volume: Math.min(Math.max(value, 0), 1.5),
                              type: 'triangle',
                            })
                          } else if (soundPreset === 'soft') {
                            void soundTestRef.current.beep({
                              frequency: 600,
                              durationMs: 200,
                              volume: Math.min(Math.max(value, 0), 1.5),
                              type: 'sine',
                            })
                          } else {
                            void soundTestRef.current.beep({
                              frequency: 760,
                              durationMs: 160,
                              volume: Math.min(Math.max(value, 0), 1.5),
                              type: 'square',
                            })
                          }
                        }, 200)
                        soundTestTimeoutRef.current = timeoutId
                      }
                    }}
                    className="w-full accent-ember-500"
                  />
                  <div className="min-w-[44px] rounded-full border border-ink-700/60 bg-ink-900/60 px-2 py-1 text-center text-[10px] text-ink-200 sm:text-xs">
                    {soundVolume.toFixed(2)}
                  </div>
                </div>
              </label>
              <label className="space-y-2 text-xs text-ink-300">
                <span className="form-label">Preset de sonido</span>
                <Dropdown
                  value={soundPreset}
                  onChange={(value) => {
                    if (value === 'punch' || value === 'alarm' || value === 'metal' || value === 'soft') {
                      setSoundPreset(value)
                    }
                  }}
                  options={[
                    { value: 'punch', label: 'Punch' },
                    { value: 'alarm', label: 'Alarma' },
                    { value: 'metal', label: 'Metálico' },
                    { value: 'soft', label: 'Suave' },
                  ]}
                />
              </label>
              <Button onClick={handleReset} variant="secondary" className="w-full text-xs">
                Resetear ajustes
              </Button>
            </div>
          </div>
        </div>

        <div className="section-stack lg:sticky lg:top-8 lg:self-start">
          <div className="surface-panel section-stack panel-block p-4 sm:p-6">
            <div>
              <p className="form-label">Sesión</p>
              <h3 className="mt-2 font-display text-2xl text-ink-50">Selecciona una rutina</h3>
            </div>
            <div className="relative" ref={routineMenuRef}>
              <button
                type="button"
                className="select-field flex items-center justify-between text-left"
                aria-haspopup="listbox"
                aria-expanded={routineMenuOpen}
                onClick={() => setRoutineMenuOpen((open) => !open)}
              >
                <span className={selectedRoutine ? 'text-ink-50' : 'text-ink-400'}>
                  {selectedRoutine ? selectedRoutine.name : 'Elige una rutina...'}
                </span>
                <span className="ml-3 text-xs text-ink-400">{routineMenuOpen ? 'Cerrar' : 'Abrir'}</span>
              </button>
              {routineMenuOpen && (
                <div
                  role="listbox"
                  className="dropdown-menu absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-2xl border shadow-xl backdrop-blur"
                >
                  {routines.map((routine: Routine) => {
                    const isActive = routine.id === selectedId
                    return (
                      <button
                        key={routine.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setSelectedId(routine.id)
                          setRoutineMenuOpen(false)
                        }}
                        className={`dropdown-item flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                          isActive ? 'is-active' : ''
                        }`}
                      >
                        <span className="font-medium">{routine.name}</span>
                        {isActive && <span className="text-xs font-semibold">Seleccionada</span>}
                      </button>
                    )
                  })}
                  {routines.length === 0 && (
                    <div className="px-4 py-3 text-sm text-ink-300">No hay rutinas aún.</div>
                  )}
                </div>
              )}
            </div>
            {selectedRoutine && (
              <div className="grid gap-3 text-sm text-ink-200 sm:grid-cols-2 lg:grid-cols-4">
                <div className="metric-chip px-3 py-2">
                  <p className="form-help">Duración</p>
                  <p className="font-display">{formatTime(routineStats.totalSeconds)}</p>
                </div>
                <div className="metric-chip px-3 py-2">
                  <p className="form-help">Ejercicios</p>
                  <p className="font-display">{routineStats.exerciseCount}</p>
                </div>
                <div className="metric-chip px-3 py-2">
                  <p className="form-help">Descansos</p>
                  <p className="font-display">{routineStats.restCount}</p>
                </div>
              </div>
            )}
          </div>

          <div className="surface-panel section-stack panel-block p-4 sm:p-6">
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <LayoutGrid className="h-4 w-4" />
              <span className="form-label">Modo visual</span>
            </div>
            {renderViewModeToggle()}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmStopOpen}
        title="Detener rutina"
        description="La rutina actual se detendrá y volverás al inicio."
        confirmLabel="Detener"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmStopOpen(false)
          stop()
        }}
        onCancel={() => {
          setConfirmStopOpen(false)
          if (state === 'PAUSED') {
            resume()
          }
        }}
      />
    </div>
  )
}
