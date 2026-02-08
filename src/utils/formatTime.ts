export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const paddedSeconds = seconds.toString().padStart(2, '0')

  return `${minutes}:${paddedSeconds}`
}
