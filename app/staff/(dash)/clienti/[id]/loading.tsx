import Scheletro from '@/components/staff/Scheletro'

/* La scheda cliente: il nome in grande, i dati a sinistra, lo storico a
   destra. È la pagina che si apre più spesso di tutte — da un elenco, quindi
   con un clic su una riga — ed è quella dove lo scheletro conta di più. */
export default function Loading() {
  return <Scheletro titolo="13ch" spans={[7, 5, 6, 6]} />
}
