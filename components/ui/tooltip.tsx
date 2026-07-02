'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tooltip CSS-only (group-hover), API compatibile shadcn: TooltipProvider/Tooltip/
 * TooltipTrigger/TooltipContent. Nessuna dipendenza Radix.
 */

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <span className="group/tt relative inline-flex">{children}</span>;
}

export function TooltipTrigger({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean } & React.HTMLAttributes<HTMLSpanElement>) {
  if (asChild) return <>{children}</>;
  return <span {...props}>{children}</span>;
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground opacity-0 shadow transition-opacity duration-150 group-hover/tt:opacity-100',
        className
      )}
    >
      {children}
    </span>
  );
}
