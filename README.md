🏋️ Workout Timer App - Aplicación de Rutinas de Ejercicio Personalizables

> **Aplicación de escritorio para crear y ejecutar rutinas de ejercicio con temporizador, videos y síntesis de voz**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Características](#-características)
- [Demo Rápida](#-demo-rápida)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Arquitectura](#-arquitectura)
- [Decisiones Técnicas Clave](#-decisiones-técnicas-clave)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [FAQ](#-faq)
- [Licencia](#-licencia)

---

## 🎯 Visión General

**Workout Timer** es una aplicación web progresiva diseñada para usuarios que entrenan en casa frente a su computadora. Permite crear rutinas personalizadas tipo HIIT, Tabata o circuitos, con feedback de voz para seguir los ejercicios sin mirar la pantalla.

### 🎪 Propuesta de Valor

- **🎨 Personalización Total**: Crea tus propios ejercicios con nombres arbitrarios
- **🗣️ Feedback de Voz**: Anuncio automático del ejercicio sin mirar la pantalla
- **📹 Soporte Multimedia**: Videos de referencia durante la ejecución
- **⏱️ Control Preciso**: Temporizador de alta precisión (<50ms de error)
- **🔌 Funciona Offline**: Sin conexión, sin cuentas, sin servidor

### 🎬 Caso de Uso Principal

```
Usuario ejecuta rutina de 20 minutos
  ↓
App reproduce video del ejercicio actual
  ↓
Temporizador cuenta regresivamente
  ↓
Voz anuncia "Sentadillas"
  ↓
Usuario ejecuta sin mirar pantalla
  ↓
Al finalizar → Voz anuncia "Descanso"
  ↓
Siguiente ejercicio se carga automáticamente
```

---

## ✨ Características

### MVP (Versión 1.0)

#### Gestión de Ejercicios
- ✅ Crear ejercicio (nombre + video MP4/WebM/MOV)
- ✅ Listar ejercicios con thumbnails
- ✅ Eliminar ejercicios (con confirmación)
- ✅ Búsqueda por nombre

#### Gestión de Rutinas
- ✅ Crear rutina con intervalos personalizables
- ✅ Asociar ejercicios con duración específica
- ✅ Intervalos de descanso configurables
- ✅ Reordenar intervalos (drag & drop)
- ✅ Guardar/cargar rutinas

#### Ejecución
- ✅ Temporizador con cuenta regresiva precisa
- ✅ Reproducción de video en loop
- ✅ Síntesis de voz (español/inglés)
- ✅ Controles: Play, Pausa, Stop, Siguiente
- ✅ Indicador de progreso
- ✅ Atajos de teclado (Espacio, Escape, Flechas)

#### Persistencia
- ✅ Almacenamiento local (IndexedDB)
- ✅ Videos almacenados como blobs
- ✅ Funciona sin conexión

### 🚫 Fuera del Alcance MVP

- Backend/Sincronización en la nube
- Biblioteca predefinida de ejercicios
- Edición de ejercicios (solo crear/eliminar)
- Estadísticas o historial de sesiones
- Exportación/Importación de rutinas
- Temas personalizables
- Versión móvil

---

## 🎥 Demo Rápida

### Crear Ejercicio
```typescript
1. Click en "Nuevo Ejercicio"
2. Ingresar nombre: "Sentadillas"
3. Subir video desde tu computadora
4. Guardar → El ejercicio aparece en la lista
```

### Crear Rutina
```typescript
1. Click en "Nueva Rutina"
2. Ingresar nombre: "HIIT 20 min"
3. Agregar intervalos:
   - Sentadillas (30 seg)
   - Descanso (10 seg)
   - Burpees (30 seg)
   - Descanso (10 seg)
4. Guardar rutina
```

### Ejecutar
```typescript
1. Seleccionar rutina
2. Click en Play
3. Escuchar "Sentadillas" → Hacer ejercicio
4. Video se reproduce automáticamente
5. Al terminar → Transición automática
```

---

## 🛠️ Stack Tecnológico

### Core Stack
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 18.3+ | Framework UI |
| **TypeScript** | 5.5+ | Type safety |
| **Vite** | 5.4+ | Build tool |
| **Tailwind CSS** | 3.4+ | Styling |
| **Zustand** | 4.5+ | State management |
| **Dexie.js** | 4.0+ | IndexedDB wrapper |

### Librerías Auxiliares
- **Headless UI** - Componentes accesibles
- **Lucide React** - Iconos
- **dnd-kit** - Drag & drop
- **Zod** - Validación de esquemas

### Web APIs Utilizadas
- **File API** - Carga de videos
- **IndexedDB** - Almacenamiento persistente
- **Web Speech API** - Síntesis de voz
- **requestAnimationFrame** - Temporizador preciso
- **Page Visibility API** - Detección de pestaña activa

---

## 📦 Instalación

### Prerrequisitos
- **Node.js** 18+ y npm 9+
- **Navegador moderno**: Chrome 120+, Firefox 120+, Edge 120+, Safari 17+

### Setup Rápido

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/workout-timer.git
cd workout-timer

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción

```bash
# Generar build optimizado
npm run build

# Preview del build
npm run preview
```

---

## 🎮 Uso

### Atajos de Teclado

Durante la ejecución de rutina:

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `→` | Siguiente intervalo |
| `Escape` | Detener rutina |

### Formatos de Video Soportados

- **MP4** (H.264) - Recomendado
- **WebM** (VP9)
- **MOV** (QuickTime)

**Límites:**
- Tamaño máximo por video: **100 MB**
- Duración máxima de intervalo: **10 minutos**
- Máximo de ejercicios: **100**
- Máximo de intervalos por rutina: **50**

### Gestión de Almacenamiento

La app almacena videos localmente usando IndexedDB:

```typescript
// Verificar espacio disponible
const quota = await navigator.storage.estimate();
console.log(`Usado: ${quota.usage} bytes`);
console.log(`Disponible: ${quota.quota} bytes`);
```

**Cuotas típicas:**
- Chrome/Edge: ~500MB - varios GB
- Firefox: ~50% del espacio libre en disco
- Safari: ~1GB (solicita permiso para más)

---

## 🏗️ Arquitectura

### Estructura por Capas

```
┌─────────────────────────────────────┐
│     PRESENTATION LAYER              │
│  (React Components + Tailwind)      │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│     APPLICATION LAYER               │
│  (Custom Hooks + Zustand Stores)    │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│       DOMAIN LAYER                  │
│  (Business Logic Services)          │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│    INFRASTRUCTURE LAYER             │
│  (IndexedDB Repositories)           │
└─────────────────────────────────────┘
```

### Máquina de Estados del Player

```typescript
type PlayerState = 
  | 'IDLE'      // Sin rutina cargada
  | 'READY'     // Rutina cargada, no iniciada
  | 'PLAYING'   // Ejecutando
  | 'PAUSED'    // Pausado
  | 'COMPLETED' // Finalizado
  | 'ERROR';    // Error crítico
```

**Transiciones:**
```
IDLE → READY      (cargar rutina)
READY → PLAYING   (play)
PLAYING → PAUSED  (pause)
PAUSED → PLAYING  (resume)
PLAYING → COMPLETED (último intervalo termina)
ANY → ERROR       (fallo crítico)
```

### Estructura de Carpetas

```
src/
├── components/
│   ├── exercises/
│   │   ├── ExerciseCard.tsx
│   │   ├── ExerciseForm.tsx
│   │   ├── ExerciseList.tsx
│   │   └── EmptyState.tsx
│   ├── routines/
│   │   ├── RoutineBuilder.tsx
│   │   ├── IntervalEditor.tsx
│   │   └── RoutineList.tsx
│   ├── player/
│   │   ├── Player.tsx
│   │   ├── VideoDisplay.tsx
│   │   ├── Timer.tsx
│   │   └── Controls.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useExercises.ts
│   ├── useRoutines.ts
│   ├── usePlayer.ts
│   ├── useTimer.ts
│   └── useVoice.ts
├── services/
│   ├── TimerEngine.ts
│   ├── VoiceService.ts
│   └── VideoManager.ts
├── repositories/
│   ├── ExerciseRepository.ts
│   ├── RoutineRepository.ts
│   └── db.ts
├── stores/
│   ├── exerciseStore.ts
│   ├── routineStore.ts
│   └── playerStore.ts
├── types/
│   ├── Exercise.ts
│   ├── Routine.ts
│   └── Interval.ts
└── utils/
    ├── formatTime.ts
    └── validators.ts
```

---

## 🔧 Decisiones Técnicas Clave

### 1. ¿Por qué Web App y no Electron desde el inicio?

**Decisión:** Empezar como aplicación web, migrar a Electron en Fase 2.

**Justificación:**
- ⚡ **Desarrollo 2-3x más rápido** - Sin configurar IPC, permisos, packaging
- 🔄 **Migración futura sin refactorización** - El código web se empaqueta en Electron directamente
- 🎯 **MVP más rápido** - Enfocarse en features, no en infraestructura
- 📦 **Bundle liviano** - Sin overhead de Chromium embebido

**Trade-off aceptado:**
- File API requiere selección manual de videos (vs. acceso directo al filesystem)
- Para MVP con ~20-30 ejercicios de <30 segundos, es viable (~200-500MB total)

### 2. Temporizador de Alta Precisión

**Problema:** `setInterval` pierde 1-2 segundos cada minuto.

**Solución:** `requestAnimationFrame` + `performance.now()`

```typescript
class TimerEngine {
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
}
```

**Resultado:** Error <50ms en sesiones de 60 minutos.

### 3. Gestión de Voz con Cola

**Problema:** Al saltar intervalos rápido, la voz se corta o repite.

**Solución:** Cola simple con debounce:

```typescript
class VoiceService {
  private queue: string[] = [];
  private lastSpoken: string = '';
  
  speak(text: string) {
    // No repetir mismo texto
    if (text === this.lastSpoken) return;
    
    // Cancelar pendiente
    this.synth.cancel();
    
    // Hablar con debounce
    setTimeout(() => {
      this.synth.speak(new SpeechSynthesisUtterance(text));
      this.lastSpoken = text;
    }, 200);
  }
}
```

### 4. Política de Limpieza de Blobs

**Decisión:** 1 ejercicio = 1 video (sin compartir blobs).

```typescript
deleteExercise(id: string) {
  const exercise = await db.exercises.get(id);
  
  // Revocar blob URL
  if (exercise?.videoURL) {
    URL.revokeObjectURL(exercise.videoURL);
  }
  
  // Eliminar de DB
  await db.exercises.delete(id);
}
```

**Beneficio:** Simplicidad. Sin lógica de conteo de referencias.

### 5. Estados Vacíos Definidos

Cada vista tiene estado vacío explícito:

| Vista | Estado Vacío | Acción |
|-------|--------------|--------|
| Ejercicios | Ilustración + "Crea tu primer ejercicio" | CTA a formulario |
| Rutinas | "Sin rutinas guardadas" | CTA a constructor |
| Player | "Selecciona una rutina" | Volver a lista |
| Error | "Navegador no soporta Web Speech" | Sugerencia de navegador alternativo |

---

## 🗺️ Roadmap

### ✅ Fase 1: MVP Funcional (4-6 semanas)

**Semana 1-2: Setup y Ejercicios**
- [x] Configurar proyecto Vite + React + TypeScript
- [x] Modelo de datos (Exercise, Routine, Interval)
- [x] IndexedDB con Dexie
- [x] Formulario de creación de ejercicios
- [x] Lista de ejercicios con thumbnails

**Semana 3-4: Rutinas**
- [x] Constructor de rutinas
- [x] Drag & drop para reordenar
- [x] Selector de ejercicios
- [x] Intervalos de descanso
- [x] Guardar/cargar rutinas

**Semana 5-6: Player**
- [x] TimerEngine con RAF
- [x] VideoDisplay
- [x] VoiceService
- [x] Controles y atajos
- [x] Transiciones automáticas

### 🚧 Fase 2: Refinamiento y Electron (3-4 semanas)

- [ ] Animaciones suaves (Framer Motion)
- [ ] Sonido opcional en fin de intervalo
- [ ] Modo claro/oscuro
- [ ] Migrar a Electron
- [ ] Almacenamiento por paths (no blobs)
- [ ] Instaladores para Windows/macOS/Linux
- [ ] Duplicar/Editar ejercicios
- [ ] Clonar rutinas

### 🔮 Fase 3: Biblioteca y Compartir (4-6 semanas)

- [ ] Biblioteca predefinida (20-30 ejercicios)
- [ ] Categorización (cardio, fuerza, estiramiento)
- [ ] Filtros por categoría
- [ ] Exportar/Importar rutinas (JSON)
- [ ] Estadísticas básicas
- [ ] Gráfica de actividad semanal

### 🚀 Fase 4: Expansión (futuro)

- [ ] Soporte para imágenes/GIFs
- [ ] Generador inteligente de rutinas
- [ ] Sincronización cloud (requiere backend)
- [ ] App móvil (React Native)

---

## 🤝 Contribución

### Configuración de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar dev server con HMR
npm run dev

# Linting
npm run lint

# Formateo
npm run format

# Type checking
npm run type-check
```

### Guías de Estilo

- **TypeScript:** Strict mode habilitado
- **Componentes:** Máximo 200 líneas
- **Commits:** Conventional Commits (feat, fix, docs, etc.)
- **Formateo:** Prettier con config del proyecto

### Testing Recomendado

Aunque no es obligatorio para MVP, se recomienda:

```bash
npm run test              # Tests unitarios (Vitest)
npm run test:coverage     # Coverage report
```

**Tests críticos:**
- TimerEngine (precisión)
- Cálculo de duración total
- Orden de intervalos
- Validaciones de formularios

---

## ❓ FAQ

### ¿Funciona sin conexión?
Sí, completamente. Una vez cargada, no requiere internet.

### ¿Dónde se guardan mis datos?
En IndexedDB del navegador. Los datos son locales y privados.

### ¿Qué pasa si borro caché del navegador?
Se pierden todos los ejercicios y rutinas. Recomendamos:
1. Usar modo incógnito solo para probar
2. Aceptar persistencia cuando el navegador lo solicite
3. En Fase 2 habrá exportación de respaldo

### ¿Por qué no puedo usar GIFs?
MVP solo soporta videos. Los GIFs se agregarán en Fase 3.

### ¿Puedo usar en móvil?
No está optimizado para móvil. Funciona, pero la experiencia es pobre. Versión móvil planeada para Fase 4.

### ¿Cómo migro a Electron después?
El código web se empaqueta con Electron Builder sin cambios. Solo se migra el almacenamiento de blobs a filesystem.

### ¿Qué hago si la voz no funciona?
1. Verificar que tu navegador soporte Web Speech API
2. Revisar permisos de micrófono (algunos navegadores lo requieren)
3. Cambiar a Chrome/Edge (mejor compatibilidad)
4. Como fallback, el nombre se muestra en pantalla

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 📞 Contacto

- **Issues:** [GitHub Issues](https://github.com/johnivansn/routime/issues)
- **Discusiones:** [GitHub Discussions](https://github.com/johnivansn/routime/discussions)

---

<div align="center">

**Hecho con ❤️ para personas que entrenan en casa**

[⬆ Volver arriba](#-workout-timer-app---aplicación-de-rutinas-de-ejercicio-personalizables)

</div>