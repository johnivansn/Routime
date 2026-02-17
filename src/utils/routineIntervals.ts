import type { Interval, Routine } from '@/types'

const cloneWithId = (interval: Interval, suffix: string): Interval => ({
  ...interval,
  id: `${interval.id}-${suffix}`,
})

export const expandRoutineIntervals = (routine: Routine | null): Interval[] => {
  if (!routine) return []

  if (routine.blocks && routine.blocks.length > 0) {
    const expanded: Interval[] = []
    routine.blocks.forEach((block, blockIndex) => {
      const rounds = Math.max(1, block.rounds ?? 1)
      const blockIntervals = block.intervals ?? []
      for (let round = 0; round < rounds; round += 1) {
        blockIntervals.forEach((interval, index) => {
          expanded.push(
            cloneWithId(interval, `b${blockIndex}-r${round + 1}-i${index}`)
          )
        })
      }
    })
    return expanded
  }

  const baseIntervals = routine.intervals ?? []
  if (!routine.rounds || !routine.roundIntervalCount) {
    return baseIntervals
  }

  const start = routine.roundStartIndex ?? 0
  const size = routine.roundIntervalCount
  const total = routine.rounds
  const expandedLength = start + size * total
  if (baseIntervals.length >= expandedLength) {
    return baseIntervals
  }

  const warmup = baseIntervals.slice(0, start)
  const work = baseIntervals.slice(start, start + size)
  const cooldown = baseIntervals.slice(start + size)
  const repeated: Interval[] = []
  for (let round = 0; round < total; round += 1) {
    work.forEach((interval, index) => {
      repeated.push(cloneWithId(interval, `r${round + 1}-i${index}`))
    })
  }
  return [...warmup, ...repeated, ...cooldown]
}
