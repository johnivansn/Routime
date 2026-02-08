import { useEffect, useState } from 'react'
import { db } from '@/repositories/db'

type ExerciseOption = {
  id: string
  name: string
}

export function useExerciseOptions() {
  const [options, setOptions] = useState<ExerciseOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const exercises = await db.exercises.toArray()
      if (!active) return
      setOptions(exercises.map((item) => ({ id: item.id, name: item.name })))
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { options, loading }
}
