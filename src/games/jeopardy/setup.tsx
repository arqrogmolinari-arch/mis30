import { useState } from 'react'
import { PlayerTile } from '../../components/ui/PlayerTile'
import { PillButton } from '../../components/ui/PillButton'
import { setTeams, patchGameState } from '../../lib/actions'
import type { GameContext } from '../registry'
import type { JeopardyTeam } from '../../lib/types'
import { TEAM_COLORS } from './utils'

const DEFAULT_NAMES = ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4']
const CAT_COUNT = 5
const VAL_COUNT = 5

interface Draft {
  id: string; name: string; color: string
  member_ids: string[]; captain_id: string; score: number
}

export function SetupPanel({ ctx, initialTeams }: { ctx: GameContext; initialTeams?: Draft[] }) {
  const { room, players } = ctx
  const gs = room.game_state

  const [teams, setLocal] = useState<Draft[]>(() =>
    initialTeams ?? DEFAULT_NAMES.map((name, i) => ({
      id: `team-${i + 1}`, name, color: TEAM_COLORS[i],
      member_ids: [], captain_id: '', score: 0,
    })),
  )
  const [saving, setSaving] = useState(false)

  const assigned = new Set(teams.flatMap((t) => t.member_ids))
  const unassigned = players.filter((p) => !assigned.has(p.id))

  function assign(playerId: string, toIdx: number) {
    setLocal((prev) =>
      prev.map((t, i) => {
        const without = {
          ...t,
          member_ids: t.member_ids.filter((id) => id !== playerId),
          captain_id: t.captain_id === playerId ? '' : t.captain_id,
        }
        if (i === toIdx) without.member_ids = [...without.member_ids, playerId]
        return without
      }),
    )
  }

  function setCaptain(teamIdx: number, playerId: string) {
    setLocal((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, captain_id: playerId } : t)),
    )
  }

  const activeTeams = teams.filter((t) => t.member_ids.length > 0)
  const canStart = activeTeams.length >= 2 && activeTeams.every((t) => t.captain_id !== '')

  async function handleStart() {
    setSaving(true)
    await setTeams(room.id, activeTeams as JeopardyTeam[])
    await patchGameState(room.id, gs, {
      phase: 'picking',
      current_team_index: 0,
      board: Array.from({ length: CAT_COUNT }, () => Array(VAL_COUNT).fill(false)),
      active_q: null,
      steal_open: false,
      overrides: {},
    })
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, letterSpacing: 1, color: '#5A2A4A', margin: '0 0 12px' }}>
        Armar equipos
      </h2>

      {unassigned.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#5A2A4A', fontSize: 13, margin: '0 0 8px' }}>Sin equipo:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {unassigned.map((p) => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <PlayerTile player={p} size={52} />
                <p style={{ margin: '4px 0 2px', fontSize: 11, color: '#5A2A4A', fontWeight: 700 }}>{p.name}</p>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {teams.map((_, ti) => (
                    <button
                      key={ti}
                      onClick={() => assign(p.id, ti)}
                      style={{
                        minWidth: 26, height: 26, borderRadius: 8,
                        border: '2.5px solid #5A2A4A',
                        background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                        fontSize: 14, color: '#5A2A4A', fontWeight: 600,
                        fontFamily: 'Pixelify Sans, sans-serif', lineHeight: 1,
                      }}
                    >{ti + 1}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {teams.map((team, ti) => (
          <div key={team.id} style={{
            background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 10,
            borderTop: '4px solid rgba(90,42,74,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: 8,
                background: '#5A2A4A', color: 'white', fontWeight: 600, fontSize: 14,
                fontFamily: 'Pixelify Sans, sans-serif',
                display: 'grid', placeItems: 'center', lineHeight: 1,
              }}>{ti + 1}</span>
              <input
                value={team.name}
                onChange={(e) => setLocal((prev) =>
                  prev.map((t, i) => (i === ti ? { ...t, name: e.target.value } : t)),
                )}
                style={{
                  flex: 1, minWidth: 0, border: 'none', background: 'transparent',
                  fontWeight: 700, color: '#5A2A4A', fontSize: 14,
                  fontFamily: 'Quicksand, sans-serif', padding: 0,
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {team.member_ids.map((mid) => {
                const p = players.find((x) => x.id === mid)
                if (!p) return null
                const isCap = team.captain_id === mid
                return (
                  <div key={mid} style={{ textAlign: 'center', position: 'relative' }}>
                    <PlayerTile player={p} size={44} onClick={() => setCaptain(ti, mid)} />
                    {isCap && (
                      <span style={{
                        position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                        borderRadius: '50%', background: '#FFD23F', border: '2px solid #5A2A4A',
                        display: 'grid', placeItems: 'center', pointerEvents: 'none',
                        fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 11, color: '#5A2A4A',
                      }}>C</span>
                    )}
                    <button
                      onClick={() => assign(mid, -1)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 10, color: '#aaa', display: 'block', margin: '0 auto',
                      }}
                    >✕</button>
                  </div>
                )
              })}
              {team.member_ids.length === 0 && (
                <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>Vacío</p>
              )}
            </div>
            {team.member_ids.length > 0 && team.captain_id === '' && (
              <p style={{ fontSize: 11, color: '#C58BE0', margin: '6px 0 0' }}>
                Tocá un jugador → capitán (C)
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <PillButton onClick={handleStart} disabled={!canStart || saving}>
          {saving ? 'Iniciando…' : '¡Iniciar Jeopardy!'}
        </PillButton>
        {!canStart && (
          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 }}>
            {activeTeams.length < 2
              ? 'Necesitás al menos 2 equipos con jugadores'
              : 'Cada equipo con jugadores necesita un capitán (C)'}
          </p>
        )}
      </div>
    </div>
  )
}
