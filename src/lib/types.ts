export type Phase = 'lobby' | 'playing' | 'results'
export type GameId = 'quiz' | 'two_truths' | 'most_likely'

export interface Room {
  id: string
  code: string
  phase: Phase
  active_game: GameId | null
  game_state: GameState
}

export interface GameState {
  round_index?: number
  prompt_index?: number
  round_key?: string
  phase?: string            // per-game internal phase
  timer_ends_at?: string | null
  current_player_id?: string | null
  done_player_ids?: string[]
  shuffle?: number[]        // random order of statements for two-truths
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
