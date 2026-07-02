import * as React from 'react';
import { cn } from '@/lib/utils';

const BADGE_VARIANTS = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground',
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function badgeVariants({ variant = 'default' }: { variant?: BadgeVariant } = {}) {
  return cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors', BADGE_VARIANTS[variant]);
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
