import React from 'react';

/** GlassSurface — superficie glassmorphism riutilizzabile. Props: children, blur?, opacity?, border?. */
export interface GlassSurfaceProps { children: React.ReactNode; blur?: number; opacity?: number; border?: boolean; className?: string; }

export function GlassSurface({ children, blur = 12, opacity = 0.12, border = true, className }: GlassSurfaceProps) {
  return (
    <div
      className={['rounded-2xl', className].filter(Boolean).join(' ')}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        background: `rgba(255,255,255,${opacity})`,
        border: border ? '1px solid rgba(255,255,255,0.18)' : 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {children}
    </div>
  );
}

export default GlassSurface;
