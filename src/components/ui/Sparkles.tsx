/** Destellos pixel-art decorativos; pointer-events off para no bloquear taps. */
export function Sparkles() {
  const sparks = [
    { top: '8%', left: '12%', size: 16, color: '#FF4FB6' },
    { top: '22%', left: '84%', size: 22, color: '#C58BE0' },
    { top: '54%', left: '6%', size: 14, color: '#FF9E5E' },
    { top: '70%', left: '90%', size: 20, color: '#FF4FB6' },
    { top: '88%', left: '24%', size: 16, color: '#C58BE0' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {sparks.map((s, i) => (
        <PixelSparkle key={i} top={s.top} left={s.left} size={s.size} color={s.color} />
      ))}
    </div>
  )
}

function PixelSparkle({ top, left, size, color }: { top: string; left: string; size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 7 7" width={size} height={size} shapeRendering="crispEdges"
      style={{ position: 'absolute', top, left, opacity: 0.7 }}
    >
      <g fill={color}>
        <rect x="3" y="0" width="1" height="7" />
        <rect x="0" y="3" width="7" height="1" />
        <rect x="2" y="2" width="3" height="3" />
      </g>
    </svg>
  )
}
