import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/shared/Button'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { useExercises } from '@/hooks/useExercises'

export function NewExercise() {
  const navigate = useNavigate()
  const { addExercise } = useExercises()
  const [name, setName] = useState('')

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="hero-edit flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 p-4 sm:p-6">
        <div>
          <p className="page-kicker">Nuevo</p>
          <h1 className="page-title">Ejercicio</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/ejercicios">
            <Button variant="ghost">Volver a ejercicios</Button>
          </Link>
        </div>
      </div>

      <div className="surface-card space-y-4 p-4 sm:p-6">
        <label className="form-label">Nombre del ejercicio</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Burpees"
          className="input-field font-display text-lg sm:text-2xl"
        />
      </div>

      <ExerciseForm
        submitLabel="Crear ejercicio"
        layout="horizontal"
        hideNameField
        nameValue={name}
        onNameChange={setName}
        onCancel={() => navigate('/ejercicios')}
        onSubmit={async (values) => {
          await addExercise({
            name: values.name,
            mediaType: values.mediaType,
            videoFile: values.videoFile,
            imageFiles: values.imageFiles,
            imageSlideSeconds: values.imageSlideSeconds,
          })
          setName('')
          navigate('/ejercicios')
        }}
      />
    </div>
  )
}
