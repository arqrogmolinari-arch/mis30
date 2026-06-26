interface Props {
  title: string
  gradient: string
  onClick?: () => void
}

export function GameCard({ title, gradient, onClick }: Props) {
  return (
    <button onClick={onClick} style={{
      cursor: onClick ? 'pointer' : 'default', borderRadius: 22,
      border: '3px solid #5A2A4A',
      background: gradient, padding: '30px 22px', minHeight: 160, width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 0 rgba(90,42,74,0.18), inset 0 0 0 3px rgba(255,255,255,0.55)',
      touchAction: 'manipulation',
    }}>
      <div style={{
        fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 24, color: '#fff',
        textShadow: '2px 2px 0 rgba(90,42,74,0.4)', textAlign: 'center', letterSpacing: 0.5,
      }}>{title}</div>
    </button>
  )
}
