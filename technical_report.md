# INFORME TÉCNICO: APLICACIÓN DE RUTINAS DE EJERCICIOS PERSONALIZABLES PARA DESKTOP

## VERSIÓN 1.0 | FEBRERO 2026

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Visión General del Producto](#2-visión-general-del-producto)
3. [Análisis de Plataformas](#3-análisis-de-plataformas)
4. [Decisión de Plataforma](#4-decisión-de-plataforma)
5. [Requerimientos Funcionales](#5-requerimientos-funcionales)
6. [Requerimientos No Funcionales](#6-requerimientos-no-funcionales)
7. [Arquitectura del Sistema](#7-arquitectura-del-sistema)
8. [Modelo de Datos](#8-modelo-de-datos)
9. [Componentes Técnicos Críticos](#9-componentes-técnicos-críticos)
10. [Stack Tecnológico](#10-stack-tecnológico)
11. [Gestión de Estados del Sistema](#11-gestión-de-estados-del-sistema)
12. [Diseño de Experiencia de Usuario](#12-diseño-de-experiencia-de-usuario)
13. [Persistencia y Almacenamiento](#13-persistencia-y-almacenamiento)
14. [Seguridad y Límites](#14-seguridad-y-límites)
15. [Gestión de Riesgos](#15-gestión-de-riesgos)
16. [Roadmap de Desarrollo](#16-roadmap-de-desarrollo)
17. [Criterios de Éxito](#17-criterios-de-éxito)
18. [Conclusiones y Recomendaciones](#18-conclusiones-y-recomendaciones)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Descripción del Proyecto

Aplicación de escritorio para creación y ejecución de rutinas de ejercicio personalizables con temporizador integrado, gestión de multimedia y síntesis de voz. Orientada a usuarios que entrenan en casa frente a su computadora, permitiendo seguir rutinas tipo HIIT, Tabata o circuitos personalizados.

### 1.2 Objetivos Principales

- **Personalización total**: Ejercicios con nombres arbitrarios definidos por el usuario
- **Autonomía de ejecución**: Feedback de voz que elimina necesidad de mirar pantalla
- **Simplicidad técnica**: Funciona offline, sin cuentas, sin servidor
- **Precisión temporal**: Control de intervalos con error <50ms

### 1.3 Alcance del MVP

**Incluido:**
- Gestión completa de ejercicios (crear, listar, eliminar)
- Constructor de rutinas con intervalos personalizables
- Player con temporizador preciso, reproducción de video y síntesis de voz
- Persistencia local mediante IndexedDB
- Controles mediante teclado y mouse

**Excluido:**
- Backend/sincronización en la nube
- Biblioteca predefinida de ejercicios
- Edición de ejercicios existentes
- Estadísticas o historial
- Exportación/importación de datos
- Versión móvil

### 1.4 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo de creación de ejercicio | < 2 minutos |
| Tiempo de creación de rutina (10 intervalos) | < 5 minutos |
| Precisión del temporizador | Error < 50ms/hora |
| Tamaño del bundle | < 500KB (sin videos) |
| First load | < 2 segundos |

---

## 2. VISIÓN GENERAL DEL PRODUCTO

### 2.1 Contexto de Uso

**Usuario tipo:**
- Entrena en casa sin equipamiento complejo
- Busca estructura y disciplina en sus entrenamientos
- Prefiere personalizar ejercicios con su propia terminología
- Necesita referencias visuales (videos) para técnica correcta
- Entrena frente a computadora, alejado 2-3 metros de la pantalla

**Flujo típico de uso:**

```
Día 1: CONFIGURACIÓN
├── Crear 10-15 ejercicios con videos
├── Crear 2-3 rutinas base
└── Probar una rutina corta (5 min)

Día 2+: USO REGULAR
├── Abrir aplicación
├── Seleccionar rutina
├── Ejecutar sin interrupciones
└── Seguir audio sin mirar pantalla
```

### 2.2 Propuesta de Valor Diferenciadora

| Característica | Valor para el usuario |
|----------------|----------------------|
| **Personalización completa** | No depende de biblioteca predefinida, crea su propio vocabulario |
| **Feedback auditivo** | Permite entrenar sin mirar pantalla constantemente |
| **Videos integrados** | Referencia visual durante ejecución, no solo instrucciones estáticas |
| **Offline-first** | Funciona sin conexión, sin latencia, sin dependencias externas |
| **Zero setup** | Sin registro, sin login, sin configuración compleja |

### 2.3 Caso de Uso Principal Detallado

**Escenario:** Usuario ejecuta rutina HIIT de 20 minutos

```
1. Usuario selecciona "HIIT 20 min" de lista de rutinas
2. Click en "Iniciar rutina"
3. Pantalla muestra video de primer ejercicio
4. Voz anuncia: "Sentadillas"
5. Temporizador muestra 00:30 y comienza cuenta regresiva
6. Usuario ejecuta ejercicio sin mirar pantalla (guiado por voz)
7. A los 25 segundos: temporizador cambia a rojo (alerta visual)
8. Al llegar a 00:00:
   - Video del ejercicio se detiene
   - Voz anuncia: "Descanso"
   - Temporizador muestra 00:10
9. Durante descanso: pantalla en negro o logo de app
10. Al finalizar descanso:
    - Voz anuncia: "Burpees"
    - Video de burpees se carga y reproduce
11. Proceso se repite hasta completar todos los intervalos
12. Al finalizar: voz anuncia "Rutina completada"
13. Pantalla muestra resumen: "10 ejercicios - 20:00 minutos"
```

---

## 3. ANÁLISIS DE PLATAFORMAS

### 3.1 Opciones Evaluadas

Se evaluaron tres opciones principales para implementar la aplicación:

#### Opción A: Aplicación Web (PWA)

**Stack:** React/Vue + Vite + IndexedDB + Web APIs

**Ventajas:**
- ⚡ Desarrollo 2-3x más rápido que alternativas nativas
- 🌐 Multiplataforma sin cambios (Windows, macOS, Linux)
- 🛠️ Tooling maduro y familiar (npm, bundlers, DevTools)
- 🔄 Actualizaciones inmediatas (refresh del navegador)
- 📦 Bundle liviano (sin runtime de Electron)

**Desventajas:**
- 📁 Acceso limitado a filesystem (File API requiere permisos)
- 🚫 Sin icono nativo en desktop
- 🪟 Ocupa pestaña del navegador
- ⚠️ Límites de almacenamiento en IndexedDB (varía por navegador)

#### Opción B: Electron

**Stack:** Electron + React + SQLite/NeDB + Node.js APIs

**Ventajas:**
- 💾 Acceso completo al filesystem
- 🖥️ Aplicación nativa con icono en desktop
- 📚 Node.js integrado (cualquier librería npm backend)
- 🔗 Videos almacenados por path, no en memoria
- 🔔 Integración profunda con OS (notificaciones, tray icons)

**Desventajas:**
- 📦 Bundle pesado (~150MB mínimo)
- 🔀 Complejidad IPC (Main ↔ Renderer Process)
- 📥 Distribución compleja (instaladores por OS)
- 🔒 Configuración de seguridad crítica
- 💻 Mayor consumo de memoria (~100MB+ en idle)

#### Opción C: Tauri

**Stack:** Tauri + React + Rust backend + WebView nativo

**Ventajas:**
- 🪶 Bundle minúsculo (~5MB)
- ⚡ Performance superior (Rust compilado)
- 🔐 Seguridad por diseño
- 💾 Bajo consumo de memoria (~50MB)

**Desventajas:**
- 🦀 Requiere aprender Rust
- 📚 Ecosistema menos maduro
- 🐛 Debugging complejo (frontend + backend)
- 🌐 Inconsistencias entre WebViews del sistema

### 3.2 Matriz de Comparación

| Criterio | Web App | Electron | Tauri |
|----------|---------|----------|-------|
| **Complejidad inicial** | ⭐⭐⭐⭐⭐ Baja | ⭐⭐⭐⭐ Media | ⭐⭐⭐ Media-Alta |
| **Acceso a archivos** | ⭐⭐ Limitado | ⭐⭐⭐⭐⭐ Completo | ⭐⭐⭐⭐⭐ Completo |
| **Peso del bundle** | ⭐⭐⭐⭐⭐ Mínimo | ⭐⭐ Pesado | ⭐⭐⭐⭐⭐ Mínimo |
| **Integración OS** | ⭐⭐ Básica | ⭐⭐⭐⭐⭐ Completa | ⭐⭐⭐⭐ Alta |
| **Velocidad desarrollo** | ⭐⭐⭐⭐⭐ Rápido | ⭐⭐⭐⭐ Rápido | ⭐⭐⭐ Medio |
| **Mantenimiento** | ⭐⭐⭐⭐⭐ Bajo | ⭐⭐⭐⭐ Medio | ⭐⭐⭐ Medio |
| **Experiencia usuario** | ⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐ Muy buena |
| **Time-to-MVP** | ⭐⭐⭐⭐⭐ 4-6 semanas | ⭐⭐⭐⭐ 6-8 semanas | ⭐⭐⭐ 8-10 semanas |

---

## 4. DECISIÓN DE PLATAFORMA

### 4.1 Plataforma Seleccionada: APLICACIÓN WEB

**Estrategia:** Desarrollar como aplicación web en Fase 1, migrar a Electron en Fase 2.

### 4.2 Justificación Técnica

**Para un MVP desarrollado por una sola persona, la aplicación web es superior por:**

1. **Time-to-market crítico**
   - Desarrollo 2-3x más rápido que Electron o Tauri
   - Permite validar concepto antes de invertir en packaging nativo

2. **Menor fricción técnica**
   - Cero configuración de IPC, permisos, o seguridad multiplataforma
   - Stack web es conocido, Electron/Tauri requieren aprendizaje adicional

3. **Tooling inmediato**
   - Vite + React + TypeScript es stack battle-tested
   - Hot-reload instantáneo, debugging familiar

4. **Persistencia suficiente**
   - IndexedDB soporta >1GB en navegadores modernos
   - Para 20-30 ejercicios con videos de 30 segundos (~200-500MB total), es viable

5. **Workaround aceptable para archivos**
   - File API requiere selección manual, pero para MVP donde usuario carga videos ocasionalmente, es manejable
   - No afecta la experiencia core (ejecutar rutinas)

6. **Migración futura sin refactorización**
   - El código web se empaqueta en Electron sin cambios arquitectónicos
   - Solo se migra almacenamiento de blobs → filesystem paths

### 4.3 Gestión de Videos en Web App

**Problema:** File API no permite acceso directo a rutas del sistema.

**Solución para MVP:**

```javascript
// Usuario selecciona video mediante <input type="file">
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'video/*';
fileInput.onchange = (e) => {
  const file = e.target.files[0];
  const videoURL = URL.createObjectURL(file); // Blob URL temporal
  
  // Guardar en IndexedDB el File object completo (no solo la ruta)
  // IndexedDB soporta almacenar objetos File directamente
  await db.exercises.add({
    name: 'Sentadillas',
    videoFile: file, // Se almacena como blob
    videoURL: videoURL // Para reproducción inmediata
  });
};
```

**Implicaciones:**
- Videos se almacenan como blobs en IndexedDB (límite ~500MB-1GB según navegador)
- Para MVP con ~20-30 ejercicios de 10-30 segundos c/u, es viable (~200-500MB total)
- En Fase 2 con Electron: migrar a almacenar paths absolutos

### 4.4 Camino de Migración

```
Fase 1 (MVP - Semanas 1-6):
  Web App → Deploy como sitio estático
  
Fase 2 (Electron - Semanas 7-10):
  Mismo código → Empaquetar con Electron → Distribuir como .exe/.dmg
  
Fase 3 (Optimización - Semanas 11-12):
  Migrar almacenamiento de blobs → filesystem paths
  Agregar features específicas de Electron (tray icon, shortcuts globales)
```

---

## 5. REQUERIMIENTOS FUNCIONALES

### RF-01: Gestión de Ejercicios

| ID | Descripción | Prioridad | Complejidad |
|----|-------------|-----------|-------------|
| **RF-01.1** | Crear ejercicio con nombre (string, 3-50 chars) y video (mp4/webm/mov) | Alta | Media |
| **RF-01.2** | Listar ejercicios en tarjetas con thumbnail del video | Alta | Media |
| **RF-01.3** | Eliminar ejercicio con modal de confirmación | Alta | Baja |
| **RF-01.4** | Búsqueda de ejercicios por nombre | Media | Baja |
| **RF-01.5** | Mostrar estado vacío cuando no hay ejercicios | Media | Baja |

**Criterios de aceptación RF-01.1:**
- Validar nombre (3-50 caracteres, sin caracteres especiales)
- Validar formato de video (mp4/webm/mov)
- Validar tamaño de video (max 100MB)
- Generar thumbnail automático del video
- Almacenar en IndexedDB exitosamente
- Mostrar mensaje de éxito o error

### RF-02: Gestión de Rutinas

| ID | Descripción | Prioridad | Complejidad |
|----|-------------|-----------|-------------|
| **RF-02.1** | Crear rutina con nombre único | Alta | Baja |
| **RF-02.2** | Agregar intervalos de ejercicio con duración configurable | Alta | Media |
| **RF-02.3** | Agregar intervalos de descanso con duración configurable | Alta | Baja |
| **RF-02.4** | Reordenar intervalos mediante drag & drop | Alta | Media |
| **RF-02.5** | Eliminar intervalo de rutina | Media | Baja |
| **RF-02.6** | Guardar rutina en IndexedDB | Alta | Media |
| **RF-02.7** | Listar rutinas guardadas con duración total | Alta | Baja |
| **RF-02.8** | Cargar rutina para editar | Media | Baja |
| **RF-02.9** | Eliminar rutina con confirmación | Alta | Baja |
| **RF-02.10** | Calcular y mostrar duración total automáticamente | Media | Baja |

**Criterios de aceptación RF-02.2:**
- Seleccionar ejercicio de lista de ejercicios existentes
- Input numérico para duración (1-600 segundos)
- Validar que ejercicio no esté duplicado consecutivamente
- Mostrar preview del ejercicio seleccionado
- Máximo 50 intervalos por rutina

### RF-03: Ejecución de Rutina

| ID | Descripción | Prioridad | Complejidad |
|----|-------------|-----------|-------------|
| **RF-03.1** | Reproducir video del ejercicio actual en loop | Alta | Media |
| **RF-03.2** | Mostrar temporizador con cuenta regresiva (MM:SS) | Alta | Alta |
| **RF-03.3** | Anunciar nombre del ejercicio mediante síntesis de voz | Alta | Media |
| **RF-03.4** | Mostrar progreso de rutina (intervalo X de Y) | Media | Baja |
| **RF-03.5** | Transición automática al finalizar intervalo | Alta | Media |
| **RF-03.6** | Control Play/Pausa | Alta | Media |
| **RF-03.7** | Control Stop (volver a lista de rutinas) | Alta | Baja |
| **RF-03.8** | Control Siguiente (saltar intervalo actual) | Media | Baja |
| **RF-03.9** | Pausar automáticamente si pestaña pierde foco | Media | Media |
| **RF-03.10** | Mostrar alerta visual últimos 5 segundos | Baja | Baja |
| **RF-03.11** | Mensaje de completado al finalizar rutina | Alta | Baja |

**Criterios de aceptación RF-03.2:**
- Precisión del temporizador: error acumulado <100ms por intervalo
- Actualización visual fluida (60fps)
- Fuente grande legible desde 3 metros
- Cambio de color en últimos 5 segundos

**Criterios de aceptación RF-03.3:**
- Voz clara y audible
- Anunciar al inicio de cada intervalo
- No interrumpir anuncio si usuario salta rápidamente
- Soportar español e inglés

---

## 6. REQUERIMIENTOS NO FUNCIONALES

### RNF-01: Performance

| ID | Descripción | Métrica | Prioridad |
|----|-------------|---------|-----------|
| **RNF-01.1** | Precisión del temporizador | Error <100ms por intervalo | Crítica |
| **RNF-01.2** | Transición entre intervalos | <200ms | Alta |
| **RNF-01.3** | Carga de rutina desde IndexedDB | <500ms | Media |
| **RNF-01.4** | Reproducción de video sin stuttering | 60fps | Alta |
| **RNF-01.5** | First load de la aplicación | <2 segundos | Media |
| **RNF-01.6** | Bundle size (sin videos) | <500KB | Media |

### RNF-02: Usabilidad

| ID | Descripción | Criterio | Prioridad |
|----|-------------|----------|-----------|
| **RNF-02.1** | Interfaz optimizada para resolución | 1920x1080 nativa | Alta |
| **RNF-02.2** | Fuentes grandes para legibilidad a distancia | Min 48px para timer | Alta |
| **RNF-02.3** | Atajos de teclado para controles | Espacio, Escape, Flechas | Alta |
| **RNF-02.4** | Confirmación antes de acciones destructivas | Modal con doble confirmación | Media |
| **RNF-02.5** | Estados vacíos con call-to-action | Ilustración + CTA | Media |
| **RNF-02.6** | Alto contraste (legibilidad) | WCAG AA mínimo | Media |

### RNF-03: Compatibilidad

| ID | Descripción | Soporte | Prioridad |
|----|-------------|---------|-----------|
| **RNF-03.1** | Navegadores modernos | Chrome/Edge 120+, Firefox 120+, Safari 17+ | Alta |
| **RNF-03.2** | Formatos de video | mp4 (H.264), webm (VP9), mov | Alta |
| **RNF-03.3** | Síntesis de voz | Español e inglés | Alta |
| **RNF-03.4** | Resolución mínima | 1280x720 | Media |

### RNF-04: Mantenibilidad

| ID | Descripción | Criterio | Prioridad |
|----|-------------|----------|-----------|
| **RNF-04.1** | TypeScript con tipos estrictos | Strict mode habilitado | Alta |
| **RNF-04.2** | Componentes reutilizables | Max 200 líneas por componente | Media |
| **RNF-04.3** | Separación de concerns | Capas bien definidas | Alta |
| **RNF-04.4** | Código documentado | JSDoc en funciones públicas | Baja |

### RNF-05: Límites del Sistema

| ID | Recurso | Límite | Justificación |
|----|---------|--------|---------------|
| **RNF-05.1** | Ejercicios máximos | 100 | UI puede degradarse más allá |
| **RNF-05.2** | Intervalos por rutina | 50 | Balance usabilidad/complejidad |
| **RNF-05.3** | Tamaño de video | 100MB | Límite de IndexedDB |
| **RNF-05.4** | Duración de intervalo | 600 segundos (10 min) | Caso de uso típico |
| **RNF-05.5** | Duración de rutina | Sin límite | Suma de intervalos |

---

## 7. ARQUITECTURA DEL SISTEMA

### 7.1 Arquitectura por Capas

```
┌─────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                     │
│        (React Components + Tailwind CSS)            │
│                                                     │
│  - ExerciseList, ExerciseForm, ExerciseCard        │
│  - RoutineBuilder, IntervalEditor, RoutineList     │
│  - Player, VideoDisplay, Timer, Controls           │
│  - Shared: Button, Modal, Input, EmptyState        │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│            APPLICATION LAYER                        │
│         (Custom Hooks + Zustand Stores)             │
│                                                     │
│  Hooks:                        Stores:              │
│  - useExercises                - exerciseStore      │
│  - useRoutines                 - routineStore       │
│  - usePlayer                   - playerStore        │
│  - useTimer                                         │
│  - useVoice                                         │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│              DOMAIN LAYER                           │
│          (Business Logic Services)                  │
│                                                     │
│  - TimerEngine: Control preciso del temporizador    │
│  - VoiceService: Síntesis de voz con cola          │
│  - VideoManager: Carga y gestión de videos         │
│  - validators: Validaciones de negocio             │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│           INFRASTRUCTURE LAYER                      │
│       (IndexedDB + Web APIs Adapters)               │
│                                                     │
│  - ExerciseRepository: CRUD de ejercicios           │
│  - RoutineRepository: CRUD de rutinas               │
│  - db.ts: Configuración de Dexie                   │
└─────────────────────────────────────────────────────┘
```

### 7.2 Patrón de Estado Global

**Tecnología:** Zustand

**Justificación:**
- Más simple que Redux (menos boilerplate)
- Integración nativa con React hooks
- TypeScript support out-of-the-box
- Devtools para debugging
- Middleware para persistencia (opcional)

**Estructura de stores:**

```typescript
// stores/exerciseStore.ts
interface ExerciseStore {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  loadExercises: () => Promise<void>;
  createExercise: (data: Omit<Exercise, 'id' | 'createdAt'>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
}

// stores/playerStore.ts
interface PlayerStore {
  routine: Routine | null;
  currentIndex: number;
  timeRemaining: number;
  state: PlayerState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
}
```

### 7.3 Flujo de Datos

```
Usuario interactúa con UI Component
         ↓
Component llama a Hook (useExercises, usePlayer)
         ↓
Hook actualiza Zustand Store
         ↓
Store llama a Service (TimerEngine, VoiceService)
         ↓
Service interactúa con Repository
         ↓
Repository opera sobre IndexedDB
         ↓
Actualización se propaga automáticamente a UI
```

### 7.4 Estructura de Carpetas

```
workout-app/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── exercises/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseForm.tsx
│   │   │   ├── ExerciseList.tsx
│   │   │   └── EmptyExerciseState.tsx
│   │   ├── routines/
│   │   │   ├── RoutineBuilder.tsx
│   │   │   ├── IntervalEditor.tsx
│   │   │   ├── RoutineList.tsx
│   │   │   └── EmptyRoutineState.tsx
│   │   ├── player/
│   │   │   ├── Player.tsx
│   │   │   ├── VideoDisplay.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── Controls.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useExercises.ts
│   │   ├── useRoutines.ts
│   │   ├── usePlayer.ts
│   │   ├── useTimer.ts
│   │   ├── useVoice.ts
│   │   ├── useKeyboard.ts
│   │   └── useCleanup.ts
│   ├── services/
│   │   ├── TimerEngine.ts
│   │   ├── VoiceService.ts
│   │   └── VideoManager.ts
│   ├── repositories/
│   │   ├── ExerciseRepository.ts
│   │   ├── RoutineRepository.ts
│   │   └── db.ts
│   ├── stores/
│   │   ├── exerciseStore.ts
│   │   ├── routineStore.ts
│   │   └── playerStore.ts
│   ├── types/
│   │   ├── Exercise.ts
│   │   ├── Routine.ts
│   │   ├── Interval.ts
│   │   └── PlayerState.ts
│   ├── utils/
│   │   ├── formatTime.ts
│   │   ├── validators.ts
│   │   └── storageQuota.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .eslintrc.cjs
├── .prettierrc
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 8. MODELO DE DATOS

### 8.1 Entidades Principales

#### Exercise (Ejercicio)

```typescript
export interface Exercise {
  id: string;                    // UUID v4
  name: string;                  // 3-50 caracteres
  videoFile: File;               // Objeto File del navegador
  videoURL: string;              // Blob URL para reproducción
  thumbnail?: string;            // Data URL de frame del video
  createdAt: number;             // timestamp Unix
}
```

**Validaciones:**
- `name`: 3-50 caracteres, sin caracteres especiales (`<>`)
- `videoFile.size`: Max 100MB
- `videoFile.type`: 'video/mp4' | 'video/webm' | 'video/quicktime'

#### Interval (Intervalo)

```typescript
export enum IntervalType {
  EXERCISE = 'EXERCISE',
  REST = 'REST'
}

export interface Interval {
  id: string;                    // UUID v4
  type: IntervalType;            // EXERCISE | REST
  exerciseId?: string;           // null si type === REST
  duration: number;              // segundos (1-600)
  order: number;                 // posición en rutina (0-based)
}
```

**Reglas de negocio:**
- Si `type === EXERCISE`, `exerciseId` es obligatorio
- Si `type === REST`, `exerciseId` debe ser null
- `duration` entre 1 y 600 segundos
- `order` debe ser único dentro de la rutina

#### Routine (Rutina)

```typescript
export interface Routine {
  id: string;                    // UUID v4
  name: string;                  // 3-50 caracteres
  intervals: Interval[];         // array ordenado por 'order'
  totalDuration: number;         // suma de durations (calculado)
  createdAt: number;             // timestamp Unix
  updatedAt: number;             // timestamp Unix
}
```

**Campos calculados:**
- `totalDuration`: Se calcula sumando `duration` de todos los `intervals`
- Debe actualizarse automáticamente al agregar/eliminar/modificar intervalos

#### PlayerState (Estado del Reproductor)

```typescript
export type PlayerStateType = 
  | 'IDLE'       // Sin rutina cargada
  | 'READY'      // Rutina cargada, no iniciada
  | 'PLAYING'    // Ejecutando
  | 'PAUSED'     // Pausado
  | 'COMPLETED'  // Finalizado
  | 'ERROR';     // Error crítico

export interface PlayerState {
  routineId: string | null;
  currentIntervalIndex: number;
  timeRemaining: number;         // segundos del intervalo actual
  state: PlayerStateType;
  error?: string;
}
```

### 8.2 Esquema IndexedDB

**Tecnología:** Dexie.js (wrapper sobre IndexedDB)

```typescript
// repositories/db.ts
import Dexie, { Table } from 'dexie';

class WorkoutDB extends Dexie {
  exercises!: Table<Exercise>;
  routines!: Table<Routine>;

  constructor() {
    super('WorkoutDatabase');
    
    // Versión 1 del esquema
    this.version(1).stores({
      exercises: 'id, name, createdAt',
      routines: 'id, name, createdAt, updatedAt'
    });
  }
}

export const db = new WorkoutDB();
```

**Índices definidos:**
- `exercises`: Por `id` (primary), `name`, `createdAt`
- `routines`: Por `id` (primary), `name`, `createdAt`, `updatedAt`

**Migraciones futuras:**
```typescript
// Si se necesita agregar campos en versión 2
this.version(2).stores({
  exercises: 'id, name, createdAt, category', // +category
  routines: 'id, name, createdAt, updatedAt'
}).upgrade(tx => {
  // Agregar campo 'category' a ejercicios existentes
  return tx.table('exercises').toCollection().modify(exercise => {
    exercise.category = 'uncategorized';
  });
});
```

### 8.3 Relaciones entre Entidades

```
Exercise (1) ←──── (N) Interval (N) ────→ (1) Routine
     ↑                                          ↑
     │                                          │
 videoFile                              intervals[]
  (Blob)                                  (Array)
```

**Reglas de integridad:**
- Un `Interval` de tipo `EXERCISE` debe referenciar un `Exercise` existente
- Al eliminar un `Exercise`, verificar que no esté en uso en ninguna `Routine`
- Al eliminar una `Routine`, sus `Interval` se eliminan automáticamente (cascade)

### 8.4 Política de Limpieza de Blobs

**Decisión:** 1 ejercicio = 1 video (sin compartir blobs entre ejercicios)

```typescript
async deleteExercise(id: string): Promise<void> {
  const exercise = await db.exercises.get(id);
  
  // 1. Verificar que no esté en uso
  const routinesWithExercise = await db.routines
    .filter(r => r.intervals.some(i => i.exerciseId === id))
    .toArray();
  
  if (routinesWithExercise.length > 0) {
    throw new Error(
      `No se puede eliminar. Ejercicio usado en ${routinesWithExercise.length} rutina(s)`
    );
  }
  
  // 2. Revocar blob URL
  if (exercise?.videoURL) {
    URL.revokeObjectURL(exercise.videoURL);
  }
  
  // 3. Eliminar de DB
  await db.exercises.delete(id);
}
```

**Beneficio:** Simplicidad. Sin lógica de conteo de referencias.

---

## 9. COMPONENTES TÉCNICOS CRÍTICOS

### 9.1 TimerEngine - Motor de Temporizador de Alta Precisión

**Problema:** `setInterval` y `setTimeout` no son precisos:
- Throttling cuando pestaña no está activa
- Drift acumulativo (puede perder 1-2 segundos cada minuto)
- Afectado por event loop bloqueado

**Solución:** Temporizador basado en `performance.now()` + `requestAnimationFrame`

```typescript
// services/TimerEngine.ts
export class TimerEngine {
  private startTime: number = 0;
  private duration: number = 0;
  private rafId: number | null = null;
  private onTick: (remaining: number) => void;
  private onComplete: () => void;

  constructor(
    duration: number,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ) {
    this.duration = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start() {
    this.startTime = performance.now();
    this.tick();
  }

  private tick = () => {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const remaining = Math.max(0, this.duration - elapsed);

    this.onTick(remaining);

    if (remaining > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.onComplete();
    }
  };

  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Guardar tiempo restante para resume
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.duration = Math.max(0, this.duration - elapsed);
  }

  resume() {
    this.startTime = performance.now();
    this.tick();
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
```

**Características:**
- `requestAnimationFrame` corre a ~60fps, detecta drift instantáneamente
- `performance.now()` con precisión de microsegundos
- Error acumulado <50ms en sesiones de 60 minutos

**Testing de precisión:**
```typescript
// Verificar precisión en 10 minutos
const timer = new TimerEngine(600, () => {}, () => {
  const actualElapsed = performance.now() - testStart;
  const error = Math.abs(actualElapsed - 600000); // 600s = 600000ms
  console.log(`Error: ${error}ms`); // Debe ser <100ms
});
```

### 9.2 VoiceService - Síntesis de Voz con Cola

**Problema:** Al saltar intervalos rápido, la voz se corta o repite.

**Solución:** Cola simple con debounce y prevención de duplicados.

```typescript
// services/VoiceService.ts
export class VoiceService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private lastSpoken: string = '';
  private speakTimeout: number | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initVoice();
  }

  private async initVoice() {
    const voices = await this.getVoices();
    
    // Preferir voz en español si está disponible
    this.voice = voices.find(v => v.lang.startsWith('es')) 
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
  }

  private getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();
      
      if (voices.length) {
        resolve(voices);
      } else {
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(voices);
        };
      }
    });
  }

  speak(text: string, options?: { rate?: number; pitch?: number }) {
    // No repetir mismo texto consecutivamente
    if (text === this.lastSpoken) {
      return;
    }

    // Cancelar timeout pendiente
    if (this.speakTimeout) {
      clearTimeout(this.speakTimeout);
    }

    // Cancelar speech en progreso
    this.synth.cancel();

    // Debounce de 200ms
    this.speakTimeout = window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      utterance.rate = options?.rate || 1.0;   // 0.1 - 10
      utterance.pitch = options?.pitch || 1.0; // 0 - 2
      utterance.volume = 1.0;                  // 0 - 1

      this.synth.speak(utterance);
      this.lastSpoken = text;
    }, 200);
  }

  cancel() {
    if (this.speakTimeout) {
      clearTimeout(this.speakTimeout);
      this.speakTimeout = null;
    }
    this.synth.cancel();
    this.lastSpoken = '';
  }
}
```

**Mejoras implementadas:**
- ✅ Debounce de 200ms evita cortes al saltar rápido
- ✅ Prevención de duplicados (`lastSpoken`)
- ✅ Cancelación limpia de timeouts
- ✅ Selección inteligente de voz (español > inglés > default)

### 9.3 VideoManager - Gestión de Multimedia

```typescript
// services/VideoManager.ts
export class VideoManager {
  static async loadVideo(file: File): Promise<{
    file: File;
    url: string;
    thumbnail: string;
  }> {
    // Validar tipo
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato no soportado. Usa MP4, WebM o MOV');
    }

    // Validar tamaño
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      throw new Error('Video muy grande. Máximo 100MB');
    }

    // Crear blob URL
    const url = URL.createObjectURL(file);

    // Generar thumbnail
    const thumbnail = await this.generateThumbnail(url);

    return { file, url, thumbnail };
  }

  private static generateThumbnail(videoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.src = videoUrl;
      video.currentTime = 1; // Capturar frame en segundo 1

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnail);
        
        // Cleanup
        video.remove();
        canvas.remove();
      };

      video.onerror = () => reject(new Error('Error al cargar video'));
    });
  }

  static revokeURL(url: string) {
    URL.revokeObjectURL(url);
  }
}
```

---

## 10. STACK TECNOLÓGICO

### 10.1 Stack Completo Recomendado

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Framework UI** | React | 18.3+ | Ecosistema maduro, hooks nativos, performance óptimo |
| **Lenguaje** | TypeScript | 5.5+ | Type safety, mejor DX, reducción de bugs 30-40% |
| **Build Tool** | Vite | 5.4+ | HMR instantáneo, build optimizado, config mínima |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first, customizable, bundle pequeño con purge |
| **State Management** | Zustand | 4.5+ | Simple, TypeScript-friendly, devtools integrados |
| **Base de Datos** | Dexie.js | 4.0+ | Wrapper IndexedDB con API moderna y migraciones |
| **Componentes UI** | Headless UI | 2.0+ | Componentes accesibles sin estilos opinados |
| **Iconos** | Lucide React | 0.263+ | Iconos modernos, tree-shakeable |
| **Drag & Drop** | dnd-kit | 6.0+ | Accesible, performante, soporte touch |
| **Validación** | Zod | 3.22+ | Schema validation con inferencia de tipos |

### 10.2 Web APIs Utilizadas

```typescript
// File API - Carga de videos
const file: File = event.target.files[0];
const url = URL.createObjectURL(file);

// IndexedDB - Almacenamiento persistente
import Dexie from 'dexie';
const db = new Dexie('WorkoutDB');

// Web Speech API - Síntesis de voz
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance('Sentadillas');
synth.speak(utterance);

// requestAnimationFrame - Temporizador preciso
const tick = () => {
  // ... lógica de timer
  requestAnimationFrame(tick);
};

// Page Visibility API - Detección de pestaña activa
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseTimer();
  }
});

// Storage API - Verificar cuota
const estimate = await navigator.storage.estimate();
console.log(`Usado: ${estimate.usage}, Disponible: ${estimate.quota}`);

// Fullscreen API - Modo pantalla completa (opcional)
element.requestFullscreen();
```

### 10.3 Configuración de Proyecto

**Inicialización:**
```bash
# Crear proyecto
npm create vite@latest workout-app -- --template react-ts
cd workout-app

# Instalar dependencias core
npm install zustand dexie react-dexie-hooks

# Instalar UI
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react lucide-react

# Instalar utilidades
npm install zod clsx

# Instalar devtools
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier

# Inicializar Tailwind
npx tailwindcss init -p
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'dexie-vendor': ['dexie', 'react-dexie-hooks'],
        },
      },
    },
  },
});
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 11. GESTIÓN DE ESTADOS DEL SISTEMA

### 11.1 Máquina de Estados del Player

```typescript
export type PlayerStateType = 
  | 'IDLE'       // Sin rutina cargada
  | 'READY'      // Rutina cargada, no iniciada
  | 'PLAYING'    // Ejecutando
  | 'PAUSED'     // Pausado
  | 'COMPLETED'  // Finalizado
  | 'ERROR';     // Error crítico
```

### 11.2 Diagrama de Transiciones

```
         ┌──────────┐
         │   IDLE   │ (Estado inicial)
         └────┬─────┘
              │ loadRoutine()
              ↓
         ┌──────────┐
    ┌────│  READY   │────┐
    │    └────┬─────┘    │
    │         │ play()   │
    │         ↓          │
    │    ┌──────────┐   │ stop()
    │    │ PLAYING  │───┘
    │    └────┬─────┘
    │         │
    │    ┌────┴─────────┬─────────────┐
    │    │ pause()      │             │
    │    ↓              │ complete()  │ error()
    │  ┌──────────┐     ↓             ↓
    │  │  PAUSED  │  ┌────────────┐ ┌───────┐
    │  └────┬─────┘  │ COMPLETED  │ │ ERROR │
    │       │        └─────┬──────┘ └───┬───┘
    │       │ resume()     │            │
    │       └──────────────┤            │
    │                      │ reset()    │ reset()
    └──────────────────────┴────────────┘
                           │
                           ↓
                      ┌──────────┐
                      │   IDLE   │
                      └──────────┘
```

### 11.3 Implementación de Estado en Zustand

```typescript
// stores/playerStore.ts
import create from 'zustand';

interface PlayerStore {
  // Estado
  state: PlayerStateType;
  routine: Routine | null;
  currentIndex: number;
  timeRemaining: number;
  error: string | null;
  
  // Acciones
  loadRoutine: (routine: Routine) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  complete: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Estado inicial
  state: 'IDLE',
  routine: null,
  currentIndex: 0,
  timeRemaining: 0,
  error: null,

  // Cargar rutina
  loadRoutine: (routine) => {
    set({ 
      state: 'READY', 
      routine, 
      currentIndex: 0,
      timeRemaining: routine.intervals[0]?.duration || 0,
      error: null
    });
  },

  // Reproducir
  play: () => {
    const { state } = get();
    if (state === 'READY') {
      set({ state: 'PLAYING' });
    }
  },

  // Pausar
  pause: () => {
    const { state } = get();
    if (state === 'PLAYING') {
      set({ state: 'PAUSED' });
    }
  },

  // Reanudar
  resume: () => {
    const { state } = get();
    if (state === 'PAUSED') {
      set({ state: 'PLAYING' });
    }
  },

  // Detener
  stop: () => {
    set({ 
      state: 'IDLE',
      routine: null,
      currentIndex: 0,
      timeRemaining: 0
    });
  },

  // Saltar intervalo
  skip: () => {
    const { routine, currentIndex, state } = get();
    if (!routine || state !== 'PLAYING') return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= routine.intervals.length) {
      get().complete();
    } else {
      set({ 
        currentIndex: nextIndex,
        timeRemaining: routine.intervals[nextIndex].duration
      });
    }
  },

  // Completar rutina
  complete: () => {
    set({ state: 'COMPLETED' });
  },

  // Error
  setError: (error) => {
    set({ state: 'ERROR', error });
  },

  // Reset
  reset: () => {
    set({
      state: 'IDLE',
      routine: null,
      currentIndex: 0,
      timeRemaining: 0,
      error: null
    });
  },
}));
```

### 11.4 Validaciones de Transiciones

```typescript
// utils/stateValidations.ts
export function canPlay(state: PlayerStateType): boolean {
  return state === 'READY';
}

export function canPause(state: PlayerStateType): boolean {
  return state === 'PLAYING';
}

export function canResume(state: PlayerStateType): boolean {
  return state === 'PAUSED';
}

export function canStop(state: PlayerStateType): boolean {
  return ['READY', 'PLAYING', 'PAUSED', 'COMPLETED', 'ERROR'].includes(state);
}

export function canSkip(state: PlayerStateType): boolean {
  return state === 'PLAYING';
}
```

### 11.5 Integración con UI

```typescript
// components/player/Controls.tsx
export function Controls() {
  const { state, play, pause, resume, stop, skip } = usePlayerStore();

  return (
    <div className="flex gap-4">
      {state === 'READY' && (
        <Button onClick={play}>Play</Button>
      )}
      
      {state === 'PLAYING' && (
        <>
          <Button onClick={pause}>Pause</Button>
          <Button onClick={skip}>Next</Button>
        </>
      )}
      
      {state === 'PAUSED' && (
        <Button onClick={resume}>Resume</Button>
      )}
      
      {['READY', 'PLAYING', 'PAUSED'].includes(state) && (
        <Button onClick={stop} variant="danger">Stop</Button>
      )}
    </div>
  );
}
```

---

## 12. DISEÑO DE EXPERIENCIA DE USUARIO

### 12.1 Principios de Diseño

**1. Legibilidad a Distancia**
- Usuario estará a 2-3 metros de pantalla mientras ejercita
- Fuentes: mínimo 48px para temporizador, 32px para nombre ejercicio
- Alto contraste: fondo oscuro + texto blanco

**2. Mínima Interacción**
- Una vez iniciada rutina, cero clics requeridos
- Transiciones automáticas entre intervalos
- Atajos de teclado grandes y obvios

**3. Feedback Multimodal**
- Visual: Temporizador grande + cambio de color
- Auditivo: Voz anunciando ejercicio
- Progreso: Barra siempre visible

### 12.2 Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Ejercicios | Rutinas | Config   │ 80px │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               ÁREA DE CONTENIDO PRINCIPAL               │
│                                                         │
│  Vista Ejercicios:  Lista en grid 3 columnas           │
│  Vista Rutinas:     Constructor con drag & drop        │
│  Vista Player:      Fullscreen-like con video          │
│                                                         │
│                                                         │
│                                                         │
│                                              viewport   │
│                                              - 80px     │
└─────────────────────────────────────────────────────────┘
```

### 12.3 Vista de Player (Crítica)

```
┌─────────────────────────────────────────────────────────┐
│                    SENTADILLAS                   │ 80px │
│              (nombre del ejercicio)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                  VIDEO 16:9                             │
│              (máx 1200x675px)                           │
│                  loop, muted                            │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     00:45                        │ 140px│
│                (temporizador)                           │
│              font-size: 96px                            │
│           color: green → red últimos 5s                 │
├─────────────────────────────────────────────────────────┤
│  ████████████░░░░░░░░░░░░  Intervalo 3 de 10    │ 50px │
│           (barra de progreso)                           │
├─────────────────────────────────────────────────────────┤
│         ⏮   ⏯   ⏹   ⏭                          │ 100px│
│      (controles grandes táctiles)                       │
└─────────────────────────────────────────────────────────┘
```

### 12.4 Paleta de Colores

```css
:root {
  /* Fondo */
  --bg-primary: #0f172a;      /* slate-900 */
  --bg-secondary: #1e293b;    /* slate-800 */
  --bg-card: #334155;         /* slate-700 */
  
  /* Texto */
  --text-primary: #f1f5f9;    /* slate-100 */
  --text-secondary: #cbd5e1;  /* slate-300 */
  --text-muted: #94a3b8;      /* slate-400 */
  
  /* Acentos */
  --accent: #3b82f6;          /* blue-500 */
  --success: #10b981;         /* green-500 */
  --warning: #f59e0b;         /* amber-500 */
  --danger: #ef4444;          /* red-500 */
  
  /* Timer */
  --timer-normal: #10b981;    /* green-500 */
  --timer-warning: #f59e0b;   /* amber-500 (últimos 10s) */
  --timer-danger: #ef4444;    /* red-500 (últimos 5s) */
}
```

### 12.5 Componentes de Estados Vacíos

Cada vista define explícitamente su estado vacío:

| Vista | Estado Vacío | Ilustración | CTA |
|-------|--------------|-------------|-----|
| **Ejercicios** | "Aún no has creado ejercicios" | Icono de video | "Crear Primer Ejercicio" |
| **Rutinas** | "Sin rutinas guardadas" | Icono de lista | "Nueva Rutina" |
| **Player** | "Selecciona una rutina para comenzar" | Icono de play | "Ver Rutinas" |
| **Error API** | "Tu navegador no soporta Web Speech API" | Icono de alerta | "Ver Navegadores Compatibles" |

```typescript
// components/shared/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-400 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### 12.6 Reglas de UI (Pautas Estrictas)

✅ **SÍ HACER:**
- Máximo 3 colores activos simultáneamente
- Animaciones <300ms de duración
- Sin scroll durante ejecución de Player
- Fuentes escalables con `clamp()` para responsive
- Alto contraste (mínimo WCAG AA)
- Estados de loading explícitos

❌ **NO HACER:**
- Overlays durante ejecución (bloquean video)
- Animaciones mayores a 500ms
- Modales no solicitados
- Más de 2 niveles de navegación
- Iconos sin labels en acciones críticas

### 12.7 Atajos de Teclado

| Tecla | Acción | Contexto |
|-------|--------|----------|
| `Espacio` | Play / Pausa | Player |
| `→` | Siguiente intervalo | Player |
| `Escape` | Detener / Cerrar | Player / Modales |
| `Enter` | Confirmar | Formularios |
| `Ctrl/Cmd + N` | Nuevo ejercicio | Lista ejercicios |
| `Ctrl/Cmd + R` | Nueva rutina | Lista rutinas |
| `F` | Fullscreen | Player (opcional) |

```typescript
// hooks/useKeyboard.ts
export function useKeyboard(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const handler = handlers[e.code] || handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlers]);
}

// Uso en Player
function Player() {
  const { state, play, pause, resume, skip, stop } = usePlayerStore();

  useKeyboard({
    'Space': () => {
      if (state === 'PLAYING') pause();
      else if (state === 'PAUSED') resume();
      else if (state === 'READY') play();
    },
    'ArrowRight': skip,
    'Escape': stop,
  });
  
  return <div>...</div>;
}
```

---

## 13. PERSISTENCIA Y ALMACENAMIENTO

### 13.1 Estrategia de Almacenamiento

**Decisiones:**
- ✅ IndexedDB (via Dexie.js) para ejercicios y rutinas
- ✅ File objects almacenados como blobs dentro de IndexedDB
- ❌ NO usar localStorage (límite 5-10MB, síncrono, blocking)
- ❌ NO usar SessionStorage (se pierde al cerrar pestaña)

**Cuotas típicas de IndexedDB:**

| Navegador | Cuota Inicial | Límite Máximo |
|-----------|---------------|---------------|
| Chrome/Edge | ~500MB | 60% del espacio libre en disco |
| Firefox | Variable | 50% del espacio libre (con confirmación) |
| Safari | ~1GB | Solicita permiso para más |

### 13.2 Implementación de Repositorios

```typescript
// repositories/ExerciseRepository.ts
export class ExerciseRepository {
  async create(exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...exercise
    };

    await db.exercises.add(newExercise);
    return newExercise;
  }

  async findAll(): Promise<Exercise[]> {
    return await db.exercises
      .orderBy('createdAt')
      .reverse()
      .toArray();
  }

  async findById(id: string): Promise<Exercise | undefined> {
    return await db.exercises.get(id);
  }

  async delete(id: string): Promise<void> {
    // 1. Verificar que no esté en uso
    const routinesWithExercise = await db.routines
      .filter(r => r.intervals.some(i => i.exerciseId === id))
      .toArray();
    
    if (routinesWithExercise.length > 0) {
      throw new Error(
        `No se puede eliminar. Ejercicio usado en ${routinesWithExercise.length} rutina(s)`
      );
    }

    // 2. Obtener ejercicio
    const exercise = await this.findById(id);
    
    // 3. Revocar blob URL
    if (exercise?.videoURL) {
      URL.revokeObjectURL(exercise.videoURL);
    }

    // 4. Eliminar de DB
    await db.exercises.delete(id);
  }

  async search(query: string): Promise<Exercise[]> {
    const all = await this.findAll();
    return all.filter(ex => 
      ex.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// repositories/RoutineRepository.ts
export class RoutineRepository {
  async create(routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'totalDuration'>): Promise<Routine> {
    const totalDuration = routine.intervals.reduce(
      (sum, interval) => sum + interval.duration, 
      0
    );

    const newRoutine: Routine = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalDuration,
      ...routine
    };

    await db.routines.add(newRoutine);
    return newRoutine;
  }

  async update(id: string, updates: Partial<Routine>): Promise<Routine> {
    const routine = await this.findById(id);
    if (!routine) {
      throw new Error('Rutina no encontrada');
    }

    // Recalcular duración si se actualizan intervalos
    let totalDuration = routine.totalDuration;
    if (updates.intervals) {
      totalDuration = updates.intervals.reduce(
        (sum, interval) => sum + interval.duration,
        0
      );
    }

    const updated: Routine = {
      ...routine,
      ...updates,
      totalDuration,
      updatedAt: Date.now()
    };

    await db.routines.put(updated);
    return updated;
  }

  async findAll(): Promise<Routine[]> {
    return await db.routines
      .orderBy('updatedAt')
      .reverse()
      .toArray();
  }

  async findById(id: string): Promise<Routine | undefined> {
    return await db.routines.get(id);
  }

  async delete(id: string): Promise<void> {
    await db.routines.delete(id);
  }
}
```

### 13.3 Gestión de Cuota de Almacenamiento

```typescript
// utils/storageQuota.ts
export async function checkStorageQuota(): Promise<{
  used: number;
  available: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      used,
      available: quota - used,
      percentage: (used / quota) * 100
    };
  }

  return { used: 0, available: 0, percentage: 0 };
}

export async function requestPersistence(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
```

**Integración con UI:**
```typescript
// components/settings/StorageInfo.tsx
export function StorageInfo() {
  const [quota, setQuota] = useState<{used: number; available: number; percentage: number}>();

  useEffect(() => {
    checkStorageQuota().then(setQuota);
  }, []);

  if (!quota) return null;

  const isWarning = quota.percentage > 80;
  const isDanger = quota.percentage > 90;

  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Almacenamiento</h3>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Usado: {formatBytes(quota.used)}</span>
          <span>{quota.percentage.toFixed(1)}%</span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isDanger ? 'bg-red-500' : 
              isWarning ? 'bg-amber-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${quota.percentage}%` }}
          />
        </div>
      </div>

      {isWarning && (
        <p className="text-sm text-amber-400">
          ⚠️ Espacio limitado. Considera eliminar ejercicios no usados.
        </p>
      )}
    </div>
  );
}
```

### 13.4 Prevención de Pérdida de Datos

**1. Solicitar persistencia al primer uso:**
```typescript
// App.tsx
useEffect(() => {
  requestPersistence().then(isPersistent => {
    if (isPersistent) {
      console.log('✅ Almacenamiento persistente garantizado');
    } else {
      console.warn('⚠️ Datos pueden perderse al limpiar caché');
    }
  });
}, []);
```

**2. Warning en UI:**
```typescript
// components/shared/DataWarning.tsx
export function DataWarning() {
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage.persisted().then(setIsPersistent);
  }, []);

  if (isPersistent) return null;

  return (
    <div className="bg-amber-900/20 border border-amber-500 rounded-lg p-4 mb-4">
      <p className="text-amber-200 text-sm">
        ⚠️ <strong>Importante:</strong> Tus datos se almacenan localmente. 
        No borres el caché del navegador para evitar perder ejercicios y rutinas.
      </p>
    </div>
  );
}
```

**3. Export manual (Fase 1.5):**
```typescript
// utils/backup.ts
export async function exportData(): Promise<void> {
  const exercises = await db.exercises.toArray();
  const routines = await db.routines.toArray();
  
  // Serializar datos (sin File objects, solo metadata)
  const backup = {
    version: 1,
    exportedAt: Date.now(),
    exercises: exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      createdAt: ex.createdAt,
      // videoFile y videoURL no se exportan (blobs no serializables)
    })),
    routines
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 14. SEGURIDAD Y LÍMITES

### 14.1 Validaciones Frontend

```typescript
// utils/validators.ts
export const validators = {
  exerciseName: (name: string): { valid: boolean; error?: string } => {
    if (name.length < 3) {
      return { valid: false, error: 'Nombre muy corto (mínimo 3 caracteres)' };
    }
    if (name.length > 50) {
      return { valid: false, error: 'Nombre muy largo (máximo 50 caracteres)' };
    }
    if (/<|>/.test(name)) {
      return { valid: false, error: 'Caracteres no permitidos: < >' };
    }
    return { valid: true };
  },

  videoFile: (file: File): { valid: boolean; error?: string } => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Formato no soportado. Usa MP4, WebM o MOV' 
      };
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'Video muy grande. Máximo 100MB' 
      };
    }

    return { valid: true };
  },

  intervalDuration: (seconds: number): { valid: boolean; error?: string } => {
    if (seconds < 1) {
      return { valid: false, error: 'Duración mínima: 1 segundo' };
    }
    if (seconds > 600) {
      return { valid: false, error: 'Duración máxima: 10 minutos (600 segundos)' };
    }
    return { valid: true };
  },

  routineName: (name: string): { valid: boolean; error?: string } => {
    if (name.length < 3) {
      return { valid: false, error: 'Nombre muy corto (mínimo 3 caracteres)' };
    }
    if (name.length > 50) {
      return { valid: false, error: 'Nombre muy largo (máximo 50 caracteres)' };
    }
    return { valid: true };
  },

  maxIntervals: (count: number): { valid: boolean; error?: string } => {
    if (count > 50) {
      return { 
        valid: false, 
        error: 'Máximo 50 intervalos por rutina' 
      };
    }
    return { valid: true };
  },

  maxExercises: (count: number): { valid: boolean; error?: string } => {
    if (count > 100) {
      return { 
        valid: false, 
        error: 'Máximo 100 ejercicios. Considera eliminar ejercicios no usados.' 
      };
    }
    return { valid: true };
  }
};
```

### 14.2 Sanitización de Inputs

```typescript
// utils/sanitize.ts
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')  // Prevenir inyección de HTML
    .slice(0, 50);         // Limitar longitud
}

export function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Caracteres inválidos en nombres de archivo
    .slice(0, 100);
}
```

### 14.3 Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self'; 
        script-src 'self' 'unsafe-inline'; 
        style-src 'self' 'unsafe-inline'; 
        media-src 'self' blob:; 
        img-src 'self' data:;
        connect-src 'self';
      ">
```

**Justificación de directivas:**
- `blob:` en `media-src`: Para reproducir videos cargados por usuario
- `data:` en `img-src`: Para thumbnails en base64
- `unsafe-inline` en `script-src` y `style-src`: Requerido por Vite en dev (se puede eliminar en producción con nonce)

### 14.4 Límites del Sistema (Resumen)

| Límite | Valor | Tipo | Acción al Exceder |
|--------|-------|------|-------------------|
| **Ejercicios máximos** | 100 | Soft | Warning en UI, permitir continuar |
| **Intervalos por rutina** | 50 | Hard | Bloquear agregar más |
| **Tamaño de video** | 100MB | Hard | Rechazar upload |
| **Duración de intervalo** | 600s (10min) | Hard | Validación de formulario |
| **Nombre de ejercicio/rutina** | 3-50 chars | Hard | Validación de formulario |
| **IndexedDB total** | Variable | Soft | Mostrar warning al 80% |

---

## 15. GESTIÓN DE RIESGOS

### 15.1 Matriz de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Prioridad | Mitigación |
|----|--------|--------------|---------|-----------|------------|
| **R-01** | Usuario alcanza cuota de IndexedDB | Media | Alto | Alta | Implementar `checkStorageQuota()`, warning al 80%, validar tamaño de videos |
| **R-02** | Incompatibilidad de Web Speech API | Baja | Medio | Media | Fallback visual (nombre en pantalla completa), detectar soporte al inicio |
| **R-03** | Throttling del temporizador en pestaña inactiva | Media | Alto | Alta | Page Visibility API, pausar automáticamente |
| **R-04** | Pérdida de datos por limpieza de caché | Media | Crítico | Alta | `navigator.storage.persist()`, warning en UI, export manual |
| **R-05** | Formato de video no soportado | Baja | Medio | Baja | Validar `file.type`, listar formatos soportados, sugerir conversión |
| **R-06** | Memory leaks por Blob URLs | Media | Alto | Alta | Implementar `useCleanup` hook, revocar URLs al eliminar |
| **R-07** | Pantalla pequeña (<1280px) | Media | Medio | Media | Definir resolución mínima, warning si viewport pequeño, `clamp()` para fuentes |
| **R-08** | Ejercicio referenciado al eliminar | Alta | Bajo | Baja | Validar antes de eliminar, mostrar rutinas afectadas |

### 15.2 Plan de Mitigación Detallado

#### R-01: Límite de Almacenamiento

**Detección:**
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const quota = await checkStorageQuota();
    if (quota.percentage > 80) {
      showWarning('Espacio limitado. Elimina ejercicios no usados.');
    }
  }, 60000); // Verificar cada minuto

  return () => clearInterval(interval);
}, []);
```

**Acciones:**
1. Mostrar warning al 80%
2. Bloquear nuevos uploads al 95%
3. Sugerir eliminar ejercicios antiguos
4. En Fase 2: migrar a Electron elimina este riesgo

#### R-03: Temporizador en Pestaña Inactiva

**Implementación:**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && state === 'PLAYING') {
      pause();
      showNotification('Pausa automática: pestaña en segundo plano');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [state, pause]);
```

#### R-04: Pérdida de Datos

**Prevención multicapa:**
```typescript
// 1. Solicitar persistencia al inicio
const isPersistent = await navigator.storage.persist();

// 2. Mostrar warning si no se garantiza
if (!isPersistent) {
  showPersistentWarning();
}

// 3. Export manual disponible
<Button onClick={exportData}>
  Respaldar Datos
</Button>
```

#### R-06: Memory Leaks

**Hook de limpieza:**
```typescript
// hooks/useCleanup.ts
export function useCleanup() {
  const cleanup = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((fn: () => void) => {
    cleanup.current.push(fn);
  }, []);

  useEffect(() => {
    return () => {
      cleanup.current.forEach(fn => fn());
      cleanup.current = [];
    };
  }, []);

  return addCleanup;
}

// Uso
function ExerciseCard({ exercise }) {
  const addCleanup = useCleanup();

  useEffect(() => {
    const url = exercise.videoURL;
    addCleanup(() => URL.revokeObjectURL(url));
  }, [exercise.videoURL, addCleanup]);
}
```

---

## 16. ROADMAP DE DESARROLLO

### 16.1 Fase 1: MVP Funcional (4-6 semanas, ~80-100 horas)

#### Semana 1-2: Setup y Ejercicios (20-25 horas)

**Entregables:**
- [x] Configurar proyecto (Vite + React + TypeScript + Tailwind)
- [x] Configurar ESLint + Prettier
- [x] Implementar modelo de datos (Exercise, Routine, Interval)
- [x] Configurar IndexedDB con Dexie
- [x] Crear ExerciseForm con upload de video
- [x] Implementar VideoManager (validación, thumbnail)
- [x] Implementar ExerciseRepository
- [x] Crear ExerciseList con tarjetas
- [x] Función delete con confirmación
- [x] Estado vacío para lista de ejercicios

**Criterios de completado:**
- Usuario puede crear ejercicio con video en <2 minutos
- Thumbnail se genera automáticamente
- Validaciones funcionan correctamente
- Ejercicios persisten al recargar página

#### Semana 3-4: Rutinas (25-30 horas)

**Entregables:**
- [x] Crear RoutineBuilder UI
- [x] Selector de ejercicios existentes
- [x] Implementar dnd-kit para drag & drop
- [x] Input de duración con validación
- [x] Botón agregar intervalo de descanso
- [x] Cálculo automático de duración total
- [x] RoutineRepository con CRUD completo
- [x] Lista de rutinas guardadas
- [x] Modal de confirmación para eliminar
- [x] Estado vacío para rutinas

**Criterios de completado:**
- Usuario puede crear rutina de 10 intervalos en <5 minutos
- Drag & drop funciona fluidamente
- Duración total se actualiza automáticamente
- Rutinas persisten correctamente

#### Semana 5-6: Player y Voz (30-35 horas)

**Entregables:**
- [x] Implementar TimerEngine con RAF
- [x] Crear componente Player con estados
- [x] Integrar VideoDisplay con reproducción automática
- [x] Implementar VoiceService con cola
- [x] Controles Play/Pause/Resume/Stop/Skip
- [x] Barra de progreso de rutina
- [x] Transiciones automáticas entre intervalos
- [x] Cambio de color del timer (últimos 5s)
- [x] Page Visibility API (pausa automática)
- [x] Atajos de teclado
- [x] Mensaje de completado
- [x] Testing manual extensivo

**Criterios de completado:**
- Temporizador con error <100ms por intervalo
- Voz anuncia correctamente sin duplicados
- Transiciones suaves (<200ms)
- Usuario puede completar rutina sin mirar pantalla

#### Documentación y Deploy (5 horas)

- [x] README con instrucciones de uso
- [x] Documentación de código crítico
- [x] Deploy en Vercel/Netlify
- [x] Casos de prueba documentados

---

### 16.2 Fase 2: Refinamiento y Electron (3-4 semanas)

#### Mejoras UX (1 semana)

- [ ] Animaciones suaves (Framer Motion)
- [ ] Sonido opcional en fin de intervalo
- [ ] Modo oscuro/claro toggle
- [ ] Atajos de teclado adicionales
- [ ] Fullscreen nativo (F11)
- [ ] Mejoras de accesibilidad (ARIA labels)

#### Migración a Electron (2 semanas)

- [ ] Setup de Electron con electron-builder
- [ ] Configurar IPC para comunicación
- [ ] Migrar almacenamiento de blobs → filesystem paths
- [ ] Implementar menú nativo de aplicación
- [ ] Tray icon con controles rápidos
- [ ] Auto-updates (electron-updater)
- [ ] Crear instaladores para Windows/macOS/Linux
- [ ] Testing en múltiples plataformas

#### Features Adicionales (1 semana)

- [ ] Duplicar ejercicio
- [ ] Editar ejercicio (cambiar nombre/video)
- [ ] Clonar rutina
- [ ] Reordenar ejercicios en lista
- [ ] Categorías de ejercicios (cardio, fuerza, etc.)
- [ ] Filtros por categoría

---

### 16.3 Fase 3: Biblioteca y Compartir (4-6 semanas)

#### Biblioteca Predefinida (2 semanas)

- [ ] Incluir 20-30 ejercicios comunes con videos stock
- [ ] Categorización (cardio, fuerza, estiramiento, HIIT)
- [ ] Sistema de etiquetas
- [ ] Filtros por categoría y etiquetas
- [ ] Importar ejercicio de biblioteca a "Mis Ejercicios"
- [ ] Búsqueda avanzada

#### Exportación/Importación (1 semana)

- [ ] Exportar rutina como JSON
- [ ] Importar rutina desde archivo
- [ ] Validación de formato de importación
- [ ] Migración de versiones de datos
- [ ] Compartir rutina vía archivo

#### Estadísticas Básicas (2 semanas)

- [ ] Almacenar historial de sesiones completadas
- [ ] Contador de sesiones por rutina
- [ ] Total de tiempo entrenado
- [ ] Ejercicio más frecuente
- [ ] Gráfica de actividad semanal (Chart.js)
- [ ] Racha de días consecutivos
- [ ] Export de estadísticas

---

### 16.4 Fase 4: Expansión (Futuro)

#### Soporte Multimedia Avanzado

- [ ] Soporte para imágenes (además de videos)
- [ ] Soporte para GIFs animados
- [ ] Secuencias de imágenes
- [ ] Generar GIF a partir de video

#### Rutinas Inteligentes

- [ ] Generador de rutinas basado en tiempo disponible
- [ ] Sugerencias de ejercicios complementarios
- [ ] Plantillas de rutinas predefinidas
- [ ] Variaciones automáticas de rutinas

#### Sincronización Cloud (Requiere Backend)

- [ ] Backend con Node.js + PostgreSQL
- [ ] Autenticación de usuarios
- [ ] Subir rutinas a cuenta personal
- [ ] Sincronizar entre dispositivos
- [ ] Compartir rutinas con comunidad
- [ ] Comentarios y valoraciones

#### Mobile App

- [ ] React Native con código compartido
- [ ] Modo compañero: móvil como control remoto
- [ ] Notificaciones push para recordatorios
- [ ] Integración con Apple Health / Google Fit

---

## 17. CRITERIOS DE ÉXITO

### 17.1 Métricas Funcionales

| Criterio | Objetivo | Método de Medición |
|----------|----------|-------------------|
| **Crear ejercicio** | < 2 minutos | Cronometrar desde click en "Nuevo" hasta guardado |
| **Crear rutina de 10 intervalos** | < 5 minutos | Cronometrar flujo completo |
| **Ejecutar rutina sin mirar** | 100% éxito | Test con usuario a 3 metros |
| **Pausar/reanudar sin pérdida** | 0 errores | Test con 20 pausas/reanudaciones |

### 17.2 Métricas Técnicas

| Criterio | Objetivo | Herramienta |
|----------|----------|------------|
| **Precisión del temporizador** | Error < 100ms/intervalo | Custom timer logger |
| **Bundle size (sin videos)** | < 500KB | `npm run build` + análisis |
| **First load** | < 2 segundos | Lighthouse |
| **Console errors en uso normal** | 0 | Manual testing + Sentry (opcional) |
| **Compatibilidad navegadores** | Chrome, Firefox, Edge actualizados | BrowserStack |

### 17.3 Métricas de Experiencia

| Criterio | Objetivo | Método |
|----------|----------|--------|
| **Comprensión sin tutorial** | 80% usuarios | Test con 5 usuarios nuevos |
| **Transiciones sin lag** | Percepción fluida | Test visual a 60fps |
| **Timer visible a distancia** | Legible a 3 metros | Test de legibilidad |
| **Voz clara y audible** | 100% comprensión | Test con audio ambiente |

### 17.4 Checklist de Completado MVP

**Funcionalidad:**
- [ ] Usuario puede crear 10 ejercicios en <20 minutos
- [ ] Usuario puede crear rutina con ≥3 intervalos
- [ ] Player reproduce videos secuencialmente
- [ ] Temporizador cuenta regresivamente con precisión
- [ ] Voz anuncia nombre de ejercicio
- [ ] Controles Play/Pausa/Stop funcionan
- [ ] Datos persisten al cerrar navegador
- [ ] App funciona sin conexión a internet

**Calidad:**
- [ ] Sin errores de TypeScript en compilación
- [ ] Sin warnings de ESLint
- [ ] Bundle optimizado (<500KB)
- [ ] README completo con instrucciones
- [ ] Estados vacíos implementados
- [ ] Validaciones funcionando correctamente

**UX:**
- [ ] Diseño responsive (1280x720 mínimo)
- [ ] Alto contraste para legibilidad
- [ ] Atajos de teclado funcionando
- [ ] Confirmaciones antes de eliminar
- [ ] Transiciones suaves entre vistas
- [ ] Feedback visual en todas las acciones

---

## 18. CONCLUSIONES Y RECOMENDACIONES

### 18.1 Resumen de Decisiones Técnicas Clave

#### 1. Plataforma: Web App → Electron

**Decisión Final:** Desarrollar como aplicación web en Fase 1, migrar a Electron en Fase 2.

**Razones:**
- ✅ Desarrollo 2-3x más rápido para MVP
- ✅ Validación de concepto sin overhead de packaging
- ✅ Stack web conocido vs. curva de aprendizaje de Electron
- ✅ Migración futura sin refactorización arquitectónica
- ✅ Limitaciones de File API manejables en MVP

**Trade-offs Aceptados:**
- Selección manual de videos (vs. acceso directo a filesystem)
- Límites de almacenamiento de IndexedDB (manejable para ~30 ejercicios)
- Sin icono nativo en desktop inicialmente

#### 2. Stack: React + TypeScript + Vite + Tailwind + Dexie

**Justificación:**
- **React 18.3+**: Ecosistema maduro, hooks nativos, performance óptimo
- **TypeScript 5.5+**: Reduce bugs en 30-40%, mejor DX, autocompletado
- **Vite 5.4+**: HMR instantáneo, build optimizado, configuración mínima
- **Tailwind CSS 3.4+**: Utility-first, bundle pequeño, desarrollo rápido
- **Dexie.js 4.0+**: Simplifica IndexedDB sin peso significativo

**Alternativas Descartadas:**
- ❌ Redux → Demasiado boilerplate para este caso
- ❌ Material-UI → Peso excesivo, preferimos Headless UI
- ❌ Webpack → Vite es superior en DX y velocidad
- ❌ Native IndexedDB → Dexie ofrece mejor API sin costo significativo

#### 3. Arquitectura: Capas con Separación de Concerns

**Beneficios:**
- Testear lógica sin UI
- Migrar a Electron sin refactorización
- Reemplazar IndexedDB por filesystem fácilmente
- Mantenibilidad a largo plazo

```
UI → Hooks → Services → Repositories → IndexedDB
```

#### 4. Persistencia: IndexedDB + Blobs

**Decisión:** Almacenar File objects directamente en IndexedDB.

**Justificación para MVP:**
- Viable para <50 videos de 10-30 segundos (~200-500MB total)
- Navegadores modernos soportan >1GB en IndexedDB
- Simplicidad vs. complejidad de filesystem

**Migración Futura:**
- Fase 2 con Electron: Almacenar paths absolutos en lugar de blobs
- Libera espacio y permite videos más grandes

#### 5. Temporizador: requestAnimationFrame + performance.now()

**Resultado:** Precisión de ~50ms en sesiones de 60 minutos.

**Ventajas sobre setInterval:**
- Sin drift acumulativo
- Detección instantánea de throttling
- Sincronizado con refresh rate del display (60fps)

#### 6. Voz: Web Speech API con Cola y Debounce

**Mejoras implementadas:**
- Cola para evitar cortes al saltar rápido
- Debounce de 200ms
- Prevención de duplicados
- Fallback visual si API no disponible

### 18.2 Qué NO Implementar en MVP (Crítico)

Estas features quedaron **explícitamente excluidas** del MVP para mantener el enfoque y velocidad de desarrollo:

❌ **Backend/Cloud**
- Agrega complejidad sin beneficio para usuario local único
- No hay datos compartidos entre usuarios en MVP
- Puede agregarse en Fase 3 si hay demanda

❌ **Autenticación**
- Sin backend, no hay necesidad de auth
- Datos locales son privados por naturaleza

❌ **Edición de Ejercicios**
- Eliminar y recrear es suficiente para MVP
- Edición agrega complejidad de validaciones y UI
- Puede agregarse en Fase 2

❌ **Biblioteca Predefinida**
- Usuario puede crear sus propios ejercicios fácilmente
- Evita necesidad de videos stock con licencia
- Biblioteca se agrega en Fase 3 con 20-30 ejercicios

❌ **Estadísticas/Historial**
- Valor marginal vs. esfuerzo de implementación
- Requiere almacenar historial de sesiones
- Fase 3 agrega estadísticas básicas

❌ **Exportación/Importación**
- Riesgo de pérdida de datos se mitiga con `navigator.storage.persist()`
- Warning en UI sobre limpieza de caché
- Export manual se agrega en Fase 1.5

❌ **Temas/Customización**
- Dark mode por defecto es suficiente
- Customización de colores/fuentes no es core
- Puede agregarse en Fase 2

❌ **Testing Automatizado**
- ROI bajo para proyecto personal en fase inicial
- Testing manual extensivo es suficiente
- Tests críticos (TimerEngine) pueden agregarse después

❌ **Responsive Móvil**
- Fuera de alcance (app es desktop-only)
- Mobile app se considera en Fase 4 con React Native

❌ **PWA Completo**
- Web app ya funciona offline por naturaleza
- Service Worker agrega complejidad sin beneficio claro
- Puede agregarse en Fase 2 si se requiere "Add to Desktop"

### 18.3 Recomendaciones para el Desarrollo

#### Priorización de Tareas

**Alta Prioridad (Bloqueante para MVP):**
1. TimerEngine con precisión <100ms
2. VoiceService con anuncio correcto
3. Almacenamiento persistente en IndexedDB
4. Transiciones automáticas entre intervalos
5. Estados del sistema bien definidos

**Media Prioridad (Importante pero no bloqueante):**
1. Estados vacíos con CTAs
2. Atajos de teclado
3. Validaciones exhaustivas
4. Warnings de almacenamiento

**Baja Prioridad (Nice to have):**
1. Animaciones suaves
2. Thumbnails de videos
3. Búsqueda de ejercicios
4. Fullscreen API

#### Orden de Implementación Recomendado

```
Semana 1-2: Ejercicios
  ├── Setup proyecto
  ├── Modelo de datos
  ├── IndexedDB configuración
  └── CRUD de ejercicios
  
Semana 3-4: Rutinas
  ├── Modelo de rutinas
  ├── Constructor UI
  ├── Drag & drop
  └── Persistencia
  
Semana 5: Player - Parte 1
  ├── Estados del sistema
  ├── TimerEngine
  ├── Controles básicos
  └── Transiciones
  
Semana 6: Player - Parte 2
  ├── VoiceService
  ├── VideoDisplay
  ├── Atajos de teclado
  └── Testing extensivo
```

#### Testing Manual Crítico

Antes de considerar MVP completo, ejecutar estos tests:

**Test de Precisión del Timer:**
```
1. Crear rutina de 10 minutos (600 segundos)
2. Ejecutar completa sin pausar
3. Medir con cronómetro externo
4. Error debe ser <6 segundos (1%)
```

**Test de Voz:**
```
1. Crear rutina con 10 ejercicios variados
2. Ejecutar completa
3. Saltar entre intervalos rápidamente
4. Verificar que voz no se corta ni repite
```

**Test de Persistencia:**
```
1. Crear 5 ejercicios con videos
2. Crear 2 rutinas
3. Cerrar navegador completamente
4. Reabrir aplicación
5. Verificar que todos los datos persisten
```

**Test de Memoria:**
```
1. Abrir DevTools → Memory tab
2. Crear 10 ejercicios con videos
3. Eliminar todos los ejercicios
4. Tomar heap snapshot
5. Verificar que blobs fueron liberados
```

### 18.4 Métricas de Calidad del Código

Para mantener la mantenibilidad a largo plazo:

**TypeScript:**
- ✅ Strict mode habilitado
- ✅ No usar `any` (máximo 5 usos justificados)
- ✅ Interfaces para todas las entidades
- ✅ Types exportados desde carpeta `types/`

**Componentes:**
- ✅ Máximo 200 líneas por componente
- ✅ Extraer lógica compleja a hooks
- ✅ Props interface siempre definida
- ✅ Usar `memo()` para componentes que renderizan listas

**Servicios:**
- ✅ Una responsabilidad por servicio
- ✅ Métodos públicos documentados con JSDoc
- ✅ Manejo de errores con try/catch
- ✅ Cleanup en destructores/useEffect

**Stores:**
- ✅ Un store por dominio (exercises, routines, player)
- ✅ No mutar estado directamente
- ✅ Actions deben ser síncronas o async claramente identificadas
- ✅ Derivar estado cuando sea posible (totalDuration)

### 18.5 Plan de Contingencia

**Si el desarrollo toma más tiempo del estimado:**

**Opción 1: Reducir alcance del MVP**
- Eliminar búsqueda de ejercicios
- Eliminar drag & drop (orden manual con botones arriba/abajo)
- Eliminar thumbnails de videos
- Eliminar atajos de teclado (solo mouse)

**Opción 2: Postergar features no críticas**
- Mover estados vacíos a Fase 1.5
- Mover validaciones exhaustivas a Fase 1.5
- Mover Page Visibility API a Fase 1.5

**Opción 3: Simplificar UI**
- Usar componentes HTML nativos en lugar de Headless UI
- Simplificar diseño del Player
- Reducir animaciones

### 18.6 Siguientes Pasos Inmediatos

**Para comenzar desarrollo HOY:**

1. **Setup inicial (1 hora)**
   ```bash
   npm create vite@latest workout-app -- --template react-ts
   cd workout-app
   npm install
   npm install zustand dexie tailwindcss @headlessui/react lucide-react
   npx tailwindcss init -p
   ```

2. **Configurar estructura (30 minutos)**
   - Crear carpetas según arquitectura
   - Configurar alias `@/` en vite.config.ts
   - Configurar ESLint y Prettier

3. **Implementar modelo de datos (1 hora)**
   - Definir interfaces en `types/`
   - Configurar Dexie en `repositories/db.ts`
   - Crear esquema de IndexedDB

4. **Primer componente (2 horas)**
   - Implementar ExerciseForm básico
   - Validación de nombre
   - Upload de video con validación de tamaño/tipo
   - Guardar en IndexedDB

5. **Verificar persistencia (30 minutos)**
   - Crear ejercicio de prueba
   - Cerrar navegador
   - Reabrir y verificar que persiste

**Después de estos pasos, tendrás la base sólida para continuar con el desarrollo iterativo.**

---

## ANEXO A: SNIPPETS DE CÓDIGO CLAVE

### A.1 Hook de Player Completo

```typescript
// hooks/usePlayer.ts
import { useState, useEffect, useRef } from 'use';
import { Routine, Interval, IntervalType } from '@/types';
import { TimerEngine } from '@/services/TimerEngine';
import { VoiceService } from '@/services/VoiceService';
import { db } from '@/repositories/db';

export function usePlayer(routine: Routine) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [state, setState] = useState<'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED'>('READY');

  const timerRef = useRef<TimerEngine | null>(null);
  const voiceRef = useRef(new VoiceService());

  const currentInterval = routine.intervals[currentIndex];

  const announceInterval = async (interval: Interval) => {
    if (interval.type === IntervalType.EXERCISE && interval.exerciseId) {
      const exercise = await db.exercises.get(interval.exerciseId);
      if (exercise) {
        voiceRef.current.speak(exercise.name);
      }
    } else {
      voiceRef.current.speak('Descanso');
    }
  };

  const startInterval = (interval: Interval) => {
    announceInterval(interval);
    
    timerRef.current = new TimerEngine(
      interval.duration,
      setTimeRemaining,
      () => {
        // Al completar intervalo, pasar al siguiente
        if (currentIndex < routine.intervals.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Rutina completada
          setState('COMPLETED');
          voiceRef.current.speak('Rutina completada');
        }
      }
    );

    timerRef.current.start();
    setTimeRemaining(interval.duration);
  };

  const play = () => {
    if (state === 'READY') {
      startInterval(currentInterval);
      setState('PLAYING');
    }
  };

  const pause = () => {
    timerRef.current?.pause();
    setState('PAUSED');
  };

  const resume = () => {
    timerRef.current?.resume();
    setState('PLAYING');
  };

  const stop = () => {
    timerRef.current?.stop();
    setState('IDLE');
    setCurrentIndex(0);
  };

  const skip = () => {
    timerRef.current?.stop();
    if (currentIndex < routine.intervals.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Auto-start siguiente intervalo
  useEffect(() => {
    if (state === 'PLAYING' && currentIndex > 0) {
      startInterval(currentInterval);
    }
  }, [currentIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      timerRef.current?.stop();
      voiceRef.current.cancel();
    };
  }, []);

  return {
    currentInterval,
    currentIndex,
    timeRemaining,
    state,
    play,
    pause,
    resume,
    stop,
    skip,
    progress: ((currentIndex + 1) / routine.intervals.length) * 100,
  };
}
```

### A.2 Configuración de Tailwind

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontSize: {
        'timer': '96px',
        'exercise-name': '48px',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

---

## ANEXO B: COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npm run preview          # Preview del build
npm run lint             # Ejecutar ESLint
npm run format           # Formatear con Prettier
npm run type-check       # Verificar tipos TypeScript

# Análisis
npm run build -- --report   # Analizar tamaño del bundle
npx vite-bundle-visualizer # Visualizar dependencias

# Database
# (Abrir DevTools → Application → IndexedDB)

# Limpiar caché
# DevTools → Application → Clear Storage → Clear site data
```

---

## ANEXO C: RECURSOS Y REFERENCIAS

### Documentación Oficial

- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Vite:** https://vitejs.dev/guide/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Dexie.js:** https://dexie.org/
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

### Herramientas

- **Figma:** Diseño de mockups (opcional)
- **Excalidraw:** Diagramas de arquitectura
- **Chrome DevTools:** Debugging y performance
- **React DevTools:** Inspección de componentes

### Inspiración

- **Seconds Interval Timer:** Referencia de UI
- **HIIT Interval Timer:** Funcionalidad similar
- **Tabata Timer:** UX de temporizadores

---

## FIN DEL INFORME

**Documento:** Informe Técnico - Aplicación de Rutinas de Ejercicio  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Autor:** Arquitecto de Software  
**Próxima Revisión:** Post-MVP (estimado: 6-8 semanas desde inicio)

---

**Historial de Cambios:**

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | Feb 2026 | Versión inicial completa | Arquitecto |
|  |  |  |  |
|  |  |  |  |