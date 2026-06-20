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
