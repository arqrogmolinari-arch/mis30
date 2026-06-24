# Jeopardy por equipos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multiple-choice quiz with a Jeopardy-style team game: 5 categories × 5 point values, 4 teams with captains chosen by Ro, pick-and-answer turns, steal mechanic, 60s timers, flexible text matching.

**Architecture:** Teams stored as JSONB in a new `rooms.teams` column; `players.score` untouched (used only by the other games). Game state drives phases (setup → picking → answering → stealing → revealing → finished) via `rooms.game_state`. All realtime sync through the existing Supabase subscription on `rooms`. Captain answers land in the existing `answers` table with `game='jeopardy'`. New game files live under `src/games/jeopardy/`.

**Tech Stack:** React 19, TypeScript, Vite, Supabase Realtime, inline CSS, existing UI components (PillButton, PlayerTile, Countdown).

## Global Constraints
- Y2K/Bratz palette: primary text `#5A2A4A`, card bg `rgba(255,255,255,0.7)`, headings `font-family: 'Baloo 2, sans-serif'`
- Mobile-first: all tap targets ≥ 48×48px
- No test runner — verification = `npm run build` + manual multi-device check
- No new npm packages
- `players.score` must never be modified during Jeopardy — team scores live in `rooms.teams[i].score` only
- Fixed room code `ROCIO30`

---

### Task 1: DB migration + Type updates

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `JeopardyTeam` interface, `Room.teams: JeopardyTeam[]`, Jeopardy fields on `GameState`, `'jeopardy'` added to `GameId` — consumed by all subsequent tasks.

- [ ] **Step 1: Apply migration to live Supabase project**

Use Supabase MCP `apply_migration` with:
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS teams JSONB NOT NULL DEFAULT '[]'::jsonb;
```

- [ ] **Step 2: Update supabase/schema.sql**

In the `rooms` CREATE TABLE block, add after the `game_state` line:
```sql
  teams jsonb not null default '[]'::jsonb,
```

Also add to the comment at top: `-- active_game now also accepts 'jeopardy'`

- [ ] **Step 3: Replace src/lib/types.ts**

```typescript
export type Phase = 'lobby' | 'playing' | 'results'
export type GameId = 'quiz' | 'two_truths' | 'most_likely' | 'jeopardy'

export interface JeopardyTeam {
  id: string
  name: string
  color: string
  member_ids: string[]
  captain_id: string
  score: number
}

export interface Room {
  id: string
  code: string
  phase: Phase
  active_game: GameId | null
  game_state: GameState
  teams: JeopardyTeam[]
}

export interface GameState {
  // shared
  round_index?: number
  prompt_index?: number
  round_key?: string
  phase?: string
  timer_ends_at?: string | null
  current_player_id?: string | null
  done_player_ids?: string[]
  shuffle?: number[]
  // jeopardy
  current_team_index?: number
  board?: boolean[][]
  active_q?: { cat_i: number; val_i: number } | null
  steal_open?: boolean
  overrides?: Record<string, 'correct' | 'incorrect'>
}

export interface Player {
  id: string
  room_id: string
  slug: string
  name: string
  photo: string
  claimed_at: string | null
  score: number
}

export interface Answer {
  id: string
  room_id: string
  player_id: string
  game: GameId
  round_key: string
  value: any
  created_at: string
}

export interface TtEntry {
  id: string
  room_id: string
  player_id: string
  statements: [string, string, string]
  lie_index: number
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: clean. The `quiz.tsx` file still imports `quiz.json` (deleted in Task 7) — if it errors now, that's fine; it gets removed in Task 7.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/lib/types.ts
git commit -m "feat(jeopardy): add rooms.teams column + types"
```

---

### Task 2: Content (jeopardy.json)

**Files:**
- Create: `src/content/jeopardy.json`

(quiz.json deleted in Task 7 together with quiz.tsx to avoid a broken-import build error.)

- [ ] **Step 1: Create src/content/jeopardy.json**

```json
{
  "categories": [
    {
      "name": "Arquitectura",
      "questions": [
        { "value": 100, "q": "¿En qué ciudad se encuentra la Torre Eiffel?", "a": "París", "accept": ["paris", "parís"] },
        { "value": 200, "q": "¿Cómo se llama el edificio más alto del mundo?", "a": "Burj Khalifa", "accept": ["burj", "khalifa"] },
        { "value": 300, "q": "¿Qué arquitecto diseñó la Sagrada Familia en Barcelona?", "a": "Antoni Gaudí", "accept": ["gaudi", "gaudí"] },
        { "value": 400, "q": "¿En qué país se encuentra la ciudadela inca de Machu Picchu?", "a": "Perú", "accept": ["peru", "perú"] },
        { "value": 500, "q": "¿Cómo se llama el estilo medieval con arcos apuntados, rosetones y arbotantes?", "a": "Gótico", "accept": ["gotico", "gótico"] }
      ]
    },
    {
      "name": "Tecnología",
      "questions": [
        { "value": 100, "q": "¿Qué empresa creó el iPhone?", "a": "Apple", "accept": ["apple"] },
        { "value": 200, "q": "¿En qué año se lanzó Facebook al público?", "a": "2004", "accept": ["2004"] },
        { "value": 300, "q": "¿Qué significa la sigla GPS?", "a": "Global Positioning System", "accept": ["global positioning", "posicionamiento global", "positioning system"] },
        { "value": 400, "q": "¿Cómo se llama el asistente de voz virtual de Apple?", "a": "Siri", "accept": ["siri"] },
        { "value": 500, "q": "¿Qué lenguaje de programación creó Guido van Rossum?", "a": "Python", "accept": ["python"] }
      ]
    },
    {
      "name": "Cultura Pop 2000s",
      "questions": [
        { "value": 100, "q": "¿Quién cantó \"Baby One More Time\"?", "a": "Britney Spears", "accept": ["britney", "spears"] },
        { "value": 200, "q": "¿Cómo se llamaba la línea de muñecas rival de Barbie, furor en los 2000?", "a": "Bratz", "accept": ["bratz"] },
        { "value": 300, "q": "¿Qué programa argentino de los 2000 lanzó al grupo Erreway?", "a": "Rebelde Way", "accept": ["rebelde"] },
        { "value": 400, "q": "¿Quién interpretó a Hannah Montana en la serie de Disney Channel?", "a": "Miley Cyrus", "accept": ["miley", "cyrus"] },
        { "value": 500, "q": "¿Cómo se llamaba el personaje de Lindsay Lohan en \"Chica Mala\"?", "a": "Cady Heron", "accept": ["cady", "heron"] }
      ]
    },
    {
      "name": "Sobre Ro",
      "questions": [
        { "value": 100, "q": "¿Qué proteína no puede faltar en la heladera de Ro?", "a": "Suprema de pollo", "accept": ["suprema", "pollo"] },
        { "value": 200, "q": "¿Qué bebida toma Ro al menos dos veces por día?", "a": "Café con leche", "accept": ["cafe", "café"] },
        { "value": 300, "q": "¿Cuál es la fobia más peculiar de Ro? (hay dos respuestas válidas)", "a": "Polillas / Pies", "accept": ["polilla", "polillas", "pies", "pie"] },
        { "value": 400, "q": "¿Qué comida pone extremadamente feliz a Ro... y a muchos otros no tanto?", "a": "Hígado con papas fritas", "accept": ["higado", "hígado"] },
        { "value": 500, "q": "¿Quiénes son los cantantes favoritos de Ro últimamente? (son dos, con uno alcanza)", "a": "Michael Bublé y Frank Sinatra", "accept": ["buble", "bublé", "sinatra", "michael buble", "frank sinatra"] }
      ]
    },
    {
      "name": "Por el mundo",
      "questions": [
        { "value": 100, "q": "¿Cuál es la capital de Francia?", "a": "París", "accept": ["paris", "parís"] },
        { "value": 200, "q": "¿En qué continente se encuentra Egipto?", "a": "África", "accept": ["africa", "áfrica"] },
        { "value": 300, "q": "¿Cuál es el país más grande del mundo por superficie?", "a": "Rusia", "accept": ["rusia", "russia"] },
        { "value": 400, "q": "¿Cómo se llama la moneda oficial de Japón?", "a": "Yen", "accept": ["yen"] },
        { "value": 500, "q": "¿En qué país está Estambul, la ciudad que conecta Europa y Asia?", "a": "Turquía", "accept": ["turquia", "turquía", "turkey"] }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/jeopardy.json
git commit -m "feat(jeopardy): 25-question content across 5 categories"
```

---

### Task 3: Utils + Action helpers

**Files:**
- Create: `src/games/jeopardy/utils.ts`
- Modify: `src/lib/actions.ts`

**Interfaces:**
- Produces:
  - `normalize(s): string`
  - `isCorrect(answer, accept[]): boolean`
  - `jRoundKey(catI, valI): string`
  - `getMyTeam(teams, playerId): JeopardyTeam | undefined`
  - `isCaptain(team, playerId): boolean`
  - `TEAM_COLORS: string[]`
  - `POINT_VALUES: number[]`
  - `setTeams(roomId, teams): Promise<void>`
  - `updateTeamScore(roomId, teams, teamId, delta): Promise<void>`

- [ ] **Step 1: Create src/games/jeopardy/utils.ts**

```typescript
import type { JeopardyTeam } from '../../lib/types'

export const TEAM_COLORS = ['#FF6B9D', '#A78BFA', '#34D399', '#FBBF24']
export const POINT_VALUES = [100, 200, 300, 400, 500]

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function isCorrect(answer: string, accept: string[]): boolean {
  if (!answer.trim()) return false
  const n = normalize(answer)
  return accept.some((k) => n.includes(normalize(k)))
}

export function jRoundKey(catI: number, valI: number): string {
  return `j:${catI}:${valI}`
}

export function getMyTeam(teams: JeopardyTeam[], playerId: string): JeopardyTeam | undefined {
  return teams.find((t) => t.member_ids.includes(playerId))
}

export function isCaptain(team: JeopardyTeam | undefined, playerId: string): boolean {
  return team?.captain_id === playerId
}
```

- [ ] **Step 2: Append to src/lib/actions.ts**

Add these two functions at the end of the file:

```typescript
export async function setTeams(roomId: string, teams: import('./types').JeopardyTeam[]): Promise<void> {
  await supabase.from('rooms').update({ teams }).eq('id', roomId)
}

export async function updateTeamScore(
  roomId: string,
  teams: import('./types').JeopardyTeam[],
  teamId: string,
  delta: number,
): Promise<void> {
  const updated = teams.map((t) =>
    t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t,
  )
  await supabase.from('rooms').update({ teams: updated }).eq('id', roomId)
}
```

- [ ] **Step 3: Update clearGameData in src/lib/actions.ts to reset teams on jeopardy replay**

Replace the existing `clearGameData` function body:

```typescript
export async function clearGameData(roomId: string, game: GameId): Promise<void> {
  await supabase.from('answers').delete().eq('room_id', roomId).eq('game', game)
  if (game === 'two_truths') {
    await supabase.from('two_truths_entries').delete().eq('room_id', roomId)
  }
  if (game === 'jeopardy') {
    await supabase.from('rooms').update({ teams: [] }).eq('id', roomId)
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/games/jeopardy/utils.ts src/lib/actions.ts
git commit -m "feat(jeopardy): utils (normalize/isCorrect) + team actions"
```

---

### Task 4: Setup Phase UI

**Files:**
- Create: `src/games/jeopardy/setup.tsx`

**Interfaces:**
- Consumes: `TEAM_COLORS` from `utils.ts`; `setTeams`, `patchGameState` from `actions.ts`; `PlayerTile`, `PillButton` UI components
- Produces: `<SetupPanel ctx />` — rendered by `renderHost` when `gs.phase === 'setup'`

- [ ] **Step 1: Create src/games/jeopardy/setup.tsx**

```tsx
import { useState } from 'react'
import { PlayerTile } from '../../components/ui/PlayerTile'
import { PillButton } from '../../components/ui/PillButton'
import { setTeams, patchGameState } from '../../lib/actions'
import type { GameContext } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { TEAM_COLORS } from './utils'

const DEFAULT_NAMES = ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4']
const CAT_COUNT = 5
const VAL_COUNT = 5

interface Draft {
  id: string; name: string; color: string
  member_ids: string[]; captain_id: string; score: number
}

export function SetupPanel({ ctx }: { ctx: GameContext }) {
  const { room, players } = ctx
  const gs = room.game_state

  const [teams, setLocal] = useState<Draft[]>(() =>
    DEFAULT_NAMES.map((name, i) => ({
      id: `team-${i + 1}`, name, color: TEAM_COLORS[i],
      member_ids: [], captain_id: '', score: 0,
    })),
  )
  const [saving, setSaving] = useState(false)

  const assigned = new Set(teams.flatMap((t) => t.member_ids))
  const unassigned = players.filter((p) => !assigned.has(p.id))

  function assign(playerId: string, toIdx: number) {
    setLocal((prev) =>
      prev.map((t, i) => {
        const without = {
          ...t,
          member_ids: t.member_ids.filter((id) => id !== playerId),
          captain_id: t.captain_id === playerId ? '' : t.captain_id,
        }
        if (i === toIdx) without.member_ids = [...without.member_ids, playerId]
        return without
      }),
    )
  }

  function setCaptain(teamIdx: number, playerId: string) {
    setLocal((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, captain_id: playerId } : t)),
    )
  }

  const canStart = teams.every((t) => t.member_ids.length > 0 && t.captain_id !== '')

  async function handleStart() {
    setSaving(true)
    await setTeams(room.id, teams as JeopardyTeam[])
    await patchGameState(room.id, gs, {
      phase: 'picking',
      current_team_index: 0,
      board: Array.from({ length: CAT_COUNT }, () => Array(VAL_COUNT).fill(false)),
      active_q: null,
      steal_open: false,
      overrides: {},
    })
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A', margin: '0 0 12px' }}>
        Armar equipos
      </h2>

      {unassigned.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#5A2A4A', fontSize: 13, margin: '0 0 8px' }}>Sin equipo:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {unassigned.map((p) => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <PlayerTile player={p} size={52} />
                <p style={{ margin: '4px 0 2px', fontSize: 11, color: '#5A2A4A', fontWeight: 700 }}>{p.name}</p>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                  {teams.map((t, ti) => (
                    <button
                      key={ti}
                      onClick={() => assign(p.id, ti)}
                      style={{
                        width: 22, height: 22, borderRadius: '50%', border: 'none',
                        background: t.color, cursor: 'pointer',
                        fontSize: 10, color: 'white', fontWeight: 800,
                      }}
                    >{ti + 1}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {teams.map((team, ti) => (
          <div key={team.id} style={{
            background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 10,
            borderTop: `4px solid ${team.color}`,
          }}>
            <input
              value={team.name}
              onChange={(e) => setLocal((prev) =>
                prev.map((t, i) => (i === ti ? { ...t, name: e.target.value } : t)),
              )}
              style={{
                width: '100%', border: 'none', background: 'transparent',
                fontWeight: 800, color: '#5A2A4A', fontSize: 14,
                fontFamily: 'Baloo 2, sans-serif', marginBottom: 8, padding: 0,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {team.member_ids.map((mid) => {
                const p = players.find((x) => x.id === mid)
                if (!p) return null
                const isCap = team.captain_id === mid
                return (
                  <div key={mid} style={{ textAlign: 'center', position: 'relative' }}>
                    <div onClick={() => setCaptain(ti, mid)} style={{ cursor: 'pointer' }}>
                      <PlayerTile player={p} size={44} />
                      {isCap && (
                        <span style={{
                          position: 'absolute', top: -4, right: -4, fontSize: 13,
                        }}>⭐</span>
                      )}
                    </div>
                    <button
                      onClick={() => assign(mid, -1)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 10, color: '#aaa', display: 'block', margin: '0 auto',
                      }}
                    >✕</button>
                  </div>
                )
              })}
              {team.member_ids.length === 0 && (
                <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>Vacío</p>
              )}
            </div>
            {team.member_ids.length > 0 && team.captain_id === '' && (
              <p style={{ fontSize: 11, color: '#B86CD9', margin: '6px 0 0' }}>
                Tocá un jugador → capitán ⭐
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <PillButton onClick={handleStart} disabled={!canStart || saving}>
          {saving ? 'Iniciando…' : '¡Iniciar Jeopardy! 🎯'}
        </PillButton>
        {!canStart && (
          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 }}>
            Cada equipo necesita jugadores y un capitán (⭐)
          </p>
        )}
      </div>
    </div>
  )
}
```

Note: `assign(mid, -1)` removes from all teams since no team has index -1.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/games/jeopardy/setup.tsx
git commit -m "feat(jeopardy): team setup UI"
```

---

### Task 5: Board Component

**Files:**
- Create: `src/games/jeopardy/board.tsx`

**Interfaces:**
- Consumes: `POINT_VALUES` from `utils.ts`; `JeopardyTeam` type
- Produces: `<JeopardyBoard>` — used by renderScreen (display) and renderGuest when captain is picking

```tsx
export interface JCategory {
  name: string
  questions: { value: number; q: string; a: string; accept: string[] }[]
}
```

- [ ] **Step 1: Create src/games/jeopardy/board.tsx**

```tsx
import type { JeopardyTeam } from '../../lib/types'
import { POINT_VALUES } from './utils'

export interface JCategory {
  name: string
  questions: { value: number; q: string; a: string; accept: string[] }[]
}

interface BoardProps {
  categories: JCategory[]
  board: boolean[][]
  teams: JeopardyTeam[]
  currentTeamIndex: number
  onPick?: (catI: number, valI: number) => void
  interactive?: boolean
}

export function JeopardyBoard({
  categories, board, teams, currentTeamIndex, onPick, interactive = false,
}: BoardProps) {
  const ct = teams[currentTeamIndex]

  return (
    <div>
      {ct && (
        <p style={{
          textAlign: 'center', fontFamily: 'Baloo 2, sans-serif',
          fontWeight: 800, color: '#5A2A4A', fontSize: 16, margin: '0 0 10px',
        }}>
          Turno: <span style={{ color: ct.color }}>{ct.name}</span>
          {interactive ? ' — elegí una pregunta' : ''}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
        gap: 5, padding: '0 4px',
      }}>
        {categories.map((cat, ci) => (
          <div key={ci} style={{
            textAlign: 'center', fontFamily: 'Baloo 2, sans-serif',
            fontWeight: 800, fontSize: 11, color: '#5A2A4A',
            padding: '6px 2px', background: 'rgba(255,255,255,0.6)',
            borderRadius: 7,
          }}>
            {cat.name}
          </div>
        ))}

        {POINT_VALUES.map((val, vi) =>
          categories.map((_, ci) => {
            const played = board[ci]?.[vi] ?? false
            const tappable = interactive && !played
            return (
              <button
                key={`${ci}-${vi}`}
                disabled={!tappable}
                onClick={() => tappable && onPick?.(ci, vi)}
                style={{
                  padding: '14px 2px', borderRadius: 9, border: 'none',
                  cursor: tappable ? 'pointer' : 'default',
                  background: played
                    ? 'rgba(90,42,74,0.07)'
                    : `linear-gradient(135deg,${ct?.color ?? '#FF4FB6'},#B86CD9)`,
                  color: played ? 'transparent' : 'white',
                  fontWeight: 800, fontSize: 18,
                  fontFamily: 'Baloo 2, sans-serif',
                  boxShadow: played ? 'none' : '0 3px 0 rgba(0,0,0,0.12)',
                }}
              >
                {played ? '' : val}
              </button>
            )
          }),
        )}
      </div>

      {teams.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {teams.map((t, ti) => (
            <div key={t.id} style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: 10,
              padding: '5px 12px',
              borderBottom: `3px solid ${t.color}`,
              opacity: ti === currentTeamIndex ? 1 : 0.55,
            }}>
              <div style={{ fontWeight: 800, color: '#5A2A4A', fontSize: 12 }}>{t.name}</div>
              <div style={{ fontWeight: 800, color: t.color, fontSize: 20, textAlign: 'center' }}>{t.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/games/jeopardy/board.tsx
git commit -m "feat(jeopardy): board component"
```

---

### Task 6: Question Phase Components

**Files:**
- Create: `src/games/jeopardy/question.tsx`

**Interfaces:**
- Consumes: `isCorrect`, `jRoundKey` from `utils.ts`; `submitAnswer`, `patchGameState`, `updateTeamScore` from `actions.ts`; `Countdown`, `PillButton` UI components
- Produces:
  - `<AnsweringGuest ctx catI valI q isMyTurn />`
  - `<StealingGuest ctx catI valI q canSteal />`
  - `<RevealingScreen q answers teams roundKey overrides players winnerTeamId />`
  - `<RevealingHost ctx catI valI q teams isLastQuestion />`

- [ ] **Step 1: Create src/games/jeopardy/question.tsx**

```tsx
import { useState } from 'react'
import { PillButton } from '../../components/ui/PillButton'
import { Countdown } from '../../components/ui/Countdown'
import { submitAnswer, patchGameState, updateTeamScore } from '../../lib/actions'
import type { GameContext } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { isCorrect, jRoundKey } from './utils'
import type { JCategory } from './board'

type Q = JCategory['questions'][0]

// ── Answering: guest ──────────────────────────────────────────────────────────

export function AnsweringGuest({
  ctx, catI, valI, q, isMyTurn,
}: { ctx: GameContext; catI: number; valI: number; q: Q; isMyTurn: boolean }) {
  const { room, me } = ctx
  const gs = room.game_state
  const [text, setText] = useState('')
  const rk = jRoundKey(catI, valI)

  if (!isMyTurn) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800 }}>{q.q}</p>
        <p style={{ color: '#999', fontSize: 14, marginTop: 8 }}>Discutan entre el equipo 💬</p>
        {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{q.q}</p>
      {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí la respuesta…"
        rows={2}
        style={{
          width: '100%', padding: 12, borderRadius: 12,
          border: '2px solid #B86CD9', fontFamily: 'inherit',
          fontSize: 16, resize: 'none', boxSizing: 'border-box', marginTop: 10,
        }}
      />
      <div style={{ marginTop: 8 }}>
        <PillButton
          disabled={!text.trim()}
          onClick={() => me && submitAnswer(room.id, me.id, 'jeopardy', rk, text.trim())}
        >
          Enviar ✓
        </PillButton>
      </div>
    </div>
  )
}

// ── Stealing: guest ───────────────────────────────────────────────────────────

export function StealingGuest({
  ctx, catI, valI, q, canSteal,
}: { ctx: GameContext; catI: number; valI: number; q: Q; canSteal: boolean }) {
  const { room, me } = ctx
  const gs = room.game_state
  const [text, setText] = useState('')
  const rk = jRoundKey(catI, valI)

  if (!canSteal) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#FF4FB6', fontWeight: 800, fontSize: 18 }}>¡Fase de robo! 🔥</p>
        <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800, marginTop: 6 }}>{q.q}</p>
        {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>Los capitanes intentan robar…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ color: '#FF4FB6', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 18 }}>¡Intentá robar! 🔥</p>
      <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{q.q}</p>
      {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí la respuesta…"
        rows={2}
        style={{
          width: '100%', padding: 12, borderRadius: 12,
          border: '2px solid #FF4FB6', fontFamily: 'inherit',
          fontSize: 16, resize: 'none', boxSizing: 'border-box', marginTop: 10,
        }}
      />
      <div style={{ marginTop: 8 }}>
        <PillButton
          disabled={!text.trim()}
          onClick={() => me && submitAnswer(room.id, me.id, 'jeopardy', rk, text.trim())}
        >
          ¡Robar! 🔥
        </PillButton>
      </div>
    </div>
  )
}

// ── Revealing: big screen ─────────────────────────────────────────────────────

export function RevealingScreen({
  q, answers, teams, roundKey, overrides, players, winnerTeamId,
}: {
  q: Q; answers: GameContext['answers']; teams: JeopardyTeam[]
  roundKey: string; overrides: Record<string, 'correct' | 'incorrect'>
  players: GameContext['players']; winnerTeamId: string | null
}) {
  const roundAnswers = answers.filter((a) => a.round_key === roundKey)
  const winnerTeam = teams.find((t) => t.id === winnerTeamId)

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 26, fontWeight: 800 }}>{q.q}</p>
      <div style={{
        background: '#5A2A4A', color: 'white', borderRadius: 14,
        padding: '10px 22px', display: 'inline-block', margin: '10px 0',
        fontFamily: 'Baloo 2, sans-serif', fontSize: 24, fontWeight: 800,
      }}>
        {q.a}
      </div>
      {winnerTeam
        ? <p style={{ color: winnerTeam.color, fontWeight: 800, fontSize: 20, fontFamily: 'Baloo 2, sans-serif' }}>
            +{q.value} pts → {winnerTeam.name} 🎉
          </p>
        : <p style={{ color: '#999', fontSize: 18 }}>Nadie acertó</p>
      }
      <div style={{ marginTop: 12, display: 'grid', gap: 7, maxWidth: 400, margin: '12px auto 0' }}>
        {roundAnswers.map((ans) => {
          const player = players.find((p) => p.id === ans.player_id)
          const correct = overrides[ans.player_id] != null
            ? overrides[ans.player_id] === 'correct'
            : isCorrect(String(ans.value), q.accept)
          return (
            <div key={ans.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.7)', borderRadius: 9, padding: '7px 12px',
            }}>
              <span style={{ fontSize: 18 }}>{correct ? '✓' : '✗'}</span>
              <span style={{ fontWeight: 700, color: '#5A2A4A', flex: 1, textAlign: 'left' }}>{player?.name ?? '?'}</span>
              <span style={{ color: '#5A2A4A', fontStyle: 'italic', fontSize: 14 }}>{String(ans.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Revealing: host ───────────────────────────────────────────────────────────

export function RevealingHost({
  ctx, catI, valI, q, teams, isLastQuestion,
}: { ctx: GameContext; catI: number; valI: number; q: Q; teams: JeopardyTeam[]; isLastQuestion: boolean }) {
  const { room, answers, players } = ctx
  const gs = room.game_state
  const rk = jRoundKey(catI, valI)
  const roundAnswers = answers.filter((a) => a.round_key === rk)
  const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>
  const [confirming, setConfirming] = useState(false)

  function effectiveCorrect(playerId: string, value: string) {
    return overrides[playerId] != null
      ? overrides[playerId] === 'correct'
      : isCorrect(value, q.accept)
  }

  function toggleOverride(playerId: string, currently: boolean) {
    patchGameState(room.id, gs, {
      overrides: { ...overrides, [playerId]: currently ? 'incorrect' : 'correct' },
    })
  }

  function findWinnerTeamId(): string | null {
    for (const ans of roundAnswers) {
      if (effectiveCorrect(ans.player_id, String(ans.value))) {
        return teams.find((t) => t.member_ids.includes(ans.player_id))?.id ?? null
      }
    }
    return null
  }

  async function confirm() {
    setConfirming(true)
    const winnerTeamId = findWinnerTeamId()
    if (winnerTeamId) {
      await updateTeamScore(room.id, room.teams, winnerTeamId, q.value)
    }
    const newBoard = (gs.board ?? []).map((row, ci) =>
      row.map((v, vi) => (ci === catI && vi === valI ? true : v)),
    )
    const finished = newBoard.every((row) => row.every(Boolean))
    await patchGameState(room.id, gs, {
      phase: finished ? 'finished' : 'picking',
      board: newBoard,
      active_q: null,
      steal_open: false,
      overrides: {},
      current_team_index: ((gs.current_team_index ?? 0) + 1) % teams.length,
      timer_ends_at: null,
    })
    setConfirming(false)
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ color: '#5A2A4A', fontWeight: 800, marginBottom: 8 }}>
        Respuesta: <span style={{ color: '#B86CD9' }}>{q.a}</span>
      </p>
      <div style={{ display: 'grid', gap: 7 }}>
        {roundAnswers.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>Nadie envió respuesta</p>}
        {roundAnswers.map((ans) => {
          const player = players.find((p) => p.id === ans.player_id)
          const correct = effectiveCorrect(ans.player_id, String(ans.value))
          const team = teams.find((t) => t.member_ids.includes(ans.player_id))
          return (
            <div
              key={ans.id}
              onClick={() => toggleOverride(ans.player_id, correct)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: correct ? 'rgba(156,232,156,0.4)' : 'rgba(255,100,100,0.15)',
                borderRadius: 9, padding: '8px 10px',
              }}
            >
              <span style={{ fontSize: 18 }}>{correct ? '✓' : '✗'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#5A2A4A', fontSize: 13 }}>
                  {player?.name ?? '?'} · <span style={{ color: team?.color }}>{team?.name ?? '?'}</span>
                </div>
                <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>{String(ans.value)}</div>
              </div>
              <span style={{ fontSize: 10, color: '#bbb' }}>toca p/ cambiar</span>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 14 }}>
        <PillButton onClick={confirm} disabled={confirming}>
          {confirming ? 'Guardando…' : isLastQuestion ? 'Ver podio final 🏆' : 'Confirmar y siguiente →'}
        </PillButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/games/jeopardy/question.tsx
git commit -m "feat(jeopardy): answering/stealing/revealing phase components"
```

---

### Task 7: Game Config, Wiring + Cleanup

**Files:**
- Create: `src/games/jeopardy/index.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/routes/Host.tsx`
- Delete: `src/games/quiz.tsx`, `src/content/quiz.json`

**Interfaces:**
- Consumes: all components from tasks 4–6; content from `jeopardy.json`
- Produces: `jeopardyGame: GameConfig` registered in `GAMES` as `'jeopardy'`

- [ ] **Step 1: Create src/games/jeopardy/index.tsx**

```tsx
import jeopardyData from '../../content/jeopardy.json'
import type { GameConfig } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { PillButton } from '../../components/ui/PillButton'
import { Countdown } from '../../components/ui/Countdown'
import { setActiveGame, patchGameState } from '../../lib/actions'
import { SetupPanel } from './setup'
import { JeopardyBoard } from './board'
import { AnsweringGuest, StealingGuest, RevealingScreen, RevealingHost } from './question'
import { jRoundKey, getMyTeam, isCaptain, isCorrect } from './utils'

const CATEGORIES = jeopardyData.categories

function TeamPodium({ teams }: { teams: JeopardyTeam[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 34, color: '#5A2A4A', margin: '0 0 20px' }}>
        Podio final 🏆
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        {sorted.map((t, i) => (
          <div key={t.id} style={{
            background: 'rgba(255,255,255,0.7)', borderRadius: 14,
            padding: '14px 20px', borderBottom: `4px solid ${t.color}`, minWidth: 90,
          }}>
            <div style={{ fontSize: 30 }}>
              {['🥇', '🥈', '🥉', '4️⃣'][i]}
            </div>
            <div style={{ fontWeight: 800, color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 16 }}>{t.name}</div>
            <div style={{ fontWeight: 800, color: t.color, fontSize: 26 }}>{t.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const jeopardyGame: GameConfig = {
  id: 'jeopardy',

  initialState: () => ({
    phase: 'setup',
    current_team_index: 0,
    board: Array.from({ length: CATEGORIES.length }, () => Array(5).fill(false)),
    active_q: null,
    steal_open: false,
    overrides: {},
  }),

  // ── BIG SCREEN ──────────────────────────────────────────────────────────────
  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase
    const board = gs.board ?? []

    if (phase === 'setup') {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 28, color: '#5A2A4A' }}>
            El host está armando los equipos… 🎪
          </p>
        </div>
      )
    }

    if (phase === 'finished') return <TeamPodium teams={teams} />

    if (phase === 'picking') {
      return (
        <div style={{ padding: 12 }}>
          <JeopardyBoard
            categories={CATEGORIES} board={board}
            teams={teams} currentTeamIndex={gs.current_team_index ?? 0}
          />
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null
    const rk = jRoundKey(aq.cat_i, aq.val_i)
    const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>

    if (phase === 'answering' || phase === 'stealing') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.6)', borderRadius: 7,
            padding: '3px 12px', display: 'inline-block', marginBottom: 10,
            fontSize: 13, color: '#5A2A4A', fontWeight: 700,
          }}>
            {CATEGORIES[aq.cat_i].name} · {q.value} pts
            {phase === 'stealing' ? ' · 🔥 ROBO' : ''}
          </div>
          <p style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 32, color: '#5A2A4A', fontWeight: 800 }}>{q.q}</p>
          {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
          <p style={{ color: '#999', fontSize: 16, marginTop: 10 }}>
            {count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }

    if (phase === 'revealing') {
      const roundAnswers = answers.filter((a) => a.round_key === rk)
      const winnerTeamId = (() => {
        for (const ans of roundAnswers) {
          const ok = overrides[ans.player_id] != null
            ? overrides[ans.player_id] === 'correct'
            : isCorrect(String(ans.value), q.accept)
          if (ok) return teams.find((t) => t.member_ids.includes(ans.player_id))?.id ?? null
        }
        return null
      })()
      return (
        <RevealingScreen
          q={q} answers={answers} teams={teams}
          roundKey={rk} overrides={overrides}
          players={players} winnerTeamId={winnerTeamId}
        />
      )
    }

    return null
  },

  // ── GUEST ───────────────────────────────────────────────────────────────────
  renderGuest: (ctx) => {
    const { room, me } = ctx
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase

    if (phase === 'setup' || !me) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20 }}>
            El host está armando los equipos… 🎪
          </p>
        </div>
      )
    }

    if (phase === 'finished') {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 800 }}>
            ¡Terminó! Mirá la pantalla 🏆
          </p>
        </div>
      )
    }

    const myTeam = getMyTeam(teams, me.id)
    const imCaptain = isCaptain(myTeam, me.id)
    const currentTeamIdx = gs.current_team_index ?? 0
    const myTeamIdx = teams.findIndex((t) => t.id === myTeam?.id)
    const isMyTeamTurn = myTeamIdx === currentTeamIdx
    const board = gs.board ?? []

    if (phase === 'picking') {
      if (isMyTeamTurn && imCaptain) {
        return (
          <div style={{ padding: 12 }}>
            <JeopardyBoard
              categories={CATEGORIES} board={board}
              teams={teams} currentTeamIndex={currentTeamIdx}
              interactive
              onPick={(ci, vi) => {
                patchGameState(room.id, gs, {
                  phase: 'answering',
                  active_q: { cat_i: ci, val_i: vi },
                  timer_ends_at: new Date(Date.now() + 60_000).toISOString(),
                  steal_open: false,
                })
              }}
            />
          </div>
        )
      }
      const ct = teams[currentTeamIdx]
      const captain = ct ? ctx.players.find((p) => p.id === ct.captain_id) : null
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontSize: 18 }}>
            Turno de <span style={{ fontWeight: 800, color: ct?.color }}>{ct?.name}</span>
          </p>
          {captain && <p style={{ color: '#999', fontSize: 14, marginTop: 4 }}>{captain.name} está eligiendo…</p>}
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null

    if (phase === 'answering') {
      return <AnsweringGuest ctx={ctx} catI={aq.cat_i} valI={aq.val_i} q={q} isMyTurn={isMyTeamTurn && imCaptain} />
    }
    if (phase === 'stealing') {
      return <StealingGuest ctx={ctx} catI={aq.cat_i} valI={aq.val_i} q={q} canSteal={imCaptain && !isMyTeamTurn} />
    }
    if (phase === 'revealing') {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800 }}>{q.q}</p>
          <div style={{
            background: '#5A2A4A', color: 'white', borderRadius: 12, padding: '8px 18px',
            display: 'inline-block', marginTop: 8,
            fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800,
          }}>{q.a}</div>
        </div>
      )
    }
    return null
  },

  // ── HOST ────────────────────────────────────────────────────────────────────
  renderHost: (ctx) => {
    const { room, answers } = ctx
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase

    if (phase === 'setup') return <SetupPanel ctx={ctx} />

    if (phase === 'finished') {
      return (
        <div style={{ padding: 16 }}>
          <TeamPodium teams={teams} />
          <PillButton onClick={() => setActiveGame(room.id, null, {})}>Volver al hub</PillButton>
        </div>
      )
    }

    const board = gs.board ?? []
    const currentTeamIdx = gs.current_team_index ?? 0
    const ct = teams[currentTeamIdx]

    if (phase === 'picking') {
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#5A2A4A', fontSize: 14, marginBottom: 8 }}>
            Turno de <strong style={{ color: ct?.color }}>{ct?.name}</strong> — esperando que el capitán elija
          </p>
          <JeopardyBoard categories={CATEGORIES} board={board} teams={teams} currentTeamIndex={currentTeamIdx} />
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null
    const rk = jRoundKey(aq.cat_i, aq.val_i)

    if (phase === 'answering') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#5A2A4A', fontWeight: 800, fontFamily: 'Baloo 2, sans-serif' }}>{q.q}</p>
          <p style={{ color: '#999', fontSize: 13 }}>{count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}</p>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <PillButton onClick={() => patchGameState(room.id, gs, {
              phase: 'stealing', steal_open: true,
              timer_ends_at: new Date(Date.now() + 60_000).toISOString(),
            })}>Abrir robo 🔥</PillButton>
            <PillButton variant="ghost" onClick={() => patchGameState(room.id, gs, { phase: 'revealing' })}>
              Revelar
            </PillButton>
          </div>
        </div>
      )
    }

    if (phase === 'stealing') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#FF4FB6', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800 }}>🔥 Fase de robo</p>
          <p style={{ color: '#5A2A4A', fontWeight: 800 }}>{q.q}</p>
          <p style={{ color: '#999', fontSize: 13 }}>{count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}</p>
          <div style={{ marginTop: 10 }}>
            <PillButton onClick={() => patchGameState(room.id, gs, { phase: 'revealing' })}>Revelar</PillButton>
          </div>
        </div>
      )
    }

    if (phase === 'revealing') {
      const totalQ = board.flatMap((r) => r).length
      const played = board.flatMap((r) => r).filter(Boolean).length
      return (
        <RevealingHost
          ctx={ctx} catI={aq.cat_i} valI={aq.val_i}
          q={q} teams={teams}
          isLastQuestion={played === totalQ - 1}
        />
      )
    }

    return null
  },
}
```

- [ ] **Step 2: Update src/games/registry.ts**

Add `jeopardyGame` import and entry:

```typescript
import type { ReactNode } from 'react'
import type { Answer, GameState, Player, Room, TtEntry } from '../lib/types'

export interface GameContext {
  room: Room
  players: Player[]
  answers: Answer[]
  ttEntries: TtEntry[]
  me?: Player
}

export interface GameConfig {
  id: string
  initialState: (ctx: GameContext) => GameState
  renderScreen: (ctx: GameContext) => ReactNode
  renderGuest: (ctx: GameContext) => ReactNode
  renderHost: (ctx: GameContext) => ReactNode
}

import { jeopardyGame } from './jeopardy/index'
import { mostLikelyGame } from './mostLikely'
import { twoTruthsGame } from './twoTruths'

export const GAMES: Record<string, GameConfig> = {
  jeopardy: jeopardyGame,
  most_likely: mostLikelyGame,
  two_truths: twoTruthsGame,
}
```

Note: `quiz` is intentionally removed from the registry.

- [ ] **Step 3: Update src/routes/Host.tsx**

Replace the `GAME_LIST` constant (keep all other code the same):

```typescript
const GAME_LIST: { id: GameId; title: string; emoji: string; gradient: string }[] = [
  { id: 'jeopardy', title: 'Jeopardy: ¿Quién conoce a Rocío?', emoji: '🎯', gradient: 'linear-gradient(135deg,#FF4FB6,#B86CD9)' },
  { id: 'most_likely', title: '¿Quién es más probable?', emoji: '🔮', gradient: 'linear-gradient(135deg,#FF9E5E,#FF4FB6)' },
  { id: 'two_truths', title: 'Dos verdades, una mentira', emoji: '🎭', gradient: 'linear-gradient(135deg,#B86CD9,#FFB6D9)' },
]
```

- [ ] **Step 4: Remove old quiz files**

```bash
git rm src/games/quiz.tsx src/content/quiz.json
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: clean build, no TypeScript errors, no missing imports.

- [ ] **Step 6: Commit**

```bash
git add src/games/jeopardy/index.tsx src/games/registry.ts src/routes/Host.tsx
git commit -m "feat(jeopardy): wire game config + remove old quiz"
```

---

### Task 8: End-to-end verification + merge

- [ ] **Step 1: Run dev server with LAN access**

```bash
npm run dev -- --host
```

- [ ] **Step 2: Verify full game flow manually**

Open `/host/ROCIO30` on your phone. On a second device open `/join/ROCIO30` and claim a player. On a third device open `/screen/ROCIO30`.

Checklist:
- [ ] Jeopardy card appears in hub, tapping it enters setup
- [ ] Players appear as tiles; colored buttons assign to teams
- [ ] Tapping a player in a team makes them captain (⭐)
- [ ] "Iniciar Jeopardy" button enables only when all 4 teams have captain
- [ ] After start, board appears on screen and captain's phone
- [ ] Non-captain guests see "Turno del Equipo X"
- [ ] Captain taps a cell → question appears everywhere with countdown
- [ ] Captain submits → host sees answer + "Abrir robo" / "Revelar" buttons
- [ ] "Abrir robo" → steal captains see input on their phones
- [ ] First steal captain to submit → host sees their answer
- [ ] "Revelar" → screen shows all answers with ✓/✗, official answer, winner team
- [ ] Host can toggle override by tapping a player row
- [ ] "Confirmar" → board marks cell as played, scores update, turn rotates
- [ ] After all 25 questions → podium screen appears
- [ ] "Volver al hub" returns to game selection
- [ ] Other games (Most Likely, Dos Verdades) still work normally

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Final build check**

```bash
npm run build
```

- [ ] **Step 5: Merge to main**

```bash
git checkout main
git merge feat/open-ended-quiz
git log --oneline -5
```
