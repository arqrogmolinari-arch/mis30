import { useParams } from 'react-router-dom'
import { useRoom } from '../lib/room'
import { Loading } from '../components/ui/Loading'
import { Countdown } from '../components/ui/Countdown'
import { JeopardyBoard } from '../games/jeopardy/board'
import { TeamPodium } from '../games/jeopardy/index'
import { isCorrect, jRoundKey } from '../games/jeopardy/utils'
import jeopardyData from '../content/jeopardy.json'
import { DEFAULT_ROOM } from '../lib/config'
import type { JeopardyTeam, GameState, Answer } from '../lib/types'

const CATEGORIES = jeopardyData.categories
const BAND_H = 120

// ── Score band ────────────────────────────────────────────────────────────────

function ScoreBand({ teams, currentTeamIndex }: { teams: JeopardyTeam[]; currentTeamIndex?: number }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: BAND_H,
      background: 'rgba(255,255,255,0.85)',
      borderTop: '2px solid rgba(90,42,74,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 40, padding: '0 48px',
    }}>
      {teams.map((t, i) => {
        const active = i === currentTeamIndex
        return (
          <div key={t.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 28px', borderRadius: 14,
            border: active ? `3px solid ${t.color}` : '3px solid transparent',
            boxShadow: active ? `0 0 20px ${t.color}55` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}>
            <div style={{
              color: '#5A2A4A',
              fontFamily: 'Quicksand, sans-serif', fontWeight: 700, fontSize: 22,
            }}>
              {t.name}
            </div>
            <div style={{
              color: t.color,
              fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 48,
              lineHeight: 1,
            }}>
              {t.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Jeopardy phase content ────────────────────────────────────────────────────

function JeopardyContent({ gs, teams, answers }: { gs: GameState; teams: JeopardyTeam[]; answers: Answer[] }) {
  const phase = gs.phase

  const centered = {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    height: '100%', textAlign: 'center' as const, padding: '40px 80px',
  }

  if (phase === 'setup') {
    return (
      <div style={centered}>
        <p style={{
          color: '#5A2A4A', fontFamily: 'Pixelify Sans, sans-serif',
          fontSize: 'clamp(32px,4vw,56px)', fontWeight: 600, margin: 0,
        }}>
          Preparando el juego…
        </p>
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div style={centered}>
        <TeamPodium teams={teams} />
      </div>
    )
  }

  if (phase === 'picking') {
    return (
      <div style={{ padding: '24px 40px' }}>
        <JeopardyBoard
          categories={CATEGORIES}
          board={gs.board ?? []}
          teams={teams}
          currentTeamIndex={gs.current_team_index ?? 0}
        />
      </div>
    )
  }

  const aq = gs.active_q
  if (!aq) return null
  const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
  if (!q) return null

  if (phase === 'answering' || phase === 'stealing') {
    return (
      <div style={centered}>
        <div style={{
          background: phase === 'stealing' ? '#FF4FB6' : 'rgba(255,255,255,0.7)',
          color: phase === 'stealing' ? '#fff' : '#5A2A4A',
          borderRadius: 999, padding: '4px 20px', marginBottom: 28,
          border: phase === 'stealing' ? 'none' : '2px solid rgba(90,42,74,0.15)',
          fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600,
          fontSize: 'clamp(16px,2vw,24px)', letterSpacing: 1,
        }}>
          {CATEGORIES[aq.cat_i].name} · {q.value} pts
          {phase === 'stealing' ? ' · ROBO' : ''}
        </div>
        <p style={{
          color: '#5A2A4A',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 800,
          fontSize: 'clamp(40px,5.5vw,80px)',
          lineHeight: 1.2, margin: '0 0 32px',
        }}>
          {q.q}
        </p>
        {gs.timer_ends_at && (
          <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
            <Countdown endsAt={gs.timer_ends_at} />
          </div>
        )}
      </div>
    )
  }

  if (phase === 'revealing') {
    const rk = jRoundKey(aq.cat_i, aq.val_i)
    const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>
    const roundAnswers = answers.filter((a) => a.round_key === rk)

    const winnerTeam = (() => {
      for (const ans of roundAnswers) {
        const ok = overrides[ans.player_id] != null
          ? overrides[ans.player_id] === 'correct'
          : isCorrect(String(ans.value), q.accept)
        if (ok) return teams.find((t) => t.member_ids.includes(ans.player_id)) ?? null
      }
      return null
    })()

    return (
      <div style={centered}>
        <p style={{
          color: '#5A2A4A',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
          fontSize: 'clamp(28px,3.5vw,52px)',
          lineHeight: 1.3, margin: '0 0 28px',
        }}>
          {q.q}
        </p>
        <div style={{
          background: '#5A2A4A', color: '#FFD6E7',
          borderRadius: 16, padding: '16px 48px',
          fontFamily: 'Quicksand, sans-serif', fontWeight: 800,
          fontSize: 'clamp(36px,5vw,72px)',
          boxShadow: '0 0 40px rgba(255,78,182,0.3)',
          marginBottom: 28,
        }}>
          {q.a}
        </div>
        {winnerTeam
          ? (
            <p style={{
              color: winnerTeam.color, fontWeight: 800,
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: 'clamp(24px,3vw,44px)', margin: 0,
            }}>
              +{q.value} pts → {winnerTeam.name}
            </p>
          )
          : (
            <p style={{
              color: 'rgba(90,42,74,0.45)',
              fontFamily: 'Quicksand, sans-serif', fontWeight: 700,
              fontSize: 'clamp(20px,2.5vw,36px)', margin: 0,
            }}>
              Nadie acertó
            </p>
          )
        }
      </div>
    )
  }

  return null
}

// ── Root component ────────────────────────────────────────────────────────────

export default function Presenter() {
  const { code = DEFAULT_ROOM } = useParams()
  const { room, answers, loading } = useRoom(code)

  if (loading) return <Loading />
  if (!room) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#5A2A4A', fontFamily: 'Pixelify Sans, sans-serif', fontSize: 32 }}>
          Sala no encontrada.
        </p>
      </div>
    )
  }

  const teams: JeopardyTeam[] = room.teams ?? []
  const gs = room.game_state

  const mainContent = (() => {
    if (!room.active_game || room.phase !== 'playing') {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', textAlign: 'center',
        }}>
          <p style={{
            color: '#5A2A4A', fontFamily: 'Pixelify Sans, sans-serif',
            fontSize: 'clamp(32px,4vw,56px)', fontWeight: 600, margin: 0,
          }}>
            ¡Ya empezamos!
          </p>
        </div>
      )
    }
    if (room.active_game === 'jeopardy') {
      return <JeopardyContent gs={gs} teams={teams} answers={answers} />
    }
    return null
  })()

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: BAND_H }}>
        {mainContent}
      </div>
      <ScoreBand teams={teams} currentTeamIndex={gs.current_team_index} />
    </div>
  )
}
