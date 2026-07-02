'use client';

import { logoutAction } from './actions';
import { LayoutDashboard, FileEdit, Mail, Rocket, CreditCard, Settings, LogOut } from 'lucide-react';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { key: 'content', label: 'Contenuti', href: '/portal/content', icon: FileEdit },
  { key: 'messages', label: 'Messaggi', href: '/portal/messages', icon: Mail },
  { key: 'publish', label: 'Pubblica', href: '/portal/publish', icon: Rocket },
  { key: 'subscription', label: 'Abbonamento', href: '/portal/subscription', icon: CreditCard },
  { key: 'settings', label: 'Impostazioni', href: '/portal/settings', icon: Settings },
];

export default function AdminShell({ active, businessName, email, logo, children }: {
  active: string; businessName: string; email: string; logo?: string; children: React.ReactNode;
}) {
  const border = '1px solid var(--lumino-muted, rgba(255,255,255,0.12))';
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: border }}>
        <div className="flex items-center gap-2">
          {logo ? <img src={logo} alt={businessName} className="h-8 w-8 rounded object-contain" /> : null}
          <span className="font-semibold" style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}>{businessName}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden opacity-60 sm:inline">{email}</span>
          <button onClick={() => logoutAction()} className="flex items-center gap-1.5 rounded px-2 py-1 opacity-80 hover:opacity-100" style={{ border }}>
            <LogOut className="h-3.5 w-3.5" /> Esci
          </button>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden w-52 shrink-0 p-3 sm:block" style={{ borderRight: border, minHeight: 'calc(100vh - 57px)' }}>
          <nav className="space-y-1">
            {NAV.map(n => {
              const Icon = n.icon;
              const on = n.key === active;
              return (
                <a key={n.key} href={n.href}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm"
                  style={on ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' } : { opacity: 0.8 }}>
                  <Icon className="h-4 w-4" /> {n.label}
                </a>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      {/* Nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 flex justify-around py-2 sm:hidden" style={{ borderTop: border, background: 'var(--lumino-bg, #0a0a0a)' }}>
        {NAV.map(n => { const Icon = n.icon; return <a key={n.key} href={n.href} className="p-1" style={{ opacity: n.key === active ? 1 : 0.5 }}><Icon className="h-5 w-5" /></a>; })}
      </nav>
    </div>
  );
}
