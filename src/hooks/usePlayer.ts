import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, Interval, Routine } from '@/types'
import { TimerEngine } from '@/services/TimerEngine'
import { VoiceService } from '@/services/VoiceService'
import { SoundService } from '@/services/SoundService'
import { db } from '@/repositories/db'

export type PlayerState = 'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED'

type PlayerOptions = {
  voiceEnabled: boolean
  soundEnabled: boolean
  voiceVolume: number
  soundVolume: number
  voiceName?: string | null
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
  const voiceRef = useRef(new VoiceService())
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
        if (options.voiceEnabled) {
          voiceRef.current.setPreferredVoiceByName(options.voiceName)
          voiceRef.current.speak(interval.label ?? 'Descanso', 'es-ES', options.voiceVolume)
        }
        return
      }
      const exercise = await loadExercise(interval)
      if (exercise && options.voiceEnabled) {
        voiceRef.current.setPreferredVoiceByName(options.voiceName)
        const detail = interval.label ? ` - ${interval.label}` : ''
        const announcement = `${exercise.name}${detail}`
        voiceRef.current.speak(announcement, 'es-ES', options.voiceVolume)
      }
    },
    [loadExercise, options.voiceEnabled, options.voiceName, options.voiceVolume]
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
              soundRef.current.beep({
                frequency: 520,
                durationMs: 420,
                volume: Math.min(options.soundVolume + 0.04, 0.6),
                type: 'triangle',
              })
            }
            if (options.voiceEnabled) {
              voiceRef.current.speak('Rutina completada', 'es-ES', options.voiceVolume)
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
      voiceRef.current.cancel()
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
