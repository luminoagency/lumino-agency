import Scheletro from '@/components/staff/Scheletro'

/* La mappa Leaflet occupa mezza schermata: la sagoma alta le tiene il posto,
   altrimenti la pagina cresce di colpo quando la libreria arriva. */
export default function Loading() {
  return <Scheletro titolo="12ch" spans={[3, 3, 3, 3, 8, 4, 12]} />
}
