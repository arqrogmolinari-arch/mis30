import promptData from '../content/most_likely.json'
import type { GameConfig } from './registry'
import { PlayerTile } from '../components/ui/PlayerTile'
import { PillButton } from '../components/ui/PillButton'
import { patchGameState, submitAnswer } from '../lib/actions'
import { HostBackToHub } from './quiz'

const PROMPTS = promptData as string[]
function roundKey(i: number) { return `ml:${i}` }

export const mostLikelyGame: GameConfig = {
  id: 'most_likely',
  initialState: () => ({ prompt_index: 0, round_key: roundKey(0), phase: 'voting' }),

  renderScreen: ({ room, players, answers }) => {
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    const votes = answers.filter((a) => a.round_key === roundKey(i))
    const tally: Record<string, number> = {}
    votes.forEach((v) => { tally[v.value] = (tally[v.value] ?? 0) + 1 })
    const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
    const winner = players.find((p) => p.id === winnerId)
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Baloo 2', fontSize: 40, color: '#5A2A4A' }}>{PROMPTS[i]}</h2>
        {gs.phase === 'voting'
          ? <p style={{ color: '#5A2A4A', fontSize: 24 }}>{votes.length} votos…</p>
          : winner && (
            <div style={{ marginTop: 20 }}>
              <PlayerTile player={winner} size={140} />
              <div style={{ marginTop: 16, maxWidth: 400, margin: '16px auto' }}>
                {players.filter((p) => tally[p.id]).sort((a, b) => tally[b.id] - tally[a.id]).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 60, color: '#5A2A4A', fontWeight: 700 }}>{p.name}</span>
                    <div style={{ height: 18, borderRadius: 9, background: '#FF4FB6',
                      width: `${(tally[p.id] / votes.length) * 100}%`, minWidth: 18 }} />
                    <span style={{ color: '#5A2A4A' }}>{tally[p.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    )
  },

  renderGuest: ({ room, answers, players, me }) => {
    if (!me) return null
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    if (gs.phase === 'revealing') return <div style={{ padding: 24, textAlign: 'center' }}>Mirá la pantalla 👀</div>
    const myVote = answers.find((a) => a.round_key === roundKey(i) && a.player_id === me.id)
    return (
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {players.map((p) => (
          <PlayerTile key={p.id} player={p} size={86} selected={myVote?.value === p.id}
            onClick={() => submitAnswer(room.id, me.id, 'most_likely', roundKey(i), p.id)} />
        ))}
      </div>
    )
  },

  renderHost: ({ room }) => {
    const gs = room.game_state
    const i = gs.prompt_index ?? 0
    const last = i >= PROMPTS.length - 1
    async function close() { await patchGameState(room.id, gs, { phase: 'revealing' }) }
    async function next() {
      if (last) return
      const ni = i + 1
      await patchGameState(room.id, gs, { prompt_index: ni, round_key: roundKey(ni), phase: 'voting' })
    }
    return (
      <div style={{ padding: 20, display: 'grid', gap: 12 }}>
        <p style={{ color: '#5A2A4A' }}>Prompt {i + 1}/{PROMPTS.length} · {gs.phase}</p>
        {gs.phase === 'voting' && <PillButton onClick={close}>Cerrar votación</PillButton>}
        {gs.phase === 'revealing' && !last && <PillButton onClick={next}>Siguiente</PillButton>}
        {gs.phase === 'revealing' && last && <HostBackToHub room={room} />}
      </div>
    )
  },
}
