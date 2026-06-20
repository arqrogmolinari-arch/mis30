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
