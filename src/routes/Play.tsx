import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { getMyPlayerId } from '../lib/identity'
import { Sparkles } from '../components/ui/Sparkles'
import { Loading } from '../components/ui/Loading'
import { WaitingGame } from '../components/ui/WaitingGame'
import { PillButton } from '../components/ui/PillButton'
import { GAMES } from '../games/registry'
import { DEFAULT_ROOM } from '../lib/config'

export default function Play() {
  const { code = DEFAULT_ROOM } = useParams()
  const nav = useNavigate()
  const { room, players, answers, ttEntries, loading } = useRoom(code)
  const myId = getMyPlayerId()
  const me = players.find((p) => p.id === myId)

  if (loading || !room) return <Loading />

  if (!me) {
    return (
      <Center>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div>Volvé a entrar tocando tu foto</div>
          <PillButton onClick={() => nav('/join')}>Elegir mi foto</PillButton>
        </div>
      </Center>
    )
  }

  if (me.name === 'Ro') {
    return <Navigate to={`/host/${code}`} replace />
  }

  if (room.phase === 'lobby') {
    return <WaitingGame name={me.name} />
  }

  if (room.phase === 'results') {
    return <Center>Ranking final<br />Mirá la pantalla</Center>
  }

  if (room.active_game && room.phase === 'playing') {
    const cfg = GAMES[room.active_game]
    if (!cfg) return <Center>Esperando el próximo juego…</Center>
    const claimed = players.filter((p) => p.claimed_at)
    return <div style={{ minHeight: '100vh' }}>{cfg.renderGuest({ room, players: claimed, answers, ttEntries, me })}</div>
  }

  // Inconsistent state (phase=playing but no active_game)
  return <Center>Esperando el próximo juego…</Center>
}

export function WaitingRoom({ name }: { name: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center',
      padding: '24px 14px 40px', position: 'relative' }}>
      <Sparkles />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <h1 style={{ fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A',
          textShadow: '2px 2px 0 rgba(255,255,255,0.7)', letterSpacing: 1,
          fontSize: 'clamp(28px, 8vw, 42px)', margin: 0 }}>Hola {name}</h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              animation: 'heartFade 0.9s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}>
              <PixelHeart size={40} color="#FF4FB6" />
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 700, color: '#5A2A4A',
          opacity: 0.8, fontSize: 'clamp(15px, 4.5vw, 18px)', margin: 0 }}>
          Esperando que comience la partida
        </p>
      </div>
      <style>{`@keyframes heartFade {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }`}</style>
    </div>
  )
}

/** Corazón pixel-art reutilizable (en vez de emoji). */
export function PixelHeart({ size = 24, color = '#FF4FB6' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 9 8" width={size} height={size} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <g fill={color}>
        <rect x="1" y="0" width="2" height="1" />
        <rect x="5" y="0" width="2" height="1" />
        <rect x="0" y="1" width="4" height="1" />
        <rect x="5" y="1" width="4" height="1" />
        <rect x="0" y="2" width="9" height="1" />
        <rect x="0" y="3" width="9" height="1" />
        <rect x="1" y="4" width="7" height="1" />
        <rect x="2" y="5" width="5" height="1" />
        <rect x="3" y="6" width="3" height="1" />
        <rect x="4" y="7" width="1" height="1" />
      </g>
    </svg>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center',
      padding: 24, fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A', fontSize: 26, position: 'relative' }}>
      <Sparkles /><div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
