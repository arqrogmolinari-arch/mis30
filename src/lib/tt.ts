import { supabase } from './supabase'

export async function saveTtEntry(
  roomId: string, playerId: string, statements: [string, string, string], lieIndex: number,
): Promise<void> {
  await supabase.from('two_truths_entries').upsert(
    { room_id: roomId, player_id: playerId, statements, lie_index: lieIndex },
    { onConflict: 'player_id' },
  )
}

/** Deterministic shuffle of [0,1,2] from a seed so screen+host agree on display order. */
export function shuffleOrder(seed: number): number[] {
  const arr = [0, 1, 2]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * (i + 7) + 13) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
