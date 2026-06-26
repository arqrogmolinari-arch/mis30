import { Routes, Route, Navigate } from 'react-router-dom'
import Join from './routes/Join'
import Screen from './routes/Screen'
import Host from './routes/Host'
import Play from './routes/Play'
import Preview from './routes/Preview'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/join" replace />} />
      {/* URLs limpias (sala única ROCIO30 por defecto) */}
      <Route path="/join" element={<Join />} />
      <Route path="/play" element={<Play />} />
      <Route path="/screen" element={<Screen />} />
      <Route path="/host" element={<Host />} />
      {/* Compatibilidad con QR/links que llevan el código */}
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/screen/:code" element={<Screen />} />
      <Route path="/host/:code" element={<Host />} />
      {/* Preview TEMPORAL de diseño (borrar luego) */}
      <Route path="/preview/podium" element={<Preview />} />
      <Route path="/preview/loading" element={<Preview />} />
      <Route path="/preview/host" element={<Preview />} />
      <Route path="/preview/setup" element={<Preview />} />
      <Route path="/preview/jeopardy" element={<Preview />} />
      <Route path="/preview/answer" element={<Preview />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  )
}
