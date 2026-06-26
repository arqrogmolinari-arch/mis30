import rosterData from '../content/players.json'

export interface RosterEntry {
  slug: string
  name: string
}

export const roster: RosterEntry[] = rosterData as RosterEntry[]

/** Photo path for a slug. Falls back to a placeholder if the file is missing. */
export function photoFor(slug: string): string {
  return `/players/${slug}.png`
}

/** Deterministic glam gradient per slug, used as a placeholder behind missing photos. */
export function gradientFor(slug: string): string {
  const pairs = [
    ['#FF9E5E', '#FF4FB6'], ['#B86CD9', '#FF4FB6'], ['#FF4FB6', '#FFB6D9'],
    ['#FF9E5E', '#B86CD9'], ['#B86CD9', '#FFB6D9'], ['#FF4FB6', '#FF9E5E'],
  ]
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const [a, b] = pairs[h % pairs.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
