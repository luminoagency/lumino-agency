import Scheletro from '@/components/staff/Scheletro'

/* Oggi: il saluto grande, quattro numeri, il flusso del team largo e la
   settimana. Gli span sono quelli veri della home. */
export default function Loading() {
  return <Scheletro titolo="14ch" spans={[7, 5, 3, 3, 3, 3, 8, 4]} />
}
