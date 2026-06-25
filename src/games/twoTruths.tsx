import { useState } from 'react'
import type { GameConfig } from './registry'
import type { Player } from '../lib/types'
import { PillButton } from '../components/ui/PillButton'
import { PlayerTile } from '../components/ui/PlayerTile'
import { patchGameState, submitAnswer, addScores } from '../lib/actions'
import { saveTtEntry, shuffleOrder } from '../lib/tt'
import { HostBackToHub } from './shared'

function roundKeyFor(playerId: string) { return `tt:${playerId}` }

// Host-local guard: player turns already scored this session. Prevents a double
// "reveal" tap from double-awarding (the rooms phase event lands after the players
// score event, so a game_state-based guard can't close the window). Cleared on start.
const revealedTurns = new Set<string>()

export const twoTruthsGame: GameConfig = {
  id: 'two_truths',
  initialState: () => {
    revealedTurns.clear()
    return { phase: 'writing', done_player_ids: [] }
  },

  renderScreen: ({ room, players, ttEntries, answers }) => {
    const gs = room.game_state
    if (gs.phase === 'writing') {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>Cargá tus 3 frases ✍️</h2>
          <p style={{ fontSize: 28, color: '#5A2A4A' }}>{ttEntries.length} de {players.length} listos</p>
        </div>
      )
    }
    const current = players.find((p) => p.id === gs.current_player_id)
    const entry = ttEntries.find((e) => e.player_id === gs.current_player_id)
    if (!current || !entry) return <div style={{ padding: 40, color: '#5A2A4A' }}>Esperando…</div>
    const order = gs.shuffle ?? shuffleOrder(0)
    const votes = answers.filter((a) => a.round_key === roundKeyFor(current.id))
    const guessedRight = votes.filter((v) => v.value === entry.lie_index).length
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <PlayerTile player={current} size={110} />
        <div style={{ display: 'grid', gap: 12, maxWidth: 560, margin: '20px auto' }}>
          {order.map((si) => {
            const isLie = si === entry.lie_index
            const reveal = gs.phase === 'revealing'
            return (
              <div key={si} style={{
                padding: 18, borderRadius: 16, fontSize: 22, color: '#5A2A4A',
                background: reveal && isLie ? '#FF9E5E' : 'rgba(255,255,255,0.75)',
                boxShadow: '0 4px 0 rgba(90,42,74,0.2)',
              }}>{entry.statements[si]}{reveal && isLie ? '  ← mentira 🤥' : ''}</div>
            )
          })}
        </div>
        {gs.phase === 'revealing' && <p style={{ color: '#5A2A4A', fontSize: 24 }}>{guessedRight} la descubrieron</p>}
      </div>
    )
  },

  renderGuest: ({ room, answers, ttEntries, me }) => {
    if (!me) return null
    const gs = room.game_state
    if (gs.phase === 'writing') return <WriteForm roomId={room.id} me={me} done={!!ttEntries.find((e) => e.player_id === me.id)} />
    const current = gs.current_player_id
    if (current === me.id) return <div style={{ padding: 24, textAlign: 'center', fontSize: 26 }}>¡Es tu turno! Mirá la pantalla 👀</div>
    const entry = ttEntries.find((e) => e.player_id === current)
    if (!entry || gs.phase === 'revealing') return <div style={{ padding: 24, textAlign: 'center' }}>Mirá la pantalla 👀</div>
    const order = gs.shuffle ?? shuffleOrder(0)
    const myVote = answers.find((a) => a.round_key === roundKeyFor(current!) && a.player_id === me.id)
    return (
      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
        <p style={{ textAlign: 'center', color: '#5A2A4A' }}>¿Cuál es la mentira?</p>
        {order.map((si) => (
          <PillButton key={si} variant="ghost" selected={myVote?.value === si}
            onClick={() => submitAnswer(room.id, me.id, 'two_truths', roundKeyFor(current!), si)}>
            {entry.statements[si]}
          </PillButton>
        ))}
      </div>
    )
  },

  renderHost: ({ room, players, ttEntries, answers }) => {
    const gs = room.game_state
    const done = gs.done_player_ids ?? []

    async function startGuessing(p: Player) {
      const seed = (ttEntries.findIndex((e) => e.player_id === p.id) + 1) * 7
      await patchGameState(room.id, gs, {
        phase: 'guessing', current_player_id: p.id, shuffle: shuffleOrder(seed),
      })
    }
    async function reveal() {
      const cur = gs.current_player_id!
      if (revealedTurns.has(roundKeyFor(cur))) return  // already revealed/scored this turn — block double-tap
      const entry = ttEntries.find((e) => e.player_id === cur)
      if (!entry) return
      revealedTurns.add(roundKeyFor(cur))
      const deltas: Record<string, number> = {}
      const votes = answers.filter((a) => a.round_key === roundKeyFor(cur))
      votes.filter((v) => v.value === entry.lie_index).forEach((v) => { deltas[v.player_id] = 1 })
      const fooled = votes.filter((v) => v.value !== entry.lie_index).length
      if (fooled > 0) deltas[cur] = (deltas[cur] ?? 0) + fooled
      if (Object.keys(deltas).length) await addScores(deltas, players)
      await patchGameState(room.id, gs, { phase: 'revealing' })
    }
    async function nextPlayer() {
      const cur = gs.current_player_id!
      await patchGameState(room.id, gs, {
        phase: 'picking', current_player_id: null, done_player_ids: [...done, cur],
      })
    }

    if (gs.phase === 'writing' || gs.phase === 'picking' || gs.phase === 'init') {
      const remaining = players.filter((p) => ttEntries.find((e) => e.player_id === p.id) && !done.includes(p.id))
      return (
        <div style={{ padding: 20, display: 'grid', gap: 10 }}>
          <p style={{ color: '#5A2A4A' }}>{ttEntries.length}/{players.length} cargaron · elegí a quién le toca:</p>
          {remaining.map((p) => <PillButton key={p.id} variant="ghost" onClick={() => startGuessing(p)}>{p.name}</PillButton>)}
          {remaining.length === 0 && <HostBackToHub room={room} />}
        </div>
      )
    }
    const currentEntry = ttEntries.find((e) => e.player_id === gs.current_player_id)
    const currentPlayer = players.find((p) => p.id === gs.current_player_id)
    return (
      <div style={{ padding: 20, display: 'grid', gap: 10 }}>
        {currentPlayer && (
          <p style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, color: '#5A2A4A', fontSize: 16, margin: 0 }}>
            {currentPlayer.name}
          </p>
        )}
        {currentEntry && (
          <div style={{ display: 'grid', gap: 6 }}>
            {currentEntry.statements.map((s, si) => (
              <div key={si} style={{
                padding: '8px 12px', borderRadius: 10, fontSize: 13, color: '#5A2A4A',
                background: gs.phase === 'revealing' && si === currentEntry.lie_index
                  ? 'rgba(255,158,94,0.4)' : 'rgba(255,255,255,0.7)',
              }}>
                {s}{gs.phase === 'revealing' && si === currentEntry.lie_index ? ' 🤥' : ''}
              </div>
            ))}
          </div>
        )}
        {gs.phase === 'guessing' && <PillButton onClick={reveal}>Cerrar y revelar</PillButton>}
        {gs.phase === 'revealing' && <PillButton onClick={nextPlayer}>Siguiente jugador</PillButton>}
      </div>
    )
  },
}

function WriteForm({ roomId, me, done }: { roomId: string; me: Player; done: boolean }) {
  const [s, setS] = useState(['', '', ''])
  const [lie, setLie] = useState<number | null>(null)
  if (done) return <div style={{ padding: 24, textAlign: 'center', fontSize: 24 }}>¡Listo! Esperá tu turno 🎀</div>
  const ready = s.every((x) => x.trim()) && lie !== null
  return (
    <div style={{ padding: '16px 12px 32px', display: 'grid', gap: 14 }}>
      <p style={{ textAlign: 'center', color: '#5A2A4A', fontSize: 15, margin: 0 }}>2 verdades + 1 mentira. Marcá cuál es la mentira.</p>
      {s.map((val, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'stretch' }}>
          <input value={val} placeholder={`Frase ${i + 1}`} onChange={(e) => {
            const n = [...s]; n[i] = e.target.value; setS(n)
          }} style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #FFB6D9',
            fontSize: 16, fontFamily: 'Quicksand, sans-serif', color: '#5A2A4A' }} />
          <button onClick={() => setLie(i)} style={{
            padding: '0 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700,
            fontFamily: 'Quicksand, sans-serif', fontSize: 14, touchAction: 'manipulation',
            background: lie === i ? '#FF4FB6' : 'rgba(255,255,255,0.7)', color: lie === i ? '#fff' : '#5A2A4A',
          }}>🤥</button>
        </div>
      ))}
      <PillButton disabled={!ready} style={{ width: '100%' }}
        onClick={() => saveTtEntry(roomId, me.id, [s[0], s[1], s[2]], lie!)}>
        Guardar
      </PillButton>
    </div>
  )
}
