'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge, type BadgeVariant } from '@/components/ui/badge';

/**
 * Announcement — pill di annuncio (es. "Novità · ..."). Sub-component AnnouncementTag
 * (etichetta colorata a sinistra) e AnnouncementTitle (testo).
 *
 * Props:
 * - variant?: 'default' | 'secondary' | 'outline' (default 'outline').
 * - themed?: usa l'accent della palette per bordo/testo.
 * - children (required).
 *
 * @example
 * <Announcement themed>
 *   <AnnouncementTag>Novità</AnnouncementTag>
 *   <AnnouncementTitle>Prenotazioni online attive →</AnnouncementTitle>
 * </Announcement>
 */

export interface AnnouncementProps {
  variant?: BadgeVariant;
  themed?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Announcement({ variant = 'outline', themed = false, className, children }: AnnouncementProps) {
  return (
    <Badge
      variant={variant}
      className={cn('max-w-full gap-2 rounded-full px-3 py-0.5 font-medium', className)}
      style={themed ? { borderColor: 'var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-accent, #8b5cf6)' } : undefined}
    >
      {children}
    </Badge>
  );
}

export function AnnouncementTag({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('-ml-1.5 shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-xs', className)}>{children}</div>;
}

export function AnnouncementTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex items-center gap-1 truncate', className)}>{children}</div>;
}

export default Announcement;
