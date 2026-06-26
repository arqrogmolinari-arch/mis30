import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  selected?: boolean
}

/** Botón simple con outline stroke (sin pixel art). Texto en sans-serif. */
export function PillButton({ variant = 'primary', selected, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      style={{
        cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
        fontWeight: 700, letterSpacing: '0.3px',
        fontSize: 16, padding: '13px 24px', borderRadius: 999,
        border: '2.5px solid #5A2A4A',
        color: variant === 'primary' ? '#fff' : '#5A2A4A',
        background: variant === 'primary' ? '#FF4FB6' : 'rgba(255,255,255,0.85)',
        boxShadow: selected ? '0 0 0 3px #FFB6D9, 0 4px 0 rgba(90,42,74,0.18)' : 'none',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        touchAction: 'manipulation',
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    />
  )
}
