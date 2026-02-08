import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/shared/Button'
import { isValidExerciseName } from '@/utils/validators'

const MAX_SIZE_MB = 100
const SUPPORTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

type ExerciseFormProps = {
  onSubmit: (values: { name: string; videoFile: File }) => Promise<void>
}

export function ExerciseForm({ onSubmit }: ExerciseFormProps) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!isValidExerciseName(name)) {
      return 'El nombre debe tener 3-50 caracteres y solo letras, números o guiones.'
    }
    if (!file) {
      return 'Selecciona un video.'
    }
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return 'Formato inválido. Usa MP4, WebM o MOV.'
    }
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > MAX_SIZE_MB) {
      return `El video excede ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!file) return
    setError(null)
    setLoading(true)
    await onSubmit({ name: name.trim(), videoFile: file })
    setLoading(false)
    setName('')
    setFile(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-ink-700 bg-ink-800/70 p-6"
    >
      <div className="space-y-2">
        <label className="text-sm text-ink-200">Nombre del ejercicio</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Burpees"
          className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-50 outline-none focus:border-accent-500"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-ink-200">Video</label>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-200 file:mr-3 file:rounded-full file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink-50"
        />
        <p className="text-xs text-ink-400">Máximo {MAX_SIZE_MB}MB. MP4/WebM/MOV.</p>
      </div>
      {error && <p className="text-sm text-ember-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar ejercicio'}
      </Button>
    </form>
  )
}
