'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

/** AnnouncementBanner — banner promo in alto. Props: text, ctaText?, ctaHref?, dismissible?. */
export interface AnnouncementBannerProps {
  text: string;
  ctaText?: string;
  ctaHref?: string;
  dismissible?: boolean;
  className?: string;
}

export function AnnouncementBanner({ text, ctaText, ctaHref = '#', dismissible = true, className }: AnnouncementBannerProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={['relative flex w-full items-center justify-center gap-3 px-6 py-2.5 text-sm', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }}>
      <span className="text-center">
        {text}
        {ctaText && <a href={ctaHref} className="ml-2 font-semibold underline underline-offset-2">{ctaText}</a>}
      </span>
      {dismissible && (
        <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default AnnouncementBanner;
