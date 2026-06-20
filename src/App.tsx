import { Routes, Route, Navigate } from 'react-router-dom'
import Join from './routes/Join'
import Screen from './routes/Screen'
import Host from './routes/Host'
import Play from './routes/Play'

const ROOM = 'ROCIO30'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/join/${ROOM}`} replace />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/screen/:code" element={<Screen />} />
      <Route path="/host/:code" element={<Host />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
