import { useState } from 'react'
import { PillButton } from '../../components/ui/PillButton'
import { Countdown } from '../../components/ui/Countdown'
import { submitAnswer, patchGameState, updateTeamScore } from '../../lib/actions'
import type { GameContext } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { isCorrect, jRoundKey } from './utils'
import type { JCategory } from './board'

type Q = JCategory['questions'][0]

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_CSS = `
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  75%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(900deg); opacity: 0; }
}
`

export function Confetti() {
  const COLORS = ['#FF4FB6', '#FFD23F', '#B86CD9', '#22c55e', '#60a5fa', '#ff7043', '#FFA0D4', '#A8E6CF']
  const pieces = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    left: `${((i * 13 + Math.floor(i / 8) * 5) % 96).toFixed(0)}%`,
    delay: `${(i % 14) * 0.12}s`,
    color: COLORS[i % COLORS.length],
    size: 7 + (i % 6),
    duration: `${2.3 + (i % 10) * 0.18}s`,
    isRect: i % 3 !== 0,
  }))

  return (
    <>
      <style>{CONFETTI_CSS}</style>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 100, overflow: 'hidden',
      }}>
        {pieces.map((p) => (
          <div key={p.id} style={{
            position: 'absolute', top: -20, left: p.left,
            width: p.size, height: p.isRect ? p.size * 1.8 : p.size,
            borderRadius: p.isRect ? 3 : '50%', background: p.color,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }} />
        ))}
      </div>
    </>
  )
}

// ── Answering: guest ──────────────────────────────────────────────────────────

export function AnsweringGuest({
  ctx, catI, valI, q, isMyTurn,
}: { ctx: GameContext; catI: number; valI: number; q: Q; isMyTurn: boolean }) {
  const { room, me } = ctx
  const gs = room.game_state
  const [text, setText] = useState('')
  const rk = jRoundKey(catI, valI)

  if (!isMyTurn) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800 }}>{q.q}</p>
        <p style={{ color: '#999', fontSize: 14, marginTop: 8 }}>Discutan entre el equipo</p>
        {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{q.q}</p>
      {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí la respuesta…"
        rows={2}
        style={{
          width: '100%', padding: 12, borderRadius: 12,
          border: '2px solid #B86CD9', fontFamily: 'inherit',
          fontSize: 16, resize: 'none', boxSizing: 'border-box', marginTop: 10,
        }}
      />
      <div style={{ marginTop: 8 }}>
        <PillButton
          disabled={!text.trim()}
          onClick={() => me && submitAnswer(room.id, me.id, 'jeopardy', rk, text.trim())}
        >
          Enviar ✓
        </PillButton>
      </div>
    </div>
  )
}

// ── Stealing: guest ───────────────────────────────────────────────────────────

export function StealingGuest({
  ctx, catI, valI, q, canSteal,
}: { ctx: GameContext; catI: number; valI: number; q: Q; canSteal: boolean }) {
  const { room, me } = ctx
  const gs = room.game_state
  const [text, setText] = useState('')
  const rk = jRoundKey(catI, valI)

  if (!canSteal) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#FF4FB6', fontWeight: 800, fontSize: 18 }}>¡Fase de robo!</p>
        <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800, marginTop: 6 }}>{q.q}</p>
        {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>Los capitanes intentan robar…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ color: '#FF4FB6', fontFamily: 'Quicksand, sans-serif', fontWeight: 800, fontSize: 18 }}>¡Intentá robar!</p>
      <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{q.q}</p>
      {gs.timer_ends_at && <Countdown endsAt={gs.timer_ends_at} />}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí la respuesta…"
        rows={2}
        style={{
          width: '100%', padding: 12, borderRadius: 12,
          border: '2px solid #FF4FB6', fontFamily: 'inherit',
          fontSize: 16, resize: 'none', boxSizing: 'border-box', marginTop: 10,
        }}
      />
      <div style={{ marginTop: 8 }}>
        <PillButton
          disabled={!text.trim()}
          onClick={() => me && submitAnswer(room.id, me.id, 'jeopardy', rk, text.trim())}
        >
          ¡Robar!
        </PillButton>
      </div>
    </div>
  )
}

// ── Revealing: big screen ─────────────────────────────────────────────────────

export function RevealingScreen({
  q, answers, teams, roundKey, overrides, players, winnerTeamId,
}: {
  q: Q; answers: GameContext['answers']; teams: JeopardyTeam[]
  roundKey: string; overrides: Record<string, 'correct' | 'incorrect'>
  players: GameContext['players']; winnerTeamId: string | null
}) {
  const roundAnswers = answers.filter((a) => a.round_key === roundKey)
  const winnerTeam = teams.find((t) => t.id === winnerTeamId)

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ color: '#5A2A4A', fontFamily: 'Quicksand, sans-serif', fontSize: 26, fontWeight: 800 }}>{q.q}</p>
      <div style={{
        background: '#5A2A4A', color: 'white', borderRadius: 14,
        padding: '10px 22px', display: 'inline-block', margin: '10px 0',
        fontFamily: 'Quicksand, sans-serif', fontSize: 24, fontWeight: 800,
      }}>
        {q.a}
      </div>
      {winnerTeam
        ? <p style={{ color: winnerTeam.color, fontWeight: 800, fontSize: 20, fontFamily: 'Quicksand, sans-serif' }}>
            +{q.value} pts → {winnerTeam.name}
          </p>
        : <p style={{ color: '#999', fontSize: 18 }}>Nadie acertó</p>
      }
      <div style={{ marginTop: 12, display: 'grid', gap: 7, maxWidth: 400, margin: '12px auto 0' }}>
        {roundAnswers.map((ans) => {
          const player = players.find((p) => p.id === ans.player_id)
          const correct = overrides[ans.player_id] != null
            ? overrides[ans.player_id] === 'correct'
            : isCorrect(String(ans.value), q.accept)
          return (
            <div key={ans.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.7)', borderRadius: 9, padding: '7px 12px',
            }}>
              <span style={{ fontSize: 18 }}>{correct ? '✓' : '✗'}</span>
              <span style={{ fontWeight: 700, color: '#5A2A4A', flex: 1, textAlign: 'left' }}>{player?.name ?? '?'}</span>
              <span style={{ color: '#5A2A4A', fontStyle: 'italic', fontSize: 14 }}>{String(ans.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Revealing: host ───────────────────────────────────────────────────────────

export function RevealingHost({
  ctx, catI, valI, q, teams, isLastQuestion,
}: { ctx: GameContext; catI: number; valI: number; q: Q; teams: JeopardyTeam[]; isLastQuestion: boolean }) {
  const { room, answers, players } = ctx
  const gs = room.game_state
  const rk = jRoundKey(catI, valI)
  const roundAnswers = answers.filter((a) => a.round_key === rk)
  const overrides = (gs.overrides ?? {}) as Record<string, 'correct' | 'incorrect'>
  const [confirming, setConfirming] = useState(false)

  function effectiveCorrect(playerId: string, value: string) {
    return overrides[playerId] != null
      ? overrides[playerId] === 'correct'
      : isCorrect(value, q.accept)
  }

  function toggleOverride(playerId: string, currently: boolean) {
    patchGameState(room.id, gs, {
      overrides: { ...overrides, [playerId]: currently ? 'incorrect' : 'correct' },
    })
  }

  function findWinnerTeamId(): string | null {
    for (const ans of roundAnswers) {
      if (effectiveCorrect(ans.player_id, String(ans.value))) {
        return teams.find((t) => t.member_ids.includes(ans.player_id))?.id ?? null
      }
    }
    return null
  }

  async function confirm() {
    setConfirming(true)
    const winnerTeamId = findWinnerTeamId()
    if (winnerTeamId) {
      await updateTeamScore(room.id, room.teams, winnerTeamId, q.value)
    }
    const newBoard = (gs.board ?? []).map((row, ci) =>
      row.map((v, vi) => (ci === catI && vi === valI ? true : v)),
    )
    const finished = newBoard.every((row) => row.every(Boolean))
    await patchGameState(room.id, gs, {
      phase: finished ? 'finished' : 'picking',
      board: newBoard,
      active_q: null,
      steal_open: false,
      overrides: {},
      current_team_index: ((gs.current_team_index ?? 0) + 1) % teams.length,
      timer_ends_at: null,
    })
    setConfirming(false)
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ color: '#5A2A4A', fontWeight: 800, marginBottom: 8 }}>
        Respuesta: <span style={{ color: '#B86CD9' }}>{q.a}</span>
      </p>
      <div style={{ display: 'grid', gap: 7 }}>
        {roundAnswers.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>Nadie envió respuesta</p>}
        {roundAnswers.map((ans) => {
          const player = players.find((p) => p.id === ans.player_id)
          const correct = effectiveCorrect(ans.player_id, String(ans.value))
          const team = teams.find((t) => t.member_ids.includes(ans.player_id))
          return (
            <div
              key={ans.id}
              onClick={() => toggleOverride(ans.player_id, correct)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: correct ? 'rgba(156,232,156,0.4)' : 'rgba(255,100,100,0.15)',
                borderRadius: 9, padding: '8px 10px',
              }}
            >
              <span style={{ fontSize: 18 }}>{correct ? '✓' : '✗'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#5A2A4A', fontSize: 13 }}>
                  {player?.name ?? '?'} · <span style={{ color: team?.color }}>{team?.name ?? '?'}</span>
                </div>
                <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>{String(ans.value)}</div>
              </div>
              <span style={{ fontSize: 10, color: '#bbb' }}>toca p/ cambiar</span>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 14 }}>
        <PillButton onClick={confirm} disabled={confirming}>
          {confirming ? 'Guardando…' : isLastQuestion ? 'Ver podio final' : 'Confirmar y siguiente →'}
        </PillButton>
      </div>
    </div>
  )
}
