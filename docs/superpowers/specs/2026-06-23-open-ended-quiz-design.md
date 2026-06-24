# Quiz de respuesta abierta — Diseño

**Fecha:** 2026-06-23
**Contexto:** Rocío 30 — Party Game Hub. Hoy el quiz es de opción múltiple (4 opciones, índice correcto). La host quiere que los invitados **escriban** la respuesta, con matching flexible.

## Objetivo

Convertir el juego de quiz de opción múltiple a **respuesta abierta** con corrección automática flexible, mostrando todas las respuestas al revelar y permitiendo override manual del host.

## Formato de contenido (`src/content/quiz.json`)

```json
[
  { "q": "¿Mi comida favorita?", "a": "Milanesa", "accept": ["milanesa", "milanga"] }
]
```

- `q` — la pregunta.
- `a` — la respuesta "oficial" que se muestra al revelar.
- `accept` — lista de palabras clave que cuentan como correctas. Si se omite, se deriva de `a`.

## Lógica de matching

```
normalizar(s) = s.toLowerCase().trim()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')   // sin acentos
                .replace(/\s+/g, ' ')

esCorrecta(respuesta, accept[]) =
  accept.some(k => normalizar(respuesta).includes(normalizar(k)))
```

Casos cubiertos (requeridos por la host):
- Palabra exacta: `milanesa` ✓
- Palabra + otra cosa: `milanesa napolitana` ✓ (substring)
- Plural: `milanesas` ✓ (la clave singular es substring del plural)
- Bonus: ignora mayúsculas y tildes.

Respuesta vacía o ausente → incorrecta.

## Estado del juego (`game_state`)

Se reutiliza el patrón actual (`round_index`, `round_key = quiz:i`, `phase`, `timer_ends_at`).
Se agrega:
- `overrides?: Record<string, 'correct' | 'incorrect'>` — correcciones manuales del host
  para la pregunta actual. Se sincroniza por realtime para que la pantalla grande
  refleje los overrides. Se limpia al pasar de pregunta y en `initialState`.

La corrección efectiva de un jugador `p` en la pregunta actual:
```
overrides[p.id] != null ? overrides[p.id] === 'correct'
                        : esCorrecta(answerDe(p), q.accept)
```

## UX por rol

**Invitado** (`renderGuest`):
- Fase `asking`: `<input>` de texto + botón "Enviar". Puede reenviar/editar hasta el cierre
  (upsert por `player_id,round_key`, igual que hoy).
- Fase `revealing`: "¡Acertaste! ✓" / "Casi… ✗" + la respuesta oficial (`a`).

**Pantalla grande** (`renderScreen`):
- Fase `asking`: pregunta + countdown + contador "X de N respondieron" (sin spoilear respuestas).
- Fase `revealing`: respuesta oficial grande + lista de cada invitado que respondió, con su
  texto y marca ✓/✗ según corrección efectiva (incluye overrides). Cuántos acertaron.

**Host** (`renderHost`):
- Fase `asking`: "Cerrar y revelar" → corrige automáticamente, +1 por acierto, fase `revealing`.
  Mantiene el guard host-local `revealedRounds` contra doble-tap.
- Fase `revealing`: lista de invitados que respondieron; tocar uno alterna correcto/incorrecto,
  ajustando su puntaje ±1 y escribiendo en `overrides`. Luego "Siguiente pregunta" / "Ver podio".

## Scoring

- Al revelar (una sola vez, guard `revealedRounds`): `+1` a cada respuesta con `esCorrecta` true.
- Override del host sobre jugador `p`:
  - estado actual = corrección efectiva de `p`.
  - nuevo estado = lo opuesto.
  - delta de puntaje = nuevo ? `+1` : `-1`; `addScores({ [p.id]: delta })`.
  - patch `overrides[p.id] = nuevo ? 'correct' : 'incorrect'`.

## Alcance / sin cambios

- Sin cambios de esquema: `answers.value` es `jsonb` (`any`), ahora guarda un string.
- Sin cambios en los otros dos juegos ni en el motor de sala.
- Sin tests automatizados (el proyecto no tiene runner); verificación por `npm run build` + prueba manual.

## Archivos afectados

- `src/content/quiz.json` — nuevo formato.
- `src/games/quiz.tsx` — input abierto, matching, reveal con respuestas, override.
- `src/lib/types.ts` — agregar `overrides` opcional a `GameState`.
- (opcional) un helper `normalize`/`isCorrect` dentro de `quiz.tsx`.
