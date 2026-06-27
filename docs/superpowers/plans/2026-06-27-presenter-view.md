# Presenter View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a TV-optimized read-only presenter view at `/presenter` accessible via a "Presentar" button in the host panel.

**Architecture:** New standalone route `Presenter.tsx` that reads room state via the existing `useRoom()` hook. Contains its own rendering logic per jeopardy phase (no game registry changes). A fixed bottom score band shows team scores at all times. The host opens this in a new browser tab and casts it to the TV.

**Tech Stack:** React, React Router, existing `useRoom` hook, Supabase real-time (via hook), inline styles (project convention).

## Global Constraints

- All styles use inline JS objects — no CSS files, no Tailwind classes.
- Font families: `'Pixelify Sans, sans-serif'` for scores/headings, `'Quicksand, sans-serif'` for body text.
- Project palette: primary dark `#5A2A4A`, pink accent `#FF4FB6`, purple `#B86CD9`.
- TV background: `#1A0A14` (very dark burgundy).
- Reuse existing components: `Loading`, `Countdown`, `JeopardyBoard`, `TeamPodium`.
- No new dependencies.
- No interaction on the presenter screen — purely display.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| **Create** | `src/routes/Presenter.tsx` | Full TV presenter component |
| **Modify** | `src/App.tsx` | Register `/presenter` and `/presenter/:code` routes |
| **Modify** | `src/routes/Host.tsx` | Add "Presentar" ghost button that opens `/presenter` |

---

## Task 1: Create `src/routes/Presenter.tsx`

**Files:**
- Create: `src/routes/Presenter.tsx`

**Interfaces:**
- Consumes: `useRoom(code)` → `{ room, players, answers, loading }`
- Consumes: `JeopardyBoard` from `../games/jeopardy/board`
- Consumes: `TeamPodium` from `../games/jeopardy/index`
- Consumes: `Countdown` from `../components/ui/Countdown`
- Consumes: `Loading` from `../components/ui/Loading`
- Consumes: `jeopardyData` from `../content/jeopardy.json`
- Consumes: `isCorrect`, `jRoundKey` from `../games/jeopardy/utils`
- Consumes: `DEFAULT_ROOM` from `../lib/config`
- Produces: `export default function Presenter()` — used by router in Task 2

- [ ] **Step 1: Create the file with full implementation**

```tsx
import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { Loading } from '../components/ui/Loading'
import { Countdown } from '../components/ui/Countdown'
import { JeopardyBoard } from '../games/jeopardy/board'
import { TeamPodium } from '../games/jeopardy/index'
import { isCorrect, jRoundKey } from '../games/jeopardy/utils'
import jeopardyData from '../content/jeopardy.json'
import { DEFAULT_ROOM } from '../lib/config'
import type { JeopardyTeam } from '../lib/types'
import type { GameState, Answer } from '../lib/types'

const CATEGORIES = jeopardyData.categories
const BAND_H = 120

// ── Score band ────────────────────────────────────────────────────────────────

function ScoreBand({ teams, currentTeamIndex }: { teams: JeopardyTeam[]; currentTeamIndex?: number }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: BAND_H,
      background: 'rgba(0,0,0,0.60)',
      borderTop: '2px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 40, padding: '0 48px',
    }}>
      {teams.map((t, i) => {
        const active = i === currentTeamIndex
        return (
          <div key={t.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 28px', borderRadius: 14,
            border: active ? `3px solid ${t.color}` : '3px solid transparent',
            boxShadow: active ? `0 0 24px ${t.color}55` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}>
            <div style={{
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'Quicksand, sans-serif', fontWeight: 700, fontSize: 22,
            }}>
              {t.name}
            </div>
            <div style={{
              color: t.color,
              fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 48,
              lineHeight: 1,
            }}>
              {t.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Jeopardy phase content ────────────────────────────────────────────────────

function JeopardyContent({ gs, teams, answers }: { gs: GameState; teams: JeopardyTeam[]; answers: Answer[] }) {
  const phase = gs.phase

  const centered: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', textAlign: 'center', padding: '40px 80px',
  }

  if (phase === 'setup') {
    return (
      <div style={centered}>
        <p style={{
          color: '#FFD6E7', fontFamily: 'Pixelify Sans, sans-serif',
          fontSize: 'clamp(32px,4vw,56px)', fontWeight: 600, margin: 0,
        }}>
          Preparando el juego…
        </p>
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div style={{ ...centered, background: '#1A0A14' }}>
        <TeamPodium teams={teams} />
      </div>
    )
  }

  if (phase === 'picking') {
    return (
      <div style={{ padding: '24px 40px' }}>
        <JeopardyBoard
          categories={CATEGORIES}
          board={gs.board ?? []}
          teams={teams}
          currentTeamIndex={gs.current_team_index ?? 0}
        />
      </div>
    )
  }

  const aq = gs.active_q
  if (!aq) return null
  const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
  if (!q) return null

  if (phase === 'answering' || phase === 'stealing') {
    return (
      <div style={centered}>
        <div style={{
          background: phase === 'stealing' ? '#FF4FB6' : 'rgba(255,255,255,0.12)',
          color: phase === 'stealing' ? '#fff' : 'rgba(255,255,255,0.8)',
          borderRadius: 999, padding: '4px 20px', marginBottom: 28,
          fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600,
          fontSize: 'clamp(16px,2vw,24px)', letterSpacing: 1,
        }}>
          {CATEGORIES[aq.cat_i].name} · {q.value} pts
          {phase === 'stealing' ? ' · ROBO' : ''}
        </div>
        <p style={{
          color: '#FFD6E7',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 800,
          fontSize: 'clamp(40px,5.5vw,80px)',
          lineHeight: 1.2, margin: '0 0 32px',
        }}>
          {q.q}
        </p>
        {gs.timer_ends_at && (
          <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
            <Countdown endsAt={gs.timer_ends_at} />
          </div>
        )}
      </div>
    )
  }

  if (phase === 'revealing') {
    const rk = jRoundKey(aq.cat_i, aq.val_i)
    const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>
    const roundAnswers = answers.filter((a) => a.round_key === rk)

    const winnerTeam = (() => {
      for (const ans of roundAnswers) {
        const ok = overrides[ans.player_id] != null
          ? overrides[ans.player_id] === 'correct'
          : isCorrect(String(ans.value), q.accept)
        if (ok) return teams.find((t) => t.member_ids.includes(ans.player_id)) ?? null
      }
      return null
    })()

    return (
      <div style={centered}>
        <p style={{
          color: 'rgba(255,214,231,0.8)',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
          fontSize: 'clamp(28px,3.5vw,52px)',
          lineHeight: 1.3, margin: '0 0 28px',
        }}>
          {q.q}
        </p>
        <div style={{
          background: '#5A2A4A', color: '#FFD6E7',
          borderRadius: 16, padding: '16px 48px',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 800,
          fontSize: 'clamp(36px,5vw,72px)',
          boxShadow: '0 0 40px rgba(255,78,182,0.3)',
          marginBottom: 28,
        }}>
          {q.a}
        </div>
        {winnerTeam
          ? (
            <p style={{
              color: winnerTeam.color, fontWeight: 800,
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: 'clamp(24px,3vw,44px)', margin: 0,
            }}>
              +{q.value} pts → {winnerTeam.name}
            </p>
          )
          : (
            <p style={{
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
              fontSize: 'clamp(20px,2.5vw,36px)', margin: 0,
            }}>
              Nadie acertó
            </p>
          )
        }
      </div>
    )
  }

  return null
}

// ── Root component ────────────────────────────────────────────────────────────

export default function Presenter() {
  const { code = DEFAULT_ROOM } = useParams()
  const { room, answers, loading } = useRoom(code)

  if (loading) return <Loading />
  if (!room) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#1A0A14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#FFD6E7', fontFamily: 'Pixelify Sans, sans-serif', fontSize: 32 }}>
          Sala no encontrada.
        </p>
      </div>
    )
  }

  const teams: JeopardyTeam[] = room.teams ?? []
  const gs = room.game_state

  const mainContent = (() => {
    if (!room.active_game || room.phase !== 'playing') {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', textAlign: 'center',
        }}>
          <p style={{
            color: '#FFD6E7', fontFamily: 'Pixelify Sans, sans-serif',
            fontSize: 'clamp(32px,4vw,56px)', fontWeight: 600, margin: 0,
          }}>
            ¡Ya empezamos!
          </p>
        </div>
      )
    }
    if (room.active_game === 'jeopardy') {
      return <JeopardyContent gs={gs} teams={teams} answers={answers} />
    }
    return null
  })()

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#1A0A14',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Quicksand, sans-serif',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: BAND_H }}>
        {mainContent}
      </div>
      <ScoreBand teams={teams} currentTeamIndex={gs.current_team_index} />
    </div>
  )
}
```

- [ ] **Step 2: Verify the file compiles (TypeScript check)**

```bash
cd /Users/rogmolinari/Documents/Mis30 && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors related to `Presenter.tsx`. Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/routes/Presenter.tsx
git commit -m "feat: add Presenter TV route component"
```

---

## Task 2: Register routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Presenter` default export from `./routes/Presenter`
- Produces: routes `/presenter` and `/presenter/:code` in the React Router tree

- [ ] **Step 1: Add import for Presenter**

In `src/App.tsx`, add after the existing imports:

```tsx
import Presenter from './routes/Presenter'
```

- [ ] **Step 2: Add the two routes**

Inside the `<Routes>` block in `src/App.tsx`, after the existing `/screen` routes:

```tsx
<Route path="/presenter" element={<Presenter />} />
<Route path="/presenter/:code" element={<Presenter />} />
```

The full updated `App.tsx` should look like:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Join from './routes/Join'
import Screen from './routes/Screen'
import Host from './routes/Host'
import Play from './routes/Play'
import Preview from './routes/Preview'
import Presenter from './routes/Presenter'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/join" replace />} />
      {/* URLs limpias (sala única ROCIO30 por defecto) */}
      <Route path="/join" element={<Join />} />
      <Route path="/play" element={<Play />} />
      <Route path="/screen" element={<Screen />} />
      <Route path="/host" element={<Host />} />
      <Route path="/presenter" element={<Presenter />} />
      {/* Compatibilidad con QR/links que llevan el código */}
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/screen/:code" element={<Screen />} />
      <Route path="/host/:code" element={<Host />} />
      <Route path="/presenter/:code" element={<Presenter />} />
      {/* Preview TEMPORAL de diseño (borrar luego) */}
      <Route path="/preview/podium" element={<Preview />} />
      <Route path="/preview/loading" element={<Preview />} />
      <Route path="/preview/host" element={<Preview />} />
      <Route path="/preview/setup" element={<Preview />} />
      <Route path="/preview/jeopardy" element={<Preview />} />
      <Route path="/preview/answer" element={<Preview />} />
      <Route path="/preview/avatars" element={<Preview />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/rogmolinari/Documents/Mis30 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /presenter route"
```

---

## Task 3: Add "Presentar" button in `Host.tsx`

**Files:**
- Modify: `src/routes/Host.tsx`

**Interfaces:**
- Produces: an `<a>` tag styled as a ghost pill button that opens `/presenter` in a new tab, visible in both the lobby phase and the active-game phase of the host panel.

- [ ] **Step 1: Add the Presentar button to the lobby panel**

In `src/routes/Host.tsx`, inside the `if (room.phase === 'lobby')` block, add the button after the grid of game cards and before `<SeedPanel>`. The button is an `<a>` tag (not a `<button>`) since it navigates to a new tab:

```tsx
<a
  href="/presenter"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: 'block', textAlign: 'center', marginTop: 20,
    padding: '13px 24px', borderRadius: 999,
    border: '2.5px solid #5A2A4A',
    color: '#5A2A4A', background: 'rgba(255,255,255,0.85)',
    fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
    fontSize: 16, textDecoration: 'none',
    cursor: 'pointer',
  }}
>
  Presentar 📺
</a>
```

Place it **after** the `{GAME_LIST.map(...)}` grid and **before** `<SeedPanel room={room} />`.

The updated lobby block:

```tsx
if (room.phase === 'lobby') {
  return (
    <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A', letterSpacing: 1 }}>Panel · {players.filter(p => p.claimed_at).length} en sala</h1>
      <p style={{ color: '#5A2A4A', fontWeight: 700 }}>Elegí un juego:</p>
      <div style={{ display: 'grid', gap: 14 }}>
        {GAME_LIST.map((g) => <GameCard key={g.id} {...g} onClick={() => start(g.id)} />)}
      </div>
      <a
        href="/presenter"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', textAlign: 'center', marginTop: 20,
          padding: '13px 24px', borderRadius: 999,
          border: '2.5px solid #5A2A4A',
          color: '#5A2A4A', background: 'rgba(255,255,255,0.85)',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
          fontSize: 16, textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        Presentar 📺
      </a>
      <SeedPanel room={room} />
      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <PillButton onClick={() => setPhase(room!.id, 'results')}>Cerrar la noche · ranking final</PillButton>
        <PillButton variant="ghost" onClick={async () => {
          if (confirm('¿Reiniciar puntajes a 0?')) await resetScores(room!.id)
        }}>Reiniciar puntajes</PillButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the Presentar button to the active-game panel**

In `src/routes/Host.tsx`, inside the `if (room.active_game)` block, add the button in the top bar (after the "← Salir" button):

```tsx
<a
  href="/presenter"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    background: 'rgba(255,255,255,0.85)', border: '2.5px solid #5A2A4A',
    color: '#5A2A4A', borderRadius: 999, padding: '6px 18px',
    fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
    fontSize: 13, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center',
  }}
>
  Presentar 📺
</a>
```

The full updated active-game block:

```tsx
if (room.active_game) {
  const cfg = GAMES[room.active_game]
  if (!cfg) return (
    <div style={{ padding: 20, display: 'grid', gap: 12 }}>
      <p style={{ color: '#5A2A4A' }}>Juego desconocido: {room.active_game}</p>
      <PillButton onClick={() => setActiveGame(room!.id, null, {})}>Volver al hub</PillButton>
    </div>
  )
  const claimed = players.filter((p) => p.claimed_at)
  return (
    <div>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(90,42,74,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => { if (confirm('¿Salir del juego actual?')) setActiveGame(room!.id, null, {}) }}
          style={{
            background: '#fff', border: '2.5px solid #5A2A4A',
            color: '#5A2A4A', borderRadius: 999, padding: '6px 18px',
            cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
            fontWeight: 700, fontSize: 13, touchAction: 'manipulation',
          }}
        >
          ← Salir
        </button>
        <span style={{ fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, color: '#5A2A4A', fontSize: 16, letterSpacing: 0.5 }}>
          {cfg.id === 'jeopardy' ? 'Jeopardy' : cfg.id === 'most_likely' ? 'Más probable' : 'Dos verdades'}
        </span>
        <a
          href="/presenter"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.85)', border: '2.5px solid #5A2A4A',
            color: '#5A2A4A', borderRadius: 999, padding: '6px 18px',
            fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
            fontSize: 13, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}
        >
          Presentar 📺
        </a>
      </div>
      <div style={{ padding: 16 }}>
        {cfg.renderHost({ room, players: claimed, answers, ttEntries })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/rogmolinari/Documents/Mis30 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/Host.tsx
git commit -m "feat: add Presentar button to host panel"
```

---

## Manual Verification Checklist

After all tasks:

- [ ] Open `/host` → "Presentar 📺" button visible in lobby → click opens new tab at `/presenter`
- [ ] `/presenter` shows dark background (`#1A0A14`) with score band at bottom
- [ ] Score band shows team names and scores, updating in real-time
- [ ] During jeopardy `picking` phase: board visible, current team highlighted in band
- [ ] During `answering`: big question text, category badge, countdown (if timer active)
- [ ] During `stealing`: same + pink ROBO badge
- [ ] During `revealing`: question + prominent answer box + "+X pts → Team" or "Nadie acertó"
- [ ] During `finished`: TeamPodium component renders on dark background
- [ ] During game (active_game set): "Presentar 📺" also visible in top bar of host game panel
- [ ] No interactive elements on presenter screen (no buttons, inputs)
