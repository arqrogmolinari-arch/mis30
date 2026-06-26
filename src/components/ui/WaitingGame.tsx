import { useEffect, useRef, useState, useCallback } from 'react'

const GRAVITY = 0.6
const JUMP_VY = 11
const INITIAL_SPEED = 4
const GAME_HEIGHT = 140
const GIRL_X = 44
const GIRL_W = 24
const GIRL_H = 32
const OBS_W = 16
const OBS_H = 20

type Obs = { id: number; x: number }

type RS = {
  girlY: number
  isAirborne: boolean
  runFrame: number
  obstacles: Obs[]
  score: number
  gameOver: boolean
  flash: boolean
}

const INIT_RS: RS = {
  girlY: 0, isAirborne: false, runFrame: 0,
  obstacles: [], score: 0, gameOver: false, flash: false,
}

function GirlSprite({ isAirborne, runFrame, flash }: {
  isAirborne: boolean
  runFrame: number
  flash: boolean
}) {
  const alt = !isAirborne && runFrame === 1
  return (
    <svg
      viewBox="0 0 12 16"
      width={GIRL_W}
      height={GIRL_H}
      shapeRendering="crispEdges"
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        filter: flash ? 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(290deg)' : 'none',
      }}
    >
      {/* Hair */}
      <rect x="3" y="0" width="6" height="1" fill="#E8C44A" />
      <rect x="2" y="1" width="8" height="1" fill="#E8C44A" />
      <rect x="1" y="2" width="2" height="8" fill="#D4A832" />
      <rect x="9" y="2" width="2" height="8" fill="#D4A832" />
      {/* Face */}
      <rect x="3" y="2" width="6" height="6" fill="#FFD6B0" />
      {/* Eyes */}
      <rect x="4" y="3" width="1" height="2" fill="#3A2050" />
      <rect x="7" y="3" width="1" height="2" fill="#3A2050" />
      {/* Mouth */}
      <rect x="5" y="6" width="2" height="1" fill="#CC3377" />
      {/* Dress body */}
      <rect x="2" y="8" width="8" height="3" fill="#FF9ECC" />
      {/* Skirt */}
      <rect x="1" y="11" width="10" height="1" fill="#FF9ECC" />
      <rect x="0" y="12" width="12" height="1" fill="#FFB8DC" />
      {/* Legs — alternate frame when running */}
      {alt ? (
        <>
          <rect x="2" y="13" width="2" height="2" fill="#5A3A6A" />
          <rect x="2" y="15" width="3" height="1" fill="#5A3A6A" />
          <rect x="8" y="13" width="2" height="1" fill="#5A3A6A" />
          <rect x="7" y="14" width="2" height="2" fill="#5A3A6A" />
        </>
      ) : (
        <>
          <rect x="3" y="13" width="2" height="3" fill="#5A3A6A" />
          <rect x="7" y="13" width="2" height="3" fill="#5A3A6A" />
        </>
      )}
    </svg>
  )
}

function FlowerSprite() {
  return (
    <svg
      viewBox="0 0 8 10"
      width={OBS_W}
      height={OBS_H}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {/* Top petal */}
      <rect x="2" y="0" width="4" height="2" fill="#FF4FB6" />
      {/* Left petal */}
      <rect x="0" y="2" width="2" height="3" fill="#FF4FB6" />
      {/* Right petal */}
      <rect x="6" y="2" width="2" height="3" fill="#FF4FB6" />
      {/* Center */}
      <rect x="2" y="1" width="4" height="4" fill="#FFD700" />
      {/* Stem */}
      <rect x="3" y="6" width="2" height="4" fill="#5A9A3A" />
    </svg>
  )
}

export function WaitingGame({ name }: { name: string }) {
  const [rs, setRs] = useState<RS>(INIT_RS)

  const girlYRef  = useRef(0)
  const girlVYRef = useRef(0)
  const obsRef    = useRef<Obs[]>([])
  const speedRef  = useRef(INITIAL_SPEED)
  const nextRef   = useRef(80)
  const idRef     = useRef(0)
  const scoreRef  = useRef(0)
  const goRef     = useRef(false)
  const rafRef    = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const resetGame = useCallback(() => {
    goRef.current     = false
    girlYRef.current  = 0
    girlVYRef.current = 0
    obsRef.current    = []
    speedRef.current  = INITIAL_SPEED
    nextRef.current   = 80
    idRef.current     = 0
    scoreRef.current  = 0
    setRs(INIT_RS)
  }, [])

  const jump = useCallback(() => {
    if (goRef.current) {
      resetGame()
      return
    }
    if (girlYRef.current === 0) {
      girlVYRef.current = JUMP_VY
    }
  }, [resetGame])

  useEffect(() => {
    const gameWidth = gameAreaRef.current?.offsetWidth ?? 420
    let frameCount = 0

    const tick = () => {
      if (goRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      frameCount++

      // Physics (Y increases upward, gravity pulls down)
      girlVYRef.current -= GRAVITY
      const newY = Math.max(0, girlYRef.current + girlVYRef.current)
      if (newY === 0) girlVYRef.current = 0
      girlYRef.current = newY
      const onGround = newY === 0

      // Run frame — toggle every 8 frames while on ground
      const runFrame = onGround ? Math.floor(frameCount / 8) % 2 : 0

      // Move obstacles, count cleared
      let cleared = 0
      const newObs: Obs[] = []
      for (const o of obsRef.current) {
        const nx = o.x - speedRef.current
        if (nx < -OBS_W) { cleared++; continue }
        newObs.push({ ...o, x: nx })
      }
      obsRef.current = newObs

      // Update score + speed
      let newScore = scoreRef.current
      if (cleared > 0) {
        newScore = scoreRef.current + cleared
        scoreRef.current = newScore
        if (newScore % 5 === 0) {
          speedRef.current = Math.min(speedRef.current + 0.3, 12)
        }
      }

      // Spawn obstacle
      nextRef.current--
      if (nextRef.current <= 0) {
        obsRef.current = [...obsRef.current, { id: idRef.current++, x: gameWidth + 10 }]
        nextRef.current = 60 + Math.floor(Math.random() * 90)
      }

      // Collision (bounding box with 4px margin)
      const gLeft   = GIRL_X + 4
      const gRight  = GIRL_X + GIRL_W - 4
      const gBottom = newY
      const gTop    = newY + GIRL_H - 4

      let hit = false
      for (const o of obsRef.current) {
        const oLeft  = o.x + 4
        const oRight = o.x + OBS_W - 4
        const oTop   = OBS_H - 4
        if (gRight > oLeft && gLeft < oRight && gBottom < oTop && gTop > 0) {
          hit = true
          break
        }
      }

      if (hit) {
        goRef.current = true
        setRs(prev => ({ ...prev, gameOver: true, flash: true }))
        setTimeout(() => setRs(prev => ({ ...prev, flash: false })), 400)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      setRs({
        girlY: newY,
        isAirborne: !onGround,
        runFrame,
        obstacles: [...obsRef.current],
        score: newScore,
        gameOver: false,
        flash: false,
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [resetGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey)
  }, [jump])

  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      jump()
    }
    document.addEventListener('touchstart', onTouch, { passive: false })
    return () => document.removeEventListener('touchstart', onTouch)
  }, [jump])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px 40px',
        userSelect: 'none',
      }}
    >
      {/* Header: nombre + score */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          fontFamily: 'Pixelify Sans, sans-serif',
          color: '#5A2A4A',
        }}
      >
        <span style={{ fontSize: 'clamp(22px, 6vw, 30px)' }}>Hola {name}!</span>
        <span style={{ fontSize: 'clamp(18px, 5vw, 24px)' }}>{rs.score}</span>
      </div>

      {/* Área de juego */}
      <div
        ref={gameAreaRef}
        onPointerDown={jump}
        style={{
          width: '100%',
          maxWidth: 480,
          height: GAME_HEIGHT,
          position: 'relative',
          borderBottom: '2px solid var(--pink-hot)',
          cursor: 'pointer',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Chica */}
        <div
          style={{
            position: 'absolute',
            left: GIRL_X,
            bottom: rs.girlY,
            width: GIRL_W,
            height: GIRL_H,
          }}
        >
          <GirlSprite
            isAirborne={rs.isAirborne}
            runFrame={rs.runFrame}
            flash={rs.flash}
          />
        </div>

        {/* Flores obstáculo */}
        {rs.obstacles.map(o => (
          <div
            key={o.id}
            style={{
              position: 'absolute',
              left: o.x,
              bottom: 0,
              width: OBS_W,
              height: OBS_H,
            }}
          >
            <FlowerSprite />
          </div>
        ))}

        {/* Game over */}
        {rs.gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Pixelify Sans, sans-serif',
              color: '#5A2A4A',
              fontSize: 22,
              letterSpacing: 1,
            }}
          >
            ¡Ay!
          </div>
        )}
      </div>

      {/* Footer */}
      <p
        style={{
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: 700,
          color: '#5A2A4A',
          opacity: 0.75,
          fontSize: 'clamp(13px, 3.8vw, 16px)',
          margin: '14px 0 4px',
          textAlign: 'center',
        }}
      >
        {rs.gameOver ? 'Tocá para reiniciar' : 'Tocá para saltar'}
      </p>
      <p
        style={{
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: 700,
          color: '#5A2A4A',
          opacity: 0.55,
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Esperando que comience la partida…
      </p>
    </div>
  )
}
