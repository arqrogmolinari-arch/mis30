import type { GameConfig } from './registry'
export const mostLikelyGame: GameConfig = {
  id: 'most_likely',
  initialState: () => ({ prompt_index: 0, phase: 'voting' }),
  renderScreen: () => <div>most-likely (Task 10)</div>,
  renderGuest: () => <div>most-likely (Task 10)</div>,
  renderHost: () => <div>most-likely (Task 10)</div>,
}
