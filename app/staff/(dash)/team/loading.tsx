import Scheletro from '@/components/staff/Scheletro'

/* Team: tre card in cima (il totale, l'obiettivo, il chiuso) e poi una riga
   per persona. Sono pochi, quindi quattro righe bastano a tenere il posto. */
export default function Loading() {
  return <Scheletro titolo="11ch" spans={[4, 4, 4, 12]} />
}
