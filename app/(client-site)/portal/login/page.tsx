import { headers } from 'next/headers';
import { resolveProjectFromHost } from '@/lib/lab/domain-resolver';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accedi — Area riservata' };

export default async function PortalLoginPage() {
  const host = headers().get('host') || '';
  const res = await resolveProjectFromHost(host);
  const cfg = res?.project?.project_data?.build?.globalConfig;
  const businessName = cfg?.businessName || res?.project?.business_name || 'Area riservata';
  const logo = cfg?.logo?.url as string | undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ background: 'var(--lumino-muted, rgba(255,255,255,0.06))' }}>
        <div className="mb-5 text-center">
          {logo
            ? <img src={logo} alt={businessName} className="mx-auto mb-3 h-14 w-14 rounded object-contain" />
            : null}
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}>{businessName}</h1>
          <p className="mt-1 text-xs opacity-60">Accedi all'area gestione del tuo sito</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
