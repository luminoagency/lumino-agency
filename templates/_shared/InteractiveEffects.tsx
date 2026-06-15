'use client'

import { useEffect, useRef } from 'react'

/**
 * Drop this into a template once. It does 3 things:
 *
 * 1. Click ripple on every <button> and <a> inside the same parent (delegated event listener).
 *    The ripple color is controlled by the CSS variable --ripple-color, defaults to white 60%.
 *
 * 2. Cursor-following glow halo on elements with class .glow-card.
 *    Position is read via CSS variables --gx and --gy (set in onMouseMove).
 *
 * 3. Magnetic effect on elements with class .magnetic — they shift slightly toward the cursor.
 *
 * Each of these is opt-in via class names, so the existing markup keeps working unchanged.
 */
interface Props {
  accent: string
  scope?: string  // optional CSS scope prefix (e.g. 'cin', 'ben', 'pan') for class names
}

export function InteractiveEffects({ accent, scope = 'ix' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current?.parentElement
    if (!root) return

    // ============ RIPPLE on click ============
    const onClick = (e: Event) => {
      // Auto-target: all buttons + anchors with role-like classes. Opt-out via .no-ripple.
      const target = (e.target as HTMLElement).closest(
        `button:not(.no-ripple), a[href]:not(.no-ripple):not([class*="social"]):not([class*="fab"])`
      ) as HTMLElement | null
      if (!target) return
      // Skip tiny icon-only links and form-internal elements
      const rect = target.getBoundingClientRect()
      if (rect.width < 24 || rect.height < 20) return

      const mouseEvent = e as MouseEvent
      const x = mouseEvent.clientX - rect.left
      const y = mouseEvent.clientY - rect.top

      const span = document.createElement('span')
      span.className = `${scope}-ripple-fx`
      span.style.left = `${x}px`
      span.style.top = `${y}px`

      // ensure container can host an absolutely positioned ripple
      const computed = window.getComputedStyle(target)
      if (computed.position === 'static') target.style.position = 'relative'
      if (computed.overflow !== 'hidden') target.style.overflow = 'hidden'

      target.appendChild(span)
      setTimeout(() => span.remove(), 800)
    }

    root.addEventListener('click', onClick)

    // ============ MAGNETIC effect ============
    const magneticEls = root.querySelectorAll<HTMLElement>('.magnetic')
    const magneticHandlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = []

    magneticEls.forEach(el => {
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`
      }
      const leave = () => {
        el.style.transform = ''
      }
      el.addEventListener('mousemove', move)
      el.addEventListener('mouseleave', leave)
      magneticHandlers.push({ el, move, leave })
    })

    // ============ GLOW CARDS ============
    const glowEls = root.querySelectorAll<HTMLElement>('.glow-card')
    const glowHandlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void }> = []

    glowEls.forEach(el => {
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        el.style.setProperty('--gx', `${x}%`)
        el.style.setProperty('--gy', `${y}%`)
      }
      el.addEventListener('mousemove', move)
      glowHandlers.push({ el, move })
    })

    return () => {
      root.removeEventListener('click', onClick)
      magneticHandlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move)
        el.removeEventListener('mouseleave', leave)
      })
      glowHandlers.forEach(({ el, move }) => {
        el.removeEventListener('mousemove', move)
      })
    }
  }, [scope])

  return (
    <>
      <div ref={rootRef} style={{ display: 'none' }} />
      <style>{`
        .${scope}-ripple, [data-ripple] {
          position: relative;
          overflow: hidden;
        }
        .${scope}-ripple-fx {
          position: absolute;
          border-radius: 50%;
          width: 0;
          height: 0;
          background: var(--ripple-color, rgba(255,255,255,0.5));
          transform: translate(-50%, -50%);
          animation: ${scope}RippleFx 0.8s ease-out forwards;
          pointer-events: none;
          z-index: 100;
        }
        @keyframes ${scope}RippleFx {
          0%   { width: 0; height: 0; opacity: 0.65; }
          100% { width: 500px; height: 500px; opacity: 0; }
        }

        .magnetic {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .magnetic:not(:hover) {
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .glow-card {
          position: relative;
          overflow: hidden;
        }
        .glow-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(400px circle at var(--gx, 50%) var(--gy, 50%), ${accent}33, transparent 45%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
          z-index: 0;
        }
        .glow-card:hover::before {
          opacity: 1;
        }
        .glow-card > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  )
}
