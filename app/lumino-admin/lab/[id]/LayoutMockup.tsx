'use client'

import type { LayoutProposal, SectionKey } from '@/lib/lab/layout'

/** Anteprima SVG di un layout: wireframe della homepage, brandizzato con la palette. */

function hexToRgb(h: string): [number, number, number] {
  const x = h.replace('#', '')
  const v = x.length === 3 ? x.split('').map(c => c + c).join('') : x
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function lum(h: string): number { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
function sat(h: string): number { const [r, g, b] = hexToRgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx }

interface Roles { pageBg: string; ink: string; sub: string; accent: string; tint: string; isDark: boolean }

function roles(palette: string[]): Roles {
  const pal = palette.length ? palette : ['#1a1a1a', '#e52d1d', '#f5f0e8']
  const byLum = [...pal].sort((a, b) => lum(a) - lum(b))
  const lightest = byLum[byLum.length - 1]
  const darkest = byLum[0]
  const isDark = lum(lightest) < 0.6
  const pageBg = isDark ? darkest : lightest
  const ink = isDark ? '#ffffff' : (lum(darkest) < 0.5 ? darkest : '#1a1a1a')
  const accent = [...pal].sort((a, b) => sat(b) - sat(a)).find(c => c !== pageBg && sat(c) > 0.22) || pal[1] || '#e52d1d'
  const tint = [...pal].sort((a, b) => sat(b) - sat(a)).find(c => c !== pageBg && c !== accent) || accent
  const sub = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
  return { pageBg, ink, sub, accent, tint, isDark }
}

const W = 300
const PAD = 16
const CW = W - PAD * 2

function line(x: number, y: number, w: number, color: string, h = 4, r = 2) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={color} />
}

function section(key: SectionKey, y: number, R: Roles, hero: string): { h: number; el: JSX.Element } {
  const card = R.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const border = R.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'

  switch (key) {
    case 'hero': {
      if (hero === 'minimal') {
        return { h: 64, el: (<g>
          {line(PAD, y + 18, 150, R.ink, 9, 3)}
          {line(PAD, y + 34, 90, R.sub as string, 5)}
          <rect x={PAD} y={y + 48} width={46} height={3} fill={R.accent} />
        </g>) }
      }
      if (hero === 'split') {
        return { h: 120, el: (<g>
          <rect x={PAD} y={y} width={CW / 2 - 4} height={120} rx={8} fill={R.tint} opacity={0.85} />
          {line(PAD + CW / 2 + 6, y + 24, CW / 2 - 24, R.ink, 10, 3)}
          {line(PAD + CW / 2 + 6, y + 42, CW / 2 - 40, R.ink, 10, 3)}
          {line(PAD + CW / 2 + 6, y + 62, CW / 2 - 16, R.sub as string, 5)}
          {line(PAD + CW / 2 + 6, y + 72, CW / 2 - 30, R.sub as string, 5)}
          <rect x={PAD + CW / 2 + 6} y={y + 90} width={70} height={16} rx={8} fill={R.accent} />
        </g>) }
      }
      // fullbleed / centered
      const centered = hero === 'centered'
      return { h: 130, el: (<g>
        <defs>
          <linearGradient id={`hg${y}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={R.tint} stopOpacity={centered ? 0.25 : 0.95} />
            <stop offset="1" stopColor={R.accent} stopOpacity={centered ? 0.15 : 0.6} />
          </linearGradient>
        </defs>
        <rect x={PAD} y={y} width={CW} height={130} rx={8} fill={centered ? R.pageBg : `url(#hg${y})`} stroke={centered ? border : 'none'} />
        {centered ? (<g>
          <rect x={W / 2 - 80} y={y + 38} width={160} height={11} rx={3} fill={R.ink} />
          <rect x={W / 2 - 55} y={y + 56} width={110} height={11} rx={3} fill={R.ink} />
          <rect x={W / 2 - 45} y={y + 78} width={90} height={5} rx={2} fill={R.sub as string} />
          <rect x={W / 2 - 38} y={y + 96} width={76} height={18} rx={9} fill={R.accent} />
        </g>) : (<g>
          <rect x={PAD + 18} y={y + 44} width={150} height={11} rx={3} fill="#ffffff" opacity={0.95} />
          <rect x={PAD + 18} y={y + 62} width={110} height={11} rx={3} fill="#ffffff" opacity={0.95} />
          <rect x={PAD + 18} y={y + 86} width={72} height={18} rx={9} fill="#ffffff" opacity={0.9} />
        </g>)}
      </g>) }
    }
    case 'gallery': {
      const n = 4, gap = 6, sw = (CW - gap * (n - 1)) / n
      return { h: 56, el: (<g>
        {line(PAD, y, 60, R.ink, 5)}
        {Array.from({ length: n }).map((_, i) => (
          <rect key={i} x={PAD + i * (sw + gap)} y={y + 12} width={sw} height={42} rx={5} fill={R.tint} opacity={0.3 + (i % 2) * 0.25} />
        ))}
      </g>) }
    }
    case 'menu': {
      return { h: 76, el: (<g>
        {line(PAD, y, 50, R.ink, 5)}
        {[0, 1, 2].map(i => (<g key={i}>
          {line(PAD, y + 16 + i * 18, 110, R.sub as string, 5)}
          <circle cx={W - PAD - 14} cy={y + 18 + i * 18} r={3} fill={R.accent} />
          {line(W - PAD - 36, y + 16 + i * 18, 18, R.ink, 5)}
        </g>))}
      </g>) }
    }
    case 'about': {
      return { h: 64, el: (<g>
        <rect x={PAD} y={y} width={96} height={64} rx={6} fill={R.tint} opacity={0.7} />
        {line(PAD + 110, y + 6, 80, R.ink, 6)}
        {[0, 1, 2, 3].map(i => line(PAD + 110, y + 22 + i * 11, i === 3 ? 70 : CW - 110, R.sub as string, 5))}
      </g>) }
    }
    case 'services': {
      const n = 3, gap = 8, sw = (CW - gap * (n - 1)) / n
      return { h: 60, el: (<g>
        {Array.from({ length: n }).map((_, i) => (<g key={i}>
          <rect x={PAD + i * (sw + gap)} y={y} width={sw} height={60} rx={6} fill={card} stroke={border} />
          <circle cx={PAD + i * (sw + gap) + sw / 2} cy={y + 20} r={9} fill={R.accent} opacity={0.85} />
          {line(PAD + i * (sw + gap) + sw / 2 - 22, y + 38, 44, R.ink, 4)}
          {line(PAD + i * (sw + gap) + sw / 2 - 16, y + 47, 32, R.sub as string, 3)}
        </g>))}
      </g>) }
    }
    case 'reviews': {
      const n = 3, gap = 8, sw = (CW - gap * (n - 1)) / n
      return { h: 56, el: (<g>
        {Array.from({ length: n }).map((_, i) => (<g key={i}>
          <rect x={PAD + i * (sw + gap)} y={y} width={sw} height={56} rx={6} fill={card} stroke={border} />
          {[0, 1, 2, 3, 4].map(s => <circle key={s} cx={PAD + i * (sw + gap) + 10 + s * 7} cy={y + 14} r={2.4} fill={R.accent} />)}
          {[0, 1, 2].map(l => line(PAD + i * (sw + gap) + 10, y + 26 + l * 8, l === 2 ? sw - 40 : sw - 20, R.sub as string, 3))}
        </g>))}
      </g>) }
    }
    case 'events': {
      return { h: 44, el: (<g>
        <rect x={PAD} y={y} width={CW} height={44} rx={6} fill={R.accent} opacity={0.16} stroke={border} />
        <rect x={PAD + 10} y={y + 10} width={34} height={24} rx={4} fill={R.accent} />
        {line(PAD + 56, y + 12, 120, R.ink, 6)}
        {line(PAD + 56, y + 26, 90, R.sub as string, 4)}
      </g>) }
    }
    case 'booking': {
      return { h: 58, el: (<g>
        {line(PAD, y, 60, R.ink, 5)}
        <rect x={PAD} y={y + 12} width={CW * 0.46} height={16} rx={5} fill={card} stroke={border} />
        <rect x={PAD + CW * 0.5} y={y + 12} width={CW * 0.5} height={16} rx={5} fill={card} stroke={border} />
        <rect x={PAD} y={y + 36} width={CW} height={16} rx={5} fill={card} stroke={border} />
        <rect x={W - PAD - 70} y={y + 36} width={70} height={16} rx={8} fill={R.accent} />
      </g>) }
    }
    case 'map': {
      return { h: 54, el: (<g>
        <rect x={PAD} y={y} width={CW} height={54} rx={6} fill={R.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} stroke={border} />
        {[18, 36].map(gy => <line key={gy} x1={PAD} y1={y + gy} x2={PAD + CW} y2={y + gy} stroke={border} />)}
        {[90, 180, 250].map(gx => <line key={gx} x1={PAD + gx} y1={y} x2={PAD + gx} y2={y + 54} stroke={border} />)}
        <circle cx={PAD + CW / 2} cy={y + 26} r={6} fill={R.accent} />
        <circle cx={PAD + CW / 2} cy={y + 26} r={2.5} fill="#fff" />
      </g>) }
    }
    case 'team': {
      const n = 3, gap = 16, cw = (CW - gap * (n - 1)) / n
      return { h: 56, el: (<g>
        {Array.from({ length: n }).map((_, i) => (<g key={i}>
          <circle cx={PAD + cw / 2 + i * (cw + gap)} cy={y + 18} r={16} fill={R.tint} opacity={0.7} />
          {line(PAD + i * (cw + gap) + cw / 2 - 18, y + 40, 36, R.ink, 4)}
          {line(PAD + i * (cw + gap) + cw / 2 - 12, y + 48, 24, R.sub as string, 3)}
        </g>))}
      </g>) }
    }
    case 'newsletter': {
      return { h: 40, el: (<g>
        <rect x={PAD} y={y} width={CW} height={40} rx={6} fill={card} stroke={border} />
        {line(PAD + 12, y + 14, 110, R.ink, 5)}
        <rect x={W - PAD - 120} y={y + 11} width={70} height={18} rx={5} fill={R.pageBg} stroke={border} />
        <rect x={W - PAD - 46} y={y + 11} width={38} height={18} rx={9} fill={R.accent} />
      </g>) }
    }
    default:
      return { h: 0, el: <g /> }
  }
}

export function LayoutMockup({ layout }: { layout: LayoutProposal }) {
  const R = roles(layout.palette)
  const border = R.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'

  // chrome + nav
  let y = 40
  const blocks: JSX.Element[] = []
  const gap = 12
  for (let i = 0; i < layout.sections.length; i++) {
    const { h, el } = section(layout.sections[i], y, R, layout.heroStyle)
    if (h === 0) continue
    blocks.push(<g key={i}>{el}</g>)
    y += h + gap
  }
  // footer
  const footerY = y
  const totalH = y + 34

  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ display: 'block', borderRadius: 10 }} role="img" aria-label={`Mockup ${layout.name}`}>
      <rect x={0} y={0} width={W} height={totalH} rx={10} fill={R.pageBg} />
      {/* browser chrome */}
      <g>
        {[0, 1, 2].map(i => <circle key={i} cx={14 + i * 10} cy={14} r={3} fill={R.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'} />)}
        <line x1={0} y1={26} x2={W} y2={26} stroke={border} />
      </g>
      {/* nav */}
      <g>
        <circle cx={PAD + 4} cy={34} r={4} fill={R.accent} />
        {line(PAD + 14, 32, 40, R.ink, 5)}
        {[0, 1, 2].map(i => line(W - PAD - 80 + i * 28, 33, 18, R.sub as string, 4))}
      </g>
      {blocks}
      {/* footer */}
      <g>
        <rect x={0} y={footerY} width={W} height={totalH - footerY} fill={R.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
        {line(PAD, footerY + 12, 50, R.sub as string, 4)}
        {[0, 1, 2].map(i => line(W - PAD - 70 + i * 24, footerY + 12, 16, R.sub as string, 4))}
      </g>
    </svg>
  )
}
