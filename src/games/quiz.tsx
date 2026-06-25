import quizData from '../content/quiz.json'
import type { GameConfig } from './registry'
import type { GameState, Player } from '../lib/types'
import { PillButton } from '../components/ui/PillButton'
import { PlayerTile } from '../components/ui/PlayerTile'
import { Countdown } from '../components/ui/Countdown'
import { patchGameState, setActiveGame, submitAnswer, addScores } from '../lib/actions'

interface QuizQ { q: string; options: string[]; correct: number }
const QUESTIONS = quizData as QuizQ[]
const TIMER_SECONDS = 20

function roundKey(i: number) { return `quiz:${i}` }

// Host-local guard: rounds already scored this game session. Prevents a double
// "reveal" tap from double-awarding, since the rooms phase-change event arrives
// AFTER the players score event (so a game_state-based guard can't close the window).
// Cleared in initialState so replaying the game after a reset scores fresh.
const revealedRounds = new Set<string>()

export const quizGame: GameConfig = {
  id: 'quiz',
  initialState: () => {
    revealedRounds.clear()
    return {
      round_index: 0, round_key: roundKey(0), phase: 'asking',
      timer_ends_at: new Date(Date.now() + TIMER_SECONDS * 1000).toISOString(),
    }
  },

  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const q = QUESTIONS[i]
    if (gs.phase === 'finished' || !q) return <Podium players={players} />
    const mine = answers.filter((a) => a.round_key === roundKey(i))
    const correctCount = mine.filter((a) => a.value === q.correct).length
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>{q.q}</h2>
        {gs.phase === 'asking' && <Countdown endsAt={gs.timer_ends_at} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{
              padding: 20, borderRadius: 16, fontSize: 24, fontWeight: 700, color: '#5A2A4A',
              background: gs.phase === 'revealing' && oi === q.correct ? '#9CE89C' : 'rgba(255,255,255,0.7)',
              boxShadow: '0 4px 0 rgba(90,42,74,0.2)',
            }}>{opt}{gs.phase === 'revealing' && oi === q.correct ? ' ✓' : ''}</div>
          ))}
        </div>
        {gs.phase === 'revealing' && <p style={{ marginTop: 16, color: '#5A2A4A', fontSize: 24 }}>
          {correctCount} acertaron 🎉</p>}
      </div>
    )
  },

  renderGuest: ({ room, answers, me }) => {
    if (!me) return null
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const q = QUESTIONS[i]
    if (gs.phase === 'finished' || !q) return <div style={{ padding: 24, textAlign: 'center' }}>¡Terminó! Mirá la pantalla 💖</div>
    const myAnswer = answers.find((a) => a.round_key === roundKey(i) && a.player_id === me.id)
    if (gs.phase === 'revealing') {
      const ok = myAnswer?.value === q.correct
      return <div style={{ padding: 24, textAlign: 'center', fontSize: 28 }}>{ok ? '¡Acertaste! ✓' : 'Casi… ✗'}</div>
    }
    return (
      <div style={{ padding: '16px 12px 32px', display: 'grid', gap: 12 }}>
        {q.options.map((opt, oi) => (
          <PillButton key={oi} variant="ghost" selected={myAnswer?.value === oi}
            style={{ width: '100%', fontSize: 'clamp(15px, 4vw, 18px)', textTransform: 'none', letterSpacing: 0 }}
            onClick={() => submitAnswer(room.id, me.id, 'quiz', roundKey(i), oi)}>{opt}</PillButton>
        ))}
      </div>
    )
  },

  renderHost: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.round_index ?? 0
    const last = i >= QUESTIONS.length - 1

    async function reveal() {
      const key = roundKey(i)
      if (revealedRounds.has(key)) return  // already revealed/scored this round — block double-tap
      revealedRounds.add(key)
      const q = QUESTIONS[i]
      const deltas: Record<string, number> = {}
      answers.filter((a) => a.round_key === roundKey(i) && a.value === q.correct)
        .forEach((a) => { deltas[a.player_id] = 1 })
      if (Object.keys(deltas).length) await addScores(deltas, players)
      await patchGameState(room.id, gs, { phase: 'revealing' })
    }
    async function next() {
      if (last) { await patchGameState(room.id, gs, { phase: 'finished' }); return }
      const ni = i + 1
      await patchGameState(room.id, gs, {
        round_index: ni, round_key: roundKey(ni), phase: 'asking',
        timer_ends_at: new Date(Date.now() + TIMER_SECONDS * 1000).toISOString(),
      })
    }

    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        <p style={{ color: '#5A2A4A' }}>Pregunta {i + 1}/{QUESTIONS.length} · fase: {gs.phase}</p>
        {gs.phase === 'asking' && <PillButton onClick={reveal}>Cerrar y revelar</PillButton>}
        {(gs.phase === 'revealing') && <PillButton onClick={next}>{last ? 'Ver podio' : 'Siguiente pregunta'}</PillButton>}
        {gs.phase === 'finished' && <HostBackToHub room={room} />}
      </div>
    )
  },
}

function Podium({ players }: { players: Player[] }) {
  const top = [...players].sort((a, b) => b.score - a.score).slice(0, 3)
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>Podio 🏆</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
        {top.map((p, idx) => (
          <div key={p.id}>
            <div style={{ fontSize: 32 }}>{['🥇', '🥈', '🥉'][idx]}</div>
            <PlayerTile player={p} size={100} />
            <div style={{ color: '#5A2A4A', fontWeight: 800 }}>{p.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HostBackToHub({ room }: { room: { id: string; game_state: GameState } }) {
  return <PillButton onClick={() => setActiveGame(room.id, null, {})}>Volver al hub</PillButton>
}
