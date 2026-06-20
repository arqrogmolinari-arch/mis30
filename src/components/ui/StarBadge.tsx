export function StarBadge({ value }: { value: number }) {
  return (
    <div style={{ position: 'relative', width: 56, height: 56, display: 'inline-flex' }}>
      <div style={{ fontSize: 56, lineHeight: 1, color: '#FFD23F' }}>★</div>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'Baloo 2, sans-serif', fontWeight: 800,
        color: '#5A2A4A', fontSize: 20,
      }}>{value}</span>
    </div>
  )
}
