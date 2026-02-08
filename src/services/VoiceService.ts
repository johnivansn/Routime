export class VoiceService {
  private synth: SpeechSynthesis | null = null
  private lastSpoken = ''
  private debounceMs = 200
  private pendingTimeout: number | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
    }
  }

  speak(text: string, lang = 'es-ES') {
    if (!this.synth || !text || text === this.lastSpoken) {
      return
    }

    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout)
    }

    this.synth.cancel()

    this.pendingTimeout = window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      this.synth?.speak(utterance)
      this.lastSpoken = text
    }, this.debounceMs)
  }

  cancel() {
    if (!this.synth) {
      return
    }
    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout)
      this.pendingTimeout = null
    }
    this.synth.cancel()
  }
}
