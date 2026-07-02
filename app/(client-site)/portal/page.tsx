import { requireClient } from './_auth';
import AdminShell from './AdminShell';
import Onboarding from './Onboarding';
import { getClientMessages, getClientSubscription } from './actions';
import { Mail, FileEdit, CreditCard, LifeBuoy } from 'lucide-react';

export const dynamic = 'force-dynamic';

const euro = (n?: number) => typeof n === 'number' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n) : '—';
const dt = (s?: string) => s ? new Date(s).toLocaleDateString('it-IT') : '—';

export default async function PortalHome() {
  const { user, project } = await requireClient();
  const pdata = project?.project_data || {};
  const cfg = pdata.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  const logo = cfg?.logo?.url as string | undefined;

  const messages = await getClientMessages();
  const newCount = messages.filter(m => m.status === 'new').length;
  const { subscription } = await getClientSubscription();

  const hasDraft = !!pdata.client_draft;
  const siteUrl = pdata.publish?.customDomain ? `https://${pdata.publish.customDomain}` : (pdata.publish?.url as string | undefined);
  const card = 'rounded-2xl border border-white/10 p-5';
  const cardBg = { background: 'var(--lumino-muted, rgba(255,255,255,0.05))' };

  return (
    <AdminShell active="dashboard" businessName={businessName} email={user.email} logo={logo}>
      <Onboarding show={!user.onboarding_completed} userName={user.full_name || ''} businessName={businessName} />

      <h1 className="mb-4 text-2xl font-semibold" style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}>Ciao {user.full_name || ''} 👋</h1>

      {hasDraft && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <span>📝 Hai modifiche non ancora pubblicate.</span>
          <span className="flex gap-2">
            <a href="/portal/publish" className="rounded px-3 py-1.5 font-semibold text-white" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>Pubblica ora</a>
            <a href="/portal/content" className="rounded border border-white/20 px-3 py-1.5">Continua a modificare</a>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* A) Il tuo sito */}
        <div className={card} style={cardBg}>
          <h2 className="flex items-center gap-2 font-semibold"><FileEdit className="h-4 w-4" /> Il tuo sito</h2>
          {siteUrl ? <a href={siteUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm text-[color:var(--lumino-accent,#8b5cf6)] hover:underline">{siteUrl}</a> : <p className="mt-2 text-sm opacity-60">Non ancora pubblicato</p>}
          <p className="mt-2 text-xs opacity-60">Ultima modifica: {dt(pdata.client_draft_updated_at)}</p>
          <p className="text-xs opacity-60">Ultima pubblicazione: {dt(pdata.client_last_publish_at || pdata.publish?.publishedAt)}</p>
          <a href="/portal/content" className="mt-3 inline-block rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>Modifica contenuti</a>
        </div>

        {/* B) Messaggi */}
        <div className={card} style={cardBg}>
          <h2 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Messaggi ricevuti</h2>
          <p className="mt-2 text-2xl font-bold">{newCount} <span className="text-sm font-normal opacity-60">nuovi</span></p>
          <ul className="mt-2 space-y-1 text-xs opacity-70">
            {messages.slice(0, 3).map(m => <li key={m.id} className="truncate">• {m.from_name || m.from_email || 'Anonimo'} — {m.subject || (m.message_body || '').slice(0, 40)}</li>)}
            {messages.length === 0 && <li>Nessun messaggio.</li>}
          </ul>
          <a href="/portal/messages" className="mt-3 inline-block rounded border border-white/20 px-3 py-1.5 text-sm">Vedi tutti</a>
        </div>

        {/* C) Abbonamento */}
        <div className={card} style={cardBg}>
          <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" /> Il tuo abbonamento</h2>
          {subscription
            ? <><p className="mt-2 text-sm">{euro(subscription.monthly_amount)}/mese · <span className="opacity-70">{subscription.status}</span></p>
              <p className="text-xs opacity-60">Prossimo pagamento: {dt(subscription.next_billing_date)}</p></>
            : <p className="mt-2 text-sm opacity-60">Nessun abbonamento attivo.</p>}
          <a href="/portal/subscription" className="mt-3 inline-block rounded border border-white/20 px-3 py-1.5 text-sm">Dettagli</a>
        </div>

        {/* D) Supporto */}
        <div className={card} style={cardBg}>
          <h2 className="flex items-center gap-2 font-semibold"><LifeBuoy className="h-4 w-4" /> Supporto</h2>
          <p className="mt-2 text-sm opacity-70">Hai bisogno di aiuto o modifiche strutturali?</p>
          <div className="mt-3 flex flex-col gap-1 text-sm">
            <a href="mailto:bylumino06@gmail.com" className="text-[color:var(--lumino-accent,#8b5cf6)] hover:underline">bylumino06@gmail.com</a>
            <a href="https://wa.me/" target="_blank" rel="noreferrer" className="text-[color:var(--lumino-accent,#8b5cf6)] hover:underline">WhatsApp</a>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
