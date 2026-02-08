import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, Interval, Routine } from '@/types'
import { TimerEngine } from '@/services/TimerEngine'
import { SoundService } from '@/services/SoundService'
import { db } from '@/repositories/db'

export type PlayerState = 'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED'

type PlayerOptions = {
  soundEnabled: boolean
  soundVolume: number
  soundPreset?: 'punch' | 'alarm' | 'metal' | 'soft'
}

export function usePlayer(routine: Routine | null, options: PlayerOptions) {
  const [state, setState] = useState<PlayerState>('IDLE')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const timerRef = useRef<TimerEngine | null>(null)
  const indexRef = useRef(0)
  const activeIntervalIdRef = useRef<string | null>(null)
  const soundRef = useRef(new SoundService())
  const lastBeepSecondRef = useRef<number | null>(null)
  const currentVideoUrlRef = useRef<string | null>(null)

  const intervals = routine?.intervals ?? []
  const currentInterval = intervals[currentIndex]

  const clearVideoUrl = useCallback(() => {
    if (currentVideoUrlRef.current) {
      URL.revokeObjectURL(currentVideoUrlRef.current)
      currentVideoUrlRef.current = null
    }
    setVideoUrl(null)
  }, [])

  const loadExercise = useCallback(
    async (interval: Interval | undefined) => {
      if (!interval || interval.type !== 'EXERCISE' || !interval.exerciseId) {
        setCurrentExercise(null)
        clearVideoUrl()
        return null
      }
      const exercise = await db.exercises.get(interval.exerciseId)
      if (!exercise) {
        setCurrentExercise(null)
        clearVideoUrl()
        return null
      }
      setCurrentExercise(exercise)
      clearVideoUrl()
      if (exercise.videoFile) {
        const url = URL.createObjectURL(exercise.videoFile)
        currentVideoUrlRef.current = url
        setVideoUrl(url)
      }
      return exercise
    },
    [clearVideoUrl]
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
      options.voiceEnabled,
      options.voiceVolume,
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
    setTimeRemaining(routine?.intervals[0]?.duration ?? 0)
  }, [routine, stopTimer])

  const skip = useCallback(() => {
    stopTimer()
    if (currentIndex < intervals.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setTimeRemaining(intervals[nextIndex]?.duration ?? 0)
      setState('PLAYING')
    } else {
      setState('COMPLETED')
      setTimeRemaining(0)
    }
  }, [currentIndex, intervals, stopTimer])

  useEffect(() => {
    indexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    if (!routine) {
      setState('IDLE')
      setCurrentIndex(0)
      setTimeRemaining(0)
      setCurrentExercise(null)
      clearVideoUrl()
      return
    }
    stopTimer()
    setState('READY')
    setCurrentIndex(0)
    setTimeRemaining(routine.intervals[0]?.duration ?? 0)
    void loadExercise(routine.intervals[0])
  }, [clearVideoUrl, loadExercise, routine, stopTimer])

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
      clearVideoUrl()
    }
  }, [clearVideoUrl, stopTimer])

  const progress = useMemo(() => {
    if (!routine || routine.intervals.length === 0) return 0
    return ((currentIndex + 1) / routine.intervals.length) * 100
  }, [currentIndex, routine])

  return {
    state,
    currentInterval,
    currentExercise,
    timeRemaining,
    progress,
    videoUrl,
    currentIndex,
    totalIntervals: intervals.length,
    play,
    pause,
    resume,
    stop,
    skip,
  }
}
