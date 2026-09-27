import AvatarUpload from '@/components/staff/AvatarUpload'
import PageHead from '@/components/staff/PageHead'
import ProfiloForm from './ProfiloForm'
import PreferenzeSalat from './PreferenzeSalat'
import { requireStaff } from '@/lib/staff/auth'
import { firmaAvatar } from '@/lib/staff/avatar'

export const metadata = { title: 'Le mie cose' }
export const dynamic = 'force-dynamic'

/**
 * Le impostazioni personali.
 *
 * Si chiama `/staff/io` e non `/staff/impostazioni` per una ragione che non è
 * di stile: qui non ci sono impostazioni dell'applicazione — non c'è niente che
 * riguardi i clienti, i prezzi o i permessi. Ci sono la propria faccia, il
 * proprio ruolo, il proprio saluto e i propri promemoria. Chiamarla
 * «impostazioni» farebbe cercare qui, un giorno, la configurazione di qualcosa.
 *
 * Non è nel rail: si apre dal proprio nome in fondo alla barra, che è dove tutti
 * la cercano. Vedi `HREF_IMPOSTAZIONI` in `lib/staff/nav.ts`.
 *
 * **Le due metà della pagina vivono in due posti diversi, ed è voluto.** Foto,
 * ruolo e saluto stanno nel database perché li vedono gli altri (il saluto nella
 * home, la faccia nel rail, e un domani nella pagina Team). Gli orari della
 * preghiera e le ayat stanno in `localStorage` perché sono di *questo*
 * dispositivo: il metodo di calcolo e la posizione non hanno senso su un altro
 * schermo, e una colonna in più su `staff_profiles` per l'intervallo delle ayat
 * sarebbe una query a ogni apertura per un numero che si cambia una volta.
 */
export default async function IoPage() {
  const me = await requireStaff()
  const foto = await firmaAvatar(me.foto_url)

  return (
    <>
      <PageHead
        title="Le mie cose"
        sub="La faccia con cui ti vedono i colleghi, il saluto che trovi entrando, i tuoi promemoria."
      />

      <div className="lm-bento">
        <section className="lm-card" data-span="5">
          <div className="lm-card-top">
            <span className="lm-label">Foto profilo</span>
          </div>
          <AvatarUpload nome={me.nome} foto={foto} haFoto={Boolean(me.foto_url)} />
          <p className="lm-field-hint">
            Sta nella home accanto al saluto e nel rail accanto al tuo nome. Se non c’è, restano le
            iniziali.
          </p>
        </section>

        <section className="lm-card" data-span="7">
          <div className="lm-card-top">
            <span className="lm-label">Come ti chiamiamo</span>
          </div>
          <ProfiloForm
            nome={me.nome}
            ruoloTitolo={me.ruolo_titolo}
            salutoCustom={me.saluto_custom}
          />
        </section>

        <section className="lm-card" data-span="12">
          <div className="lm-card-top">
            <span className="lm-label">Promemoria della preghiera</span>
          </div>
          <PreferenzeSalat />
        </section>
      </div>
    </>
  )
}
