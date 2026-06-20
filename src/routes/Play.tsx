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
