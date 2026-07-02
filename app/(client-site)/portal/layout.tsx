import { headers } from 'next/headers';
import { resolveProjectFromHost } from '@/lib/lab/domain-resolver';

export const dynamic = 'force-dynamic';

// Layout globale del portale cliente: applica palette + font del progetto (branding coerente).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get('host') || '';
  const res = await resolveProjectFromHost(host);
  const cfg = res?.project?.project_data?.build?.globalConfig;
  const pal = cfg?.palette;

  const style = {
    minHeight: '100vh',
    ...(pal ? {
      '--lumino-bg': pal.bg, '--lumino-ink': pal.ink,
      '--lumino-accent': pal.accent, '--lumino-muted': pal.muted,
    } : {}),
    background: pal?.bg || '#0a0a0a',
    color: pal?.ink || '#f4f4f5',
    fontFamily: cfg?.font?.body ? `'${cfg.font.body}', system-ui, sans-serif` : 'system-ui, sans-serif',
  } as React.CSSProperties;
  const fonts = [cfg?.font?.heading, cfg?.font?.body].filter(Boolean) as string[];

  return (
    <div style={style}>
      {fonts.length > 0 && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join('&')}&display=swap`} />
      )}
      {children}
    </div>
  );
}
