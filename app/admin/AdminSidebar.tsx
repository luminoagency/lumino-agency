'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutActionState } from '../auth/actions'

/**
 * Sidebar dello shell /admin (restyle STEP 1).
 * Guscio di navigazione: 4 gruppi (Panoramica / Contenuti / Il sito / Attività).
 * Voci [pro] mostrate ai Basic con lucchetto → /pricing. Su mobile la sidebar
 * collassa in un drawer con hamburger. I contenuti veri delle sezioni arrivano
 * negli step successivi; qui conta la navigazione.
 */

type Item = { label: string; href: string; pro?: boolean }
type Group = { label: string | null; items: Item[] }

const GROUPS: Group[] = [
  { label: null, items: [{ label: 'Panoramica', href: '/admin' }] },
  {
    label: 'Contenuti',
    items: [
      { label: 'Identità & storia', href: '/admin/identita' },
      { label: 'Menu', href: '/admin/menu' },
      { label: 'Lo chef', href: '/admin/chef', pro: true },
      { label: 'Eventi', href: '/admin/events', pro: true },
      { label: 'Gallery', href: '/admin/gallery-admin' },
    ],
  },
  {
    label: 'Il sito',
    items: [
      { label: 'Pagine', href: '/admin/pagine', pro: true },
      { label: 'Funzionalità', href: '/admin/funzionalita' },
      { label: 'Contatti & orari', href: '/admin/contatti' },
    ],
  },
  {
    label: 'Attività',
    items: [{ label: 'Prenotazioni', href: '/admin/prenotazioni', pro: true }],
  },
]

export function AdminSidebar({ tier }: { tier: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isBasic = tier === 'basic'

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')
  }

  async function logout() {
    const r = await logoutActionState()
    window.location.assign(r.redirectTo)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .as-shell { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; }
        .as-main { min-width: 0; margin-left: 250px; }

        .as-sidebar {
          width: 250px; background: #0a0a0b;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
        }
        .as-brand {
          display: flex; align-items: baseline; gap: 5px;
          font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 500;
          color: #fff; text-decoration: none; line-height: 1;
          padding: 22px 22px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .as-brand-dot { width: 6px; height: 6px; border-radius: 50%; background: #e52d1d; box-shadow: 0 0 10px #e52d1d; align-self: flex-end; margin-bottom: 5px; }
        .as-nav { flex: 1; overflow-y: auto; padding: 14px 12px 20px; }
        .as-group { margin-top: 18px; }
        .as-group:first-child { margin-top: 4px; }
        .as-group-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.34); padding: 0 12px; margin-bottom: 8px; }
        .as-link {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; margin-bottom: 2px; border-radius: 9px;
          color: rgba(255,255,255,0.72); text-decoration: none; font-size: 13.5px; font-weight: 500;
          border-left: 2px solid transparent; transition: background 0.15s, color 0.15s;
        }
        .as-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .as-link.active { background: rgba(229,45,29,0.12); color: #fff; border-left-color: #e52d1d; font-weight: 600; }
        .as-link.locked { color: rgba(255,255,255,0.4); }
        .as-link.locked:hover { background: rgba(255,255,255,0.03); }
        .as-lock { margin-left: auto; font-size: 11px; opacity: 0.75; }
        .as-foot { padding: 16px 18px; border-top: 1px solid rgba(255,255,255,0.06); }
        .as-plan { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
        .as-plan b { color: #fff; text-transform: capitalize; }
        .as-logout { width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.75); padding: 8px 12px; border-radius: 100px; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .as-logout:hover { background: rgba(255,255,255,0.06); color: #fff; }

        /* mobile */
        .as-burger { display: none; }
        .as-backdrop { display: none; }
        @media (max-width: 860px) {
          .as-sidebar {
            position: fixed; top: 0; left: 0; z-index: 200;
            transform: translateX(-100%); transition: transform 0.28s ease;
            box-shadow: 0 0 40px rgba(0,0,0,0.6);
          }
          .as-sidebar.open { transform: translateX(0); }
          .as-burger {
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 14px; left: 14px; z-index: 150;
            width: 42px; height: 42px; border-radius: 10px;
            background: rgba(15,15,17,0.9); backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.12); color: #fff; cursor: pointer;
            flex-direction: column; gap: 4px;
          }
          .as-burger span { width: 18px; height: 2px; background: currentColor; display: block; }
          .as-backdrop.show { display: block; position: fixed; inset: 0; z-index: 190; background: rgba(0,0,0,0.5); }
          .as-main { margin-left: 0; padding-top: 54px; }
        }
      `}</style>

      <button type="button" className="as-burger" aria-label="Apri menu" onClick={() => setOpen(true)}>
        <span /><span /><span />
      </button>
      <div className={`as-backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`as-sidebar ${open ? 'open' : ''}`}>
        <Link href="/admin" className="as-brand" onClick={() => setOpen(false)}>
          <span>Lumino</span>
          <span className="as-brand-dot" />
        </Link>

        <nav className="as-nav">
          {GROUPS.map((g, gi) => (
            <div key={gi} className="as-group">
              {g.label && <div className="as-group-label">{g.label}</div>}
              {g.items.map(item => {
                const locked = item.pro && isBasic
                const active = isActive(item.href)
                if (locked) {
                  return (
                    <Link key={item.href} href="/pricing" className="as-link locked" title="Incluso nei piani Pro e Premium">
                      {item.label}
                      <span className="as-lock">🔒</span>
                    </Link>
                  )
                }
                return (
                  <Link key={item.href} href={item.href} className={`as-link ${active ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="as-foot">
          <div className="as-plan">Piano: <b>{tier}</b></div>
          <button type="button" className="as-logout" onClick={logout}>Esci</button>
        </div>
      </aside>
    </>
  )
}
