import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { roster, photoFor } from '../../lib/roster'
import type { Room } from '../../lib/types'

/** Hidden helper: upserts roster rows into `players`. Idempotent on (room_id, slug). */
export function SeedPanel({ room }: { room: Room }) {
  const [msg, setMsg] = useState('')
  async function seed() {
    const rows = roster.map((r) => ({
      room_id: room.id, slug: r.slug, name: r.name, photo: photoFor(r.slug),
    }))
    const { error } = await supabase.from('players').upsert(rows, { onConflict: 'room_id,slug' })
    setMsg(error ? `Error: ${error.message}` : `Seeded ${rows.length} players ✓`)
  }
  return (
    <div style={{ marginTop: 24, padding: 12, border: '1px dashed #B86CD9', borderRadius: 12 }}>
      <button onClick={seed} style={{ padding: '8px 14px', borderRadius: 8 }}>Seed players from roster</button>
      {msg && <span style={{ marginLeft: 10, color: '#5A2A4A' }}>{msg}</span>}
    </div>
  )
}
