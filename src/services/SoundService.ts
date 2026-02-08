type BeepOptions = {
  frequency?: number
  durationMs?: number
  volume?: number
  type?: OscillatorType
}

export class SoundService {
  private context: AudioContext | null = null

  private getContext() {
    if (!this.context) {
      this.context = new AudioContext()
    }
    return this.context
  }

  async unlock() {
    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }
  }

  async beep({ frequency = 880, durationMs = 120, volume = 0.18, type = 'sine' }: BeepOptions = {}) {
    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.value = Math.min(Math.max(volume, 0), 1.5)

    oscillator.connect(gain)
    gain.connect(context.destination)

    const now = context.currentTime
    const stopTime = now + durationMs / 1000
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

    oscillator.start(now)
    oscillator.stop(stopTime)
  }

  async beepPattern(
    pattern: { frequency: number; durationMs: number; volume: number; type: OscillatorType }[]
  ) {
    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }

    let offset = 0
    for (const step of pattern) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = step.type
      oscillator.frequency.value = step.frequency
      gain.gain.value = Math.min(Math.max(step.volume, 0), 1.5)

      oscillator.connect(gain)
      gain.connect(context.destination)

      const startAt = context.currentTime + offset / 1000
      const stopAt = startAt + step.durationMs / 1000
      gain.gain.setValueAtTime(step.volume, startAt)
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

      oscillator.start(startAt)
      oscillator.stop(stopAt)
      offset += step.durationMs + 40
    }
  }
}
