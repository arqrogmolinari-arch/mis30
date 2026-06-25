import type { ReactNode } from 'react'
import type { Answer, GameState, Player, Room, TtEntry } from '../lib/types'

export interface GameContext {
  room: Room
  players: Player[]          // claimed players only, for gameplay
  answers: Answer[]          // all answers (games filter by namespaced round_key)
  ttEntries: TtEntry[]
  me?: Player                // guest only
}

export interface GameConfig {
  id: string
  initialState: (ctx: GameContext) => GameState
  renderScreen: (ctx: GameContext) => ReactNode
  renderGuest: (ctx: GameContext) => ReactNode
  renderHost: (ctx: GameContext) => ReactNode
}

import { jeopardyGame } from './jeopardy/index'
import { mostLikelyGame } from './mostLikely'
import { twoTruthsGame } from './twoTruths'

export const GAMES: Record<string, GameConfig> = {
  jeopardy: jeopardyGame,
  most_likely: mostLikelyGame,
  two_truths: twoTruthsGame,
}
