const KEY = 'rocio30_player_id'

export function getMyPlayerId(): string | null {
  return localStorage.getItem(KEY)
}

export function setMyPlayerId(id: string): void {
  localStorage.setItem(KEY, id)
}

export function clearMyPlayerId(): void {
  localStorage.removeItem(KEY)
}
