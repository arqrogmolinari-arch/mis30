import type { JeopardyTeam } from '../../lib/types'

export const TEAM_COLORS = ['#FF6B9D', '#A78BFA', '#34D399', '#FBBF24']
export const POINT_VALUES = [100, 200, 300, 400, 500]

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function isCorrect(answer: string, accept: string[]): boolean {
  if (!answer.trim()) return false
  const n = normalize(answer)
  return accept.some((k) => n.includes(normalize(k)))
}

export function jRoundKey(catI: number, valI: number): string {
  return `j:${catI}:${valI}`
}

export function getMyTeam(teams: JeopardyTeam[], playerId: string): JeopardyTeam | undefined {
  return teams.find((t) => t.member_ids.includes(playerId))
}

export function isCaptain(team: JeopardyTeam | undefined, playerId: string): boolean {
  return team?.captain_id === playerId
}
