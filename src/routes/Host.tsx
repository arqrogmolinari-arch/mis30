import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { setActiveGame, setPhase, resetScores } from '../lib/actions'
import { GameCard } from '../components/ui/GameCard'
import { PillButton } from '../components/ui/PillButton'
import { SeedPanel } from '../components/seed/SeedPanel'
import type { GameId } from '../lib/types'
import { GAMES } from '../games/registry'

const GAME_LIST: { id: GameId; title: string; emoji: string; gradient: string }[] = [
  { id: 'quiz', title: '¿Quién conoce a Rocío?', emoji: '🎤', gradient: 'linear-gradient(135deg,#FF4FB6,#B86CD9)' },
  { id: 'most_likely', title: '¿Quién es más probable?', emoji: '🔮', gradient: 'linear-gradient(135deg,#FF9E5E,#FF4FB6)' },
  { id: 'two_truths', title: 'Dos verdades, una mentira', emoji: '🎭', gradient: 'linear-gradient(135deg,#B86CD9,#FFB6D9)' },
]

export default function Host() {
  const { code = '' } = useParams()
  const { room, players, answers, ttEntries } = useRoom(code)
  if (!room) return <div style={{ padding: 40 }}>Cargando…</div>

  async function start(game: GameId) {
    const cfg = GAMES[game]
    const claimed = players.filter((p) => p.claimed_at)
    const init = cfg.initialState({ room: room!, players: claimed, answers: [], ttEntries: [] })
    await setActiveGame(room!.id, game, init)
  }

  if (room.phase === 'results') {
    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        <PillButton onClick={() => setPhase(room!.id, 'lobby')}>Volver al lobby</PillButton>
      </div>
    )
  }

  if (room.phase === 'lobby') {
    return (
      <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A' }}>Panel · {players.filter(p => p.claimed_at).length} en sala</h1>
        <p style={{ color: '#5A2A4A' }}>Elegí un juego:</p>
        <div style={{ display: 'grid', gap: 14 }}>
          {GAME_LIST.map((g) => <GameCard key={g.id} {...g} onClick={() => start(g.id)} />)}
        </div>
        <SeedPanel room={room} />
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          <PillButton onClick={() => setPhase(room!.id, 'results')}>Cerrar la noche · ranking final 🏆</PillButton>
          <PillButton variant="ghost" onClick={async () => {
            if (confirm('¿Reiniciar puntajes a 0?')) await resetScores(room!.id)
          }}>Reiniciar puntajes</PillButton>
        </div>
      </div>
    )
  }

  if (room.active_game) {
    const cfg = GAMES[room.active_game]
    const claimed = players.filter((p) => p.claimed_at)
    return <div style={{ padding: 16 }}>{cfg.renderHost({ room, players: claimed, answers, ttEntries })}</div>
  }

  return null
}
