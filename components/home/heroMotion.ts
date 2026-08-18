'use client'

import { gradientAt } from './useMotion'

/**
 * I motori di animazione dell'hero.
 *
 * Sono quattro effetti che girano di continuo — lettere reattive, scintille,
 * blob liquidi, finestre in parallasse — e quattro loop rAF separati vorrebbe
 * dire quattro code di lavoro che si contendono lo stesso frame. Qui ognuno è
 * un driver con un solo metodo `update(state)`, e l'hero li chiama tutti dentro
 * un unico requestAnimationFrame.
 *
 * Nessun driver legge il tempo o la posizione del mouse per conto proprio: li
 * riceve nello stato del frame, così vedono tutti lo stesso istante.
 */

export interface FrameState {
  /** Puntatore in coordinate viewport. */
  pointerX: number
  pointerY: number
  /** Velocità di scroll smorzata, in px per frame. Positiva = si scende. */
  scrollVel: number
  /** Millisecondi dall'avvio del loop. */
  time: number
}

export interface Driver {
  update(state: FrameState): void
  /** Riporta gli elementi al loro stato di riposo. */
  reset(): void
  /** Ricostruisce la lista di elementi osservati (il DOM è cambiato). */
  refresh?(): void
  /** Stacca listener propri. */
  destroy?(): void
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/* ═══════════════════════════════════════════════════════════════════════════
   Lettere del titolo
   ═══════════════════════════════════════════════════════════════════════════ */

const LETTER_RADIUS = 180

export function createLettersDriver(root: HTMLElement): Driver {
  let chars: HTMLElement[] = []

  const collect = () => {
    chars = Array.from(root.querySelectorAll<HTMLElement>('.lm-char'))

    // Le lettere del segmento in gradiente vanno dipinte una per una: con
    // background-clip il gradiente resta ancorato al riquadro del testo, così
    // appena una lettera si sposta il colore le rimane indietro.
    const grad = chars.filter((el) => el.dataset.grad === 'true')
    grad.forEach((el, i) => {
      const color = gradientAt(grad.length < 2 ? 0 : i / (grad.length - 1))
      el.style.color = color
      el.dataset.base = color
    })
  }

  const clear = (el: HTMLElement) => {
    el.style.transform = ''
    el.style.textShadow = ''
    if (!el.dataset.base) el.style.color = ''
  }

  collect()

  return {
    update({ pointerX, pointerY }) {
      for (const el of chars) {
        const rect = el.getBoundingClientRect()
        const dx = pointerX - (rect.left + rect.width / 2)
        const dy = pointerY - (rect.top + rect.height / 2)
        const distance = Math.hypot(dx, dy)

        if (distance < LETTER_RADIUS) {
          const f = 1 - distance / LETTER_RADIUS
          el.style.transform = `translate(${-dx * f * 0.16}px, ${-dy * f * 0.3 - f * 10}px) scale(${1 + f * 0.09})`
          el.style.textShadow = `0 0 ${26 * f}px rgba(255, 205, 150, ${0.55 * f})`
          if (!el.dataset.base) {
            el.style.color = `rgb(244, ${238 - Math.round(20 * f)}, ${228 - Math.round(60 * f)})`
          }
        } else {
          clear(el)
        }
      }
    },
    reset() {
      chars.forEach(clear)
    },
    refresh: collect,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Scintille
   ═══════════════════════════════════════════════════════════════════════════ */

const SPARK_COUNT = 46
const SPARK_DODGE = 130
const SPARK_COLORS = ['rgba(255,205,150,', 'rgba(236,106,156,', 'rgba(139,92,246,']

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  color: string
  burst: boolean
}

export function createSparksDriver(canvas: HTMLCanvasElement, burstZone: HTMLElement): Driver {
  const ctx = canvas.getContext('2d')
  let width = 0
  let height = 0
  let sparks: Spark[] = []

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = rect.width
    height = rect.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const spawn = (n: number, x?: number, y?: number, burst = false) => {
    for (let i = 0; i < n; i += 1) {
      sparks.push({
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        vx: burst ? (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 0.22,
        vy: burst ? (Math.random() - 0.5) * 5 : -Math.random() * 0.35 - 0.08,
        r: Math.random() * 1.9 + 0.5,
        life: burst ? 1 : Math.random() * 0.6 + 0.4,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        burst,
      })
    }
  }

  const onBurst = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    spawn(18, event.clientX - rect.left, event.clientY - rect.top, true)
  }

  resize()
  spawn(SPARK_COUNT)
  window.addEventListener('resize', resize)
  burstZone.addEventListener('pointerdown', onBurst)

  return {
    update({ pointerX, pointerY }) {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const rect = canvas.getBoundingClientRect()
      const lx = pointerX - rect.left
      const ly = pointerY - rect.top

      sparks = sparks.filter((p) => {
        const dx = p.x - lx
        const dy = p.y - ly
        const d = Math.hypot(dx, dy)

        if (d < SPARK_DODGE && d > 0) {
          const push = (1 - d / SPARK_DODGE) * 0.42
          p.vx += (dx / d) * push
          p.vy += (dy / d) * push
        }

        p.vx *= 0.965
        p.vy *= 0.965
        p.x += p.vx
        p.y += p.vy

        if (p.burst) {
          p.life -= 0.016
          if (p.life <= 0) return false
        } else {
          if (p.y < -10) p.y = height + 10
          if (p.y > height + 10) p.y = -10
          if (p.x < -10) p.x = width + 10
          if (p.x > width + 10) p.x = -10
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.burst ? p.life * 0.9 : p.life * 0.55})`
        ctx.fill()
        return true
      })

      if (sparks.filter((p) => !p.burst).length < SPARK_COUNT) spawn(1)
    },
    reset() {
      ctx?.clearRect(0, 0, width, height)
      sparks = []
    },
    destroy() {
      window.removeEventListener('resize', resize)
      burstZone.removeEventListener('pointerdown', onBurst)
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Blob liquidi
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Cinque cerchi sotto un filtro SVG "gooey": si fondono quando si avvicinano e
 * si staccano quando si allontanano, come gocce di mercurio.
 *
 * Lo scroll è la forza principale: più si scorre veloce, più si stirano in
 * verticale e più si separano (quindi si smettono di fondere). Da fermi
 * tornano vicini e ridiventano una massa sola. Il cursore li tira appena.
 *
 * Cinque e non sei: il filtro SVG è la parte cara: ogni cerchio in più costa
 * un'altra area da sfocare e ricomporre.
 */
interface BlobConfig {
  /** Posizione di riposo, in percentuale del contenitore. */
  x: number
  y: number
  size: number
  ampX: number
  ampY: number
  freqX: number
  freqY: number
  phase: number
  /** Quanto segue il cursore (negativo = lo evita). */
  pull: number
}

export const BLOBS: BlobConfig[] = [
  { x: 26, y: 42, size: 30, ampX: 5.5, ampY: 4.0, freqX: 0.11, freqY: 0.14, phase: 0.0, pull: 0.5 },
  { x: 38, y: 58, size: 24, ampX: 4.0, ampY: 6.0, freqX: 0.16, freqY: 0.09, phase: 1.3, pull: 0.8 },
  { x: 52, y: 36, size: 27, ampX: 6.5, ampY: 3.5, freqX: 0.08, freqY: 0.17, phase: 2.6, pull: 0.35 },
  { x: 63, y: 60, size: 21, ampX: 5.0, ampY: 5.0, freqX: 0.13, freqY: 0.12, phase: 3.9, pull: -0.4 },
  { x: 45, y: 48, size: 34, ampX: 3.0, ampY: 3.0, freqX: 0.06, freqY: 0.07, phase: 5.2, pull: 0.2 },
]

export function createBlobsDriver(container: HTMLElement, nodes: HTMLElement[]): Driver {
  return {
    update({ pointerX, pointerY, scrollVel, time }) {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0) return

      // Da fermi 0, in scroll pieno 1. Il tetto evita che una rotellina
      // impazzita mandi i blob fuori schermo.
      const energy = clamp(Math.abs(scrollVel) / 45, 0, 1)
      const t = time / 1000

      // Cursore in percentuale del contenitore.
      const cx = ((pointerX - rect.left) / rect.width) * 100
      const cy = ((pointerY - rect.top) / rect.height) * 100

      nodes.forEach((el, i) => {
        const b = BLOBS[i]
        if (!b) return

        let x = b.x + Math.sin(t * b.freqX * 6.28 + b.phase) * b.ampX
        let y = b.y + Math.cos(t * b.freqY * 6.28 + b.phase) * b.ampY

        // Lo scroll li spinge via dal centro: si separano e smettono di fondersi.
        x += ((b.x - 45) / 45) * energy * 16
        y += ((b.y - 48) / 48) * energy * 22

        // Il cursore li tira (o li respinge) appena.
        if (Number.isFinite(cx)) {
          x += clamp(cx - b.x, -30, 30) * 0.05 * b.pull
          y += clamp(cy - b.y, -30, 30) * 0.05 * b.pull
        }

        // Stiramento verticale proporzionale alla velocità di scroll.
        const sy = 1 + energy * 0.55
        const sx = 1 - energy * 0.16

        el.style.transform = `translate3d(${x - b.x}%, ${y - b.y}%, 0) scale(${sx}, ${sy})`
      })
    },
    reset() {
      nodes.forEach((el) => {
        el.style.transform = ''
      })
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Finestre fluttuanti
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Mini finestre browser sparse nell'hero, a profondità diverse: le "vicine" si
 * muovono di più col mouse, le lontane quasi niente. Passano DIETRO il titolo.
 *
 * Solo translate e rotate, mai scale: queste finestre possono contenere un
 * <video> e scalare un wrapper di video è vietato su tutti i progetti.
 */
export interface WindowConfig {
  /** Posizione, in percentuale del contenitore. Sparse e sfalsate: mai in colonna. */
  x: number
  y: number
  width: number
  rotate: number
  /** 0 = lontana e quasi ferma, 1 = vicina e reattiva. */
  depth: number
  driftAmp: number
  driftFreq: number
  phase: number
}

export const HERO_WINDOWS: WindowConfig[] = [
  { x: 4, y: 16, width: 232, rotate: -6, depth: 0.45, driftAmp: 9, driftFreq: 0.07, phase: 0.4 },
  { x: 68, y: 8, width: 268, rotate: 4, depth: 1, driftAmp: 13, driftFreq: 0.05, phase: 2.1 },
  { x: 78, y: 54, width: 208, rotate: -3, depth: 0.7, driftAmp: 11, driftFreq: 0.09, phase: 4.4 },
]

export function createWindowsDriver(container: HTMLElement, nodes: HTMLElement[]): Driver {
  return {
    update({ pointerX, pointerY, scrollVel, time }) {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0) return

      const px = (pointerX - rect.left) / rect.width - 0.5
      const py = (pointerY - rect.top) / rect.height - 0.5
      const t = time / 1000
      const drag = clamp(scrollVel / 45, -1, 1)

      nodes.forEach((el, i) => {
        const w = HERO_WINDOWS[i]
        if (!w) return

        const driftY = Math.sin(t * w.driftFreq * 6.28 + w.phase) * w.driftAmp
        const driftX = Math.cos(t * w.driftFreq * 4.4 + w.phase) * (w.driftAmp * 0.6)

        const x = driftX - px * w.depth * 30
        const y = driftY - py * w.depth * 22 + drag * w.depth * 26

        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${w.rotate}deg)`
      })
    },
    reset() {
      nodes.forEach((el, i) => {
        const w = HERO_WINDOWS[i]
        el.style.transform = w ? `rotate(${w.rotate}deg)` : ''
      })
    },
  }
}
