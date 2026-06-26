import { useEffect, useState } from 'react'

/** Renders seconds remaining until `endsAt` (ISO). Visual only. */
export function Countdown({ endsAt }: { endsAt: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  if (!endsAt) return null
  const remaining = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000))
  return (
    <div style={{
      fontFamily: 'Pixelify Sans, sans-serif', fontWeight: 600, fontSize: 48,
      color: remaining <= 5 ? '#FF4FB6' : '#5A2A4A',
    }}>{remaining}</div>
  )
}
