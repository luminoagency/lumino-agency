'use client';

import React, { useEffect, useState } from 'react';

/** StickyHeader — header che diventa solido allo scroll. Props: logo, links, cta?. */
type Link = { label: string; href: string };
export interface StickyHeaderProps {
  logo: React.ReactNode;
  links: Link[];
  cta?: Link;
  className?: string;
}

export function StickyHeader({ logo, links, cta, className }: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={['sticky top-0 z-40 w-full transition-all duration-300', className].filter(Boolean).join(' ')}
      style={{ background: scrolled ? 'var(--lumino-bg, #ffffff)' : 'transparent', color: 'var(--lumino-ink, #1a1a1a)', boxShadow: scrolled ? '0 1px 0 var(--lumino-muted, #e5e5e5)' : 'none', backdropFilter: scrolled ? 'saturate(180%) blur(8px)' : 'none' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="font-bold">{logo}</div>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l, i) => <a key={i} href={l.href} className="text-sm font-medium opacity-80 transition-opacity hover:opacity-100">{l.label}</a>)}
        </nav>
        {cta && <a href={cta.href} className="rounded-full px-5 py-2 text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>{cta.label}</a>}
      </div>
    </header>
  );
}

export default StickyHeader;
