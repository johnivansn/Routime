import type { Interval } from './Interval'

export type Routine = {
  id: string
  name: string
  intervals: Interval[]
  createdAt: number
  updatedAt: number
}
