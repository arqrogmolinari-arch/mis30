import { supabase } from './supabase'
import type { GameId, GameState, Player } from './types'

export async function claimPlayer(playerId: string): Promise<void> {
  await supabase.from('players').update({ claimed_at: new Date().toISOString() }).eq('id', playerId)
}

export async function setActiveGame(roomId: string, game: GameId | null, state: GameState): Promise<void> {
  await supabase.from('rooms').update({
    active_game: game,
    phase: game ? 'playing' : 'lobby',
    game_state: state,
  }).eq('id', roomId)
}

export async function patchGameState(roomId: string, current: GameState, patch: Partial<GameState>): Promise<void> {
  await supabase.from('rooms').update({ game_state: { ...current, ...patch } }).eq('id', roomId)
}

export async function setPhase(roomId: string, phase: 'lobby' | 'playing' | 'results'): Promise<void> {
  await supabase.from('rooms').update({ phase }).eq('id', roomId)
}

export async function submitAnswer(
  roomId: string, playerId: string, game: GameId, roundKey: string, value: any,
): Promise<void> {
  await supabase.from('answers').upsert(
    { room_id: roomId, player_id: playerId, game, round_key: roundKey, value },
    { onConflict: 'player_id,round_key' },
  )
}

export async function addScores(deltas: Record<string, number>, players: Player[]): Promise<void> {
  // Apply score deltas. Reads current score from the passed players snapshot.
  const updates = Object.entries(deltas).map(([playerId, delta]) => {
    const p = players.find((x) => x.id === playerId)
    const next = (p?.score ?? 0) + delta
    return supabase.from('players').update({ score: next }).eq('id', playerId)
  })
  await Promise.all(updates)
}

export async function resetScores(roomId: string): Promise<void> {
  await supabase.from('players').update({ score: 0 }).eq('room_id', roomId)
}

/**
 * Clears a game's prior data so reselecting the same game starts fresh.
 * Round keys are reused (e.g. `quiz:0`), so without this a replay would let the
 * host reveal-and-score stale answers from the previous run. Scores in
 * players.score are NOT touched (that's the cumulative global ranking).
 */
export async function clearGameData(roomId: string, game: GameId): Promise<void> {
  await supabase.from('answers').delete().eq('room_id', roomId).eq('game', game)
  if (game === 'two_truths') {
    await supabase.from('two_truths_entries').delete().eq('room_id', roomId)
  }
}
