import Dexie, { type Table } from 'dexie'
import type { Exercise, Routine } from '@/types'

export class RoutimeDatabase extends Dexie {
  exercises!: Table<Exercise, string>
  routines!: Table<Routine, string>

  constructor() {
    super('routime')
    this.version(1).stores({
      exercises: 'id, name, createdAt',
      routines: 'id, name, updatedAt',
    })
  }
}

export const db = new RoutimeDatabase()
