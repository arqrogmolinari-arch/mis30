import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Room, Player, Answer, TtEntry } from './types'

export interface RoomState {
  room: Room | null
  players: Player[]
  answers: Answer[]
  ttEntries: TtEntry[]
  loading: boolean
}

/**
 * Subscribes to all room tables via Postgres Changes. On ANY change to a table,
 * it re-fetches that table (simple + robust for ~18 players). Returns live state.
 */
export function useRoom(code: string): RoomState {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [ttEntries, setTtEntries] = useState<TtEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let roomId: string | null = null
    let cancelled = false

    async function loadRoom() {
      const { data } = await supabase.from('rooms').select('*').eq('code', code).single()
      if (cancelled) return
      if (!data) { setLoading(false); return }  // room missing: stop showing the loader
      roomId = data.id
      setRoom(data as Room)
      await Promise.all([loadPlayers(), loadAnswers(), loadTt()])
      setLoading(false)
    }
    async function loadPlayers() {
      if (!roomId) return
      const { data } = await supabase.from('players').select('*')
        .eq('room_id', roomId).order('name')
      if (!cancelled && data) setPlayers(data as Player[])
    }
    async function loadAnswers() {
      if (!roomId) return
      const { data } = await supabase.from('answers').select('*')
        .eq('room_id', roomId).order('created_at')
      if (!cancelled && data) setAnswers(data as Answer[])
    }
    async function loadTt() {
      if (!roomId) return
      const { data } = await supabase.from('two_truths_entries').select('*').eq('room_id', roomId)
      if (!cancelled && data) setTtEntries(data as TtEntry[])
    }

    loadRoom()

    const channel = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' },
        (payload: any) => { if (payload.new && (payload.new as Room).code === code) setRoom(payload.new as Room) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => loadPlayers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, () => loadAnswers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'two_truths_entries' }, () => loadTt())
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [code])

  return { room, players, answers, ttEntries, loading }
}
