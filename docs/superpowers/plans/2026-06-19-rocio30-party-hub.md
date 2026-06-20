# Rocío 30 Party Game Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first realtime party game hub for ~18 guests, with a fixed room (`ROCIO30`), pre-loaded players who pick their own face to join, a shared room engine, and 3 games (quiz, most-likely, two-truths) plus a global results podium — all in a Y2K/Bratz aesthetic.

**Architecture:** React + Vite SPA. Supabase Realtime (Postgres Changes) is the single source of truth: the host writes state transitions to the DB, and Big Screen / guests subscribe and react. Each game is a config object plugged into one generic room engine. No automated tests (per spec) — every task verifies by running the app and observing realtime behavior across multiple browser tabs.

**Tech Stack:** React 18, TypeScript, Vite, React Router, @supabase/supabase-js, qrcode.react, Google Fonts (Baloo 2 + Quicksand), plain CSS with design tokens.

---

## Testing & Verification Approach

Per the spec (no-objetivo: "sin tests automatizados"), this plan uses **manual verification** instead of an automated test suite. The standard verification harness is:

- **Two-tab setup:** open `/screen/ROCIO30` in one browser window and `/host/ROCIO30` + `/join/ROCIO30` in others (or use phone + laptop). Realtime changes in one must appear in the others within ~1s.
- Each task's final step describes exactly what to click and what to observe.
- Keep the Supabase project awake (free tier pauses after 7 days idle).

---

## File Structure

```
Mis30/
├── .env.local                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
├── .env.example                    # template, committed
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── supabase/
│   └── schema.sql                  # full DB schema + RLS (apply once)
├── public/
│   └── players/                    # AI photos dropped here later (<slug>.jpg)
└── src/
    ├── main.tsx                    # router setup
    ├── App.tsx                     # route definitions
    ├── styles/
    │   ├── tokens.css              # design tokens (colors, fonts)
    │   └── global.css              # base styles, gradient background
    ├── lib/
    │   ├── supabase.ts             # Supabase client
    │   ├── types.ts                # Room, Player, Answer, TtEntry, GameState
    │   ├── room.ts                 # useRoom(code) hook
    │   ├── roster.ts               # load players.json
    │   ├── actions.ts              # host/guest write helpers
    │   └── identity.ts             # localStorage player_id
    ├── content/
    │   ├── players.json            # [{slug,name}] roster (host fills)
    │   ├── quiz.json               # quiz questions
    │   └── most_likely.json        # most-likely prompts
    ├── games/
    │   ├── registry.ts             # GameConfig type + registry of 3 games
    │   ├── quiz.tsx                # quiz config (screen/guest/host/score)
    │   ├── mostLikely.tsx          # most-likely config
    │   └── twoTruths.tsx           # two-truths config
    ├── components/
    │   ├── ui/
    │   │   ├── PillButton.tsx
    │   │   ├── StarBadge.tsx
    │   │   ├── GameCard.tsx
    │   │   ├── PlayerTile.tsx
    │   │   ├── Sparkles.tsx
    │   │   └── Countdown.tsx        # local countdown vs timer_ends_at
    │   └── seed/
    │       └── SeedPanel.tsx       # hidden seed button on /host
    └── routes/
        ├── Landing.tsx             # /
        ├── Join.tsx                # /join/:code
        ├── Play.tsx                # /play/:code
        ├── Screen.tsx              # /screen/:code
        └── Host.tsx                # /host/:code
```

---

## Task 1: Project scaffold (Vite + React + TS + Router)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.example`
- Modify: `.gitignore` (already exists with `node_modules/`, `.env`, `dist/`, `.superpowers/`)

- [ ] **Step 1: Scaffold the Vite React-TS app**

Run (non-interactive):
```bash
cd /Users/rogmolinari/Documents/Mis30
npm create vite@latest . -- --template react-ts
```
If it refuses because the dir is non-empty, scaffold into a temp dir and copy:
```bash
npm create vite@latest .vite-tmp -- --template react-ts
cp -r .vite-tmp/* .vite-tmp/.* . 2>/dev/null; rm -rf .vite-tmp
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install react-router-dom @supabase/supabase-js qrcode.react
```

- [ ] **Step 3: Replace `src/main.tsx` with router setup**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 4: Replace `src/App.tsx` with route definitions (placeholders for now)**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'

const ROOM = 'ROCIO30'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/join/${ROOM}`} replace />} />
      <Route path="/join/:code" element={<div>join</div>} />
      <Route path="/play/:code" element={<div>play</div>} />
      <Route path="/screen/:code" element={<div>screen</div>} />
      <Route path="/host/:code" element={<div>host</div>} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
```

- [ ] **Step 5: Create `.env.example`**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

- [ ] **Step 6: Create empty `src/styles/tokens.css` and `src/styles/global.css`**

`src/styles/tokens.css`:
```css
/* filled in Task 9 */
:root { --pink-hot: #FF4FB6; }
```
`src/styles/global.css`:
```css
/* filled in Task 9 */
* { box-sizing: border-box; }
body { margin: 0; }
```

- [ ] **Step 7: Verify the app runs and routes resolve**

Run: `npm run dev`
Open `http://localhost:5173/` → should redirect to `/join/ROCIO30` and show "join".
Manually visit `/screen/ROCIO30`, `/host/ROCIO30`, `/play/ROCIO30` → each shows its placeholder word.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React-TS app with routes"
```

---

## Task 2: Supabase schema + client + types

**Files:**
- Create: `supabase/schema.sql`, `src/lib/supabase.ts`, `src/lib/types.ts`

- [ ] **Step 1: Write the full schema in `supabase/schema.sql`**

```sql
-- Rocío 30 party hub schema. Laxa RLS: anon full access (one-night, friends-only).

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  phase text not null default 'lobby',          -- lobby | playing | results
  active_game text,                              -- quiz | two_truths | most_likely | null
  game_state jsonb not null default '{}'::jsonb
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  slug text not null,
  name text not null,
  photo text not null,
  claimed_at timestamptz,
  score int not null default 0,
  unique (room_id, slug)
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  game text not null,
  round_key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (player_id, round_key)
);

create table if not exists two_truths_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  statements jsonb not null,                     -- ["s1","s2","s3"]
  lie_index int not null,                        -- 0..2
  unique (player_id)
);

-- Seed the fixed room.
insert into rooms (code) values ('ROCIO30')
  on conflict (code) do nothing;

-- Laxa RLS.
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table two_truths_entries enable row level security;

create policy anon_all_rooms on rooms for all using (true) with check (true);
create policy anon_all_players on players for all using (true) with check (true);
create policy anon_all_answers on answers for all using (true) with check (true);
create policy anon_all_tt on two_truths_entries for all using (true) with check (true);

-- Realtime publication.
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table two_truths_entries;
```

- [ ] **Step 2: Apply the schema to Supabase**

Either via the Supabase MCP tool `apply_migration` (name: `rocio30_schema`, query: the SQL above), or paste it into the Supabase dashboard SQL editor and run. Then confirm the `rooms` table has one row with `code='ROCIO30'`.

- [ ] **Step 3: Create `.env.local` with real credentials**

Get the project URL + anon (publishable) key from the Supabase dashboard (or MCP `get_project_url` / `get_publishable_keys`). Write:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```
(`.env.local` is gitignored via `.env*` — confirm `.gitignore` covers it; it lists `.env` and `.env.local`.)

- [ ] **Step 4: Create `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(url, key)
```

- [ ] **Step 5: Create `src/lib/types.ts`**

```ts
export type Phase = 'lobby' | 'playing' | 'results'
export type GameId = 'quiz' | 'two_truths' | 'most_likely'

export interface Room {
  id: string
  code: string
  phase: Phase
  active_game: GameId | null
  game_state: GameState
}

export interface GameState {
  round_index?: number
  prompt_index?: number
  round_key?: string
  phase?: string            // per-game internal phase
  timer_ends_at?: string | null
  current_player_id?: string | null
  done_player_ids?: string[]
  shuffle?: number[]        // random order of statements for two-truths
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

- [ ] **Step 6: Verify client builds**

Run: `npm run dev` (should compile with no type errors). Temporarily add `import { supabase } from './lib/supabase'` + `console.log(supabase)` in `App.tsx`, confirm no runtime error in the browser console, then remove it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema, client, and shared types"
```

---

## Task 3: Roster content + identity helpers

**Files:**
- Create: `src/content/players.json`, `src/lib/roster.ts`, `src/lib/identity.ts`

- [ ] **Step 1: Create `src/content/players.json` with sample roster**

```json
[
  { "slug": "rocio", "name": "Rocío" },
  { "slug": "sofi", "name": "Sofi" },
  { "slug": "mati", "name": "Mati" },
  { "slug": "lu", "name": "Lu" },
  { "slug": "juan", "name": "Juan" },
  { "slug": "caro", "name": "Caro" }
]
```
(The host replaces/extends this with the real ~18 names later. Photos go to `public/players/<slug>.jpg`.)

- [ ] **Step 2: Create `src/lib/roster.ts`**

```ts
import rosterData from '../content/players.json'

export interface RosterEntry {
  slug: string
  name: string
}

export const roster: RosterEntry[] = rosterData as RosterEntry[]

/** Photo path for a slug. Falls back to a placeholder if the file is missing. */
export function photoFor(slug: string): string {
  return `/players/${slug}.jpg`
}

/** Deterministic glam gradient per slug, used as a placeholder behind missing photos. */
export function gradientFor(slug: string): string {
  const pairs = [
    ['#FF9E5E', '#FF4FB6'], ['#B86CD9', '#FF4FB6'], ['#FF4FB6', '#FFB6D9'],
    ['#FF9E5E', '#B86CD9'], ['#B86CD9', '#FFB6D9'], ['#FF4FB6', '#FF9E5E'],
  ]
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const [a, b] = pairs[h % pairs.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
```

- [ ] **Step 3: Create `src/lib/identity.ts`**

```ts
const KEY = 'rocio30_player_id'

export function getMyPlayerId(): string | null {
  return localStorage.getItem(KEY)
}

export function setMyPlayerId(id: string): void {
  localStorage.setItem(KEY, id)
}

export function clearMyPlayerId(): void {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Verify import resolution**

Run: `npm run dev`. Temporarily log `roster` from `App.tsx`, confirm the array prints in the browser console, then remove the log. Confirm `tsconfig` allows JSON imports (Vite's default `react-ts` `tsconfig` has `resolveJsonModule: true`; if a type error appears, add it under `compilerOptions`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add roster content and identity helpers"
```

---

## Task 4: useRoom hook + write actions (the realtime core)

**Files:**
- Create: `src/lib/room.ts`, `src/lib/actions.ts`

- [ ] **Step 1: Create `src/lib/room.ts` — subscribe + refetch on change**

```ts
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Room, Player, Answer, TtEntry } from './types'

export interface RoomState {
  room: Room | null
  players: Player[]
  answers: Answer[]
  ttEntries: TtEntry[]
  loading: boolean
}

/**
 * Subscribes to all room tables via Postgres Changes. On ANY change to a table,
 * it re-fetches that table (simple + robust for ~18 players). Returns live state.
 */
export function useRoom(code: string): RoomState {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [ttEntries, setTtEntries] = useState<TtEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let roomId: string | null = null
    let cancelled = false

    async function loadRoom() {
      const { data } = await supabase.from('rooms').select('*').eq('code', code).single()
      if (cancelled || !data) return
      roomId = data.id
      setRoom(data as Room)
      await Promise.all([loadPlayers(), loadAnswers(), loadTt()])
      setLoading(false)
    }
    async function loadPlayers() {
      if (!roomId) return
      const { data } = await supabase.from('players').select('*')
        .eq('room_id', roomId).order('name')
      if (!cancelled && data) setPlayers(data as Player[])
    }
    async function loadAnswers() {
      if (!roomId) return
      const { data } = await supabase.from('answers').select('*').eq('room_id', roomId)
      if (!cancelled && data) setAnswers(data as Answer[])
    }
    async function loadTt() {
      if (!roomId) return
      const { data } = await supabase.from('two_truths_entries').select('*').eq('room_id', roomId)
      if (!cancelled && data) setTtEntries(data as TtEntry[])
    }

    loadRoom()

    const channel = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' },
        (payload) => { if (payload.new && (payload.new as Room).code === code) setRoom(payload.new as Room) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => loadPlayers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, () => loadAnswers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'two_truths_entries' }, () => loadTt())
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [code])

  return { room, players, answers, ttEntries, loading }
}
```

- [ ] **Step 2: Create `src/lib/actions.ts` — all writes in one place**

```ts
import { supabase } from './supabase'
import type { GameId, GameState, Player } from './types'

export async function claimPlayer(playerId: string): Promise<void> {
  await supabase.from('players').update({ claimed_at: new Date().toISOString() }).eq('id', playerId)
}

export async function setActiveGame(roomId: string, game: GameId | null, state: GameState): Promise<void> {
  await supabase.from('rooms').update({
    active_game: game,
    phase: game ? 'playing' : 'lobby',
    game_state: state,
  }).eq('id', roomId)
}

export async function patchGameState(roomId: string, current: GameState, patch: Partial<GameState>): Promise<void> {
  await supabase.from('rooms').update({ game_state: { ...current, ...patch } }).eq('id', roomId)
}

export async function setPhase(roomId: string, phase: 'lobby' | 'playing' | 'results'): Promise<void> {
  await supabase.from('rooms').update({ phase }).eq('id', roomId)
}

export async function submitAnswer(
  roomId: string, playerId: string, game: GameId, roundKey: string, value: any,
): Promise<void> {
  await supabase.from('answers').upsert(
    { room_id: roomId, player_id: playerId, game, round_key: roundKey, value },
    { onConflict: 'player_id,round_key' },
  )
}

export async function addScores(deltas: Record<string, number>, players: Player[]): Promise<void> {
  // Apply score deltas. Reads current score from the passed players snapshot.
  const updates = Object.entries(deltas).map(([playerId, delta]) => {
    const p = players.find((x) => x.id === playerId)
    const next = (p?.score ?? 0) + delta
    return supabase.from('players').update({ score: next }).eq('id', playerId)
  })
  await Promise.all(updates)
}

export async function resetScores(roomId: string): Promise<void> {
  await supabase.from('players').update({ score: 0 }).eq('room_id', roomId)
}
```

- [ ] **Step 3: Verify subscription wiring with a throwaway probe**

Temporarily make `/screen/:code` render a component that calls `useRoom(code)` and prints `JSON.stringify({phase, players: players.length})`. Run `npm run dev`, open `/screen/ROCIO30`. In the Supabase dashboard, manually `update rooms set phase='playing'`. The screen text must update within ~1s without reload. Revert the phase, then remove the probe.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add useRoom realtime hook and write actions"
```

---

## Task 5: UI primitives (PillButton, StarBadge, PlayerTile, Sparkles, Countdown, GameCard)

**Files:**
- Create: `src/components/ui/PillButton.tsx`, `StarBadge.tsx`, `PlayerTile.tsx`, `Sparkles.tsx`, `Countdown.tsx`, `GameCard.tsx`

- [ ] **Step 1: `PillButton.tsx`**

```tsx
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  selected?: boolean
}

export function PillButton({ variant = 'primary', selected, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      style={{
        border: 'none', cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
        fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
        fontSize: 18, padding: '16px 22px', borderRadius: 999,
        color: variant === 'primary' ? '#fff' : '#5A2A4A',
        background: variant === 'primary'
          ? 'linear-gradient(135deg, #FF4FB6, #B86CD9)'
          : 'rgba(255,255,255,0.7)',
        boxShadow: selected
          ? '0 0 0 4px #FF4FB6, 0 4px 0 rgba(90,42,74,0.25)'
          : '0 4px 0 rgba(90,42,74,0.25)',
        transition: 'transform 0.12s ease',
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    />
  )
}
```

- [ ] **Step 2: `StarBadge.tsx`**

```tsx
export function StarBadge({ value }: { value: number }) {
  return (
    <div style={{ position: 'relative', width: 56, height: 56, display: 'inline-flex' }}>
      <div style={{ fontSize: 56, lineHeight: 1, color: '#FFD23F' }}>★</div>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800,
        color: '#5A2A4A', fontSize: 20,
      }}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 3: `PlayerTile.tsx`**

```tsx
import { gradientFor, photoFor } from '../../lib/roster'
import type { Player } from '../../lib/types'

interface Props {
  player: Player
  size?: number
  dim?: boolean
  selected?: boolean
  onClick?: () => void
}

export function PlayerTile({ player, size = 100, dim, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        border: 'none', background: 'transparent', cursor: onClick ? 'pointer' : 'default',
        opacity: dim ? 0.4 : 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, padding: 0,
      }}
    >
      <div style={{
        width: size, height: size, borderRadius: 20, position: 'relative',
        background: gradientFor(player.slug),
        boxShadow: selected
          ? '0 0 0 4px #FF4FB6, inset 0 0 0 3px rgba(255,255,255,0.8)'
          : 'inset 0 0 0 3px rgba(255,255,255,0.8), 0 4px 0 rgba(90,42,74,0.18)',
        overflow: 'hidden',
      }}>
        <img
          src={photoFor(player.slug)}
          alt={player.name}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <span style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 800, color: '#5A2A4A', fontSize: 15 }}>
        {player.name}
      </span>
    </button>
  )
}
```

- [ ] **Step 4: `Sparkles.tsx`**

```tsx
/** Decorative star scatter; pointer-events disabled so it never blocks taps. */
export function Sparkles() {
  const stars = ['✦', '✧', '★', '✦', '✧']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <span key={i} style={{
          position: 'absolute', color: 'rgba(255,255,255,0.7)', fontSize: 18 + (i % 3) * 10,
          top: `${(i * 19 + 7) % 90}%`, left: `${(i * 37 + 11) % 92}%`,
        }}>{s}</span>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: `Countdown.tsx` — local countdown vs absolute timer**

Purely visual: each client computes seconds remaining from the absolute `endsAt`.
The host drives `reveal` manually (the spec: "al cerrar el timer o si la host fuerza
el cierre"), so this component does not need an onExpire callback. All hooks run
unconditionally to respect React's rules of hooks.

```tsx
import { useEffect, useState } from 'react'

/** Renders seconds remaining until `endsAt` (ISO). Visual only. */
export function Countdown({ endsAt }: { endsAt: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  if (!endsAt) return null
  const remaining = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000))
  return (
    <div style={{
      fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 48,
      color: remaining <= 5 ? '#FF4FB6' : '#5A2A4A',
    }}>{remaining}</div>
  )
}
```

- [ ] **Step 6: `GameCard.tsx`**

```tsx
interface Props {
  title: string
  emoji: string
  gradient: string
  onClick?: () => void
}

export function GameCard({ title, emoji, gradient, onClick }: Props) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: onClick ? 'pointer' : 'default', borderRadius: 24,
      background: gradient, padding: '28px 20px', minHeight: 200, width: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, boxShadow: '0 8px 0 rgba(90,42,74,0.2), inset 0 0 0 4px rgba(255,255,255,0.5)',
    }}>
      <div style={{ fontSize: 64 }}>{emoji}</div>
      <div style={{
        fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff',
        textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(90,42,74,0.35)', textAlign: 'center',
      }}>{title}</div>
    </button>
  )
}
```

- [ ] **Step 7: Verify primitives render**

Temporarily render all six in `/screen/:code` with dummy props (`<Countdown endsAt={new Date(Date.now()+10000).toISOString()} />`, a `PlayerTile` with a fake player object, etc.). Run `npm run dev`, open `/screen/ROCIO30`, confirm each renders and the countdown ticks down. Remove the temporary render.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Y2K UI primitives"
```

---

## Task 6: Seed panel + Join (claim) flow

**Files:**
- Create: `src/components/seed/SeedPanel.tsx`, `src/routes/Join.tsx`
- Modify: `src/App.tsx` (wire `/join/:code` to `Join`)

- [ ] **Step 1: Create `src/components/seed/SeedPanel.tsx`**

```tsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { roster, photoFor } from '../../lib/roster'
import type { Room } from '../../lib/types'

/** Hidden helper: upserts roster rows into `players`. Idempotent on (room_id, slug). */
export function SeedPanel({ room }: { room: Room }) {
  const [msg, setMsg] = useState('')
  async function seed() {
    const rows = roster.map((r) => ({
      room_id: room.id, slug: r.slug, name: r.name, photo: photoFor(r.slug),
    }))
    const { error } = await supabase.from('players').upsert(rows, { onConflict: 'room_id,slug' })
    setMsg(error ? `Error: ${error.message}` : `Seeded ${rows.length} players ✓`)
  }
  return (
    <div style={{ marginTop: 24, padding: 12, border: '1px dashed #B86CD9', borderRadius: 12 }}>
      <button onClick={seed} style={{ padding: '8px 14px', borderRadius: 8 }}>Seed players from roster</button>
      {msg && <span style={{ marginLeft: 10, color: '#5A2A4A' }}>{msg}</span>}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/routes/Join.tsx`**

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { claimPlayer } from '../lib/actions'
import { setMyPlayerId } from '../lib/identity'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Sparkles } from '../components/ui/Sparkles'

export default function Join() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { players, loading } = useRoom(code)

  async function pick(playerId: string) {
    setMyPlayerId(playerId)
    await claimPlayer(playerId)
    nav(`/play/${code}`)
  }

  if (loading) return <Center>Cargando… 🎀</Center>

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', position: 'relative' }}>
      <Sparkles />
      <h1 style={{ textAlign: 'center', fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A',
        textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(255,255,255,0.6)' }}>¿Quién sos? 🎀</h1>
      <p style={{ textAlign: 'center', color: '#5A2A4A', opacity: 0.8 }}>Tocá tu foto para entrar</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16,
        position: 'relative', zIndex: 1 }}>
        {players.map((p) => (
          <PlayerTile key={p.id} player={p} dim={!!p.claimed_at} onClick={() => pick(p.id)} />
        ))}
      </div>
      {players.length === 0 && (
        <p style={{ textAlign: 'center', color: '#5A2A4A', marginTop: 24 }}>
          No hay jugadores cargados. La host debe correr el seed desde /host.
        </p>
      )}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center',
    fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A', fontSize: 24 }}>{children}</div>
}
```

- [ ] **Step 3: Wire route in `src/App.tsx`**

Replace the `/join/:code` line:
```tsx
import Join from './routes/Join'
// ...
<Route path="/join/:code" element={<Join />} />
```

- [ ] **Step 4: Temporarily expose SeedPanel for this task**

In `src/App.tsx`, temporarily add a `<Route path="/seed/:code" element={<SeedRoute />} />` where `SeedRoute` uses `useRoom` and renders `<SeedPanel room={room} />` when `room` is loaded. (It will move into `/host` in Task 10; this temporary route lets us seed now.)

```tsx
// temporary, removed in Task 10
import { useParams } from 'react-router-dom'
import { useRoom } from './lib/room'
import { SeedPanel } from './components/seed/SeedPanel'
function SeedRoute() {
  const { code = '' } = useParams()
  const { room } = useRoom(code)
  return room ? <SeedPanel room={room} /> : <div>cargando…</div>
}
```

- [ ] **Step 5: Verify claim flow end-to-end**

Run `npm run dev`. Visit `/seed/ROCIO30`, click "Seed players" → "Seeded N players ✓". Open `/join/ROCIO30` in two browser windows. In window A tap a face → redirects to `/play/ROCIO30` (placeholder). In window B, within ~1s that same tile dims (claimed). Reload window A → it lands on `/join` again but tapping the same face still works (idempotent). Confirm in Supabase that `players.claimed_at` is set.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add player seeding and join/claim flow"
```

---

## Task 7: Screen + Host shells + Lobby

**Files:**
- Create: `src/routes/Screen.tsx`, `src/routes/Host.tsx`, `src/routes/Play.tsx`
- Modify: `src/App.tsx` (wire the three routes)

- [ ] **Step 1: Create `src/routes/Screen.tsx` with lobby (QR + live faces)**

```tsx
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useRoom } from '../lib/room'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Sparkles } from '../components/ui/Sparkles'

export default function Screen() {
  const { code = '' } = useParams()
  const { room, players } = useRoom(code)
  const joinUrl = `${window.location.origin}/join/${code}`
  const claimed = players.filter((p) => p.claimed_at)

  // Game screens are wired in later tasks via the registry (Task 8+).
  if (room && room.phase !== 'lobby' && room.active_game) {
    return <GameScreenHost code={code} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 32, position: 'relative' }}>
      <Sparkles />
      <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 56, color: '#5A2A4A',
        textTransform: 'uppercase', textShadow: '3px 3px 0 rgba(255,255,255,0.6)' }}>Rocío 30 💖</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 20, marginTop: 8 }}>
        <QRCodeSVG value={joinUrl} size={200} />
      </div>
      <p style={{ color: '#5A2A4A', fontWeight: 700, marginTop: 12 }}>Escaneá para entrar · {joinUrl}</p>
      <p style={{ color: '#5A2A4A', marginTop: 8 }}>{claimed.length} en sala 🎀</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginTop: 16,
        position: 'relative', zIndex: 1 }}>
        {claimed.map((p) => <PlayerTile key={p.id} player={p} size={90} />)}
      </div>
    </div>
  )
}

// Placeholder until Task 8 wires the registry-driven game screen.
function GameScreenHost({ code }: { code: string }) {
  return <div style={{ padding: 40, color: '#5A2A4A' }}>Juego activo (se implementa en Task 8). code={code}</div>
}
```

- [ ] **Step 2: Create `src/routes/Host.tsx` shell with hub selector + lobby controls**

```tsx
import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { setActiveGame } from '../lib/actions'
import { GameCard } from '../components/ui/GameCard'
import { SeedPanel } from '../components/seed/SeedPanel'
import type { GameId } from '../lib/types'

const GAMES: { id: GameId; title: string; emoji: string; gradient: string }[] = [
  { id: 'quiz', title: '¿Quién conoce a Rocío?', emoji: '🎤', gradient: 'linear-gradient(135deg,#FF4FB6,#B86CD9)' },
  { id: 'most_likely', title: '¿Quién es más probable?', emoji: '🔮', gradient: 'linear-gradient(135deg,#FF9E5E,#FF4FB6)' },
  { id: 'two_truths', title: 'Dos verdades, una mentira', emoji: '🎭', gradient: 'linear-gradient(135deg,#B86CD9,#FFB6D9)' },
]

export default function Host() {
  const { code = '' } = useParams()
  const { room, players } = useRoom(code)
  if (!room) return <div style={{ padding: 40 }}>Cargando…</div>

  async function start(game: GameId) {
    // Per-game initial state is provided by the registry in Task 8+.
    await setActiveGame(room!.id, game, { round_index: 0, prompt_index: 0, phase: 'init' })
  }

  if (room.phase === 'lobby') {
    return (
      <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A' }}>Panel · {players.filter(p => p.claimed_at).length} en sala</h1>
        <p style={{ color: '#5A2A4A' }}>Elegí un juego:</p>
        <div style={{ display: 'grid', gap: 14 }}>
          {GAMES.map((g) => <GameCard key={g.id} {...g} onClick={() => start(g.id)} />)}
        </div>
        <SeedPanel room={room} />
      </div>
    )
  }

  // Game host controls wired in Task 8+.
  return <GameHostControls code={code} />
}

function GameHostControls({ code }: { code: string }) {
  return <div style={{ padding: 40, color: '#5A2A4A' }}>Controles del juego (Task 8). code={code}</div>
}
```

- [ ] **Step 3: Create `src/routes/Play.tsx` shell**

```tsx
import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { getMyPlayerId } from '../lib/identity'
import { Sparkles } from '../components/ui/Sparkles'

export default function Play() {
  const { code = '' } = useParams()
  const { room, players } = useRoom(code)
  const myId = getMyPlayerId()
  const me = players.find((p) => p.id === myId)

  if (!room) return <Center>Cargando…</Center>
  if (!me) return <Center>Volvé a entrar tocando tu cara 🎀</Center>

  if (room.phase === 'lobby') {
    return <Center>Hola {me.name} 💖<br />Esperando que arranque el juego…</Center>
  }

  // Game guest views wired in Task 8+.
  return <Center>Juego activo (Task 8)</Center>
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center',
      padding: 24, fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A', fontSize: 24, position: 'relative' }}>
      <Sparkles /><div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Wire all three routes in `src/App.tsx` and remove the temporary `/seed` route**

```tsx
import Screen from './routes/Screen'
import Host from './routes/Host'
import Play from './routes/Play'
// ...
<Route path="/screen/:code" element={<Screen />} />
<Route path="/host/:code" element={<Host />} />
<Route path="/play/:code" element={<Play />} />
```
Delete the temporary `SeedRoute` and its `/seed/:code` route (seeding now lives in the Host lobby).

- [ ] **Step 5: Verify lobby realtime end-to-end (the spec's gate)**

Run `npm run dev`. Open `/screen/ROCIO30` (shows QR + "0 en sala"). On `/host/ROCIO30`, click "Seed players" if not seeded. From a phone or another window, scan/open `/join/ROCIO30` and tap a face. **The face must light up on the Big Screen lobby within ~1s.** Tap from 2–3 windows → counter and grid grow live. *Do not proceed past this gate until live faces appear.*

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add screen/host/play shells with live lobby"
```

---

## Task 8: Game engine contract + Quiz game

**Files:**
- Create: `src/content/quiz.json`, `src/games/registry.ts`, `src/games/quiz.tsx`
- Modify: `src/routes/Screen.tsx`, `src/routes/Host.tsx`, `src/routes/Play.tsx` (delegate to registry)

- [ ] **Step 1: Create `src/content/quiz.json`**

```json
[
  { "q": "¿Cuál fue mi primer trabajo?", "options": ["Niñera", "Moza", "Vendedora", "Recepcionista"], "correct": 1 },
  { "q": "¿Mi comida favorita?", "options": ["Sushi", "Milanesa", "Pizza", "Tacos"], "correct": 2 },
  { "q": "¿A qué le tengo más miedo?", "options": ["Arañas", "Alturas", "Payasos", "Oscuridad"], "correct": 0 }
]
```
(The host expands to 15–20 before the party. Each: `q`, `options[]`, `correct` index.)

- [ ] **Step 2: Create `src/games/registry.ts` — the GameConfig contract**

```tsx
import type { ReactNode } from 'react'
import type { Answer, GameState, Player, Room, TtEntry } from '../lib/types'

export interface GameContext {
  room: Room
  players: Player[]          // claimed players only, for gameplay
  answers: Answer[]          // answers for the current game
  ttEntries: TtEntry[]
  me?: Player                // guest only
}

export interface GameConfig {
  id: string
  initialState: (ctx: GameContext) => GameState
  renderScreen: (ctx: GameContext) => ReactNode
  renderGuest: (ctx: GameContext) => ReactNode
  renderHost: (ctx: GameContext) => ReactNode
}

import { quizGame } from './quiz'
import { mostLikelyGame } from './mostLikely'
import { twoTruthsGame } from './twoTruths'

export const GAMES: Record<string, GameConfig> = {
  quiz: quizGame,
  most_likely: mostLikelyGame,
  two_truths: twoTruthsGame,
}
```
(Note: `mostLikely` and `twoTruths` imports resolve in Tasks 10–11. To keep this task runnable, create thin stubs now — see Step 3.)

- [ ] **Step 3: Create stub files so the registry compiles**

`src/games/mostLikely.tsx`:
```tsx
import type { GameConfig } from './registry'
export const mostLikelyGame: GameConfig = {
  id: 'most_likely',
  initialState: () => ({ prompt_index: 0, phase: 'voting' }),
  renderScreen: () => <div>most-likely (Task 10)</div>,
  renderGuest: () => <div>most-likely (Task 10)</div>,
  renderHost: () => <div>most-likely (Task 10)</div>,
}
```
`src/games/twoTruths.tsx`:
```tsx
import type { GameConfig } from './registry'
export const twoTruthsGame: GameConfig = {
  id: 'two_truths',
  initialState: () => ({ phase: 'writing' }),
  renderScreen: () => <div>two-truths (Task 11)</div>,
  renderGuest: () => <div>two-truths (Task 11)</div>,
  renderHost: () => <div>two-truths (Task 11)</div>,
}
```

- [ ] **Step 4: Create `src/games/quiz.tsx`**

```tsx
import quizData from '../content/quiz.json'
import type { GameConfig } from './registry'
import type { GameState, Player } from '../lib/types'
import { PillButton } from '../components/ui/PillButton'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Countdown } from '../components/ui/Countdown'
import { patchGameState, setActiveGame, setPhase, submitAnswer, addScores } from '../lib/actions'

interface QuizQ { q: string; options: string[]; correct: number }
const QUESTIONS = quizData as QuizQ[]
const TIMER_SECONDS = 20

function roundKey(i: number) { return `quiz:${i}` }

export const quizGame: GameConfig = {
  id: 'quiz',
  initialState: () => ({
    round_index: 0, round_key: roundKey(0), phase: 'asking',
    timer_ends_at: new Date(Date.now() + TIMER_SECONDS * 1000).toISOString(),
  }),

  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const q = QUESTIONS[i]
    if (gs.phase === 'finished' || !q) return <Podium players={players} />
    const mine = answers.filter((a) => a.round_key === roundKey(i))
    const correctCount = mine.filter((a) => a.value === q.correct).length
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>{q.q}</h2>
        {gs.phase === 'asking' && <Countdown endsAt={gs.timer_ends_at} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{
              padding: 20, borderRadius: 16, fontSize: 24, fontWeight: 700, color: '#5A2A4A',
              background: gs.phase === 'revealing' && oi === q.correct ? '#9CE89C' : 'rgba(255,255,255,0.7)',
              boxShadow: '0 4px 0 rgba(90,42,74,0.2)',
            }}>{opt}{gs.phase === 'revealing' && oi === q.correct ? ' ✓' : ''}</div>
          ))}
        </div>
        {gs.phase === 'revealing' && <p style={{ marginTop: 16, color: '#5A2A4A', fontSize: 24 }}>
          {correctCount} acertaron 🎉</p>}
      </div>
    )
  },

  renderGuest: ({ room, answers, me }) => {
    if (!me) return null
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const q = QUESTIONS[i]
    if (gs.phase === 'finished' || !q) return <div style={{ padding: 24, textAlign: 'center' }}>¡Terminó! Mirá la pantalla 💖</div>
    const myAnswer = answers.find((a) => a.round_key === roundKey(i) && a.player_id === me.id)
    if (gs.phase === 'revealing') {
      const ok = myAnswer?.value === q.correct
      return <div style={{ padding: 24, textAlign: 'center', fontSize: 28 }}>{ok ? '¡Acertaste! ✓' : 'Casi… ✗'}</div>
    }
    return (
      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
        {q.options.map((opt, oi) => (
          <PillButton key={oi} variant="ghost" selected={myAnswer?.value === oi}
            onClick={() => submitAnswer(room.id, me.id, 'quiz', roundKey(i), oi)}>{opt}</PillButton>
        ))}
      </div>
    )
  },

  renderHost: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const last = i >= QUESTIONS.length - 1

    async function reveal() {
      const q = QUESTIONS[i]
      const deltas: Record<string, number> = {}
      answers.filter((a) => a.round_key === roundKey(i) && a.value === q.correct)
        .forEach((a) => { deltas[a.player_id] = 1 })
      if (Object.keys(deltas).length) await addScores(deltas, players)
      await patchGameState(room.id, gs, { phase: 'revealing' })
    }
    async function next() {
      if (last) { await patchGameState(room.id, gs, { phase: 'finished' }); return }
      const ni = i + 1
      await patchGameState(room.id, gs, {
        round_index: ni, round_key: roundKey(ni), phase: 'asking',
        timer_ends_at: new Date(Date.now() + TIMER_SECONDS * 1000).toISOString(),
      })
    }

    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        <p style={{ color: '#5A2A4A' }}>Pregunta {i + 1}/{QUESTIONS.length} · fase: {gs.phase}</p>
        {gs.phase === 'asking' && <PillButton onClick={reveal}>Cerrar y revelar</PillButton>}
        {(gs.phase === 'revealing') && <PillButton onClick={next}>{last ? 'Ver podio' : 'Siguiente pregunta'}</PillButton>}
        {gs.phase === 'finished' && <HostBackToHub room={room} />}
      </div>
    )
  },
}

function Podium({ players }: { players: Player[] }) {
  const top = [...players].sort((a, b) => b.score - a.score).slice(0, 3)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>Podio 🏆</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
        {top.map((p, idx) => (
          <div key={p.id}>
            <div style={{ fontSize: 32 }}>{['🥇', '🥈', '🥉'][idx]}</div>
            <PlayerTile player={p} size={100} />
            <div style={{ color: '#5A2A4A', fontWeight: 800 }}>{p.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HostBackToHub({ room }: { room: { id: string; game_state: GameState } }) {
  return <PillButton onClick={() => setActiveGame(room.id, null, {})}>Volver al hub</PillButton>
}
```

- [ ] **Step 5: Delegate routes to the registry**

In `src/routes/Screen.tsx`, replace the `GameScreenHost` placeholder so that when a game is active it renders the registry's `renderScreen`:
```tsx
import { GAMES } from '../games/registry'
// ...inside Screen(), replace the placeholder branch:
if (room && room.phase === 'results') {
  // results podium handled in Task 12; for now fall through to game/lobby
}
if (room && room.active_game && room.phase === 'playing') {
  const cfg = GAMES[room.active_game]
  const claimed = players.filter((p) => p.claimed_at)
  return <div style={{ minHeight: '100vh' }}>{cfg.renderScreen({ room, players: claimed, answers, ttEntries })}</div>
}
```
(Add `answers, ttEntries` to the `useRoom` destructure in `Screen.tsx`.)

In `src/routes/Play.tsx`, replace the final placeholder:
```tsx
import { GAMES } from '../games/registry'
// ...
if (room.active_game && room.phase === 'playing') {
  const cfg = GAMES[room.active_game]
  const claimed = players.filter((p) => p.claimed_at)
  return <div style={{ minHeight: '100vh' }}>{cfg.renderGuest({ room, players: claimed, answers, ttEntries, me })}</div>
}
```
(Add `answers, ttEntries` to `Play.tsx`'s `useRoom` destructure.)

In `src/routes/Host.tsx`, replace `GameHostControls` and use the registry's `initialState` when starting:
```tsx
import { GAMES } from '../games/registry'
// replace start():
async function start(game: GameId) {
  const cfg = GAMES[game]
  const claimed = players.filter((p) => p.claimed_at)
  const init = cfg.initialState({ room: room!, players: claimed, answers: [], ttEntries: [] })
  await setActiveGame(room!.id, game, init)
}
// replace GameHostControls usage:
if (room.active_game) {
  const cfg = GAMES[room.active_game]
  const claimed = players.filter((p) => p.claimed_at)
  return <div style={{ padding: 16 }}>{cfg.renderHost({ room, players: claimed, answers, ttEntries })}</div>
}
```
(Add `answers, ttEntries` to `Host.tsx`'s `useRoom` destructure.)

- [ ] **Step 6: Verify the full quiz loop across three views**

Run `npm run dev`. Open `/screen`, `/host`, and join from 2 windows as two players. On host, click the Quiz card. Screen shows Q1 + countdown; both guests see option pills. Each guest taps an answer (and can change it). Host clicks "Cerrar y revelar" → screen highlights the correct option + count; correct guests see "¡Acertaste!"; their `score` increments in Supabase. Click "Siguiente" through to the last question → "Ver podio" shows top 3. "Volver al hub" returns host to the selector and guests to the waiting screen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add game registry contract and quiz game"
```

---

## Task 9: Y2K/Bratz aesthetic layer (tokens, fonts, background)

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, `index.html`

- [ ] **Step 1: Add Google Fonts to `index.html`**

In `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Quicksand:wght@500;700;800&display=swap" rel="stylesheet">
<title>Rocío 30 💖</title>
```

- [ ] **Step 2: Fill `src/styles/tokens.css`**

```css
:root {
  --pink-hot: #FF4FB6;
  --pink-bubble: #FFB6D9;
  --pink-pale: #FFE4F1;
  --purple-y2k: #B86CD9;
  --orange-glow: #FF9E5E;
  --cream: #FFF6EE;
  --ink: #5A2A4A;
  --font-display: 'Baloo 2', sans-serif;
  --font-body: 'Quicksand', sans-serif;
}
```

- [ ] **Step 3: Fill `src/styles/global.css`**

```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; min-height: 100%; }
body {
  font-family: var(--font-body);
  color: var(--ink);
  background: linear-gradient(135deg, #FFE4F1 0%, #FFB6D9 45%, #B86CD9 80%, #FF9E5E 100%);
  background-attachment: fixed;
}
h1, h2, h3 { font-family: var(--font-display); }
button { font-family: var(--font-body); }
```

- [ ] **Step 4: Verify aesthetic applied**

Run `npm run dev`. Every route now sits on the pink→lila→naranja gradient; titles use Baloo 2, body uses Quicksand. Confirm on `/screen`, `/join`, `/play`, `/host`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: apply Y2K/Bratz tokens, fonts, and gradient background"
```

---

## Task 10: Most-Likely game

**Files:**
- Create: `src/content/most_likely.json`
- Modify: `src/games/mostLikely.tsx` (replace stub)

- [ ] **Step 1: Create `src/content/most_likely.json`**

```json
[
  "¿Quién es más probable que se quede dormido en la fiesta?",
  "¿Quién es más probable que termine viviendo en otro país?",
  "¿Quién es más probable que se olvide su propio cumpleaños?"
]
```

- [ ] **Step 2: Replace `src/games/mostLikely.tsx`**

```tsx
import promptData from '../content/most_likely.json'
import type { GameConfig } from './registry'
import { PlayerTile } from '../components/ui/PlayerTile'
import { PillButton } from '../components/ui/PillButton'
import { patchGameState, submitAnswer } from '../lib/actions'
import { HostBackToHub } from './quiz'

const PROMPTS = promptData as string[]
function roundKey(i: number) { return `ml:${i}` }

export const mostLikelyGame: GameConfig = {
  id: 'most_likely',
  initialState: () => ({ prompt_index: 0, round_key: roundKey(0), phase: 'voting' }),

  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    const votes = answers.filter((a) => a.round_key === roundKey(i))
    const tally: Record<string, number> = {}
    votes.forEach((v) => { tally[v.value] = (tally[v.value] ?? 0) + 1 })
    const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
    const winner = players.find((p) => p.id === winnerId)
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>{PROMPTS[i]}</h2>
        {gs.phase === 'voting'
          ? <p style={{ color: '#5A2A4A', fontSize: 24 }}>{votes.length} votos…</p>
          : winner && (
            <div style={{ marginTop: 20 }}>
              <PlayerTile player={winner} size={140} />
              <div style={{ marginTop: 16, maxWidth: 400, margin: '16px auto' }}>
                {players.filter((p) => tally[p.id]).sort((a, b) => tally[b.id] - tally[a.id]).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 60, color: '#5A2A4A', fontWeight: 700 }}>{p.name}</span>
                    <div style={{ height: 18, borderRadius: 9, background: '#FF4FB6',
                      width: `${(tally[p.id] / votes.length) * 100}%`, minWidth: 18 }} />
                    <span style={{ color: '#5A2A4A' }}>{tally[p.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    )
  },

  renderGuest: ({ room, answers, players, me }) => {
    if (!me) return null
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    if (gs.phase === 'revealing') return <div style={{ padding: 24, textAlign: 'center' }}>Mirá la pantalla 👀</div>
    const myVote = answers.find((a) => a.round_key === roundKey(i) && a.player_id === me.id)
    return (
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {players.map((p) => (
          <PlayerTile key={p.id} player={p} size={86} selected={myVote?.value === p.id}
            onClick={() => submitAnswer(room.id, me.id, 'most_likely', roundKey(i), p.id)} />
        ))}
      </div>
    )
  },

  renderHost: ({ room }) => {
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    const last = i >= PROMPTS.length - 1
    async function close() { await patchGameState(room.id, gs, { phase: 'revealing' }) }
    async function next() {
      if (last) return
      const ni = i + 1
      await patchGameState(room.id, gs, { prompt_index: ni, round_key: roundKey(ni), phase: 'voting' })
    }
    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        <p style={{ color: '#5A2A4A' }}>Prompt {i + 1}/{PROMPTS.length} · {gs.phase}</p>
        {gs.phase === 'voting' && <PillButton onClick={close}>Cerrar votación</PillButton>}
        {gs.phase === 'revealing' && !last && <PillButton onClick={next}>Siguiente</PillButton>}
        {gs.phase === 'revealing' && last && <HostBackToHub room={room} />}
      </div>
    )
  },
}
```

- [ ] **Step 3: Verify most-likely loop**

Run `npm run dev`. Host selects the Most-Likely card. Screen shows prompt 1 + live vote count. Each guest taps a player tile (including themselves — allowed). Host clicks "Cerrar votación" → screen shows the most-voted player big + count bars. "Siguiente" advances; on the last prompt, "Volver al hub" works. Confirm no scores change (this game is social-only).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add most-likely voting game"
```

---

## Task 11: Two-Truths game

**Files:**
- Modify: `src/games/twoTruths.tsx` (replace stub)
- Create: `src/lib/tt.ts` (writing helper + shuffle)

- [ ] **Step 1: Create `src/lib/tt.ts`**

```ts
import { supabase } from './supabase'

export async function saveTtEntry(
  roomId: string, playerId: string, statements: [string, string, string], lieIndex: number,
): Promise<void> {
  await supabase.from('two_truths_entries').upsert(
    { room_id: roomId, player_id: playerId, statements, lie_index: lieIndex },
    { onConflict: 'player_id' },
  )
}

/** Deterministic shuffle of [0,1,2] from a seed so screen+host agree on display order. */
export function shuffleOrder(seed: number): number[] {
  const arr = [0, 1, 2]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * (i + 7) + 13) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

- [ ] **Step 2: Replace `src/games/twoTruths.tsx`**

```tsx
import { useState } from 'react'
import type { GameConfig } from './registry'
import type { Player } from '../lib/types'
import { PillButton } from '../components/ui/PillButton'
import { PlayerTile } from '../components/ui/PlayerTile'
import { patchGameState, submitAnswer, addScores } from '../lib/actions'
import { saveTtEntry, shuffleOrder } from '../lib/tt'
import { HostBackToHub } from './quiz'

function roundKeyFor(playerId: string) { return `tt:${playerId}` }

export const twoTruthsGame: GameConfig = {
  id: 'two_truths',
  initialState: () => ({ phase: 'writing', done_player_ids: [] }),

  renderScreen: ({ room, players, ttEntries, answers }) => {
    const gs = room.game_state
    if (gs.phase === 'writing') {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>Cargá tus 3 frases ✍️</h2>
          <p style={{ fontSize: 28, color: '#5A2A4A' }}>{ttEntries.length} de {players.length} listos</p>
        </div>
      )
    }
    const current = players.find((p) => p.id === gs.current_player_id)
    const entry = ttEntries.find((e) => e.player_id === gs.current_player_id)
    if (!current || !entry) return <div style={{ padding: 40, color: '#5A2A4A' }}>Esperando…</div>
    const order = gs.shuffle ?? shuffleOrder(0)
    const votes = answers.filter((a) => a.round_key === roundKeyFor(current.id))
    const guessedRight = votes.filter((v) => v.value === entry.lie_index).length
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <PlayerTile player={current} size={110} />
        <div style={{ display: 'grid', gap: 12, maxWidth: 560, margin: '20px auto' }}>
          {order.map((si) => {
            const isLie = si === entry.lie_index
            const reveal = gs.phase === 'revealing'
            return (
              <div key={si} style={{
                padding: 18, borderRadius: 16, fontSize: 22, color: '#5A2A4A',
                background: reveal && isLie ? '#FF9E5E' : 'rgba(255,255,255,0.75)',
                boxShadow: '0 4px 0 rgba(90,42,74,0.2)',
              }}>{entry.statements[si]}{reveal && isLie ? '  ← mentira 🤥' : ''}</div>
            )
          })}
        </div>
        {gs.phase === 'revealing' && <p style={{ color: '#5A2A4A', fontSize: 24 }}>{guessedRight} la descubrieron</p>}
      </div>
    )
  },

  renderGuest: ({ room, answers, ttEntries, me }) => {
    if (!me) return null
    const gs = room.game_state
    if (gs.phase === 'writing') return <WriteForm roomId={room.id} me={me} done={!!ttEntries.find((e) => e.player_id === me.id)} />
    const current = gs.current_player_id
    if (current === me.id) return <div style={{ padding: 24, textAlign: 'center', fontSize: 26 }}>¡Es tu turno! Mirá la pantalla 👀</div>
    const entry = ttEntries.find((e) => e.player_id === current)
    if (!entry || gs.phase === 'revealing') return <div style={{ padding: 24, textAlign: 'center' }}>Mirá la pantalla 👀</div>
    const order = gs.shuffle ?? shuffleOrder(0)
    const myVote = answers.find((a) => a.round_key === roundKeyFor(current!) && a.player_id === me.id)
    return (
      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
        <p style={{ textAlign: 'center', color: '#5A2A4A' }}>¿Cuál es la mentira?</p>
        {order.map((si) => (
          <PillButton key={si} variant="ghost" selected={myVote?.value === si}
            onClick={() => submitAnswer(room.id, me.id, 'two_truths', roundKeyFor(current!), si)}>
            {entry.statements[si]}
          </PillButton>
        ))}
      </div>
    )
  },

  renderHost: ({ room, players, ttEntries, answers }) => {
    const gs = room.game_state
    const done = gs.done_player_ids ?? []

    async function startGuessing(p: Player) {
      const seed = (ttEntries.findIndex((e) => e.player_id === p.id) + 1) * 7
      await patchGameState(room.id, gs, {
        phase: 'guessing', current_player_id: p.id, shuffle: shuffleOrder(seed),
      })
    }
    async function reveal() {
      const cur = gs.current_player_id!
      const entry = ttEntries.find((e) => e.player_id === cur)
      if (!entry) return
      const deltas: Record<string, number> = {}
      const votes = answers.filter((a) => a.round_key === roundKeyFor(cur))
      votes.filter((v) => v.value === entry.lie_index).forEach((v) => { deltas[v.player_id] = 1 })
      const fooled = votes.filter((v) => v.value !== entry.lie_index).length
      if (fooled > 0) deltas[cur] = (deltas[cur] ?? 0) + fooled
      if (Object.keys(deltas).length) await addScores(deltas, players)
      await patchGameState(room.id, gs, { phase: 'revealing' })
    }
    async function nextPlayer() {
      const cur = gs.current_player_id!
      await patchGameState(room.id, gs, {
        phase: 'picking', current_player_id: null, done_player_ids: [...done, cur],
      })
    }

    if (gs.phase === 'writing' || gs.phase === 'picking' || gs.phase === 'init') {
      const remaining = players.filter((p) => ttEntries.find((e) => e.player_id === p.id) && !done.includes(p.id))
      return (
        <div style={{ padding: 20, display: 'grid', gap: 10 }}>
          <p style={{ color: '#5A2A4A' }}>{ttEntries.length}/{players.length} cargaron · elegí a quién le toca:</p>
          {remaining.map((p) => <PillButton key={p.id} variant="ghost" onClick={() => startGuessing(p)}>{p.name}</PillButton>)}
          {remaining.length === 0 && <HostBackToHub room={room} />}
        </div>
      )
    }
    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        {gs.phase === 'guessing' && <PillButton onClick={reveal}>Cerrar y revelar</PillButton>}
        {gs.phase === 'revealing' && <PillButton onClick={nextPlayer}>Siguiente jugador</PillButton>}
      </div>
    )
  },
}

function WriteForm({ roomId, me, done }: { roomId: string; me: Player; done: boolean }) {
  const [s, setS] = useState(['', '', ''])
  const [lie, setLie] = useState<number | null>(null)
  if (done) return <div style={{ padding: 24, textAlign: 'center', fontSize: 24 }}>¡Listo! Esperá tu turno 🎀</div>
  const ready = s.every((x) => x.trim()) && lie !== null
  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <p style={{ textAlign: 'center', color: '#5A2A4A' }}>2 verdades + 1 mentira. Marcá la mentira.</p>
      {s.map((val, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={val} placeholder={`Frase ${i + 1}`} onChange={(e) => {
            const n = [...s]; n[i] = e.target.value; setS(n)
          }} style={{ flex: 1, padding: 12, borderRadius: 12, border: '2px solid #FFB6D9', fontSize: 16 }} />
          <button onClick={() => setLie(i)} style={{
            padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: lie === i ? '#FF4FB6' : 'rgba(255,255,255,0.7)', color: lie === i ? '#fff' : '#5A2A4A',
          }}>mentira</button>
        </div>
      ))}
      <PillButton disabled={!ready} onClick={() => saveTtEntry(roomId, me.id, [s[0], s[1], s[2]], lie!)}>
        Guardar
      </PillButton>
    </div>
  )
}
```

- [ ] **Step 3: Verify two-truths loop**

Run `npm run dev`. Host selects the Two-Truths card. Each guest sees the write form, enters 3 statements, marks the lie, saves. Screen shows "X de N listos" climbing live. On host, pick a player → that player's celu shows "¡Es tu turno!", everyone else sees 3 vote buttons, screen shows the 3 statements. Guests vote. Host "Cerrar y revelar" → screen highlights the lie + count; correct guessers get +1, the author gets +1 per person fooled (check `players.score` in Supabase). "Siguiente jugador" returns to the picker. After everyone, "Volver al hub" works.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add two-truths game with live writing and turn-based guessing"
```

---

## Task 12: Global results podium + host controls

**Files:**
- Create: `src/components/Results.tsx`
- Modify: `src/routes/Screen.tsx`, `src/routes/Host.tsx`

- [ ] **Step 1: Create `src/components/Results.tsx`**

```tsx
import type { Player } from '../lib/types'
import { PlayerTile } from './ui/PlayerTile'
import { StarBadge } from './ui/StarBadge'

export function Results({ players }: { players: Player[] }) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const top = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Baloo 2', fontSize: 52, color: '#5A2A4A',
        textShadow: '3px 3px 0 rgba(255,255,255,0.6)' }}>Ranking final 🏆</h1>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 28, marginTop: 24 }}>
        {top.map((p, i) => (
          <div key={p.id} style={{ transform: i === 0 ? 'scale(1.15)' : 'none' }}>
            <div style={{ fontSize: 40 }}>{['🥇', '🥈', '🥉'][i]}</div>
            <PlayerTile player={p} size={120} />
            <div style={{ marginTop: 6 }}><StarBadge value={p.score} /></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, color: '#5A2A4A' }}>
        {rest.map((p, i) => <div key={p.id}>{i + 4}. {p.name} — {p.score} pts</div>)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Show results on the Big Screen when `phase==='results'`**

In `src/routes/Screen.tsx`, add near the top of the render (after `room` is loaded):
```tsx
import { Results } from '../components/Results'
// ...
if (room && room.phase === 'results') {
  const claimed = players.filter((p) => p.claimed_at)
  return <Results players={claimed} />
}
```

- [ ] **Step 3: Add "Cerrar la noche" + "Reiniciar" controls to the Host lobby**

In `src/routes/Host.tsx`, inside the `phase === 'lobby'` block (below the SeedPanel), add:
```tsx
import { setPhase, resetScores } from '../lib/actions'
// ...
<div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
  <PillButton onClick={() => setPhase(room!.id, 'results')}>Cerrar la noche · ranking final 🏆</PillButton>
  <PillButton variant="ghost" onClick={async () => {
    if (confirm('¿Reiniciar puntajes a 0?')) await resetScores(room!.id)
  }}>Reiniciar puntajes</PillButton>
</div>
```
(Import `PillButton` in `Host.tsx` if not already.)

- [ ] **Step 4: Add a "Volver al lobby" control when in results**

In `src/routes/Host.tsx`, before the lobby block, handle results phase:
```tsx
if (room.phase === 'results') {
  return (
    <div style={{ padding: 20 }}>
      <PillButton onClick={() => setPhase(room!.id, 'lobby')}>Volver al lobby</PillButton>
    </div>
  )
}
```

- [ ] **Step 5: Verify results flow**

Run `npm run dev`. Play a couple of quiz/two-truths rounds so scores accrue. On host lobby, click "Cerrar la noche" → Big Screen shows the final ranking podium with top 3 scaled + star badges and a numbered tail. Host can "Volver al lobby". "Reiniciar puntajes" sets all scores to 0 (verify on screen + Supabase).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add global results podium and host close/reset controls"
```

---

## Task 13: Final polish + multi-device dress rehearsal

**Files:**
- Modify: `README.md` (create), various (only if issues found)

- [ ] **Step 1: Write `README.md` with run/deploy/party-day instructions**

```markdown
# Rocío 30 — Party Game Hub

Mobile-first realtime party hub (Vite + React + Supabase). Fixed room: `ROCIO30`.

## Setup
1. `npm install`
2. Copy `.env.example` → `.env.local`, fill Supabase URL + anon key.
3. Apply `supabase/schema.sql` to the Supabase project (once).
4. `npm run dev`

## Add the real guests
1. Drop AI photos in `public/players/<slug>.jpg` (one per guest).
2. Edit `src/content/players.json` with `{ "slug", "name" }` per guest.
3. On `/host/ROCIO30`, click **Seed players from roster**.

## Roles on party night
- **Big Screen** (laptop → TV): open `/screen/ROCIO30` (shows the QR).
- **Host** (Rocío's phone): open `/host/ROCIO30`.
- **Guests**: scan the QR → `/join/ROCIO30` → tap their face.

## Content to edit before the party
- `src/content/quiz.json` — 15–20 questions about Rocío.
- `src/content/most_likely.json` — prompts.

## Reminders
- Reactivate the Supabase project from the dashboard if it paused (free tier pauses after 7 days idle).
- Have mobile-data backup in case the house WiFi is flaky.
```

- [ ] **Step 2: Build for production to catch type/build errors**

Run: `npm run build`
Expected: a clean build into `dist/` with no TypeScript errors. Fix any that appear.

- [ ] **Step 3: Multi-device dress rehearsal**

Run `npm run dev -- --host` (exposes the LAN URL). From the laptop open `/screen/ROCIO30`; from 2–3 phones on the same WiFi open the LAN `/join/ROCIO30` URL and join. Play one full round of each of the 3 games end-to-end, then close the night to the podium. Watch for: faces appearing live, answers/votes registering within ~1s, correct scoring, no stuck phases. Note any glitches and fix.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add README and finalize party-ready build"
```

---

## Self-Review Notes (verification against spec)

- **§4 routes** → Tasks 1, 6, 7 (all 5 routes; `/` redirects to fixed room).
- **§5 data model** → Task 2 (rooms/players/answers/two_truths_entries + RLS + realtime publication); static content in Tasks 3, 8, 10.
- **§6 engine** (state machine, generic loop, config-per-game, `game_state`, timer, claim) → Tasks 4, 5, 6, 7, 8.
- **§7.1 quiz** (+1 fixed, 20s timer, reveal, podium) → Task 8.
- **§7.2 most-likely** (vote all players, self-vote allowed, bars, no scoring) → Task 10.
- **§7.3 two-truths** (live writing, turn-based, author doesn't vote, +1 guessers / +1-per-fooled author) → Task 11.
- **§7.4 global results** (accumulated podium) → Task 12.
- **§8 RLS laxa** → Task 2.
- **§9 aesthetic** (tokens, fonts, pill/star/gamecard/playertile/sparkles, photo workflow) → Tasks 5, 9; seeding in Task 6.
- **§10 build order** → Task ordering mirrors the spec.
- **§11 risks** (reactivate Supabase, WiFi backup, reload→localStorage re-claim, photo placeholders) → Tasks 3, 13.

**Naming consistency check:** `roundKey` helpers are local per game (`quiz:i`, `ml:i`, `tt:playerId`) and never cross files. `HostBackToHub` is defined once in `quiz.tsx` and imported by `mostLikely.tsx`/`twoTruths.tsx`. `addScores(deltas, players)`, `patchGameState(roomId, current, patch)`, `submitAnswer(roomId, playerId, game, roundKey, value)` signatures are consistent across all usages. `GameContext` passes `players` as claimed-only in all three routes.
