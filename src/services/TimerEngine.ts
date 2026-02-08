type TickHandler = (remainingSeconds: number) => void
type CompleteHandler = () => void

export class TimerEngine {
  private durationSeconds: number
  private onTick: TickHandler
  private onComplete: CompleteHandler
  private rafId: number | null = null
  private startedAt: number | null = null
  private pausedAt: number | null = null
  private elapsedWhilePaused = 0

  constructor(durationSeconds: number, onTick: TickHandler, onComplete: CompleteHandler) {
    this.durationSeconds = durationSeconds
    this.onTick = onTick
    this.onComplete = onComplete
  }

  start() {
    this.stop()
    this.startedAt = performance.now()
    this.elapsedWhilePaused = 0
    this.tick()
  }

  pause() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
      this.pausedAt = performance.now()
    }
  }

  resume() {
    if (this.startedAt === null || this.pausedAt === null) {
      return
    }
    this.elapsedWhilePaused += performance.now() - this.pausedAt
    this.pausedAt = null
    this.tick()
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
    this.rafId = null
    this.startedAt = null
    this.pausedAt = null
    this.elapsedWhilePaused = 0
  }

  private tick = () => {
    if (this.startedAt === null) {
      return
    }

    const now = performance.now()
    const elapsedSeconds = (now - this.startedAt - this.elapsedWhilePaused) / 1000
    const remaining = Math.max(0, this.durationSeconds - elapsedSeconds)

    this.onTick(remaining)

    if (remaining <= 0) {
      this.onComplete()
      this.stop()
      return
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}
