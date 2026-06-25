import { gradientFor, photoFor } from '../../lib/roster'
import type { Player } from '../../lib/types'

interface Props {
  player: Player
  size?: number  // fixed px — omit to fill the grid cell (mobile-first default)
  dim?: boolean
  selected?: boolean
  onClick?: () => void
}

export function PlayerTile({ player, size, dim, selected, onClick }: Props) {
  const fixed = size !== undefined
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        border: 'none', background: 'transparent', cursor: onClick ? 'pointer' : 'default',
        opacity: dim ? 0.4 : 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 5, padding: 0,
        width: fixed ? size : '100%',
        touchAction: 'manipulation',
      }}
    >
      <div style={{
        width: fixed ? size : '100%',
        height: fixed ? size : undefined,
        aspectRatio: fixed ? undefined : '1 / 1',
        borderRadius: 14, position: 'relative', flexShrink: 0,
        background: gradientFor(player.slug),
        boxShadow: selected
          ? '0 0 0 4px #FF4FB6, inset 0 0 0 3px rgba(255,255,255,0.8)'
          : 'inset 0 0 0 3px rgba(255,255,255,0.8), 0 4px 0 rgba(90,42,74,0.18)',
        overflow: 'hidden',
      }}>
        <img
          src={photoFor(player.slug)}
          alt={player.name}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <span style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 800, color: '#5A2A4A',
        fontSize: fixed ? 15 : 13, lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>
        {player.name}
      </span>
    </button>
  )
}
