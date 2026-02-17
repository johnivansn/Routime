export type IntervalType = 'EXERCISE' | 'REST'

export type Interval = {
  id: string
  type: IntervalType
  duration: number
  exerciseId?: string
  label?: string
  notes?: string
  section?: 'WARMUP' | 'WORK' | 'COOLDOWN'
}
