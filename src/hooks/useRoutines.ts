import { useCallback, useEffect, useState } from 'react'
import { db } from '@/repositories/db'
import type { Routine } from '@/types'

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const items = await db.routines.toArray()
    setRoutines(items.sort((a, b) => b.updatedAt - a.updatedAt))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addRoutine = useCallback(async (routine: Routine) => {
    await db.routines.add(routine)
    setRoutines((prev) => [routine, ...prev])
  }, [])

  const updateRoutine = useCallback(async (routine: Routine) => {
    await db.routines.put(routine)
    setRoutines((prev) =>
      [routine, ...prev.filter((item) => item.id !== routine.id)].sort(
        (a, b) => b.updatedAt - a.updatedAt
      )
    )
  }, [])

  const removeRoutine = useCallback(async (id: string) => {
    await db.routines.delete(id)
    setRoutines((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return { routines, loading, addRoutine, updateRoutine, removeRoutine, refresh: load }
}
