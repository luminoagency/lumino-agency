import Scheletro from '@/components/staff/Scheletro'

/* La pipeline è un kanban: quattro colonne alte, non card basse. */
export default function Loading() {
  return <Scheletro titolo="10ch" spans={[3, 3, 3, 3, 12]} />
}
