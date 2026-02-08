import { useMemo, useState } from 'react'
import type { Routine } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { RoutineBuilder } from './RoutineBuilder'
import { RoutineList } from './RoutineList'
import { useExerciseOptions } from '@/hooks/useExerciseOptions'
import { useRoutines } from '@/hooks/useRoutines'
import { Button } from '@/components/shared/Button'
import { db } from '@/repositories/db'

export function RoutineManager() {
  const { routines, loading, addRoutine, updateRoutine, removeRoutine, refresh: loadRoutines } =
    useRoutines()
  const { options: exercises, loading: exercisesLoading, refresh: refreshExercises } =
    useExerciseOptions()
  const [editing, setEditing] = useState<Routine | null>(null)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const handleSave = async (routine: Routine) => {
    if (editing) {
      await updateRoutine(routine)
      setEditing(null)
    } else {
      await addRoutine(routine)
    }
  }

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('¿Eliminar esta rutina?')
    if (confirmed) {
      void removeRoutine(id)
      if (editing?.id === id) {
        setEditing(null)
      }
    }
  }

  const sortedRoutines = useMemo(() => routines, [routines])

  const seedWeeklyPlan = async (force = false) => {
    setSeedMessage(null)

    const weeklyPlan = [
      {
        name: 'Lunes - Glúteos + Piernas',
        exercises: [
          'Wall sit (30/20/10)',
          'Hip thrust unilateral con pesa (30/20/10)',
          'Peso muerto rumano 1 pierna (30/20/10)',
          'Zancada estática con pesas (30/20/10)',
          'Sentadilla profunda lenta (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Martes - Torso + Core',
        exercises: [
          'Plancha (30/20/10)',
          'Flexiones lentas 4s bajada (30/20/10)',
          'Remo con pesas + pausa (30/20/10)',
          'Sentadilla + press (30/20/10)',
          'Mountain climbers lentos (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Miércoles - Activo Castigado',
        exercises: [
          'Sentadilla lenta sin peso (30/20/10)',
          'Remo ligero con pausa (30/20/10)',
          'Flexiones controladas (30/20/10)',
          'Marcha con carga (30/20/10)',
          'Plancha corta (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Jueves - Brazos + Espalda',
        exercises: [
          'Curl bíceps isométrico (30/20/10)',
          'Remo pesado (30/20/10)',
          'Fondos tríceps con pausa (30/20/10)',
          'Press hombro parcial (30/20/10)',
          'Plancha con arrastre lento (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Viernes - Full Body Densidad',
        exercises: [
          'Sentadilla + press (30/20/10)',
          'Peso muerto (30/20/10)',
          'Flexiones (30/20/10)',
          'Zancadas (30/20/10)',
          'Mountain climbers (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Sábado - Glúteos + Core',
        exercises: [
          'Hip thrust unilateral (30/20/10)',
          'Sentadilla sumo con pausa (30/20/10)',
          'Peso muerto (30/20/10)',
          'Russian twist con pesa (30/20/10)',
          'Plancha larga (30/20/10)',
        ],
        phasePattern: [30, 20, 10],
        phaseLabels: ['ISO 30s', 'REPS 20s', 'PARCIALES 10s'],
        warmupPhases: [
          { name: 'Calentamiento: marcha activa', duration: 60, label: 'Marcha activa + brazos' },
          { name: 'Calentamiento: movilidad', duration: 60, label: 'Cadera + hombros' },
          { name: 'Calentamiento: activación', duration: 60, label: '10 sentadillas + 10 flexiones + 20 jumping jacks' },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60, label: 'Boca arriba, piernas flexionadas, inhalar 4s/exhalar 8s' },
          { name: 'Estiramiento pasivo (1 min)', duration: 60, label: 'Glúteos o isquios/espalda baja o apertura pecho' },
        ],
      },
      {
        name: 'Domingo - Activo Obligatorio',
        exercises: [
          'Sentadilla muy lenta sin peso (40/20)',
          'Puente de glúteos lento (40/20)',
          'Remo ligero con pesas (40/20)',
          'Marcha con carga ligera (40/20)',
          'Plancha relajada (40/20)',
        ],
        phasePattern: [40, 20],
        phaseLabels: ['TRABAJO 40s', 'CONTROL 20s'],
        warmupPhases: [
          { name: 'Marcha continua (2 min)', duration: 120, label: 'Ritmo medio + brazos sueltos' },
          { name: 'Movilidad lenta (3 min)', duration: 180, label: 'Círculos cadera + columna + hombros con palo' },
        ],
        cooldownPhases: [
          { name: 'Estiramiento glúteos (1 min)', duration: 60, label: 'Figura 4 en el suelo' },
          { name: 'Isquios + espalda baja (1 min)', duration: 60, label: 'Sin rebotes, sin forzar' },
          { name: 'Pectoral y hombros (1 min)', duration: 60, label: 'Apertura suave' },
          { name: 'Respiración profunda (2 min)', duration: 120, label: 'Inhalar 4s, exhalar 6-8s' },
        ],
        rounds: 4,
      },
    ]

    const ensureExercise = async (name: string) => {
      const existing = await db.exercises
        .filter((item) => item.name.toLowerCase() === name.toLowerCase())
        .first()
      if (existing) return existing.id
      const id = crypto.randomUUID()
      await db.exercises.add({
        id,
        name,
        videoFile: undefined,
        videoUrl: '',
        createdAt: Date.now(),
      })
      return id
    }

    let createdRoutines = 0

    for (const day of weeklyPlan) {
      const existingRoutine = await db.routines
        .filter((item) => item.name.toLowerCase() === day.name.toLowerCase())
        .first()
      if (existingRoutine && !force) {
        continue
      }
      if (existingRoutine && force) {
        await db.routines.delete(existingRoutine.id)
      }

      const exerciseIds: string[] = []
      for (const exercise of day.exercises) {
        const id = await ensureExercise(exercise)
        exerciseIds.push(id)
      }

      const warmupPhases =
        day.warmupPhases ?? [{ name: 'Calentamiento (3 min)', duration: 180 }]
      const cooldownPhases =
        day.cooldownPhases ?? [
          { name: 'Respiración supina 4/8 (1 min)', duration: 60 },
          { name: 'Estiramiento pasivo (1 min)', duration: 60 },
        ]
      const rounds = day.rounds ?? 5

      const intervals = []
      for (const phase of warmupPhases) {
        const phaseExerciseId = await ensureExercise(phase.name)
        intervals.push({
          id: crypto.randomUUID(),
          type: 'EXERCISE' as const,
          duration: phase.duration,
          exerciseId: phaseExerciseId,
          label: phase.label,
        })
      }

      for (let round = 0; round < rounds; round += 1) {
        for (const exerciseId of exerciseIds) {
          if (day.phasePattern && day.phasePattern.length > 0) {
            for (let phaseIndex = 0; phaseIndex < day.phasePattern.length; phaseIndex += 1) {
              const phaseSeconds = day.phasePattern[phaseIndex]
              const phaseLabel = day.phaseLabels?.[phaseIndex]
              intervals.push({
                id: crypto.randomUUID(),
                type: 'EXERCISE' as const,
                duration: phaseSeconds,
                exerciseId,
                label: phaseLabel,
              })
            }
          } else {
            intervals.push({
              id: crypto.randomUUID(),
              type: 'EXERCISE' as const,
              duration: 60,
              exerciseId,
            })
          }
        }
      }

      for (const phase of cooldownPhases) {
        const phaseExerciseId = await ensureExercise(phase.name)
        intervals.push({
          id: crypto.randomUUID(),
          type: 'EXERCISE' as const,
          duration: phase.duration,
          exerciseId: phaseExerciseId,
          label: phase.label,
        })
      }

      const now = Date.now()
      await db.routines.add({
        id: crypto.randomUUID(),
        name: day.name,
        intervals,
        createdAt: now,
        updatedAt: now,
      })
      createdRoutines += 1
    }

    await refreshExercises()
    await loadRoutines()
    setSeedMessage(
      createdRoutines > 0
        ? `Se cargaron ${createdRoutines} rutinas semanales.`
        : force
          ? 'Se reemplazaron las rutinas semanales.'
          : 'Las rutinas semanales ya existían.'
    )
  }

  const canBuild = exercises.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-700 bg-ink-800/70 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Plan semanal</p>
          <p className="text-sm text-ink-200">
            Crea automáticamente las rutinas diarias del plan anti-adaptación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void seedWeeklyPlan()} variant="ghost">
            Cargar plan semanal
          </Button>
          <Button onClick={() => void seedWeeklyPlan(true)} variant="ghost">
            Re-crear plan semanal
          </Button>
        </div>
      </div>
      {seedMessage && (
        <div className="rounded-2xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-sm text-ink-200">
          {seedMessage}
        </div>
      )}
      {exercisesLoading ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Cargando ejercicios...
        </div>
      ) : !canBuild ? (
        <EmptyState
          title="Primero crea ejercicios"
          description="Necesitas ejercicios guardados para armar una rutina."
          actionLabel="Ir a ejercicios"
        />
      ) : (
        <RoutineBuilder
          exercises={exercises}
          routine={editing}
          onSave={handleSave}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="rounded-3xl border border-ink-700 bg-ink-800/70 p-6 text-sm text-ink-300">
          Cargando rutinas...
        </div>
      ) : sortedRoutines.length === 0 ? (
        <EmptyState
          title="Sin rutinas guardadas"
          description="Combina ejercicios y descansos con duraciones precisas."
          actionLabel="Nueva rutina"
        />
      ) : (
        <RoutineList
          routines={sortedRoutines}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
