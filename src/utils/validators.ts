export function isValidExerciseName(name: string) {
  const trimmed = name.trim()
  return trimmed.length >= 3 && trimmed.length <= 80
}

export function isValidIntervalDuration(seconds: number) {
  return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600
}
