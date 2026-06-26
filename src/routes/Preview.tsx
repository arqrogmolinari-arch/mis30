// Ruta TEMPORAL de preview de diseño (no se usa en la fiesta).
// Sirve para ver las pantallas sin tener que jugar una partida entera.
//   /preview/loading   → sala de espera del invitado
//   /preview/host      → panel del host en Jeopardy (eligiendo pregunta)
//   /preview/jeopardy  → vista del invitado dentro de Jeopardy (capitán eligiendo)
//   /preview/podium    → podio final
// Borrar Preview.tsx + sus rutas en App.tsx cuando no haga falta.
import { Sparkles } from '../components/ui/Sparkles'
import { WaitingRoom } from './Play'
import { jeopardyGame, TeamPodium } from '../games/jeopardy/index'
import { SetupPanel } from '../games/jeopardy/setup'
import { TEAM_COLORS } from '../games/jeopardy/utils'
import type { GameContext } from '../games/registry'
import type { JeopardyTeam, Player, Room } from '../lib/types'

const MOCK_TEAMS: JeopardyTeam[] = [
  { id: 'team-1', name: 'Equipo 1', color: TEAM_COLORS[0], member_ids: ['a', 'b'], captain_id: 'a', score: 1200 },
  { id: 'team-2', name: 'Equipo 2', color: TEAM_COLORS[1], member_ids: ['c', 'd'], captain_id: 'c', score: 900 },
  { id: 'team-3', name: 'Equipo 3', color: TEAM_COLORS[2], member_ids: ['e', 'f'], captain_id: 'e', score: 600 },
  { id: 'team-4', name: 'Equipo 4', color: TEAM_COLORS[3], member_ids: ['g', 'h'], captain_id: 'g', score: 300 },
]

const mockPlayer = (id: string, name: string): Player => ({
  id, room_id: 'preview', slug: id, name, photo: '', claimed_at: '2026-01-01', score: 0,
})

const MOCK_PLAYERS: Player[] = [
  mockPlayer('a', 'Rocío'), mockPlayer('b', 'Marce'),
  mockPlayer('c', 'Juli'), mockPlayer('d', 'Lu'),
  mockPlayer('e', 'Caro'), mockPlayer('f', 'Vale'),
  mockPlayer('g', 'Belén'), mockPlayer('h', 'Sofi'),
  mockPlayer('i', 'Nico'), mockPlayer('j', 'Tomi'),
]

// Equipos de demo ya armados, con capitanes elegidos (id en captain_id).
// 'i' y 'j' quedan sin asignar para mostrar la fila "Sin equipo" con los botones 1–4.
const DEMO_SETUP_TEAMS: JeopardyTeam[] = [
  { id: 'team-1', name: 'Equipo 1', color: TEAM_COLORS[0], member_ids: ['a', 'b'], captain_id: 'a', score: 0 },
  { id: 'team-2', name: 'Equipo 2', color: TEAM_COLORS[1], member_ids: ['c', 'd'], captain_id: 'c', score: 0 },
  { id: 'team-3', name: 'Equipo 3', color: TEAM_COLORS[2], member_ids: ['e', 'f'], captain_id: 'e', score: 0 },
  { id: 'team-4', name: 'Equipo 4', color: TEAM_COLORS[3], member_ids: ['g', 'h'], captain_id: 'g', score: 0 },
]

// Tablero con algunas celdas ya jugadas, para que se vea "en partida".
const PLAYED = new Set(['0-0', '1-0', '2-1', '0-2', '3-3'])
const MOCK_BOARD: boolean[][] = Array.from({ length: 6 }, (_, ci) =>
  Array.from({ length: 5 }, (_, vi) => PLAYED.has(`${ci}-${vi}`)),
)

const mockRoom: Room = {
  id: 'preview', code: 'PREVIEW', phase: 'playing', active_game: 'jeopardy',
  teams: MOCK_TEAMS,
  game_state: {
    phase: 'picking',
    current_team_index: 0,
    board: MOCK_BOARD,
    active_q: null,
    steal_open: false,
    overrides: {},
  },
}

const baseCtx: Omit<GameContext, 'me'> = {
  room: mockRoom, players: MOCK_PLAYERS, answers: [], ttEntries: [],
}

function Frame({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', padding: '24px 12px' }}>
      <Sparkles />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: narrow ? 480 : 900, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}

export default function Preview() {
  const path = window.location.pathname

  if (path.endsWith('/loading')) return <WaitingRoom name="Rocío" />

  if (path.endsWith('/host')) {
    return <Frame narrow>{jeopardyGame.renderHost(baseCtx as GameContext)}</Frame>
  }

  if (path.endsWith('/setup')) {
    // Panel "Armar equipos" del host, ya poblado con capitanes y 2 sin asignar.
    const setupCtx: GameContext = {
      ...baseCtx,
      room: { ...mockRoom, game_state: { ...mockRoom.game_state, phase: 'setup' } },
    }
    return <Frame narrow><SetupPanel ctx={setupCtx} initialTeams={DEMO_SETUP_TEAMS} /></Frame>
  }

  if (path.endsWith('/jeopardy')) {
    // me = capitán del Equipo 1 (cuyo turno es) → ve el tablero interactivo
    const ctx: GameContext = { ...baseCtx, me: MOCK_PLAYERS[0] }
    return <Frame narrow>{jeopardyGame.renderGuest(ctx)}</Frame>
  }

  if (path.endsWith('/answer')) {
    // El capitán ya eligió categoría + puntaje → fase de responder.
    const answerRoom: Room = {
      ...mockRoom,
      game_state: {
        ...mockRoom.game_state,
        phase: 'answering',
        active_q: { cat_i: 0, val_i: 0 },
        timer_ends_at: new Date(Date.now() + 45_000).toISOString(),
      },
    }
    const ctx: GameContext = { ...baseCtx, room: answerRoom, me: MOCK_PLAYERS[0] }
    return <Frame narrow>{jeopardyGame.renderGuest(ctx)}</Frame>
  }

  // por defecto: podio
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', position: 'relative' }}>
      <Sparkles />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <TeamPodium teams={MOCK_TEAMS} />
      </div>
    </div>
  )
}
