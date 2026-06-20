import type { GameConfig } from './registry'
export const twoTruthsGame: GameConfig = {
  id: 'two_truths',
  initialState: () => ({ phase: 'writing' }),
  renderScreen: () => <div>two-truths (Task 11)</div>,
  renderGuest: () => <div>two-truths (Task 11)</div>,
  renderHost: () => <div>two-truths (Task 11)</div>,
}
