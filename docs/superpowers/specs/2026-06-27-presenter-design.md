# Presenter View — Design Spec
Date: 2026-06-27

## Overview

A read-only TV-optimized display accessible from the host panel via a "Presentar" button. Designed to be shown on a television so all teams can follow the game: current question, correct answer on reveal, and a permanent score band at the bottom.

## Access

- "Presentar" button (ghost PillButton style) added to `Host.tsx` — visible in all host phases (lobby and during game).
- Opens `/presenter` (or `/presenter/:code`) in a new browser tab (`target="_blank"`).
- No authentication required — same as `/screen`.

## Routes

Add to `App.tsx`:
```
/presenter       → <Presenter />
/presenter/:code → <Presenter />
```

## New file: `src/routes/Presenter.tsx`

Reads state via `useRoom(code)` (same hook as other routes). No game registry changes — component reads `room.game_state` and `room.teams` directly for jeopardy.

## Layout

```
┌─────────────────────────────────────┐
│                                     │
│         MAIN CONTENT (85%)          │
│      (phase-dependent content)      │
│                                     │
├─────────────────────────────────────┤
│   SCORE BAND (15%) — always visible │
│  [Team A · 200]  [Team B · 150]     │
└─────────────────────────────────────┘
```

- Background: `#1A0A14` (very dark burgundy, consistent with project palette)
- Main content: centered vertically and horizontally, text `clamp(48px, 6vw, 80px)`
- Score band: `position: fixed`, bottom 0, full width, `rgba(0,0,0,0.55)` background

## Phase content

| Jeopardy phase | Main content |
|---------------|--------------|
| `setup` | "Preparando el juego…" centered |
| `picking` | `JeopardyBoard` (reused, read-only, scaled for TV) + current team indicator |
| `answering` | Category + pts badge · Question (huge text) · Countdown timer |
| `stealing` | Same as answering + "ROBO" badge in pink |
| `revealing` | Question (large) → Answer box (prominent, white on dark) → "+X pts → Team" or "Nadie acertó" |
| `finished` | `TeamPodium` (existing component, centered) |

## Score band details

- Teams displayed side by side with their team color
- Name + score in `Pixelify Sans`, score large (~40px)
- Active team (current turn) gets a colored border/glow highlight
- Updates in real-time via existing Supabase subscription in `useRoom`

## What this is NOT

- Not interactive — no buttons, no inputs
- Does not show individual player answers (only correct answer + winning team on reveal)
- Does not replace `/screen` — both coexist
