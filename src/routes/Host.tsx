import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { setActiveGame, setPhase, resetScores, clearGameData, patchGameState } from '../lib/actions'
import { GameCard } from '../components/ui/GameCard'
import { PillButton } from '../components/ui/PillButton'
import { SeedPanel } from '../components/seed/SeedPanel'
import { Loading } from '../components/ui/Loading'
import type { GameId } from '../lib/types'
import { GAMES } from '../games/registry'
import { DEFAULT_ROOM } from '../lib/config'

const GAME_LIST: { id: GameId; title: string; gradient: string }[] = [
  { id: 'jeopardy', title: 'Jeopardy: ¿Quién conoce a Rocío?', gradient: 'linear-gradient(135deg,#FF4FB6,#C58BE0)' },
  // Por ahora solo Jeopardy. Los otros dos juegos quedan comentados para retomarlos luego.
  // { id: 'most_likely', title: '¿Quién es más probable?', gradient: 'linear-gradient(135deg,#FF9E5E,#FF4FB6)' },
  // { id: 'two_truths', title: 'Dos verdades, una mentira', gradient: 'linear-gradient(135deg,#C58BE0,#FFB6D9)' },
]

export default function Host() {
  const { code = DEFAULT_ROOM } = useParams()
  const { room, players, answers, ttEntries, loading } = useRoom(code)
  if (loading) return <Loading />
  if (!room) return <div style={{ padding: 40, fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A' }}>Sala no encontrada.</div>

  async function start(game: GameId) {
    const cfg = GAMES[game]
    const claimed = players.filter((p) => p.claimed_at)
    await clearGameData(room!.id, game)  // fresh slate so a replay doesn't score stale answers
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
            onClick={() => patchGameState(room!.id, room!.game_state, { phase: 'finished' })}
            style={{
              background: '#fff', border: '2.5px solid #5A2A4A',
              color: '#5A2A4A', borderRadius: 999, padding: '6px 18px',
              cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
              fontWeight: 700, fontSize: 13, touchAction: 'manipulation',
            }}
          >
            Cerrar juego
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

  // Inconsistent state (phase=playing but no active_game)
  return (
    <div style={{ padding: 20, display: 'grid', gap: 12 }}>
      <p style={{ color: '#5A2A4A', margin: 0 }}>Estado inesperado — volvé al hub para continuar.</p>
      <PillButton onClick={() => setPhase(room!.id, 'lobby')}>Volver al hub</PillButton>
    </div>
  )
}
