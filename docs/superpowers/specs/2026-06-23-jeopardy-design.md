# Jeopardy por equipos — Diseño

**Fecha:** 2026-06-23
**Contexto:** Rocío 30 — Party Game Hub. Nuevo juego que reemplaza el quiz de opción múltiple. Mecánica tipo Jeopardy con 4 equipos, capitanes, robo y timer.

---

## Resumen

Tablero estilo Jeopardy con categorías × valores (100–500). Ro arma 4 equipos y elige capitanes. Los equipos se turnan: el capitán del equipo activo elige pregunta desde su celu, responde por el equipo. Si falla, los otros 3 capitanes compiten para robar. Timer de 60s por fase. Puntaje por equipo (no toca `players.score`, que sigue siendo para los otros juegos).

---

## Arquitectura de datos

### Opción elegida: columna `teams` en `rooms`

Se agrega una columna `teams JSONB` a la tabla `rooms`. Separa la config de equipos del estado activo del juego.

**`rooms.teams`** — se escribe en setup, se actualiza al sumar puntos:
```json
[
  {
    "id": "team-1",
    "name": "Equipo 1",
    "color": "#FF6B9D",
    "member_ids": ["uuid-a", "uuid-b", "uuid-c", "uuid-d"],
    "captain_id": "uuid-a",
    "score": 0
  }
]
```

**`rooms.game_state`** — estado activo de la partida:
```json
{
  "phase": "picking",
  "current_team_index": 0,
  "board": [[false, false, false, false, false], ...],
  "active_q": { "cat_i": 2, "val_i": 3 },
  "timer_ends_at": "2026-06-23T22:00:00.000Z",
  "steal_open": false,
  "overrides": {}
}
```

**Valores de `phase`:** `setup` | `picking` | `answering` | `stealing` | `revealing` | `finished`

### Migración necesaria
```sql
ALTER TABLE rooms ADD COLUMN teams JSONB DEFAULT '[]'::jsonb;
```

### Puntaje individual intacto
`players.score` **no se modifica** durante Jeopardy. Los puntajes de equipos viven exclusivamente en `rooms.teams[i].score`. Esto preserva el sistema de puntaje individual para Quiz, Most Likely y Dos Verdades.

---

## Contenido (`src/content/jeopardy.json`)

Nuevo archivo separado del quiz existente.

```json
{
  "categories": [
    {
      "name": "Sobre Ro",
      "questions": [
        { "q": "¿Dónde nació Ro?", "a": "Córdoba", "accept": ["córdoba", "cordoba"], "value": 100 },
        { "q": "...", "a": "...", "accept": [...], "value": 200 },
        { "q": "...", "a": "...", "accept": [...], "value": 300 },
        { "q": "...", "a": "...", "accept": [...], "value": 400 },
        { "q": "...", "a": "...", "accept": [...], "value": 500 }
      ]
    }
  ]
}
```

Cada categoría tiene exactamente 5 preguntas, ordenadas de más fácil (100) a más difícil (500). **5 categorías definidas:**

1. **Arquitectura** — preguntas sobre arquitectura, edificios icónicos, historia construida.
2. **Tecnología** — gadgets, apps, hitos tech.
3. **Cultura Pop 2000s** — música, series, pelis, moda de la época.
4. **Sobre Ro** — preguntas personales sobre la cumpleañera (contenido provisto por Ro).
5. **Por el mundo** — geografía, capitales, lugares icónicos del mundo.

---

## Flujo completo

### 1. Setup (Ro arma los equipos)

- Ro abre Jeopardy desde el hub → ve pantalla de setup (solo en vista Host).
- Todos los jugadores aparecen como tiles.
- Ro toca un jugador → elige equipo (1–4) desde un popup/bottom-sheet.
- Una vez asignado, el tile muestra el color del equipo.
- Para elegir capitán: Ro toca el nombre del equipo → lista de sus miembros → toca uno → es capitán.
- Equipos pueden tener nombres personalizados (editables inline) o quedarse como "Equipo 1–4".
- Cuando los 4 equipos tienen al menos 1 miembro y un capitán → botón "Iniciar juego" se habilita.
- Al iniciar: escribe `teams` en `rooms`, pone `game_state.phase = 'picking'`, `current_team_index = 0`.

### 2. Tablero (`phase: 'picking'`)

- **Pantalla grande:** tablero completo — columnas = categorías, filas = valores 100–500. Celdas jugadas = apagadas. Muestra "Turno: Equipo X (Capitán: Nombre)".
- **Capitán del equipo activo:** ve el mismo tablero en su celu, celdas disponibles son tapeables.
- **Resto de jugadores:** ven "Le toca al Equipo X, esperá..."
- **Host (Ro):** ve el tablero + puede forzar avance si el capitán se tarda.

### 3. Pregunta activa (`phase: 'answering'`)

- Capitán toca una celda → se escribe `active_q`, `phase = 'answering'`, `timer_ends_at = now + 60s`.
- **Pantalla grande:** pregunta grande, nombre de categoría + valor, countdown 60s.
- **Capitán:** pregunta + campo de texto + botón "Enviar". Puede reenviar hasta que se cierre.
- **Resto:** ven la pregunta en modo lectura (pueden discutir en persona con el capitán).
- **Host:** ve un indicador de si el capitán ya envió respuesta.

### 4. Resultado y robo

**Si el tiempo se acaba sin respuesta o la respuesta es incorrecta:**
- `phase = 'stealing'`, `steal_open = true`, timer se resetea a 60s.
- Los otros 3 capitanes ven la pregunta + campo de texto en su celu.
- El capitán original ya no puede enviar.
- Primero en enviar respuesta correcta → roba los puntos.
- Si todos fallan o se acaba el tiempo → nadie suma.

**Si la respuesta es correcta:**
- Salta directo a `phase = 'revealing'` sin abrir robo.

### 5. Reveal (`phase: 'revealing'`)

- **Pantalla grande:** respuesta oficial grande + respuestas enviadas por los capitanes (marcadas ✓/✗) + "Equipo X ganó N puntos" o "Nadie acertó".
- **Host:** puede hacer override (tocar el resultado de un capitán para cambiar correcto/incorrecto) antes de confirmar. Botón "Confirmar y siguiente turno".
- Al confirmar: suma puntos al equipo ganador en `rooms.teams`, marca `board[cat_i][val_i] = true`, `current_team_index = (current_team_index + 1) % 4`, limpia `active_q` y `overrides`, `phase = 'picking'` (o `'finished'` si el tablero está completo).

### 6. Fin del juego (`phase: 'finished'`)

- Tablero completo → pantalla grande muestra podio de equipos (1º, 2º, 3º, 4º) con puntajes.
- Host ve botón "Volver al hub".

---

## Matching flexible

Igual al diseño del quiz abierto:

```
normalizar(s) = s.toLowerCase().trim()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, ' ')

esCorrecta(respuesta, accept[]) =
  accept.some(k => normalizar(respuesta).includes(normalizar(k)))
```

---

## Archivos a crear / modificar

| Archivo | Cambio |
|---|---|
| `supabase/schema.sql` | Agregar `ALTER TABLE rooms ADD COLUMN teams JSONB DEFAULT '[]'::jsonb` |
| `src/content/jeopardy.json` | Nuevo — categorías y preguntas (contenido a definir) |
| `src/games/jeopardy.tsx` | Nuevo — implementación completa del juego |
| `src/games/registry.ts` | Registrar `jeopardyGame` |
| `src/lib/types.ts` | Agregar `teams` a tipo `Room`; agregar campos Jeopardy a `GameState` |
| `src/routes/Host.tsx` | Mostrar tarjeta del nuevo juego en el hub |

El quiz de opción múltiple (`src/games/quiz.tsx` + `src/content/quiz.json`) **se elimina** y es reemplazado por este juego.

---

## Lo que NO cambia

- `players.score` — intacto, lo usan los otros juegos.
- `most_likely`, `two_truths` — sin cambios.
- Motor de sala, realtime, RLS — sin cambios.
- No hay tests automatizados; verificación por `npm run build` + prueba manual.
