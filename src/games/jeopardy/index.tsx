import jeopardyData from '../../content/jeopardy.json'
import type { GameConfig } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { PillButton } from '../../components/ui/PillButton'
import { Countdown } from '../../components/ui/Countdown'
import { setActiveGame, patchGameState } from '../../lib/actions'
import { SetupPanel } from './setup'
import { JeopardyBoard } from './board'
import { AnsweringGuest, StealingGuest, RevealingScreen, RevealingHost } from './question'
import { jRoundKey, getMyTeam, isCaptain, isCorrect } from './utils'

const CATEGORIES = jeopardyData.categories

export function TeamPodium({ teams }: { teams: JeopardyTeam[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 40, color: '#5A2A4A',
        letterSpacing: 1, margin: '0 0 20px' }}>
        Podio final
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        {sorted.map((t, i) => (
          <div key={t.id} style={{
            background: 'rgba(255,255,255,0.85)', borderRadius: 14, border: '2.5px solid #5A2A4A',
            padding: '14px 20px', borderBottom: `5px solid ${t.color}`, minWidth: 90,
          }}>
            <div style={{
              width: 36, height: 36, margin: '0 auto 6px', borderRadius: '50%',
              display: 'grid', placeItems: 'center', border: '2px solid #5A2A4A',
              background: ['#FFD23F', '#E7D3DE', '#FFB07A', '#FFE4F1'][i] ?? '#FFE4F1',
              fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 18, color: '#5A2A4A',
            }}>{i + 1}</div>
            <div style={{ fontWeight: 700, color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 16 }}>{t.name}</div>
            <div style={{ fontWeight: 600, color: t.color, fontFamily: 'Pixelify Sans, sans-serif', fontSize: 28 }}>{t.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const jeopardyGame: GameConfig = {
  id: 'jeopardy',

  initialState: () => ({
    phase: 'setup',
    current_team_index: 0,
    board: Array.from({ length: CATEGORIES.length }, () => Array(5).fill(false)),
    active_q: null,
    steal_open: false,
    overrides: {},
  }),

  // ── BIG SCREEN ──────────────────────────────────────────────────────────────
  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase
    const board = gs.board ?? []

    if (phase === 'setup') {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Quicksand, sans-serif', fontSize: 28, color: '#5A2A4A' }}>
            El host está armando los equipos…
          </p>
        </div>
      )
    }

    if (phase === 'finished') return <TeamPodium teams={teams} />

    if (phase === 'picking') {
      return (
        <div style={{ padding: 12 }}>
          <JeopardyBoard
            categories={CATEGORIES} board={board}
            teams={teams} currentTeamIndex={gs.current_team_index ?? 0}
          />
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null
    const rk = jRoundKey(aq.cat_i, aq.val_i)
    const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>

    if (phase === 'answering' || phase === 'stealing') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.6)', borderRadius: 7,
            padding: '3px 12px', display: 'inline-block', marginBottom: 10,
            fontSize: 13, color: '#5A2A4A', fontWeight: 700,
          }}>
            {CATEGORIES[aq.cat_i].name} · {q.value} pts
            {phase === 'stealing' ? ' · ROBO' : ''}
          </div>
          <p style={{ fontFamily: 'Quicksand, sans-serif', fontSize: 32, color: '#5A2A4A', fontWeight: 800 }}>{q.q}</p>
          {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
          <p style={{ color: '#999', fontSize: 16, marginTop: 10 }}>
            {count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }

    if (phase === 'revealing') {
      const roundAnswers = answers.filter((a) => a.round_key === rk)
      const winnerTeamId = (() => {
        for (const ans of roundAnswers) {
          const ok = overrides[ans.player_id] != null
            ? overrides[ans.player_id] === 'correct'
            : isCorrect(String(ans.value), q.accept)
          if (ok) return teams.find((t) => t.member_ids.includes(ans.player_id))?.id ?? null
        }
        return null
      })()
      return (
        <RevealingScreen
          q={q} answers={answers} teams={teams}
          roundKey={rk} overrides={overrides}
          players={players} winnerTeamId={winnerTeamId}
        />
      )
    }

    return null
  },

  // ── GUEST ───────────────────────────────────────────────────────────────────
  renderGuest: (ctx) => {
    const { room, me } = ctx
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase

    if (phase === 'setup' || !me) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20 }}>
            El host está armando los equipos…
          </p>
        </div>
      )
    }

    if (phase === 'finished') {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 22, fontWeight: 800 }}>
            ¡Terminó! Mirá la pantalla
          </p>
        </div>
      )
    }

    const myTeam = getMyTeam(teams, me.id)
    const imCaptain = isCaptain(myTeam, me.id)
    const currentTeamIdx = gs.current_team_index ?? 0
    const myTeamIdx = teams.findIndex((t) => t.id === myTeam?.id)
    const isMyTeamTurn = myTeamIdx === currentTeamIdx
    const board = gs.board ?? []

    if (phase === 'picking') {
      if (isMyTeamTurn && imCaptain) {
        return (
          <div style={{ padding: 12 }}>
            <JeopardyBoard
              categories={CATEGORIES} board={board}
              teams={teams} currentTeamIndex={currentTeamIdx}
              interactive
              onPick={(ci, vi) => {
                patchGameState(room.id, gs, {
                  phase: 'answering',
                  active_q: { cat_i: ci, val_i: vi },
                  timer_ends_at: new Date(Date.now() + 60_000).toISOString(),
                  steal_open: false,
                })
              }}
            />
          </div>
        )
      }
      const ct = teams[currentTeamIdx]
      const captain = ct ? ctx.players.find((p) => p.id === ct.captain_id) : null
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontSize: 18 }}>
            Turno de <span style={{ fontWeight: 800, color: ct?.color }}>{ct?.name}</span>
          </p>
          {captain && <p style={{ color: '#999', fontSize: 14, marginTop: 4 }}>{captain.name} está eligiendo…</p>}
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null

    if (phase === 'answering') {
      return <AnsweringGuest ctx={ctx} catI={aq.cat_i} valI={aq.val_i} q={q} isMyTurn={isMyTeamTurn && imCaptain} />
    }
    if (phase === 'stealing') {
      return <StealingGuest ctx={ctx} catI={aq.cat_i} valI={aq.val_i} q={q} canSteal={imCaptain && !isMyTeamTurn} />
    }
    if (phase === 'revealing') {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800 }}>{q.q}</p>
          <div style={{
            background: '#5A2A4A', color: 'white', borderRadius: 12, padding: '8px 18px',
            display: 'inline-block', marginTop: 8,
            fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800,
          }}>{q.a}</div>
        </div>
      )
    }
    return null
  },

  // ── HOST ────────────────────────────────────────────────────────────────────
  renderHost: (ctx) => {
    const { room, answers } = ctx
    const gs = room.game_state
    const teams: JeopardyTeam[] = room.teams ?? []
    const phase = gs.phase

    if (phase === 'setup') return <SetupPanel ctx={ctx} />

    if (phase === 'finished') {
      return (
        <div style={{ padding: 16 }}>
          <TeamPodium teams={teams} />
          <PillButton onClick={() => setActiveGame(room.id, null, {})}>Volver al hub</PillButton>
        </div>
      )
    }

    const board = gs.board ?? []
    const currentTeamIdx = gs.current_team_index ?? 0
    const ct = teams[currentTeamIdx]

    if (phase === 'picking') {
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#5A2A4A', fontSize: 14, marginBottom: 8 }}>
            Turno de <strong style={{ color: ct?.color }}>{ct?.name}</strong> — esperando que el capitán elija
          </p>
          <JeopardyBoard categories={CATEGORIES} board={board} teams={teams} currentTeamIndex={currentTeamIdx} />
        </div>
      )
    }

    const aq = gs.active_q
    if (!aq) return null
    const q = CATEGORIES[aq.cat_i]?.questions[aq.val_i]
    if (!q) return null
    const rk = jRoundKey(aq.cat_i, aq.val_i)

    if (phase === 'answering') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#5A2A4A', fontWeight: 800, fontFamily: 'Quicksand, sans-serif' }}>{q.q}</p>
          <p style={{ color: '#999', fontSize: 13 }}>{count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}</p>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <PillButton onClick={() => patchGameState(room.id, gs, {
              phase: 'stealing', steal_open: true,
              timer_ends_at: new Date(Date.now() + 60_000).toISOString(),
            })}>Abrir robo</PillButton>
            <PillButton variant="ghost" onClick={() => patchGameState(room.id, gs, { phase: 'revealing' })}>
              Revelar
            </PillButton>
          </div>
        </div>
      )
    }

    if (phase === 'stealing') {
      const count = answers.filter((a) => a.round_key === rk).length
      return (
        <div style={{ padding: 16 }}>
          <p style={{ color: '#FF4FB6', fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 18, letterSpacing: 0.5 }}>Fase de robo</p>
          <p style={{ color: '#5A2A4A', fontWeight: 800 }}>{q.q}</p>
          <p style={{ color: '#999', fontSize: 13 }}>{count} respuesta{count !== 1 ? 's' : ''} recibida{count !== 1 ? 's' : ''}</p>
          <div style={{ marginTop: 10 }}>
            <PillButton onClick={() => patchGameState(room.id, gs, { phase: 'revealing' })}>Revelar</PillButton>
          </div>
        </div>
      )
    }

    if (phase === 'revealing') {
      const totalQ = board.flatMap((r) => r).length
      const played = board.flatMap((r) => r).filter(Boolean).length
      return (
        <RevealingHost
          ctx={ctx} catI={aq.cat_i} valI={aq.val_i}
          q={q} teams={teams}
          isLastQuestion={played === totalQ - 1}
        />
      )
    }

    return null
  },
}
