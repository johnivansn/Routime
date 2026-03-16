export function isValidExerciseName(name: string) {
  const trimmed = name.trim()
  return trimmed.length >= 3 && trimmed.length <= 80
}

export function isValidIntervalDuration(seconds: number, allowZero = false) {
  const min = allowZero ? 0 : 1
  return Number.isFinite(seconds) && seconds >= min && seconds <= 600
}
