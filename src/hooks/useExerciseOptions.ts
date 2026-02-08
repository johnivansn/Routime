import { useCallback, useEffect, useState } from 'react'
import { db } from '@/repositories/db'

type ExerciseOption = {
  id: string
  name: string
}

export function useExerciseOptions() {
  const [options, setOptions] = useState<ExerciseOption[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const exercises = await db.exercises.toArray()
    setOptions(exercises.map((item) => ({ id: item.id, name: item.name })))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { options, loading, refresh: load }
}
