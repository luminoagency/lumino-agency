'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const follower = followerRef.current
    if (!cursor || !follower) return

    const onMove = (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' })
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.35, ease: 'power2.out' })
    }

    const onEnterInteractive = () => {
      gsap.to(cursor, { scale: 0, duration: 0.2 })
      gsap.to(follower, { scale: 2.5, opacity: 0.15, duration: 0.3 })
    }

    const onLeaveInteractive = () => {
      gsap.to(cursor, { scale: 1, duration: 0.2 })
      gsap.to(follower, { scale: 1, opacity: 0.08, duration: 0.3 })
    }

    window.addEventListener('mousemove', onMove)

    const interactives = document.querySelectorAll('a, button, [data-magnetic]')
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnterInteractive)
      el.addEventListener('mouseleave', onLeaveInteractive)
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterInteractive)
        el.removeEventListener('mouseleave', onLeaveInteractive)
      })
    }
  }, [])

  return (
    <>
      {/* Dot */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: -4,
          left: -4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#ffffff',
          pointerEvents: 'none',
          zIndex: 10000,
          mixBlendMode: 'difference',
        }}
      />
      {/* Follower ring */}
      <div
        ref={followerRef}
        style={{
          position: 'fixed',
          top: -20,
          left: -20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
          zIndex: 10000,
          mixBlendMode: 'difference',
        }}
      />
    </>
  )
}
