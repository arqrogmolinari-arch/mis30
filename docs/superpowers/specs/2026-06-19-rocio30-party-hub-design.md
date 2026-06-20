# Diseño — Party Game Hub "Rocío 30" (Y2K / Bratz edition)

**Fecha:** 2026-06-19
**Estado:** Aprobado para implementación
**Tipo:** Proyecto descartable, una sola noche, multiplayer en tiempo real

---

## 1. Resumen

Hub web de 3 juegos para una fiesta de ~18 adultos. Cada invitado entra desde su
celu escaneando un QR (sin instalar, sin cuenta) y **se elige a sí mismo** de una
lista pre-cargada con nombre + foto (imágenes IA que provee la host). Una Big
Screen compartida (laptop → TV) actúa de tablero central. La host (Rocío) controla
el flujo desde su celular.

Los 3 juegos comparten un único **motor de sala** reutilizable. Construir bien el
motor hace que los juegos sean configuración, no reconstrucción.

Juegos:
1. **¿Quién conoce mejor a Rocío?** — quiz sincronizado.
2. **¿Quién es más probable que…?** — votación social sobre invitados.
3. **Dos verdades y una mentira** — adivinanza social por turnos.

---

## 2. Decisiones tomadas (resumen)

| # | Decisión | Resuelto |
|---|----------|----------|
| 1 | Control de la host | **Desde el celu** (`/host`); la laptop solo muestra (`/screen`) |
| 2 | Contenido "dos verdades" | **Carga en vivo** durante la fiesta |
| 3 | Puntaje del quiz | **+1 fijo** por acierto (sin bonus por velocidad) |
| 4 | Cierre del hub | **Ranking global** acumulado (quiz + dos-verdades) |
| 5 | Avatares | **Fotos IA pre-cargadas** por la host; jugadores pre-seteados con nombre + foto |
| 6 | Roster | **Cerrado** — solo aparecen los jugadores pre-cargados |
| 7 | Re-claim | **Re-tomar siempre** — tocar tu cara te re-entra; resuelve recargas |
| 8 | Código de sala | **Fijo: `ROCIO30`** — QR estable, sin UI de crear sala |
| 9 | Sincronización | **Estado en la DB (Postgres Changes)** como única fuente de verdad |

---

## 3. Stack

- **Frontend:** React + Vite (SPA), mobile-first.
- **Estilos:** CSS plano con design tokens (sección 9 del PRD).
- **Tiempo real + datos:** Supabase Realtime (Postgres Changes). Anon key en cliente.
- **Hosting:** estático (Vercel/Netlify/Cloudflare Pages). El día de la fiesta puede
  correr en localhost en la misma red, pero deploy estático es más robusto para el QR.
- **Sin backend propio.** Lógica en el cliente + RLS laxa.

### Nota Supabase
Plan free se pausa tras 7 días de inactividad. Reactivar desde el dashboard antes
de la fiesta y hacer una prueba real.

---

## 4. Arquitectura y rutas

SPA con 5 rutas. Cliente Supabase compartido. Una sola sala (`ROCIO30`).

### Rutas
- `/` — landing simple; lleva a la sala fija `ROCIO30`. Sin UI de crear sala.
- `/join/:code` — invitado: grilla "¿Quién sos?" con las caras pre-cargadas. Tocás
  tu cara → entrás. El `player_id` se guarda en `localStorage` para sobrevivir recargas.
- `/play/:code` — invitado: vista única reactiva que se adapta a `active_game` + fase.
- `/screen/:code` — Big Screen: QR en lobby, luego el tablero del juego activo.
- `/host/:code` — panel de control de Rocío (desde su celu).

### Capa compartida
- `lib/supabase.ts` — cliente Supabase.
- `lib/room.ts` — hook `useRoom(code)`: suscribe a `rooms`, `players`, `answers`,
  `two_truths_entries` vía Postgres Changes y expone el estado vivo.
- `lib/roster.ts` — carga `src/content/players.json` (fotos IA + nombres).
- `games/registry.ts` — registro de los 3 juegos como configs.

---

## 5. Modelo de datos

### `rooms` (1 fila: la sala `ROCIO30`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `code` | text unique | `ROCIO30` |
| `phase` | text | `lobby` \| `playing` \| `results` |
| `active_game` | text \| null | `quiz` \| `two_truths` \| `most_likely` \| null |
| `game_state` | jsonb | estado del juego activo (ver §6.3) |

### `players` (pre-sembrada desde `players.json`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid FK | |
| `slug` | text | id estable del roster (ej. `rocio`), liga a la foto |
| `name` | text | nombre mostrado |
| `photo` | text | ruta a la foto IA (`/players/rocio.jpg`) |
| `claimed_at` | timestamptz \| null | null = nadie la tomó; se setea al tocar |
| `score` | int | puntaje global acumulado (quiz + dos-verdades), default 0 |

### `answers` (genérica, los 3 juegos)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid FK | |
| `player_id` | uuid FK | quién responde |
| `game` | text | `quiz` \| `two_truths` \| `most_likely` |
| `round_key` | text | identifica la ronda (ej. `quiz:3`, `tt:rocio`, `ml:5`) |
| `value` | jsonb | la respuesta (opción elegida, id votado, etc.) |
| `created_at` | timestamptz | default now() |

Restricción **único `(player_id, round_key)`** → un input por ronda; re-tocar hace
upsert (permite cambiar la respuesta hasta que cierra la fase).

### `two_truths_entries` (frases cargadas en vivo)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid FK | |
| `player_id` | uuid FK unique | autor (una entrada por persona) |
| `statements` | jsonb | `["frase1","frase2","frase3"]` |
| `lie_index` | int | cuál es la mentira (0–2) |

### Contenido estático (en el repo, no en DB)
- `src/content/quiz.json` — 15–20 preguntas, cada una con opciones e índice correcto.
- `src/content/most_likely.json` — prompts precargados.
- `src/content/players.json` — `[{ "slug": "rocio", "name": "Rocío" }, ...]`.

### Realtime
Canal por sala vía Postgres Changes sobre `rooms`, `players`, `answers`,
`two_truths_entries`. Filtrado por `room_id` en el cliente.

---

## 6. El motor de sala

### 6.1 Máquina de estados de la sala
```
lobby ──[host elige juego]──> playing ──[host vuelve al hub]──> lobby
                                  │
                          (al cerrar la noche) ──> results (ranking global)
```
El **host es el único que escribe** transiciones. Pantalla e invitados solo leen y reaccionan.

### 6.2 Loop genérico de ronda
```
PROMPT → INPUT (abierto) → CERRADO → REVELAR → PUNTUAR → siguiente / fin
```
Cada juego implementa estas fases vía su config.

### 6.3 Config por juego (`games/registry.ts`)
Cada juego es un objeto con esta forma:
```
{
  id, nombre, card,            // arte Bratz para el selector del hub
  rounds(),                    // de dónde salen las rondas (archivo o jugadores)
  renderScreen(state),         // Big Screen según la fase
  renderGuest(state, me),      // celu del invitado
  renderHost(state),           // botones del panel de control
  onAnswer(player, value),     // cómo se guarda un input
  score(answers),              // cómo se reparten puntos al revelar
}
```

### 6.4 `game_state` (jsonb) — forma común
```json
{
  "round_index": 3,
  "round_key": "quiz:3",
  "phase": "asking",
  "timer_ends_at": "2026-06-19T22:05:30Z"
}
```

### 6.5 Timer sin broadcast
El host setea `timer_ends_at` (instante absoluto UTC). Cada cliente calcula
`ends_at - now` localmente y dibuja la cuenta regresiva. Al llegar a 0 (o si el host
fuerza el cierre), el host pasa la fase a `revealing`. Nadie depende del reloj de otro.

### 6.6 Flujo de claim (lobby)
1. Invitado abre `/join/ROCIO30` → ve la grilla de caras (de `players`).
2. Toca su cara → `update players set claimed_at = now() where id = ...`.
3. Postgres Changes lo emite → la cara se "prende" en vivo en la Big Screen.
4. `player_id` se guarda en `localStorage`. Re-tocar o recargar es idempotente
   (vuelve a setear `claimed_at`, lee su identidad de localStorage).
   *Hito de validación: no avanzar a los juegos hasta ver caras prendiéndose en
   vivo en la Big Screen.*

---

## 7. Los 3 juegos

### 7.1 Quiz "¿Quién conoce mejor a Rocío?"
- **Rondas:** `content/quiz.json` (15–20 preguntas, 3–4 opciones, índice correcto).
- **Fases:** `asking` → `revealing` → `finished`. Timer de 20s (configurable).
- **Invitado:** botones cápsula con las opciones; toca, puede cambiar hasta que
  cierre el timer (upsert en `answers`).
- **Revelar:** la Big Screen marca la correcta + cuántos acertaron.
- **Puntaje:** +1 fijo por acierto → suma a `players.score`.
- **Final:** podio top 3 con sus fotos.
- **`game_state`:** `round_index`, `round_key`, `phase`, `timer_ends_at`.

### 7.2 "¿Quién es más probable que…?"
- **Rondas:** `content/most_likely.json` (prompts precargados).
- **Fases:** `voting` → `revealing`.
- **Invitado:** lista de todos los jugadores (con foto) como botones; vota.
  Votarse a sí mismo **permitido**.
- **Revelar:** el más votado en grande + barras de conteo.
- **Puntaje:** sin puntaje competitivo. Opcional: contar cuántas veces fue elegido
  cada uno → premio "el más probable de todo" en el cierre.
- **`game_state`:** `prompt_index`, `round_key`, `phase`.

### 7.3 "Dos verdades y una mentira"
El más complejo. Dos fases macro:
1. **`writing`:** cada invitado carga sus 3 frases + marca la mentira →
   `two_truths_entries`. La Big Screen muestra "X de N listos". El host arranca los
   turnos cuando quiere (no espera al 100%).
2. **`guessing` por turnos:** el host avanza jugador por jugador. La Big Screen
   muestra las 3 frases de UNA persona en orden random. El resto vota cuál es la
   mentira (3 botones). El **autor NO vota** (su celu dice "es tu turno, mirá la
   pantalla").
- **Revelar:** muestra la mentira real + quiénes acertaron.
- **Puntaje:** +1 a cada uno que adivinó la mentira; +1 al autor por cada persona
  que engañó (incentiva buenas mentiras). Suma a `players.score`.
- **`game_state`:** `phase` (`writing` \| `guessing` \| `revealing`),
  `current_player_id`, lista de quién ya pasó, orden random de frases.

### 7.4 Cierre global (`results`)
Ranking acumulado de `players.score` (quiz + dos-verdades) → podio final con fotos.
"Más probable" no suma a este ranking, pero puede aportar su propio premio aparte.

---

## 8. Seguridad / RLS

Proyecto entre amigos, una noche. RLS laxa aceptable:
- `insert`/`select`/`update` anónimo en las tablas (anon key en cliente).
- Sin datos sensibles.
- Borrar el proyecto / tablas después de la fiesta.
- Filtrar todo por `room_id` en el cliente.

---

## 9. Dirección de arte — Y2K / Bratz

### Design tokens (`src/styles/tokens.css`)
| Token | Color | Uso |
|---|---|---|
| `--pink-hot` | `#FF4FB6` | Acentos, botones primarios |
| `--pink-bubble` | `#FFB6D9` | Fondos suaves, cards |
| `--pink-pale` | `#FFE4F1` | Backgrounds amplios |
| `--purple-y2k` | `#B86CD9` | Secundario, gradientes |
| `--orange-glow` | `#FF9E5E` | Highlights cálidos |
| `--cream` | `#FFF6EE` | Paneles claros |
| `--ink` | `#5A2A4A` | Texto sobre claro (ciruela oscuro) |

Fondo: gradiente diagonal rosa→lila→naranja.

### Tipografía (Google Fonts)
- **Títulos:** display chunky redondeada — Baloo 2 o Fredoka bold, mayúsculas con
  sombra/outline.
- **Cuerpo/UI:** Quicksand.

### Componentes reusables (`src/components/ui/`)
- `PillButton` — cápsula muy redondeada, sombra suave, mayúsculas.
- `StarBadge` — estrella con número para el score.
- `GameCard` — carátula estilo videojuego Bratz para el selector del hub.
- `PlayerTile` — foto + nombre + marco glam (claim, podios, votación).
- `Sparkles` — estrellitas + marcos translúcidos en esquinas.
- Transiciones con bounce suave.
- Sonidos opcionales (ding al acertar) — nice-to-have, no bloqueante.

### Workflow de las fotos IA (que provee la host)
1. La host pasa las imágenes → van a `public/players/<slug>.jpg`.
2. Se edita `src/content/players.json`: `[{ "slug": "rocio", "name": "Rocío" }, ...]`.
3. Un script de seed (`scripts/seed.ts` o botón oculto en `/host`) inserta esos
   jugadores en la tabla `players` una vez.
- Mientras no haya fotos, se usan placeholders (marcos de gradiente glam) para no
  bloquear el desarrollo.

---

## 10. Orden de construcción

1. **Setup:** Vite + React + cliente Supabase. Variables de entorno (URL + anon key).
2. **Esquema SQL:** crear las tablas (§5) en Supabase + seed de `players`.
3. **Motor de sala (§6):** sala fija, QR en Big Screen, grilla de claim, lobby en
   tiempo real. *No avanzar hasta que el lobby muestre caras prendiéndose en vivo.*
4. **Juego 1 (quiz):** loop de ronda completo. Valida toda la arquitectura.
5. **Hub/selector:** las 3 GameCards estilo Bratz, volver al hub.
6. **Juego 2 (más probable):** el más simple; reusa votación. Rápido tras el motor.
7. **Juego 3 (dos verdades):** el más complejo (fase de carga + turnos). Último.
8. **Capa estética Y2K:** tokens, fuentes, componentes cápsula, decoración. Se
   aplica en paralelo; el remate final acá.
9. **Cierre global (`results`):** podio acumulado.
10. **Prueba real:** abrir desde 2–3 celus antes de la fiesta. Reactivar Supabase si
    se pausó.

---

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Supabase pausado por inactividad | Reactivar desde dashboard el día de la fiesta; prueba previa |
| WiFi saturado con 18 celus | Datos móviles de backup; el tráfico real es bajísimo |
| Alguien recarga y pierde sesión | `player_id` en localStorage + re-claim idempotente |
| Carga de "dos verdades" tediosa en vivo | El host arranca los turnos sin esperar al 100% |
| Empates en votaciones | Mostrar empate como tal; no crítico |
| Fotos IA no listas a tiempo | Placeholders de gradiente glam; el sitio funciona sin las fotos |

---

## 12. No-objetivos (para no sobre-construir)

- Sin autenticación real (solo "tocá tu cara").
- Sin persistencia a largo plazo (se borra todo después de la noche).
- Sin app nativa (web pura, mobile-first).
- Sin reconexión sofisticada (re-claim simple es suficiente).
- Sin moderación / anti-trampa (entre amigos).
- Sin multi-sala (una sola fiesta, `ROCIO30`).
- Sin tests automatizados (proyecto de una noche).
