const exerciseNameRegex = /^[\p{L}\p{N}\s-]{3,50}$/u

export function isValidExerciseName(name: string) {
  return exerciseNameRegex.test(name.trim())
}

export function isValidIntervalDuration(seconds: number) {
  return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600
}
