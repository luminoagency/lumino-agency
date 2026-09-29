import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ANTEPRIMA } from '@/lib/staff/db'
import { righeDemo } from '@/lib/staff/demo'

export const metadata = { title: 'Anteprima' }
export const dynamic = 'force-dynamic'

const PAGINE = [
  { href: '/staff', nome: 'Oggi', cosa: 'KPI, andamento, settimana, mappa delle zone' },
  { href: '/staff/pipeline', nome: 'Pipeline', cosa: 'KPI con mini grafico e kanban trascinabile' },
  { href: '/staff/clienti', nome: 'Clienti', cosa: 'lista scura e pannello di dettaglio viola' },
  { href: '/staff/campo', nome: 'Campo', cosa: 'visite registrate e follow-up della settimana' },
  { href: '/staff/campo/nuova', nome: 'Nuova visita', cosa: 'i tre passi, chip e controlli' },
  { href: '/staff/soldi', nome: 'Soldi', cosa: 'acconti 30/70, abbonamenti, extra, margine' },
  { href: '/staff/progetti', nome: 'Progetti', cosa: 'fasi, anteprime, domini in scadenza' },
  {
    href: '/staff/statistiche',
    nome: 'Statistiche',
    cosa: 'tassi di chiusura, mappa Leaflet, obiezioni',
  },
  { href: '/staff/archivio', nome: 'Archivio', cosa: 'ricerca, filtri, card per genere e stati vuoti' },
  { href: '/staff/lab-ai', nome: 'Lab AI', cosa: 'le due fonti, le analisi pronte e le citazioni' },
  { href: '/staff/io', nome: 'Le mie cose', cosa: 'foto profilo col ritaglio, ruolo, saluto, salat' },
  { href: '/staff/login', nome: 'Accesso', cosa: 'il pannello di vetro sulla scena' },
]

/**
 * L'indice dell'anteprima di sviluppo.
 *
 * Serve a guardare le pagine autenticate **senza avere una password e senza
 * un database pieno**: con `STAFF_DEV_PREVIEW=1` in `.env.local` il gate di
 * /staff si apre, i dati arrivano dalle venticinque righe finte di
 * `lib/staff/demo.ts` e Supabase non viene interrogato per niente.
 *
 * Fuori da lì questa pagina **non esiste**: `notFound()` e basta. I due
 * lucchetti (`NODE_ENV !== 'production'` e la variabile) stanno in
 * `lib/staff/db.ts`, e le Preview di Vercel compilano in produzione, quindi
 * sono escluse dal primo dei due anche se la variabile ci finisse per errore.
 *
 * È in sola lettura: le scritture vanno al database vero, dove senza sessione
 * la RLS le respinge. Un'anteprima che scrive è un modo per sporcare i dati
 * veri credendo di guardare un mockup.
 */
export default function AnteprimaPage() {
  if (!ANTEPRIMA) notFound()

  const dati = righeDemo()

  return (
    <div className="lm-staff-shell">
      <main className="lm-staff-main" style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p className="lm-anteprima">Anteprima di sviluppo · solo in locale</p>

        <h1 className="lm-h1" style={{ marginTop: '1.4rem' }}>
          Le pagine, coi dati finti
        </h1>
        <p className="lm-sub">
          {dati.staff_clients.length} clienti, {dati.staff_deals.length} trattative,{' '}
          {dati.staff_followups.length} richiami e {dati.staff_field_reports.length} visite, tutti
          inventati e tutti relativi a oggi. Nessuna sessione, nessuna query a Supabase.
        </p>

        <div className="lm-bento" style={{ marginTop: '1.6rem' }}>
          {PAGINE.map((p) => (
            <Link key={p.href} href={p.href} className="lm-card" data-span="6" data-hover>
              <div className="lm-card-top">
                <span className="lm-label">{p.nome}</span>
                <span className="lm-pill" data-size="sm">
                  {p.href}
                </span>
              </div>
              <p className="lm-sub" style={{ marginTop: 0 }}>
                {p.cosa}
              </p>
            </Link>
          ))}
        </div>

        <p className="lm-field-hint" style={{ marginTop: '1.4rem' }}>
          Per spegnerla: togli <code>STAFF_DEV_PREVIEW</code> da <code>.env.local</code>.
        </p>
      </main>
    </div>
  )
}
