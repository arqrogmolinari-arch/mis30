export type Phase = 'lobby' | 'playing' | 'results'
export type GameId = 'quiz' | 'two_truths' | 'most_likely' | 'jeopardy'

export interface JeopardyTeam {
  id: string
  name: string
  color: string
  member_ids: string[]
  captain_id: string
  score: number
}

export interface Room {
  id: string
  code: string
  phase: Phase
  active_game: GameId | null
  game_state: GameState
  teams: JeopardyTeam[]
}

export interface GameState {
  // shared
  round_index?: number
  prompt_index?: number
  round_key?: string
  phase?: string
  timer_ends_at?: string | null
  current_player_id?: string | null
  done_player_ids?: string[]
  shuffle?: number[]
  // jeopardy
  current_team_index?: number
  board?: boolean[][]
  active_q?: { cat_i: number; val_i: number } | null
  steal_open?: boolean
  overrides?: Record<string, 'correct' | 'incorrect'>
}

export interface Player {
  id: string
  room_id: string
  slug: string
  name: string
  photo: string
  claimed_at: string | null
  score: number
}

export interface Answer {
  id: string
  room_id: string
  player_id: string
  game: GameId
  round_key: string
  value: any
  created_at: string
}

export interface TtEntry {
  id: string
  room_id: string
  player_id: string
  statements: [string, string, string]
  lie_index: number
}
