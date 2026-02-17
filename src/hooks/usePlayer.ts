import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, Interval, Routine } from '@/types'
import { TimerEngine } from '@/services/TimerEngine'
import { SoundService } from '@/services/SoundService'
import { db } from '@/repositories/db'
import { expandRoutineIntervals } from '@/utils/routineIntervals'

export type PlayerState = 'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED'

type PlayerOptions = {
  soundEnabled: boolean
  soundVolume: number
  soundPreset?: 'punch' | 'alarm' | 'metal' | 'soft'
}

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

const preloadImages = (urls: string[]) => {
  urls.forEach((url) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  })
}

export function usePlayer(routine: Routine | null, options: PlayerOptions) {
  const [state, setState] = useState<PlayerState>('IDLE')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageSlideSeconds, setImageSlideSeconds] = useState(5)

  const timerRef = useRef<TimerEngine | null>(null)
  const indexRef = useRef(0)
  const activeIntervalIdRef = useRef<string | null>(null)
  const soundRef = useRef(new SoundService())
  const lastBeepSecondRef = useRef<number | null>(null)
  const currentVideoUrlRef = useRef<string | null>(null)
  const currentImageUrlsRef = useRef<string[]>([])

  const intervals = useMemo(() => expandRoutineIntervals(routine), [routine])
  const currentInterval = intervals[currentIndex]

  const blockInfo = useMemo(() => {
    if (!routine?.blocks || routine.blocks.length === 0) {
      if (!routine?.rounds || !routine.roundIntervalCount) {
        return {
          currentBlockName: null as string | null,
          currentRound: null as number | null,
          totalRounds: null as number | null,
        }
      }
      const start = routine.roundStartIndex ?? 0
      const total = routine.rounds
      const size = routine.roundIntervalCount
      if (currentIndex < start || currentIndex >= start + total * size) {
        return {
          currentBlockName: null as string | null,
          currentRound: null as number | null,
          totalRounds: total,
        }
      }
      const currentRound = Math.floor((currentIndex - start) / size) + 1
      return {
        currentBlockName: null as string | null,
        currentRound,
        totalRounds: total,
      }
    }
    let cursor = 0
    for (const block of routine.blocks) {
      const rounds = Math.max(1, block.rounds ?? 1)
      const size = block.intervals.length
      const total = size * rounds
      if (total === 0) {
        continue
      }
      if (currentIndex >= cursor && currentIndex < cursor + total) {
        const round = Math.floor((currentIndex - cursor) / size) + 1
        return {
          currentBlockName: block.name,
          currentRound: round,
          totalRounds: rounds,
        }
      }
      cursor += total
    }
    return {
      currentBlockName: null as string | null,
      currentRound: null as number | null,
      totalRounds: null as number | null,
    }
  }, [currentIndex, routine])

  const clearMediaUrls = useCallback(() => {
    if (currentVideoUrlRef.current) {
      URL.revokeObjectURL(currentVideoUrlRef.current)
      currentVideoUrlRef.current = null
    }
    if (currentImageUrlsRef.current.length > 0) {
      currentImageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      currentImageUrlsRef.current = []
    }
    setVideoUrl(null)
    setImageUrls([])
  }, [])

  const loadExercise = useCallback(
    async (interval: Interval | undefined) => {
      if (!interval || interval.type !== 'EXERCISE' || !interval.exerciseId) {
        setCurrentExercise(null)
        clearMediaUrls()
        return null
      }
      const exercise = await db.exercises.get(interval.exerciseId)
      if (!exercise) {
        setCurrentExercise(null)
        clearMediaUrls()
        return null
      }
      setCurrentExercise(exercise)
      clearMediaUrls()
      if (exercise.videoFile) {
        const url = URL.createObjectURL(exercise.videoFile)
        currentVideoUrlRef.current = url
        setVideoUrl(url)
      } else if (exercise.videoUrl) {
        setVideoUrl(normalizeDriveUrl(exercise.videoUrl))
      }
      if (exercise.imageFiles && exercise.imageFiles.length > 0) {
        const urls = exercise.imageFiles.map((file) => URL.createObjectURL(file))
        currentImageUrlsRef.current = urls
        setImageUrls(urls)
        preloadImages(urls)
      } else if (exercise.imageUrls && exercise.imageUrls.length > 0) {
        const urls = exercise.imageUrls
          .map((url) => normalizeDriveUrl(url))
          .filter(Boolean) as string[]
        currentImageUrlsRef.current = []
        setImageUrls(urls)
        preloadImages(urls)
      }
      setImageSlideSeconds(exercise.imageSlideSeconds ?? 5)
      return exercise
    },
    [clearMediaUrls]
  )

  const announceInterval = useCallback(
    async (interval: Interval | undefined) => {
      if (!interval) return
      if (interval.type === 'REST') {
        await loadExercise(interval)
        return
      }
      await loadExercise(interval)
    },
    [loadExercise]
  )

  const stopTimer = useCallback(() => {
    timerRef.current?.stop()
    timerRef.current = null
    lastBeepSecondRef.current = null
    activeIntervalIdRef.current = null
  }, [])

  const startInterval = useCallback(
    async (interval: Interval | undefined) => {
      if (!interval) return
      stopTimer()
      lastBeepSecondRef.current = null
      activeIntervalIdRef.current = interval.id
      setTimeRemaining(interval.duration)

      if (options.soundEnabled) {
        await soundRef.current.unlock()
      }

      await announceInterval(interval)

      if (options.soundEnabled) {
        const volume = Math.min(Math.max(options.soundVolume, 0), 1.5)
        const isRest = interval.type === 'REST'
        const isPhase = Boolean(interval.label)
        const preset = options.soundPreset ?? 'punch'

        if (preset === 'alarm') {
          void soundRef.current.beepPattern([
            { frequency: 880, durationMs: 140, volume, type: 'sawtooth' },
            { frequency: 660, durationMs: 140, volume, type: 'sawtooth' },
          ])
        } else if (preset === 'metal') {
          void soundRef.current.beep({
            frequency: isRest ? 520 : isPhase ? 720 : 640,
            durationMs: 220,
            volume,
            type: 'triangle',
          })
        } else if (preset === 'soft') {
          void soundRef.current.beep({
            frequency: isRest ? 520 : isPhase ? 680 : 600,
            durationMs: 200,
            volume,
            type: 'sine',
          })
        } else {
          void soundRef.current.beep({
            frequency: isRest ? 420 : isPhase ? 760 : 640,
            durationMs: 180,
            volume,
            type: 'square',
          })
        }
      }

      timerRef.current = new TimerEngine(
        interval.duration,
        (remainingSeconds) => {
          setTimeRemaining(remainingSeconds)
          const currentSecond = Math.max(0, Math.ceil(remainingSeconds))
          if (options.soundEnabled && currentSecond <= 3 && currentSecond > 0) {
            if (lastBeepSecondRef.current !== currentSecond) {
              lastBeepSecondRef.current = currentSecond
              soundRef.current.beep({
                frequency: 900 + currentSecond * 40,
                durationMs: 120,
                volume: options.soundVolume,
                type: 'sine',
              })
            }
          }
        },
        () => {
          const current = indexRef.current
          if (current < intervals.length - 1) {
            const nextIndex = current + 1
            setCurrentIndex(nextIndex)
            setTimeRemaining(intervals[nextIndex]?.duration ?? 0)
          } else {
            setState('COMPLETED')
            setTimeRemaining(0)
            if (options.soundEnabled) {
              const volume = Math.min(options.soundVolume + 0.08, 1.5)
              const preset = options.soundPreset ?? 'punch'
              if (preset === 'alarm') {
                soundRef.current.beepPattern([
                  { frequency: 900, durationMs: 180, volume, type: 'sawtooth' },
                  { frequency: 720, durationMs: 180, volume, type: 'sawtooth' },
                  { frequency: 900, durationMs: 180, volume, type: 'sawtooth' },
                ])
              } else if (preset === 'metal') {
                soundRef.current.beep({
                  frequency: 560,
                  durationMs: 420,
                  volume,
                  type: 'triangle',
                })
              } else if (preset === 'soft') {
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
        }
      )

      timerRef.current.start()
    },
    [
      announceInterval,
      intervals.length,
      intervals,
      options.soundEnabled,
      options.soundVolume,
      stopTimer,
    ]
  )

  const play = useCallback(async () => {
    if (!routine || !currentInterval) return
    if (state === 'PLAYING') return
    setState('PLAYING')
  }, [currentInterval, routine, state])

  const pause = useCallback(() => {
    timerRef.current?.pause()
    setState('PAUSED')
  }, [])

  const resume = useCallback(() => {
    timerRef.current?.resume()
    setState('PLAYING')
  }, [])

  const stop = useCallback(() => {
    stopTimer()
    setState(routine ? 'READY' : 'IDLE')
    setCurrentIndex(0)
    setTimeRemaining(intervals[0]?.duration ?? 0)
  }, [intervals, routine, stopTimer])

  const skip = useCallback(() => {
    stopTimer()
    if (currentIndex < intervals.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setTimeRemaining(intervals[nextIndex]?.duration ?? 0)
      setState(state === 'PAUSED' ? 'PAUSED' : 'PLAYING')
    } else {
      setState('COMPLETED')
      setTimeRemaining(0)
    }
  }, [currentIndex, intervals, state, stopTimer])

  const previous = useCallback(() => {
    stopTimer()
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setTimeRemaining(intervals[prevIndex]?.duration ?? 0)
      setState(state === 'PAUSED' ? 'PAUSED' : 'PLAYING')
    }
  }, [currentIndex, intervals, state, stopTimer])

  useEffect(() => {
    indexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    if (!routine) {
      setState('IDLE')
      setCurrentIndex(0)
      setTimeRemaining(0)
      setCurrentExercise(null)
      clearMediaUrls()
      return
    }
    stopTimer()
    setState('READY')
    setCurrentIndex(0)
    setTimeRemaining(intervals[0]?.duration ?? 0)
    void loadExercise(intervals[0])
  }, [clearMediaUrls, loadExercise, routine, stopTimer, intervals])

  useEffect(() => {
    if (state === 'PLAYING' && currentInterval) {
      if (activeIntervalIdRef.current !== currentInterval.id) {
        void startInterval(currentInterval)
      }
    } else if (state === 'READY') {
      void loadExercise(currentInterval)
    }
  }, [currentInterval, loadExercise, startInterval, state])

  useEffect(() => {
    return () => {
      stopTimer()
      clearMediaUrls()
    }
  }, [clearMediaUrls, stopTimer])

  const progress = useMemo(() => {
    if (intervals.length === 0) return 0
    return ((currentIndex + 1) / intervals.length) * 100
  }, [currentIndex, intervals.length])

  return {
    state,
    currentInterval,
    currentExercise,
    timeRemaining,
    progress,
    videoUrl,
    imageUrls,
    imageSlideSeconds,
    currentRound: blockInfo.currentRound,
    totalRounds: blockInfo.totalRounds,
    currentBlockName: blockInfo.currentBlockName,
    currentIndex,
    totalIntervals: intervals.length,
    play,
    pause,
    resume,
    stop,
    skip,
    previous,
  }
}
