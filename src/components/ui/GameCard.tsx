interface Props {
  title: string
  emoji: string
  gradient: string
  onClick?: () => void
}

export function GameCard({ title, emoji, gradient, onClick }: Props) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: onClick ? 'pointer' : 'default', borderRadius: 24,
      background: gradient, padding: '28px 20px', minHeight: 200, width: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, boxShadow: '0 8px 0 rgba(90,42,74,0.2), inset 0 0 0 4px rgba(255,255,255,0.5)',
    }}>
      <div style={{ fontSize: 64 }}>{emoji}</div>
      <div style={{
        fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff',
        textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(90,42,74,0.35)', textAlign: 'center',
      }}>{title}</div>
    </button>
  )
}
