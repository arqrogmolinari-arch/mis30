# Game Header with Team Info & Scores Modal

**Date:** 2026-06-26  
**Scope:** Jeopardy guest view (`renderGuest`)

---

## Goal

Show each player, during an active Jeopardy game, which team they're on and how many points they have. A trophy icon opens a modal with the partial leaderboard of all teams.

---

## Component: `<GameHeader />`

**Location:** `src/components/ui/GameHeader.tsx`

**Props:**
```ts
interface GameHeaderProps {
  myTeam: JeopardyTeam
  teams: JeopardyTeam[]
}
```

**Behavior:**
- Manages its own `modalOpen` boolean state via `useState`.
- Renders a sticky bar fixed to the top of the viewport.
- Trophy button toggles the modal.
- Clicking the modal overlay closes it.

---

## Visual Design

### Sticky header bar
- `position: fixed`, `top: 0`, `left: 0`, `right: 0`, `zIndex: 100`
- Height ~40px, `padding: 0 16px`
- Background: `#FF4FB6` (--pink-hot)
- Layout: flexbox, `justify-content: space-between`, `align-items: center`

### Left side — team info
- Team name: Quicksand, bold, white, ~15px
- Score: same line or tight below, `rgba(255,255,255,0.65)`, ~13px, lighter weight
- Example: **Team Rosa** · *300 pts* (in muted white)

### Right side — trophy button
- Inline SVG trophy icon, white, ~22px
- No border/background, `cursor: pointer`
- Tap opens the scores modal

---

## Scores Modal

- **Overlay:** `position: fixed`, full viewport, `background: rgba(0,0,0,0.45)`, `zIndex: 200`, tap closes
- **Card:** centered, `background: white`, `borderRadius: 16px`, `padding: 20px 24px`, `maxWidth: 320px`
- **Title:** "Resultados parciales" — Pixelify Sans, `#5A2A4A`, ~22px
- **Team list:** sorted descending by score. Each row:
  - Color dot (12px circle, team color)
  - Team name (Quicksand bold, `#5A2A4A`)
  - Score right-aligned (Pixelify Sans, team color, ~20px)
- Rows separated by subtle divider or gap

---

## Integration in Jeopardy `renderGuest()`

- Import and render `<GameHeader myTeam={myTeam} teams={teams} />` at the top of the JSX for active phases: `picking`, `answering`, `stealing`, `revealing`.
- Do **not** render it during `setup` or `finished` phases (those phases have their own messaging).
- Add `paddingTop: 44px` to the wrapping div of each active-phase render to prevent content from being hidden behind the fixed header.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/GameHeader.tsx` | New component |
| `src/games/jeopardy/index.tsx` | Import and render `<GameHeader>` in active phases of `renderGuest()`, add paddingTop offsets |

---

## Out of scope

- Other games (most_likely, twoTruths) — they don't use teams
- Host or Screen views — unaffected
- Animations on modal open/close (keep it simple)
