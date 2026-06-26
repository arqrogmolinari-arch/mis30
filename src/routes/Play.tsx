import { useParams, useNavigate } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { getMyPlayerId } from '../lib/identity'
import { Sparkles } from '../components/ui/Sparkles'
import { GAMES } from '../games/registry'

export default function Play() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { room, players, answers, ttEntries, loading } = useRoom(code)
  const myId = getMyPlayerId()
  const me = players.find((p) => p.id === myId)

  if (loading || !room) return <Center>Cargando…</Center>

  if (!me) {
    return (
      <Center>
        <div>
          <div style={{ marginBottom: 16 }}>Volvé a entrar tocando tu foto 🎀</div>
          <button
            onClick={() => nav(`/join/${code}`)}
            style={{
              background: '#FF4FB6', color: 'white', border: 'none',
              borderRadius: 24, padding: '12px 28px', fontSize: 18,
              fontFamily: 'Quicksand, sans-serif', fontWeight: 800,
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            Elegir mi foto
          </button>
        </div>
      </Center>
    )
  }

  if (room.phase === 'lobby') {
    return <WaitingRoom name={me.name} />
  }

  if (room.phase === 'results') {
    return <Center>Ranking final 🏆<br />Mirá la pantalla 💖</Center>
  }

  if (room.active_game && room.phase === 'playing') {
    const cfg = GAMES[room.active_game]
    if (!cfg) return <Center>Esperando el próximo juego… 🎀</Center>
    const claimed = players.filter((p) => p.claimed_at)
    return <div style={{ minHeight: '100vh' }}>{cfg.renderGuest({ room, players: claimed, answers, ttEntries, me })}</div>
  }

  // Inconsistent state (phase=playing but no active_game)
  return <Center>Esperando el próximo juego… 🎀</Center>
}

const WAITING_GAMES = [
  { id: 'jeopardy', title: 'Jeopardy: ¿Quién conoce a Rocío?', emoji: '🎯', gradient: 'linear-gradient(135deg,#FF4FB6,#B86CD9)' },
  { id: 'most_likely', title: '¿Quién es más probable?', emoji: '🔮', gradient: 'linear-gradient(135deg,#FF9E5E,#FF4FB6)' },
  { id: 'two_truths', title: 'Dos verdades, una mentira', emoji: '🎭', gradient: 'linear-gradient(135deg,#B86CD9,#FFB6D9)' },
]

function WaitingRoom({ name }: { name: string }) {
  return (
    <div style={{ minHeight: '100vh', padding: '24px 14px 40px', position: 'relative' }}>
      <Sparkles />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A',
          textShadow: '2px 2px 0 rgba(255,255,255,0.6)',
          fontSize: 'clamp(22px, 6vw, 30px)', margin: '0 0 2px' }}>Hola {name} 💖</h1>
        <p style={{ textAlign: 'center', color: '#5A2A4A', opacity: 0.85,
          fontFamily: 'Baloo 2, sans-serif', fontSize: 'clamp(14px, 4vw, 17px)', margin: '0 0 20px' }}>
          Sala de espera · Ro va a abrir un juego 🔓
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {WAITING_GAMES.map((g) => (
            <div key={g.id} style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 24, background: g.gradient, padding: '24px 20px', minHeight: 150,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.5)',
                filter: 'grayscale(0.4)', opacity: 0.7,
              }}>
                <div style={{ fontSize: 52, filter: 'blur(0.4px)' }}>{g.emoji}</div>
                <div style={{
                  fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff',
                  textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(90,42,74,0.35)', textAlign: 'center',
                }}>{g.title}</div>
              </div>
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                background: 'rgba(90,42,74,0.18)', borderRadius: 24, backdropFilter: 'blur(1px)',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.92)', borderRadius: 999, width: 56, height: 56,
                  display: 'grid', placeItems: 'center', fontSize: 28,
                  boxShadow: '0 4px 0 rgba(90,42,74,0.2)',
                }}>🔒</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center',
      padding: 24, fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A', fontSize: 24, position: 'relative' }}>
      <Sparkles /><div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
