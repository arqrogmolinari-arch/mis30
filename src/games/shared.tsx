import { setActiveGame } from '../lib/actions'
import { PillButton } from '../components/ui/PillButton'

export function HostBackToHub({ room }: { room: { id: string } }) {
  return <PillButton onClick={() => setActiveGame(room.id, null, {})}>Volver al hub</PillButton>
}
