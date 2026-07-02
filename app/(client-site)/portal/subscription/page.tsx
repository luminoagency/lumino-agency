import { requireClient } from '../_auth';
import AdminShell from '../AdminShell';
import { getClientSubscription } from '../actions';
import type { Subscription, Invoice } from '@/lib/lab/subscriptions';

export const dynamic = 'force-dynamic';

const eur = (n: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const itDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('it-IT') : '—';

const SUB_STATUS: Record<string, { label: string; bg: string }> = {
  active: { label: 'Attivo', bg: '#16a34a' },
  past_due: { label: 'In ritardo', bg: '#d97706' },
  suspended: { label: 'Sospeso', bg: '#dc2626' },
  canceled: { label: 'Cancellato', bg: '#6b7280' },
  trial: { label: 'Prova', bg: '#2563eb' },
};

const INV_STATUS: Record<string, { label: string; bg: string }> = {
  paid: { label: 'Pagata', bg: '#16a34a' },
  pending: { label: 'In attesa', bg: '#d97706' },
  failed: { label: 'Fallita', bg: '#dc2626' },
  draft: { label: 'Bozza', bg: '#6b7280' },
  refunded: { label: 'Rimborsata', bg: '#6b7280' },
};

const INV_TYPE: Record<string, string> = {
  setup: 'Setup',
  monthly: 'Mensile',
  'one-off': 'Una tantum',
};

function Badge({ label, bg }: { label: string; bg: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ background: bg }}
    >
      {label}
    </span>
  );
}

export default async function Page() {
  const { user, project } = await requireClient();
  const cfg = project?.project_data?.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  const { subscription, invoices }: { subscription?: Subscription; invoices: Invoice[] } =
    await getClientSubscription();

  const border = '1px solid var(--lumino-muted, rgba(255,255,255,0.12))';
  const cardStyle = { border, borderRadius: '0.75rem', padding: '1.25rem' } as const;
  const recent = invoices.slice(0, 12);

  return (
    <AdminShell active="subscription" businessName={businessName} email={user.email} logo={cfg?.logo?.url}>
      <div className="mx-auto max-w-4xl">
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}
        >
          Il tuo abbonamento
        </h1>

        {!subscription ? (
          <div style={cardStyle} className="text-sm opacity-80">
            Nessun abbonamento attivo. Per informazioni contatta Lumino.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Riepilogo piano */}
            <div style={cardStyle}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm opacity-60">Piano</div>
                  <div className="text-xl font-semibold">
                    {eur(subscription.monthly_amount)}
                    <span className="text-sm font-normal opacity-60"> /mese</span>
                  </div>
                </div>
                <Badge
                  label={(SUB_STATUS[subscription.status] || { label: subscription.status }).label}
                  bg={(SUB_STATUS[subscription.status] || { bg: '#6b7280' }).bg}
                />
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="opacity-60">Prossimo pagamento</dt>
                  <dd className="font-medium">{itDate(subscription.next_billing_date)}</dd>
                </div>
                <div>
                  <dt className="opacity-60">Ultimo pagamento</dt>
                  <dd className="font-medium">{itDate(subscription.last_paid_at)}</dd>
                </div>
                <div>
                  <dt className="opacity-60">Metodo di pagamento</dt>
                  <dd className="font-medium">{subscription.provider || '—'}</dd>
                </div>
                <div>
                  <dt className="opacity-60">Costo di attivazione (setup)</dt>
                  <dd className="font-medium">
                    {subscription.setup_fee_amount != null ? eur(subscription.setup_fee_amount) : '—'}
                    {subscription.setup_fee_amount != null ? (
                      <span className="ml-2">
                        <Badge
                          label={subscription.setup_fee_paid ? 'Pagato' : 'Da pagare'}
                          bg={subscription.setup_fee_paid ? '#16a34a' : '#d97706'}
                        />
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Storico fatture */}
            <div style={cardStyle}>
              <h2 className="mb-3 text-lg font-semibold">Storico fatture</h2>
              {recent.length === 0 ? (
                <p className="text-sm opacity-60">Nessuna fattura disponibile.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="opacity-60" style={{ borderBottom: border }}>
                        <th className="py-2 pr-3 font-medium">Numero</th>
                        <th className="py-2 pr-3 font-medium">Tipo</th>
                        <th className="py-2 pr-3 font-medium">Importo</th>
                        <th className="py-2 pr-3 font-medium">Scadenza</th>
                        <th className="py-2 pr-3 font-medium">Stato</th>
                        <th className="py-2 pr-3 font-medium">Metodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((inv) => {
                        const st = INV_STATUS[inv.status] || { label: inv.status, bg: '#6b7280' };
                        return (
                          <tr key={inv.id} style={{ borderBottom: border }}>
                            <td className="py-2 pr-3 font-medium">{inv.invoice_number}</td>
                            <td className="py-2 pr-3">{INV_TYPE[inv.invoice_type] || inv.invoice_type}</td>
                            <td className="py-2 pr-3">{eur(inv.amount)}</td>
                            <td className="py-2 pr-3">{itDate(inv.due_date)}</td>
                            <td className="py-2 pr-3">
                              <Badge label={st.label} bg={st.bg} />
                            </td>
                            <td className="py-2 pr-3">{inv.payment_method || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Azioni */}
            <div style={cardStyle} className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled
                  title="In arrivo"
                  className="cursor-not-allowed rounded px-4 py-2 text-sm opacity-50"
                  style={{ border }}
                >
                  Cambia carta di credito
                </button>
                <a
                  href="mailto:bylumino06@gmail.com"
                  className="rounded px-4 py-2 text-sm"
                  style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}
                >
                  Contatta Lumino per modifiche
                </a>
              </div>
              <p
                className="rounded-lg px-4 py-3 text-sm"
                style={{ border, background: 'rgba(139,92,246,0.08)' }}
              >
                Per modificare il tuo piano o cancellare, contatta Lumino.
              </p>
              <p className="text-xs opacity-50">
                I dati di fatturazione sono gestiti da Lumino e non sono modificabili da questa pagina.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
