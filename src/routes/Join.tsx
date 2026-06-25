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
    <div style={{ minHeight: '100vh', padding: '20px 12px 32px', position: 'relative' }}>
      <Sparkles />
      <h1 style={{ textAlign: 'center', fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A',
        textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(255,255,255,0.6)',
        fontSize: 'clamp(22px, 6vw, 32px)', margin: '0 0 4px' }}>¿Quién sos? 🎀</h1>
      <p style={{ textAlign: 'center', color: '#5A2A4A', opacity: 0.8,
        fontSize: 'clamp(14px, 4vw, 17px)', margin: '0 0 16px' }}>Tocá tu foto para entrar</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        position: 'relative', zIndex: 1 }}>
        {players.map((p) => (
          <PlayerTile key={p.id} player={p} dim={!!p.claimed_at} onClick={() => pick(p.id)} />
        ))}
      </div>
      {players.length === 0 && (
        <p style={{ textAlign: 'center', color: '#5A2A4A', marginTop: 24 }}>
          No hay jugadores cargados. La host debe correr el seed desde el panel (/host/{code}).
        </p>
      )}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center',
    fontFamily: 'Baloo 2, sans-serif', color: '#5A2A4A', fontSize: 24 }}>{children}</div>
}
