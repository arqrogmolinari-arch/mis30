import type { JeopardyTeam } from '../../lib/types'
import { POINT_VALUES } from './utils'

export interface JCategory {
  name: string
  questions: { value: number; q: string; a: string; accept: string[] }[]
}

interface BoardProps {
  categories: JCategory[]
  board: boolean[][]
  teams: JeopardyTeam[]
  currentTeamIndex: number
  onPick?: (catI: number, valI: number) => void
  interactive?: boolean
}

export function JeopardyBoard({
  categories, board, teams, currentTeamIndex, onPick, interactive = false,
}: BoardProps) {
  const ct = teams[currentTeamIndex]

  return (
    <div>
      {ct && (
        <p style={{
          textAlign: 'center', fontFamily: 'Pixelify Sans, sans-serif',
          fontWeight: 800, color: '#5A2A4A', fontSize: 16, margin: '0 0 10px',
        }}>
          Turno: <span style={{ color: ct.color }}>{ct.name}</span>
          {interactive ? ' — elegí una pregunta' : ''}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
        gap: 5, padding: '0 4px',
      }}>
        {categories.map((cat, ci) => (
          <div key={ci} style={{
            textAlign: 'center', fontFamily: 'Pixelify Sans, sans-serif',
            fontWeight: 800, fontSize: 11, color: '#5A2A4A',
            padding: '6px 2px', background: 'rgba(255,255,255,0.6)',
            borderRadius: 7,
          }}>
            {cat.name}
          </div>
        ))}

        {POINT_VALUES.map((val, vi) =>
          categories.map((_, ci) => {
            const played = board[ci]?.[vi] ?? false
            const tappable = interactive && !played
            return (
              <button
                key={`${ci}-${vi}`}
                disabled={!tappable}
                onClick={() => tappable && onPick?.(ci, vi)}
                style={{
                  padding: '14px 2px', borderRadius: 9, border: 'none',
                  cursor: tappable ? 'pointer' : 'default',
                  background: played
                    ? 'rgba(90,42,74,0.07)'
                    : `linear-gradient(135deg,${ct?.color ?? '#FF4FB6'},#B86CD9)`,
                  color: played ? 'transparent' : 'white',
                  fontWeight: 800, fontSize: 18,
                  fontFamily: 'Pixelify Sans, sans-serif',
                  boxShadow: played ? 'none' : '0 3px 0 rgba(0,0,0,0.12)',
                }}
              >
                {played ? '' : val}
              </button>
            )
          }),
        )}
      </div>

      {teams.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {teams.map((t, ti) => (
            <div key={t.id} style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: 10,
              padding: '5px 12px',
              borderBottom: `3px solid ${t.color}`,
              opacity: ti === currentTeamIndex ? 1 : 0.55,
            }}>
              <div style={{ fontWeight: 800, color: '#5A2A4A', fontSize: 12 }}>{t.name}</div>
              <div style={{ fontWeight: 800, color: t.color, fontSize: 20, textAlign: 'center' }}>{t.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
