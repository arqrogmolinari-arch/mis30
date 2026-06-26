import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { claimPlayer } from '../lib/actions'
import { setMyPlayerId } from '../lib/identity'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Sparkles } from '../components/ui/Sparkles'
import { Loading } from '../components/ui/Loading'
import { DEFAULT_ROOM } from '../lib/config'

export default function Join() {
  const { code = DEFAULT_ROOM } = useParams()
  const nav = useNavigate()
  const { players, loading } = useRoom(code)
  const [search, setSearch] = useState('')

  function pick(playerId: string) {
    setMyPlayerId(playerId)
    // Navega ya; el claim corre en segundo plano (Supabase puede estar frío).
    // Play encuentra al jugador por id, no depende de claimed_at.
    claimPlayer(playerId).catch((e) => console.error('claim falló', e))
    nav('/play')
  }

  if (loading) return <Loading />

  const filtered = search.trim()
    ? players.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : players

  return (
    <div style={{ minHeight: '100vh', padding: '20px 12px 32px', position: 'relative' }}>
      <Sparkles />
      <h1 style={{ textAlign: 'center', fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A',
        textShadow: '2px 2px 0 rgba(255,255,255,0.7)', letterSpacing: 1,
        fontSize: 'clamp(28px, 8vw, 44px)', margin: '0 0 4px' }}>¿Quién sos?</h1>
      <p style={{ textAlign: 'center', color: '#5A2A4A', opacity: 0.85,
        fontSize: 'clamp(14px, 4vw, 17px)', margin: '0 0 12px' }}>Tocá tu foto para entrar</p>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 320, margin: '0 auto 16px' }}>
        <input
          type="search"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '11px 18px',
            borderRadius: 999, border: '2.5px solid #5A2A4A',
            background: 'rgba(255,255,255,0.9)',
            fontFamily: 'Quicksand, sans-serif', fontWeight: 600, fontSize: 15, color: '#5A2A4A',
            outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        position: 'relative', zIndex: 1 }}>
        {filtered.map((p) => (
          <PlayerTile key={p.id} player={p} onClick={() => pick(p.id)} />
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

