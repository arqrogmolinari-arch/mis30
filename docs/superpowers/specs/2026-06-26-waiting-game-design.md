# Waiting Game — Mini runner para la sala de espera

**Fecha:** 2026-06-26  
**Rama:** `feature/waiting-game`  
**Estado:** Aprobado

## Contexto

La pantalla de espera (`WaitingRoom` en `src/routes/Play.tsx`) muestra "Esperando que comience la partida" con corazones animados. Se quiere reemplazar esa experiencia con un mini juego tipo runner (estilo dinosaurio de Chrome) para entretener a los jugadores hasta que el host arranca la partida.

## Alcance

- Un nuevo componente `src/components/ui/WaitingGame.tsx`.
- En la rama `feature/waiting-game`, `Play.tsx` importa `WaitingGame` en lugar de `WaitingRoom` cuando `room.phase === 'lobby'`.
- El componente original `WaitingRoom` no se toca (la rama no modifica `main`).
- Sin dependencias externas.

## Arquitectura

### Componente

```
WaitingGame({ name: string })
  ├── saludo superior: "Hola {name}" + score
  ├── canvas/área de juego (div posicionado relativamente)
  │   ├── GirlSprite (SVG pixel art, posición Y dinámica)
  │   ├── ObstacleSprite[] (SVG flor pixel art, posición X dinámica)
  │   └── suelo (border-top punteado rosa)
  └── footer: "Esperando que comience la partida…"
```

### Estado y refs

| Variable | Tipo | Dónde |
|---|---|---|
| `score` | `number` | `useState` — re-render permitido |
| `gameOver` | `boolean` | `useState` — re-render permitido |
| `girlY` | `ref` | posición vertical en píxeles (0 = suelo) |
| `girlVY` | `ref` | velocidad vertical (px/frame) |
| `obstacles` | `ref` | array `{x, id}` |
| `speed` | `ref` | velocidad horizontal actual (px/frame) |
| `nextObstacleIn` | `ref` | frames hasta el próximo obstáculo |
| `rafId` | `ref` | ID del requestAnimationFrame activo |

### Game loop (requestAnimationFrame)

Cada frame (~16ms a 60fps):

1. **Física de salto:** `girlVY += GRAVITY`; `girlY += girlVY`; clamp a 0 (suelo).
2. **Mover obstáculos:** cada obstáculo `x -= speed`; eliminar los que salen por la izquierda (`x < -20`).
3. **Spawn:** decrementar `nextObstacleIn`; cuando llega a 0, agregar un obstáculo nuevo en `x = GAME_WIDTH + 10` y resetear a un valor random entre 60–150 frames.
4. **Colisión:** bounding box con margen de 4px. Si colisiona → `setGameOver(true)`, cancelar RAF, reiniciar en 1500ms.
5. **Score:** cuando un obstáculo sale por la izquierda exitosamente, `setScore(s => s + 1)`; cada 5 puntos `speed += 0.3`.
6. **Render:** actualizar `transform: translateY` de la chica y `transform: translateX` de cada obstáculo leyendo desde los refs.

### Input

- `keydown` (Space / ArrowUp) → salto
- `pointerdown` en el área de juego → salto
- Solo salta si `girlY === 0` (en el suelo) y `!gameOver`

### Constantes

```ts
const GRAVITY = 0.6
const JUMP_VY = -13
const INITIAL_SPEED = 4
const GAME_HEIGHT = 120   // px área de juego
const GIRL_WIDTH = 24
const GIRL_HEIGHT = 32
const OBS_WIDTH = 16
const OBS_HEIGHT = 20
```

## Visual

### Layout

```
┌─────────────────────────────────────────────┐
│  Hola Rocío                     Score: 7    │  ← Pixelify Sans
│                                             │
│  [chica]                      [flor]        │  ← área de juego (120px alto)
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  ← suelo punteado rosa
│                                             │
│   Esperando que comience la partida…        │  ← Quicksand, opacidad 0.8
└─────────────────────────────────────────────┘
```

### Chica (SVG pixel art 24×32)

Pixel art mínimo dibujado con `<rect>` (como `PixelHeart`):
- Cabello largo oscuro (#4A2040)
- Cara piel claro (#FFD6B0)  
- Vestido rosa (#FF9ECC)
- Piernas (#4A2040)

Animación de piernas: alterna entre dos poses (parada / pierna adelante) con `steps(2)` cada 200ms mientras corre. Se detiene (pose neutra) cuando está en el aire.

### Flor obstáculo (SVG pixel art 16×20)

Pétalos rosados (#FF4FB6) con centro amarillo (#FFD700), tallo verde mínimo. Dibujada con `<rect>` igual que los demás sprites.

### Suelo

`border-top: 2px dashed var(--pink-hot)` — igual al estilo del resto del proyecto.

### Game over

Flash rojo de la chica (filter: `brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(500%) hue-rotate(300deg)`) por 300ms, luego reinicio automático a los 1500ms.

## Integración con la sala

`WaitingGame` se usa donde hoy está `WaitingRoom`:

```tsx
// Play.tsx (rama feature/waiting-game)
if (room.phase === 'lobby') {
  return <WaitingGame name={me.name} />
}
```

Cuando el host cambia `room.phase` a `'playing'`, React desmonta `WaitingGame` y el `useEffect` cleanup cancela el RAF automáticamente. No se necesita lógica extra.

## Archivos a crear/modificar

| Acción | Archivo |
|---|---|
| Crear | `src/components/ui/WaitingGame.tsx` |
| Modificar | `src/routes/Play.tsx` (solo el import y el condicional de lobby) |

## Fuera del alcance

- Doble salto
- Efectos de sonido
- Tabla de puntajes
- Múltiples tipos de obstáculos
- Animaciones de victoria al entrar al juego
