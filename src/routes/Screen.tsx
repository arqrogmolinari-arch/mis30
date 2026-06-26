import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useRoom } from '../lib/room'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Sparkles } from '../components/ui/Sparkles'
import { GAMES } from '../games/registry'
import { Results } from '../components/Results'
import { DEFAULT_ROOM } from '../lib/config'

export default function Screen() {
  const { code = DEFAULT_ROOM } = useParams()
  const { room, players, answers, ttEntries } = useRoom(code)
  const joinUrl = `${window.location.origin}/join`
  const claimed = players.filter((p) => p.claimed_at)

  if (room && room.phase === 'results') {
    return <Results players={claimed} />
  }

  if (room && room.active_game && room.phase === 'playing') {
    const cfg = GAMES[room.active_game]
    if (!cfg) return null
    return <div style={{ minHeight: '100vh' }}>{cfg.renderScreen({ room, players: claimed, answers, ttEntries })}</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 32, position: 'relative' }}>
      <Sparkles />
      <h1 style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: 'clamp(48px, 10vw, 76px)', color: '#5A2A4A',
        letterSpacing: 2, textShadow: '3px 3px 0 rgba(255,255,255,0.7)', margin: '0 0 4px' }}>Rocío 30</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 20, marginTop: 8,
        border: '3px solid #5A2A4A', boxShadow: '0 6px 0 rgba(90,42,74,0.18)' }}>
        <QRCodeSVG value={joinUrl} size={200} />
      </div>
      <p style={{ color: '#5A2A4A', fontWeight: 700, marginTop: 12 }}>Escaneá para entrar · {joinUrl}</p>
      <p style={{ color: '#5A2A4A', fontWeight: 700, marginTop: 8 }}>{claimed.length} en sala</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginTop: 16,
        position: 'relative', zIndex: 1 }}>
        {claimed.map((p) => <PlayerTile key={p.id} player={p} size={90} />)}
      </div>
    </div>
  )
}

