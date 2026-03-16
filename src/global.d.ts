declare global {
  interface Window {
    routime?: {
      tts?: {
        isAvailable: () => boolean
        speak: (text: string, options?: { rate?: number; volume?: number; voiceName?: string }) => void
      }
    }
  }
}

export {}
