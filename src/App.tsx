import { Routes, Route, Navigate } from 'react-router-dom'

const ROOM = 'ROCIO30'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/join/${ROOM}`} replace />} />
      <Route path="/join/:code" element={<div>join</div>} />
      <Route path="/play/:code" element={<div>play</div>} />
      <Route path="/screen/:code" element={<div>screen</div>} />
      <Route path="/host/:code" element={<div>host</div>} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
