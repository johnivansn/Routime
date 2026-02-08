import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '@/repositories/db'
import type { Exercise } from '@/types'

type ExerciseInput = {
  name: string
  videoFile: File
}

const createObjectUrl = (file: File) => URL.createObjectURL(file)

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const urlsRef = useRef(new Map<string, string>())

  const revokeAll = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    urlsRef.current.clear()
  }, [])

  const loadExercises = useCallback(async () => {
    setLoading(true)
    revokeAll()
    const items = await db.exercises.toArray()
    const hydrated = items.map((item) => {
      const url = createObjectUrl(item.videoFile)
      urlsRef.current.set(item.id, url)
      return { ...item, videoUrl: url }
    })
    setExercises(hydrated)
    setLoading(false)
  }, [revokeAll])

  useEffect(() => {
    loadExercises()
    return () => {
      revokeAll()
    }
  }, [loadExercises, revokeAll])

  const addExercise = useCallback(async ({ name, videoFile }: ExerciseInput) => {
    const id = crypto.randomUUID()
    const createdAt = Date.now()
    const videoUrl = createObjectUrl(videoFile)
    const exercise: Exercise = {
      id,
      name,
      videoFile,
      videoUrl,
      createdAt,
    }
    await db.exercises.add({
      id,
      name,
      videoFile,
      videoUrl: '',
      createdAt,
    })
    urlsRef.current.set(id, videoUrl)
    setExercises((prev) => [exercise, ...prev])
  }, [])

  const removeExercise = useCallback(async (id: string) => {
    await db.exercises.delete(id)
    const url = urlsRef.current.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      urlsRef.current.delete(id)
    }
    setExercises((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return exercises
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(needle))
  }, [exercises, query])

  return {
    exercises: filtered,
    loading,
    query,
    setQuery,
    addExercise,
    removeExercise,
    refresh: loadExercises,
  }
}
