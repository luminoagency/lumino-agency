'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, onCheckedChange, disabled, id, className, ...rest }, ref) => {
    const [internal, setInternal] = React.useState(!!defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? !!checked : internal;
    const toggle = () => {
      if (disabled) return;
      if (!isControlled) setInternal(!value);
      onCheckedChange?.(!value);
    };
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          value ? 'bg-primary' : 'bg-input',
          className
        )}
        {...rest}
      >
        <span className={cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform', value ? 'translate-x-4' : 'translate-x-0')} />
      </button>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
