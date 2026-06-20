/** Decorative star scatter; pointer-events disabled so it never blocks taps. */
export function Sparkles() {
  const stars = ['✦', '✧', '★', '✦', '✧']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <span key={i} style={{
          position: 'absolute', color: 'rgba(255,255,255,0.7)', fontSize: 18 + (i % 3) * 10,
          top: `${(i * 19 + 7) % 90}%`, left: `${(i * 37 + 11) % 92}%`,
        }}>{s}</span>
      ))}
    </div>
  )
}
