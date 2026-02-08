export class VoiceService {
  private synth: SpeechSynthesis | null = null
  private lastSpoken = ''
  private debounceMs = 200
  private pendingTimeout: number | null = null
  private preferredVoice: SpeechSynthesisVoice | null = null
  private preferredVoiceName: string | null = null

  static isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  constructor() {
    if (VoiceService.isSupported()) {
      this.synth = window.speechSynthesis
      const resolveVoices = () => {
        this.preferredVoice = this.pickPreferredVoice('es')
      }
      resolveVoices()
      window.speechSynthesis.addEventListener('voiceschanged', resolveVoices)
    }
  }

  static getVoices() {
    if (!VoiceService.isSupported()) {
      return []
    }
    return window.speechSynthesis.getVoices()
  }

  static findVoiceByName(name: string | null | undefined) {
    if (!name) return null
    return VoiceService.getVoices().find((voice) => voice.name === name) ?? null
  }

  setPreferredVoiceByName(name: string | null | undefined) {
    if (!name) {
      this.preferredVoice = null
      this.preferredVoiceName = null
      return
    }
    const voice = VoiceService.findVoiceByName(name)
    if (voice) {
      this.preferredVoice = voice
      this.preferredVoiceName = voice.name
      return
    }
    this.preferredVoiceName = name
  }

  private pickPreferredVoice(langPrefix: string) {
    if (!this.synth) return null
    const voices = this.synth.getVoices()
    if (voices.length === 0) return null

    const matchesLang = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix))
    const pool = matchesLang.length > 0 ? matchesLang : voices

    const preferredByName = pool.find((voice) =>
      /google|microsoft|lucia|pablo|sara|helena|raul|marisol/i.test(voice.name)
    )

    return preferredByName ?? pool[0]
  }

  speak(text: string, lang = 'es-ES', volume = 1, rate = 1, pitch = 1) {
    if (!this.synth || !text || text === this.lastSpoken) {
      if (typeof window !== 'undefined' && window.routime?.tts?.isAvailable()) {
        void window.routime.tts.speak(text, { rate, volume })
      }
      return
    }

    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout)
    }

    if (typeof window !== 'undefined' && window.routime?.tts?.isAvailable()) {
      void window.routime.tts.speak(text, {
        rate,
        volume,
        voiceName: this.preferredVoiceName,
      })
      this.lastSpoken = text
      return
    }

    this.synth.cancel()

    this.pendingTimeout = window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.volume = Math.min(Math.max(volume, 0), 1)
      utterance.rate = Math.min(Math.max(rate, 0.5), 2)
      utterance.pitch = Math.min(Math.max(pitch, 0), 2)
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice
      }
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
