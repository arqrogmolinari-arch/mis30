import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Join from './routes/Join'
import { useRoom } from './lib/room'
import { SeedPanel } from './components/seed/SeedPanel'

const ROOM = 'ROCIO30'

// temporary, removed in Task 7
function SeedRoute() {
  const { code = '' } = useParams()
  const { room } = useRoom(code)
  return room ? <SeedPanel room={room} /> : <div>cargando…</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/join/${ROOM}`} replace />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<div>play</div>} />
      <Route path="/screen/:code" element={<div>screen</div>} />
      <Route path="/host/:code" element={<div>host</div>} />
      <Route path="/seed/:code" element={<SeedRoute />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
