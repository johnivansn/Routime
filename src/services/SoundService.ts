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
    gain.gain.value = volume

    oscillator.connect(gain)
    gain.connect(context.destination)

    const now = context.currentTime
    const stopTime = now + durationMs / 1000
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

    oscillator.start(now)
    oscillator.stop(stopTime)
  }
}
