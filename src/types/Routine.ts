import type { Interval } from './Interval'

export type RoutineBlock = {
  id: string
  name: string
  rounds?: number
  intervals: Interval[]
}

export type Routine = {
  id: string
  name: string
  intervals: Interval[]
  blocks?: RoutineBlock[]
  createdAt: number
  updatedAt: number
  rounds?: number
  roundStartIndex?: number
  roundIntervalCount?: number
}
