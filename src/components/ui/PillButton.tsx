import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  selected?: boolean
}

export function PillButton({ variant = 'primary', selected, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      style={{
        border: 'none', cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
        fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
        fontSize: 18, padding: '16px 22px', borderRadius: 999,
        color: variant === 'primary' ? '#fff' : '#5A2A4A',
        background: variant === 'primary'
          ? 'linear-gradient(135deg, #FF4FB6, #B86CD9)'
          : 'rgba(255,255,255,0.7)',
        boxShadow: selected
          ? '0 0 0 4px #FF4FB6, 0 4px 0 rgba(90,42,74,0.25)'
          : '0 4px 0 rgba(90,42,74,0.25)',
        transition: 'transform 0.12s ease',
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    />
  )
}
