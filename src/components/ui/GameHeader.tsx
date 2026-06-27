import { useState } from 'react'
import type { JeopardyTeam } from '../../lib/types'

interface GameHeaderProps {
  myTeam: JeopardyTeam
  teams: JeopardyTeam[]
}

export function GameHeader({ myTeam, teams }: GameHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const sorted = [...teams].sort((a, b) => b.score - a.score)

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#FF4FB6', height: 44,
        padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{
            fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
            fontSize: 15, color: 'white',
          }}>{myTeam.name}</span>
          <span style={{
            fontFamily: 'Quicksand, sans-serif', fontWeight: 600,
            fontSize: 12, color: 'rgba(255,255,255,0.65)',
          }}>{myTeam.score} pts</span>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
          aria-label="Ver puntajes"
        >
          <TrophyIcon />
        </button>
      </div>

      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: '20px 24px',
              width: '100%', maxWidth: 320,
              boxShadow: '0 8px 32px rgba(90,42,74,0.18)',
            }}
          >
            <div style={{
              fontFamily: 'Pixelify Sans, sans-serif', color: '#5A2A4A',
              fontSize: 20, fontWeight: 600, marginBottom: 16, textAlign: 'center',
            }}>
              Resultados parciales
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: t.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
                    color: '#5A2A4A', fontSize: 15, flex: 1,
                  }}>{t.name}</span>
                  <span style={{
                    fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600,
                    color: t.color, fontSize: 22,
                  }}>{t.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4H4a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4" />
      <path d="M17 4h3a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4" />
      <path d="M7 4h10v7a5 5 0 0 1-10 0V4z" />
      <path d="M12 16v4" />
      <path d="M8 20h8" />
    </svg>
  )
}
