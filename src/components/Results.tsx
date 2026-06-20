import type { Player } from '../lib/types'
import { PlayerTile } from './ui/PlayerTile'
import { StarBadge } from './ui/StarBadge'

export function Results({ players }: { players: Player[] }) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const top = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Baloo 2', fontSize: 52, color: '#5A2A4A',
        textShadow: '3px 3px 0 rgba(255,255,255,0.6)' }}>Ranking final 🏆</h1>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 28, marginTop: 24 }}>
        {top.map((p, i) => (
          <div key={p.id} style={{ transform: i === 0 ? 'scale(1.15)' : 'none' }}>
            <div style={{ fontSize: 40 }}>{['🥇', '🥈', '🥉'][i]}</div>
            <PlayerTile player={p} size={120} />
            <div style={{ marginTop: 6 }}><StarBadge value={p.score} /></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, color: '#5A2A4A' }}>
        {rest.map((p, i) => <div key={p.id}>{i + 4}. {p.name} — {p.score} pts</div>)}
      </div>
    </div>
  )
}
