import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Interval, Routine, RoutineBlock } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { RoutineList } from './RoutineList'
import { useExerciseOptions } from '@/hooks/useExerciseOptions'
import { useRoutines } from '@/hooks/useRoutines'
import { Check, Columns, Grid3X3, Square } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { db } from '@/repositories/db'
import { expandRoutineIntervals } from '@/utils/routineIntervals'

export function RoutineManager() {
  const navigate = useNavigate()
  const { routines, loading, removeRoutine, refresh: loadRoutines } = useRoutines()
  const { options: exercises, loading: exercisesLoading, refresh: refreshExercises } =
    useExerciseOptions()
  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([])
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null)
  const [sortKey, setSortKey] = useState<'name' | 'created'>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [columns, setColumns] = useState<1 | 2 | 3>(3)

  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()

  const filteredRoutines = useMemo(() => {
    if (!query.trim()) return routines
    const needle = normalize(query)
    return routines.filter((routine) => normalize(routine.name).includes(needle))
  }, [query, routines])

  const sortedRoutines = useMemo(() => {
    const sorted = [...filteredRoutines].sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      }
      return (a.createdAt ?? 0) - (b.createdAt ?? 0)
    })
    return sortDir === 'desc' ? sorted.reverse() : sorted
  }, [filteredRoutines, sortDir, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedRoutines.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pagedRoutines = sortedRoutines.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage)
    }
  }, [currentPage, page])

  const allSelected = useMemo(
    () => filteredRoutines.length > 0 && selectedRoutineIds.length === filteredRoutines.length,
    [filteredRoutines.length, selectedRoutineIds.length]
  )

  const toggleSelectRoutine = (id: string) => {
    setSelectedRoutineIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRoutineIds([])
    } else {
      setSelectedRoutineIds(filteredRoutines.map((item) => item.id))
    }
  }

  const handleBulkDelete = async () => {
    const ids = bulkDeleteMode === 'all' ? routines.map((item) => item.id) : selectedRoutineIds
    if (ids.length === 0) {
      setBulkDeleteMode(null)
      return
    }
    await Promise.all(ids.map((id) => removeRoutine(id)))
    setSelectedRoutineIds([])
    setBulkDeleteMode(null)
  }

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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
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
          { name: 'Marcha activa + brazos', duration: 60 },
          { name: 'Movilidad cadera + hombros', duration: 60 },
          { name: '10 sentadillas + 10 flexiones + 20 jumping jacks', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
        ],
      },
      {
        name: 'Domingo - Activo Obligatorio',
        exercises: [
          'Sentadilla muy lenta sin peso',
          'Puente de glúteos lento',
          'Remo ligero con pesas',
          'Marcha con carga ligera',
          'Plancha relajada',
        ],
        phasePattern: [40, 20],
        phaseLabels: ['TRABAJO 40s', 'CONTROL 20s'],
        warmupPhases: [
          { name: 'Marcha continua (2 min) · Ritmo medio + brazos sueltos', duration: 120 },
          { name: 'Movilidad: círculos de cadera (1 min)', duration: 60 },
          { name: 'Movilidad: rotaciones de columna (1 min)', duration: 60 },
          { name: 'Movilidad: hombros con palo (1 min)', duration: 60 },
        ],
        cooldownPhases: [
          { name: 'Estiramiento glúteos (1 min) · Figura 4 en el suelo', duration: 60 },
          { name: 'Isquios + espalda baja (1 min) · Sin rebotes, sin forzar', duration: 60 },
          { name: 'Pectoral y hombros (1 min) · Apertura suave', duration: 60 },
          { name: 'Respiración profunda (2 min) · Inhalar 4s, exhalar 6-8s', duration: 120 },
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
        imageFiles: undefined,
        mediaType: 'none',
        imageSlideSeconds: 5,
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
          { name: 'Respiración supina 4/8', duration: 60 },
          { name: 'Estiramiento pasivo', duration: 60 },
        ]
      const rounds = day.rounds ?? 5

      const blocks: RoutineBlock[] = []
      const warmupIntervals: Interval[] = []
      for (const phase of warmupPhases) {
        const phaseExerciseId = await ensureExercise(phase.name)
        warmupIntervals.push({
          id: crypto.randomUUID(),
          type: 'EXERCISE' as const,
          duration: phase.duration,
          exerciseId: phaseExerciseId,
        })
      }
      if (warmupIntervals.length > 0) {
        blocks.push({
          id: crypto.randomUUID(),
          name: 'Activación',
          rounds: 1,
          intervals: warmupIntervals,
        })
      }

      const workIntervals: Interval[] = []
      for (const exerciseId of exerciseIds) {
        if (day.phasePattern && day.phasePattern.length > 0) {
          const baseExercise = await db.exercises.get(exerciseId)
          const baseName = baseExercise?.name ?? 'Ejercicio'
          for (let phaseIndex = 0; phaseIndex < day.phasePattern.length; phaseIndex += 1) {
            const phaseSeconds = day.phasePattern[phaseIndex]
            const phaseLabel = day.phaseLabels?.[phaseIndex]
            const phaseName = phaseLabel ? `${baseName} · ${phaseLabel}` : baseName
            const phaseExerciseId = await ensureExercise(phaseName)
            workIntervals.push({
              id: crypto.randomUUID(),
              type: 'EXERCISE' as const,
              duration: phaseSeconds,
              exerciseId: phaseExerciseId,
            })
          }
        } else {
          workIntervals.push({
            id: crypto.randomUUID(),
            type: 'EXERCISE' as const,
            duration: 60,
            exerciseId,
          })
        }
      }
      if (workIntervals.length > 0) {
        blocks.push({
          id: crypto.randomUUID(),
          name: 'Trabajo',
          rounds,
          intervals: workIntervals,
        })
      }

      const cooldownIntervals: Interval[] = []
      for (const phase of cooldownPhases) {
        const phaseExerciseId = await ensureExercise(phase.name)
        cooldownIntervals.push({
          id: crypto.randomUUID(),
          type: 'EXERCISE' as const,
          duration: phase.duration,
          exerciseId: phaseExerciseId,
        })
      }
      if (cooldownIntervals.length > 0) {
        blocks.push({
          id: crypto.randomUUID(),
          name: 'Cierre',
          rounds: 1,
          intervals: cooldownIntervals,
        })
      }

      const intervals = expandRoutineIntervals({
        id: crypto.randomUUID(),
        name: day.name,
        intervals: [],
        blocks,
        createdAt: 0,
        updatedAt: 0,
      })

      const now = Date.now()
      await db.routines.add({
        id: crypto.randomUUID(),
        name: day.name,
        intervals,
        blocks,
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

  const seedEdtPlan = async (force = false) => {
    setSeedMessage(null)

    type BlockItem = { name: string; duration: number; type?: 'EXERCISE' | 'REST'; notes?: string }
    type DayPlan = { name: string; blocks: { name: string; rounds: number; items: BlockItem[] }[] }

    const mondayWarmup: BlockItem[] = [
      { name: 'Círculos cadera', duration: 60, notes: '10 por lado' },
      { name: 'Cat-cow', duration: 60, notes: '10 reps' },
      { name: "World's greatest stretch", duration: 60, notes: '3 por lado' },
      { name: 'Clamshells', duration: 75, notes: '15 por lado' },
      { name: 'Puentes', duration: 45, notes: 'Sin peso · 15 reps' },
      { name: "Child's pose", duration: 90, notes: 'Brazos extendidos · 3x30s' },
      { name: 'Cat-cow', duration: 90, notes: 'Profundo · 15 reps · Énfasis elongación' },
      { name: 'Chin tucks', duration: 50, notes: '10 x 5s' },
      { name: 'Rotaciones cervicales', duration: 40, notes: '6 por lado' },
      { name: 'Sentadillas', duration: 15, notes: '5 reps · Lentas' },
      { name: 'Hip thrust', duration: 15, notes: '5 reps · Lentos' },
    ]

    const tuesdayWarmup: BlockItem[] = [
      { name: 'Círculos brazos', duration: 40, notes: '10 adelante/atrás' },
      { name: 'Shoulder dislocations', duration: 40, notes: '10 reps' },
      { name: 'Protracción/retracción escapular', duration: 40, notes: '15 reps' },
      { name: 'Dead bugs', duration: 60, notes: '10 reps' },
      { name: 'Plancha', duration: 30, notes: '30 seg' },
      { name: 'Cat-cow', duration: 30, notes: '10 reps' },
      { name: 'Dead hang', duration: 60, notes: '2x30s' },
      { name: 'Extensión torácica', duration: 60, notes: 'Brazos arriba · 10 reps' },
      { name: 'Chin tucks', duration: 50, notes: '10 x 5s' },
      { name: 'Rotaciones cervicales', duration: 40, notes: '6 por lado' },
      { name: 'Extensión cervical controlada', duration: 30, notes: '8 x 3s' },
    ]

    const saturdayWarmup: BlockItem[] = [
      { name: 'Círculos cadera', duration: 60, notes: '10 por lado' },
      { name: 'Círculos brazos', duration: 45, notes: '10 por dirección' },
      { name: 'Cat-cow', duration: 45, notes: '10 reps' },
      { name: 'Squat hold', duration: 30, notes: '30 seg' },
      { name: 'Dead hang', duration: 90, notes: '3x30s' },
      { name: "Child's pose", duration: 60, notes: '60 seg' },
      { name: 'Chin tucks', duration: 50, notes: '10 x 5s' },
      { name: 'Rotaciones cervicales', duration: 40, notes: '6 por lado' },
      { name: 'Ajuste respiratorio suave', duration: 30 },
    ]

    const mondayCool: BlockItem[] = [
      { name: 'Glúteos', duration: 90, notes: '45s por lado' },
      { name: 'Flexores cadera', duration: 90, notes: '45s por lado' },
      { name: 'Isquiotibiales', duration: 30, notes: '30s' },
      { name: 'Estiramiento lateral cuello', duration: 90, notes: '45s por lado' },
      { name: 'Respiración', duration: 60, notes: '4-6-8 · 10 respiraciones' },
    ]

    const tuesdayCool: BlockItem[] = [
      { name: 'Pectorales', duration: 120, notes: '60s por lado' },
      { name: 'Tríceps', duration: 90, notes: '45s por brazo' },
      { name: 'Hombros', duration: 90, notes: '45s por lado' },
      { name: 'Estiramiento cuello frontal', duration: 60, notes: '60s' },
      { name: 'Cat-cow', duration: 30, notes: '10 reps' },
    ]

    const thursdayCool: BlockItem[] = [
      { name: 'Dorsales', duration: 60, notes: 'Colgado · 60s' },
      { name: 'Trapecio', duration: 90, notes: '45s por lado' },
      { name: 'Pectorales', duration: 90, notes: '45s por lado' },
      { name: 'Estiramiento sub-occipital', duration: 35, notes: '35s' },
      { name: 'Cat-cow', duration: 25, notes: '10 reps' },
    ]

    const postureBlock: BlockItem[] = [
      { name: 'Wall Angels', duration: 120, notes: '3x12 reps · Tempo 3-2-3 · Barbilla metida' },
      { name: 'Prone Cobra', duration: 120, notes: '3x5 reps · Mantén 5s · Cuello neutral' },
      { name: 'Neck Isometrics', duration: 120, notes: '2x10s cada dirección · Descanso 20s' },
      { name: 'Elongación espinal final', duration: 120, notes: "Child's pose 60s + Dead hang 40s + Gato-vaca 20s" },
    ]

    const edtPlan: DayPlan[] = [
      {
        name: 'EDT Lunes - Glúteos/Piernas + Core',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: mondayWarmup },
          {
            name: 'EDT 1',
            rounds: 6,
            items: [
              {
                name: 'Hip Thrust',
                duration: 70,
                notes: '5kg · Tempo 3-1-3-0 · 12 reps · Contrae glúteos antes de subir',
              },
              {
                name: 'Sentadilla Búlgara',
                duration: 60,
                notes: '5kg · Tempo 3-0-3-0 · 10 reps · 5 por pierna · Peso en talón delantero',
              },
              { name: 'Descanso', duration: 20, type: 'REST', notes: '20-40 seg' },
            ],
          },
          {
            name: 'EDT 2',
            rounds: 6,
            items: [
              {
                name: 'Good Mornings',
                duration: 90,
                notes: 'Palo escoba · Tempo 3-0-3-1 · 15 reps · Cadera atrás, no doblar cintura',
              },
              {
                name: 'Plancha shoulder taps',
                duration: 40,
                notes: 'Controlado · 20 reps · Cadera sin rotar',
              },
              { name: 'Descanso', duration: 20, type: 'REST', notes: '15-30 seg' },
            ],
          },
          {
            name: 'Finisher Core',
            rounds: 4,
            items: [
              { name: 'Dead bugs', duration: 50, notes: '20 reps' },
              { name: 'Plancha lateral', duration: 30, notes: 'Izquierda · 30 seg' },
              { name: 'Plancha lateral', duration: 30, notes: 'Derecha · 30 seg' },
              { name: 'Hollow body hold', duration: 20, notes: '20 seg' },
              { name: 'Descanso', duration: 20, type: 'REST' },
            ],
          },
          { name: 'Postura + Elongación', rounds: 1, items: postureBlock },
          { name: 'Vuelta a la calma', rounds: 1, items: mondayCool },
        ],
      },
      {
        name: 'EDT Martes - Torso/Brazos + Metabólico',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: tuesdayWarmup },
          {
            name: 'EDT 1',
            rounds: 5,
            items: [
              {
                name: 'Flexiones',
                duration: 60,
                notes: 'Tempo 3-0-2-0 · 10-12 reps · Variante rodillas si necesario',
              },
              {
                name: 'Curl bíceps unilateral',
                duration: 100,
                notes: '5kg · Tempo 3-1-3-0 · 15 reps alternando · Cero balanceo',
              },
              { name: 'Descanso', duration: 20, type: 'REST' },
            ],
          },
          {
            name: 'EDT 2',
            rounds: 10,
            items: [
              { name: 'Plancha comandos', duration: 40, notes: 'Up-downs · 12 reps · Cadera estable' },
              { name: 'Fondos tríceps', duration: 50, notes: 'Tempo 3-0-2-0 · 10 reps · Codos atrás' },
            ],
          },
          {
            name: 'Finisher Metabólico',
            rounds: 6,
            items: [
              { name: 'Mountain climbers', duration: 30, notes: '30 seg' },
              { name: 'Descanso', duration: 15, type: 'REST' },
              { name: 'Burpees', duration: 30, notes: '30 seg' },
              { name: 'Descanso', duration: 15, type: 'REST' },
            ],
          },
          { name: 'Vuelta a la calma', rounds: 1, items: tuesdayCool },
        ],
      },
      {
        name: 'EDT Miércoles - Glúteos/Piernas + Core',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: mondayWarmup },
          {
            name: 'EDT 1',
            rounds: 5,
            items: [
              { name: 'Zancadas caminando', duration: 80, notes: '5kg · Tempo 2-0-2-0 · 20 reps · Torso vertical' },
              { name: 'Puente glúteo unilateral', duration: 100, notes: 'Tempo 3-2-3-0 · 12 reps · 6 por pierna' },
              { name: 'Descanso', duration: 12, type: 'REST' },
            ],
          },
          {
            name: 'EDT 2',
            rounds: 5,
            items: [
              { name: 'Peso muerto rumano', duration: 90, notes: '5kg · Tempo 3-0-3-1 · 15 reps · Cadera atrás' },
              { name: 'Plancha con elevación pierna', duration: 80, notes: 'Tempo 2-1-2-0 · 16 reps · 8 por pierna' },
              { name: 'Descanso', duration: 10, type: 'REST' },
            ],
          },
          {
            name: 'Finisher Core',
            rounds: 3,
            items: [
              { name: 'Russian twists', duration: 45, notes: '20 reps' },
              { name: 'Bird dogs', duration: 45, notes: '12 reps' },
              { name: 'Side plank hip dips', duration: 60, notes: '10 reps por lado' },
              { name: 'Descanso', duration: 30, type: 'REST' },
            ],
          },
          { name: 'Postura + Elongación', rounds: 1, items: postureBlock },
          { name: 'Vuelta a la calma', rounds: 1, items: mondayCool },
        ],
      },
      {
        name: 'EDT Jueves - Torso/Espalda + Metabólico',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: tuesdayWarmup },
          {
            name: 'EDT 1',
            rounds: 6,
            items: [
              { name: 'Remo inclinado', duration: 70, notes: '5kg · Tempo 2-1-2-0 · 12 reps · Retracción escapular' },
              { name: 'Flexiones diamante', duration: 50, notes: 'Tempo 3-0-2-0 · 8-10 reps · Codos pegados' },
              { name: 'Descanso', duration: 30, type: 'REST' },
            ],
          },
          {
            name: 'EDT 2',
            rounds: 5,
            items: [
              { name: 'Superman', duration: 120, notes: 'Tempo 3-2-3-1 · 15 reps · Contrae lumbar + glúteos' },
              { name: 'Plancha shoulder taps', duration: 40, notes: '20 reps · Cadera estable' },
              { name: 'Descanso', duration: 20, type: 'REST' },
            ],
          },
          {
            name: 'Finisher Metabólico',
            rounds: 5,
            items: [
              { name: 'High knees', duration: 40, notes: '40 seg' },
              { name: 'Descanso', duration: 20, type: 'REST' },
              { name: 'Jumping jacks', duration: 40, notes: '40 seg' },
              { name: 'Descanso', duration: 20, type: 'REST' },
            ],
          },
          { name: 'Vuelta a la calma', rounds: 1, items: thursdayCool },
        ],
      },
      {
        name: 'EDT Viernes - Glúteos/Piernas + Core',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: mondayWarmup },
          {
            name: 'EDT 1',
            rounds: 4,
            items: [
              { name: 'Hip Thrust pies elevados', duration: 95, notes: '5kg · Tempo 3-2-3-0 · 12 reps · Contrae glúteos arriba' },
              { name: 'Sentadilla sumo', duration: 105, notes: '5kg · Tempo 3-0-3-1 · 15 reps · Rodillas siguen puntas' },
              { name: 'Descanso', duration: 25, type: 'REST' },
            ],
          },
          {
            name: 'EDT 2',
            rounds: 6,
            items: [
              { name: 'Step-ups unilateral', duration: 90, notes: '5kg · Tempo 2-0-2-0 · 16 reps · 8 por pierna' },
              { name: 'Plancha RKC', duration: 30, notes: '30 seg · Tensión total' },
              { name: 'Descanso', duration: 30, type: 'REST' },
            ],
          },
          {
            name: 'Finisher Core',
            rounds: 3,
            items: [
              { name: 'V-ups', duration: 30, notes: '12 reps' },
              { name: 'Plank to pike', duration: 45, notes: '10 reps' },
              { name: 'Dead bugs', duration: 60, notes: '15 reps' },
              { name: 'Descanso', duration: 45, type: 'REST' },
            ],
          },
          { name: 'Postura + Elongación', rounds: 1, items: postureBlock },
          { name: 'Vuelta a la calma', rounds: 1, items: mondayCool },
        ],
      },
      {
        name: 'EDT Sábado - Full Body + Cardio-Fuerza',
        blocks: [
          { name: 'Calentamiento', rounds: 1, items: saturdayWarmup },
          {
            name: 'Full Body EDT',
            rounds: 5,
            items: [
              { name: 'Sentadilla Goblet', duration: 50, notes: '5kg · 12 reps · Tempo 2-0-2-0' },
              { name: 'Flexiones', duration: 40, notes: '10 reps · Tempo 2-0-2-0' },
              { name: 'Zancadas alternadas', duration: 60, notes: '16 reps · Tempo 2-0-2-0' },
              { name: 'Remo', duration: 60, notes: '12 reps · Tempo 2-1-2-0' },
              { name: 'Descanso', duration: 30, type: 'REST' },
            ],
          },
          {
            name: 'Cardio-Fuerza',
            rounds: 6,
            items: [
              { name: 'Burpees', duration: 40, notes: '10 reps' },
              { name: 'Mountain climbers', duration: 20, notes: '20 reps' },
              { name: 'Jumping jacks', duration: 45, notes: '30 reps' },
              { name: 'Descanso', duration: 45, type: 'REST' },
            ],
          },
          {
            name: 'Elongación espinal',
            rounds: 1,
            items: [
              { name: 'Dead hang', duration: 90, notes: '90 seg' },
              { name: 'Cat-cow', duration: 90, notes: 'Profundo · 20 reps · Respiración completa' },
              { name: 'Extensión torácica', duration: 60, notes: '60 seg' },
              { name: "Child's pose final", duration: 60, notes: '60 seg' },
            ],
          },
          {
            name: 'Vuelta a la calma',
            rounds: 1,
            items: [
              { name: 'Piernas', duration: 90, notes: '90 seg' },
              { name: 'Torso', duration: 60, notes: '60 seg' },
              { name: 'Brazos', duration: 60, notes: '60 seg' },
              { name: 'Cuello completo', duration: 90, notes: '90 seg' },
            ],
          },
        ],
      },
      {
        name: 'EDT Domingo - Movilidad + Core + Elongación',
        blocks: [
          {
            name: 'Movilidad articular',
            rounds: 1,
            items: [
              { name: 'Chin tucks', duration: 120, notes: 'Sentado · 15 reps x 8s' },
              { name: 'Rotaciones cervicales', duration: 90, notes: '10 por lado · Super lentas' },
              { name: 'Flexión/extensión cervical', duration: 60, notes: '12 reps' },
              { name: 'Círculos cadera', duration: 90, notes: '15 por lado' },
              { name: 'Cat-cow', duration: 120, notes: 'Profundo · 20 reps · Respiración completa' },
              { name: 'Shoulder dislocations', duration: 60, notes: '20 reps' },
              { name: "World's greatest stretch", duration: 90, notes: '8 por lado · Mantener 15s' },
              { name: '90/90 hip switches', duration: 45, notes: '12 cambios' },
              { name: 'Wall slides', duration: 30, notes: '15 reps · Barbilla metida' },
              { name: 'Extensión torácica', duration: 15, notes: 'Brazos arriba · 15 reps' },
            ],
          },
          {
            name: 'Core activación suave',
            rounds: 3,
            items: [
              { name: 'Dead bugs', duration: 60, notes: '15 reps · Tempo 3-0-3' },
              { name: 'Bird dogs', duration: 70, notes: '12 por lado · Tempo 3-2-3' },
              { name: 'Plancha corta', duration: 40, notes: '40 seg · Forma perfecta' },
              { name: 'Glute bridges', duration: 30, notes: 'Sin peso · 20 reps · Tempo 2-1-2' },
            ],
          },
          {
            name: 'Elongación espinal profunda',
            rounds: 1,
            items: [
              { name: "Child's pose", duration: 90, notes: 'Brazos extendidos · Respiración 4s inhala / 6s exhala' },
              { name: 'Dead hang', duration: 60, notes: 'O simulación · 3x20s' },
              { name: 'Gato-vaca', duration: 75, notes: 'Super lento · 15 reps · 5s cada fase' },
              { name: 'Sphinx pose', duration: 60, notes: '60 seg' },
              { name: 'Legs up the wall', duration: 90, notes: '90 seg' },
              { name: 'Savasana con elongación', duration: 60, notes: '60 seg' },
            ],
          },
          {
            name: 'Estiramiento pasivo final',
            rounds: 1,
            items: [
              { name: 'Estiramiento lateral cuello', duration: 120, notes: '60s por lado' },
              { name: 'Estiramiento frontal cuello', duration: 60, notes: '60s' },
              { name: 'Estiramiento sub-occipital', duration: 45, notes: '45s' },
              { name: 'Glúteos', duration: 90, notes: 'Figura 4 · 45s por lado' },
              { name: 'Flexores cadera', duration: 60, notes: '30s por lado' },
            ],
          },
        ],
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
        imageFiles: undefined,
        mediaType: 'none',
        imageSlideSeconds: 5,
        videoUrl: '',
        createdAt: Date.now(),
      })
      return id
    }

    let createdRoutines = 0

    for (const day of edtPlan) {
      const existingRoutine = await db.routines
        .filter((item) => item.name.toLowerCase() === day.name.toLowerCase())
        .first()
      if (existingRoutine && !force) {
        continue
      }
      if (existingRoutine && force) {
        await db.routines.delete(existingRoutine.id)
      }

      const blocks: RoutineBlock[] = []
      for (const block of day.blocks) {
        const intervals: Interval[] = []
        for (const item of block.items) {
          if (item.type === 'REST') {
            intervals.push({
              id: crypto.randomUUID(),
              type: 'REST',
              duration: item.duration,
              label: 'Descanso',
              notes: item.notes,
            })
          } else {
            const exerciseId = await ensureExercise(item.name)
            intervals.push({
              id: crypto.randomUUID(),
              type: 'EXERCISE',
              duration: item.duration,
              exerciseId,
              notes: item.notes,
            })
          }
        }
        blocks.push({
          id: crypto.randomUUID(),
          name: block.name,
          rounds: block.rounds,
          intervals,
        })
      }

      const intervals = expandRoutineIntervals({
        id: crypto.randomUUID(),
        name: day.name,
        intervals: [],
        blocks,
        createdAt: 0,
        updatedAt: 0,
      })

      const now = Date.now()
      await db.routines.add({
        id: crypto.randomUUID(),
        name: day.name,
        intervals,
        blocks,
        createdAt: now,
        updatedAt: now,
      })
      createdRoutines += 1
    }

    await refreshExercises()
    await loadRoutines()
    setSeedMessage(
      createdRoutines > 0
        ? `Se cargaron ${createdRoutines} rutinas EDT completas.`
        : force
          ? 'Se reemplazaron las rutinas EDT completas.'
          : 'Las rutinas EDT completas ya existían.'
    )
  }

  const canBuild = exercises.length > 0

  return (
    <div className="section-stack">
      <div className="surface-panel flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
        <div>
          <p className="form-label">Plan semanal</p>
          <p className="form-help">
            Crea automáticamente las rutinas diarias del plan anti-adaptación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void seedWeeklyPlan()}>
            Cargar plan semanal
          </Button>
          <Button onClick={() => void seedWeeklyPlan(true)} variant="secondary">
            Re-crear plan semanal
          </Button>
          <Button onClick={() => void seedEdtPlan()} variant="ghost">
            Cargar plan EDT completo
          </Button>
          <Button onClick={() => void seedEdtPlan(true)} variant="secondary">
            Re-crear plan EDT completo
          </Button>
        </div>
      </div>
      {seedMessage && (
        <div className="surface-card rounded-2xl px-4 py-3 text-sm text-ink-200">
          {seedMessage}
        </div>
      )}
      <div className="surface-card section-stack p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="form-label">Biblioteca</p>
            <h3 className="mt-1 font-display text-2xl text-ink-50">Rutinas</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-2xl border border-ink-700 bg-ink-900/60 p-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]">
                <button
                  type="button"
                  onClick={() => setColumns(1)}
                  title="1 columna"
                  aria-label="1 columna"
                  className={`rounded-xl px-2.5 py-1.5 text-xs transition ${
                    columns === 1
                      ? 'bg-ink-50 text-ink-900 shadow-[0_6px_16px_-10px_rgba(255,255,255,0.9)]'
                      : 'text-ink-300 hover:text-ink-50'
                  }`}
                >
                  <Square className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(2)}
                  title="2 columnas"
                  aria-label="2 columnas"
                  className={`rounded-xl px-2.5 py-1.5 text-xs transition ${
                    columns === 2
                      ? 'bg-ink-50 text-ink-900 shadow-[0_6px_16px_-10px_rgba(255,255,255,0.9)]'
                      : 'text-ink-300 hover:text-ink-50'
                  }`}
                >
                  <Columns className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(3)}
                  title="3 columnas"
                  aria-label="3 columnas"
                  className={`rounded-xl px-2.5 py-1.5 text-xs transition ${
                    columns === 3
                      ? 'bg-ink-50 text-ink-900 shadow-[0_6px_16px_-10px_rgba(255,255,255,0.9)]'
                      : 'text-ink-300 hover:text-ink-50'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
              <label className="text-xs text-ink-300" htmlFor="routine-sort">
                Orden
              </label>
              <select
                id="routine-sort"
                value={`${sortKey}:${sortDir}`}
                onChange={(event) => {
                  const [key, dir] = event.target.value.split(':') as ['name' | 'created', 'asc' | 'desc']
                  setSortKey(key)
                  setSortDir(dir)
                  setPage(1)
                }}
                className="input-field min-w-[160px] text-xs"
              >
                <option value="created:desc">Más recientes</option>
                <option value="created:asc">Más antiguas</option>
                <option value="name:asc">Nombre A-Z</option>
                <option value="name:desc">Nombre Z-A</option>
              </select>
              <label className="text-xs text-ink-300" htmlFor="routine-size">
                Por página
              </label>
              <select
                id="routine-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
                className="input-field w-[88px] text-xs"
              >
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
              </select>
            </div>
            <label className="group flex items-center gap-2 text-xs text-ink-300">
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="peer sr-only"
                />
                <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-ink-600 bg-ink-900/60 text-transparent opacity-0 transition group-hover:opacity-100 peer-checked:opacity-100 peer-focus-visible:opacity-100 peer-checked:border-accent-400 peer-checked:bg-accent-500 peer-checked:text-ink-900">
                  <Check className="h-4 w-4 text-current" />
                </span>
              </span>
            </label>
            <Button
              variant="ghost"
              onClick={() => setBulkDeleteMode('selected')}
              disabled={selectedRoutineIds.length === 0}
            >
              Eliminar seleccionadas
            </Button>
            <Button variant="ghost" onClick={() => setBulkDeleteMode('all')}>
              Eliminar todo
            </Button>
            <Button
              onClick={() => navigate('/crear/nueva')}
              disabled={exercisesLoading || !canBuild}
            >
              Nueva rutina
            </Button>
          </div>
        </div>
      </div>
      <div className="sticky top-20 z-30 mt-3 bg-[color:var(--surface-panel-bg)]/90 pb-3 pt-2 backdrop-blur">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar rutina"
          className="input-field"
        />
      </div>

      {exercisesLoading && (
        <div className="surface-panel mt-4 p-4 text-sm text-ink-300 sm:p-6">
          Cargando ejercicios...
        </div>
      )}
      {!exercisesLoading && !canBuild && (
        <div className="mt-4">
          <EmptyState
            title="Primero crea ejercicios"
            description="Necesitas ejercicios guardados para armar una rutina."
            actionLabel="Ir a ejercicios"
          />
        </div>
      )}

      {loading ? (
        <div className="surface-panel mt-4 rounded-2xl p-4 text-sm text-ink-300">
          Cargando rutinas...
        </div>
      ) : filteredRoutines.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={query ? 'Sin coincidencias' : 'Sin rutinas guardadas'}
            description={
              query
                ? 'Prueba con otro nombre de rutina.'
                : 'Combina ejercicios y descansos con duraciones precisas.'
            }
            actionLabel="Nueva rutina"
            onAction={() => navigate('/crear/nueva')}
          />
        </div>
      ) : (
        <div className="mt-4">
            <RoutineList
              routines={pagedRoutines}
              onEdit={(routine) => navigate(`/editar/${routine.id}`)}
              onDelete={handleDelete}
              selectedIds={selectedRoutineIds}
              onToggleSelect={toggleSelectRoutine}
              columns={columns}
            />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-300">
            <span>
              Mostrando {sortedRoutines.length === 0 ? 0 : pageStart + 1}-
              {Math.min(pageStart + pageSize, sortedRoutines.length)} de {sortedRoutines.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-ink-200">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Eliminar rutina"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (pendingDeleteId) {
            void removeRoutine(pendingDeleteId)
          }
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmDialog
        open={Boolean(bulkDeleteMode)}
        title={bulkDeleteMode === 'all' ? 'Eliminar todas las rutinas' : 'Eliminar rutinas seleccionadas'}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => void handleBulkDelete()}
        onCancel={() => setBulkDeleteMode(null)}
      />
    </div>
  )
}
