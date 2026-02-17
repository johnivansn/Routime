import type { Exercise, Routine } from '@/types'
import { db } from '@/repositories/db'

export type SyncPayload = {
  exercises: Exercise[]
  routines: Routine[]
  exportedAt?: string
}

const getTimestamp = (item: { updatedAt?: number; createdAt?: number }) =>
  item.updatedAt ?? item.createdAt ?? 0

export const exportLocalData = async (): Promise<SyncPayload> => {
  const [exercises, routines] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
  ])
  return { exercises, routines, exportedAt: new Date().toISOString() }
}

export const importLocalData = async (
  payload: SyncPayload,
  mode: 'merge' | 'replace'
) => {
  const incomingExercises = payload.exercises ?? []
  const incomingRoutines = payload.routines ?? []

  if (mode === 'replace') {
    await db.exercises.clear()
    await db.routines.clear()
    if (incomingExercises.length > 0) {
      await db.exercises.bulkAdd(incomingExercises)
    }
    if (incomingRoutines.length > 0) {
      await db.routines.bulkAdd(incomingRoutines)
    }
    return
  }

  const [currentExercises, currentRoutines] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
  ])

  const exerciseMap = new Map(currentExercises.map((item) => [item.id, item]))
  for (const incoming of incomingExercises) {
    const existing = exerciseMap.get(incoming.id)
    if (!existing || getTimestamp(incoming) >= getTimestamp(existing)) {
      exerciseMap.set(incoming.id, incoming)
    }
  }

  const routineMap = new Map(currentRoutines.map((item) => [item.id, item]))
  for (const incoming of incomingRoutines) {
    const existing = routineMap.get(incoming.id)
    if (!existing || getTimestamp(incoming) >= getTimestamp(existing)) {
      routineMap.set(incoming.id, incoming)
    }
  }

  await Promise.all([
    db.exercises.bulkPut([...exerciseMap.values()]),
    db.routines.bulkPut([...routineMap.values()]),
  ])
}
