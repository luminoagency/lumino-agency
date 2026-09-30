import { notFound } from 'next/navigation'
import { Mail, Phone } from 'lucide-react'
import { Progress } from '@/components/staff/Bars'
import Counter from '@/components/staff/Counter'
import NuovoMembro from '@/components/staff/NuovoMembro'
import PageHead from '@/components/staff/PageHead'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { iniziali } from '@/lib/staff/avatar'
import { caricaTeam, type MembroTeam } from '@/lib/staff/f5'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import { euro } from '@/lib/staff/types'

export const metadata = { title: 'Team' }
export const dynamic = 'force-dynamic'

/**
 * La squadra.
 *
 * Solo admin. Il menù nasconde già la voce a chi non lo è, ma nascondere un link
 * non protegge un indirizzo: /staff/team si scrive a mano. `notFound()` e non un
 * messaggio di divieto — a un venditore questa pagina non deve nemmeno risultare
 * esistente.
 *
 * ## Non è una rubrica
 *
 * Il piano diceva «utenti, ruoli, obiettivi mensili, provvigioni», e con quelle
 * quattro cose sarebbe venuto fuori un elenco di nomi con accanto due numeri
 * fermi — cioè una pagina che si apre una volta e poi mai più. Quello che si
 * vuole sapere guardando la squadra è **come sta andando ognuno adesso**: quanti
 * clienti tiene, quanto ha chiuso, a che punto è dell'obiettivo del mese.
 * L'obiettivo è una barra e non una percentuale scritta, perché «68%» e una
 * barra piena per due terzi si leggono in tempi diversi, e questa pagina la si
 * guarda di sfuggita.
 *
 * ## Gli account adesso si creano da qui, ma non li crea chiunque
 *
 * Per cinque fasi questa pagina ha scritto «gli account si creano nella
 * dashboard di Supabase», e la ragione era buona: creare un utente vuol dire
 * creare credenziali, cioè `auth.admin.createUser` con la service-role, e una
 * route che crea account è il primo posto che qualcuno proverebbe a spingere.
 *
 * Ora si assume, e passare da Supabase per ogni persona vuol dire che l'unico
 * che può farlo è chi ha quelle chiavi. Il bottone c'è, ma dietro un permesso
 * che **non coincide con `admin`**: `puo_creare_membri` (migration 0037) ce
 * l'hanno le tre persone che l'hanno fondata, e un amministratore creato da
 * questo stesso bottone non lo eredita. Se il permesso si ereditasse, la prima
 * persona assunta avrebbe la chiave di casa.
 *
 * Nascondere il bottone non è il controllo: `creaMembro` rifà la stessa domanda
 * prima di toccare `auth.users`.
 */
export default async function TeamPage() {
  const me = await requireStaff()
  if (me.role !== 'admin') notFound()

  const { membri, mancaSchema } = await caricaTeam()

  const attivi = membri.filter((m) => m.attivo)
  const obiettivoTotale = attivi.reduce((s, m) => s + (m.obiettivo_mensile ?? 0), 0)
  const incassatoTotale = membri.reduce((s, m) => s + m.incassato, 0)
  const incassatoMese = membri.reduce((s, m) => s + m.incassatoMese, 0)
  const chiuseTotali = membri.reduce((s, m) => s + m.chiuse, 0)

  return (
    <>
      <PageHead
        title={
          <>
            La <em>squadra</em>
          </>
        }
        sub={`${attivi.length} in attività${
          membri.length > attivi.length ? `, ${membri.length - attivi.length} sospesi` : ''
        } · ${chiuseTotali} trattative chiuse in tutto`}
      />

      {mancaSchema && <p className="lm-avviso">{AVVISO_SCHEMA}</p>}

      <div className="lm-bento">
        {/* La card nera della schermata: l'obiettivo di squadra. È l'unico
            numero di questa pagina che riguardi tutti insieme, e l'unico che, se
            non si guarda, costa. */}
        <article className="lm-card" data-span={5} data-tone="black">
          <div className="lm-card-top">
            <span className="lm-label">obiettivo del mese, tutti insieme</span>
            {obiettivoTotale > 0 && (
              <span className="lm-muted">
                {Math.round((incassatoMese / obiettivoTotale) * 100)}%
              </span>
            )}
          </div>
          <p className="lm-num">
            <Counter value={obiettivoTotale} format="euro" />
          </p>
          {/* Un obiettivo senza «a che punto siamo» è un numero che non si
              guarda: è la stessa regola per cui ogni persona qui sotto ha la
              sua barra, e questa card — che è quella di tutti — non l'aveva.
              La barra sta sotto il totale e porta accanto la cifra vera, non
              solo la percentuale: «2.658 €» e «1.124 € entrati» rispondono a
              due domande diverse, e chi apre questa pagina le ha tutte e due. */}
          {obiettivoTotale > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: '0.7rem' }}>
              <Progress
                value={incassatoMese}
                max={obiettivoTotale}
                display={euro(incassatoMese)}
                label="Verso l’obiettivo del mese"
              />
              <p className="lm-muted" style={{ marginTop: '0.45rem' }}>
                {euro(incassatoMese)} entrati questo mese · ripartito su{' '}
                {attivi.filter((m) => m.obiettivo_mensile).length} persone.
              </p>
            </div>
          )}
          {obiettivoTotale === 0 && (
            <p className="lm-muted">
              Nessun obiettivo impostato: si mettono da Supabase, colonna obiettivo_mensile.
            </p>
          )}
        </article>

        <article className="lm-card" data-span={4} data-tone="pearl">
          <div className="lm-card-top">
            <span className="lm-label">incassato da sempre</span>
          </div>
          <p className="lm-num">
            <Counter value={incassatoTotale} format="euro" />
          </p>
          <p className="lm-muted">Solo quello entrato davvero: acconti pagati più saldi pagati.</p>
        </article>

        <article className="lm-card" data-span={3}>
          <div className="lm-card-top">
            <span className="lm-label">gli account</span>
          </div>
          {me.puo_creare_membri ? (
            <div style={{ marginTop: 'auto' }}>
              <p className="lm-sub" style={{ marginBottom: '0.9rem' }}>
                Nome, ruolo, email e una password iniziale: l’account e il profilo nascono insieme.
                Obiettivi e provvigioni si scrivono dopo, da Supabase.
              </p>
              <NuovoMembro />
            </div>
          ) : (
            <p className="lm-sub" style={{ marginTop: 'auto' }}>
              Li crea chi ha fondato lo studio. Se serve una persona in più, chiedi a loro: il
              permesso non si dà da soli, nemmeno essendo amministratori.
            </p>
          )}
        </article>

        {membri.map((m) => (
          <Persona key={m.id} m={m} io={m.id === me.id} />
        ))}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Persona({ m, io }: { m: MembroTeam; io: boolean }) {
  return (
    /* `Tilt` non prende `data-span` né `tone`: disegna un contenitore e
       basta. Lo span del bento e il tono viola di «sono io» stanno sul div
       dentro, che è la card vera. */
    <div className="lm-persona-cella" data-span={4}>
      <Tilt className="lm-card lm-persona" data-tone={io ? 'violet' : undefined}>
        <header className="lm-persona-testa">
          <span className="lm-avatar" data-size="lg" data-foto={Boolean(m.foto)}>
            {m.foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.foto} alt="" />
            ) : (
              <span aria-hidden="true">{iniziali(m.nome)}</span>
            )}
          </span>
          <span className="lm-persona-chi">
            <b>{m.nome}</b>
            <small>
              {m.ruolo_titolo ?? (m.role === 'admin' ? 'Amministratore' : 'Venditore')}
              {!m.attivo && ' · sospeso'}
            </small>
          </span>
        </header>

        <dl className="lm-persona-numeri">
          <div>
            <dt>clienti</dt>
            <dd>{m.clienti}</dd>
          </div>
          <div>
            <dt>chiuse</dt>
            <dd>{m.chiuse}</dd>
          </div>
          <div>
            <dt>incassato</dt>
            <dd>{euro(m.incassato)}</dd>
          </div>
        </dl>

        {m.versoObiettivo !== null ? (
          <div className="lm-persona-obiettivo">
            {/* Oltre il 100% la barra resta piena e il numero accanto dice il
              vero: una barra che sfonda il proprio contenitore è un difetto,
              non un premio. */}
            <Progress
              label={`su ${euro(m.obiettivo_mensile)} questo mese`}
              value={Math.min(100, m.versoObiettivo)}
              max={100}
              display={`${m.versoObiettivo}%`}
            />
          </div>
        ) : (
          <p className="lm-muted lm-persona-obiettivo">Nessun obiettivo mensile.</p>
        )}

        <footer className="lm-persona-piede">
          {m.email && (
            <a href={`mailto:${m.email}`} aria-label={`Scrivi a ${m.nome}`}>
              <Mail aria-hidden="true" /> {m.email}
            </a>
          )}
          {m.telefono && (
            <a href={`tel:${m.telefono}`} aria-label={`Chiama ${m.nome}`}>
              <Phone aria-hidden="true" /> {m.telefono}
            </a>
          )}
          {m.provvigione_pct !== null && (
            <span className="lm-muted">{m.provvigione_pct}% di provvigione</span>
          )}
        </footer>
      </Tilt>
    </div>
  )
}
