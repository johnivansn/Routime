import { useCallback, useEffect, useState } from 'react'
import { db } from '@/repositories/db'
import type { Routine } from '@/types'

export function useRoutine(id: string | undefined) {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) {
      setRoutine(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const item = await db.routines.get(id)
    setRoutine(item ?? null)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const update = useCallback(async (next: Routine) => {
    await db.routines.put(next)
    setRoutine(next)
  }, [])

  return { routine, loading, refresh: load, update }
}
