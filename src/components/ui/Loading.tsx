/** Pantalla de carga: fondo #FAE7ED + título en Pixelify Sans + puntitos pixelados. */
export function Loading({ label = 'Cargando' }: { label?: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'var(--loading-bg)',
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600,
          fontSize: 'clamp(34px, 9vw, 56px)', color: 'var(--ink)',
          letterSpacing: 2, animation: 'pixel-bob 1.4s ease-in-out infinite',
        }}>
          {label}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="loading-dot" style={{ animationDelay: '0s' }} />
          <span className="loading-dot" style={{ animationDelay: '0.2s' }} />
          <span className="loading-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
