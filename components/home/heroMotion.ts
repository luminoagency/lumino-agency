'use client'

import { gradientAt } from './useMotion'

/**
 * I motori di animazione dell'hero.
 *
 * Sono quattro effetti che girano di continuo — lettere, scintille, blob
 * liquidi, tipografia di fondo — e quattro loop rAF separati vorrebbe dire
 * quattro code che si contendono lo stesso frame. Qui ognuno è un driver con un
 * solo metodo `update(state)`, e l'hero li chiama tutti dentro un unico
 * requestAnimationFrame.
 *
 * Nessun driver legge il tempo, il puntatore o le onde per conto proprio: li
 * riceve nello stato del frame, così vedono tutti lo stesso istante e la stessa
 * perturbazione.
 */

/** Onda circolare generata da un click: la sentono lettere, blob e scintille. */
export interface Wave {
  x: number
  y: number
  born: number
}

export interface FrameState {
  pointerX: number
  pointerY: number
  /** Velocità di scroll smorzata, in px per frame. Positiva = si scende. */
  scrollVel: number
  /** Millisecondi dall'avvio del loop. */
  time: number
  waves: Wave[]
}

export interface Driver {
  update(state: FrameState): void
  reset(): void
  refresh?(): void
  destroy?(): void
  /** Scoppio nel punto del click, in coordinate viewport. */
  burst?(x: number, y: number): void
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/* Fisica dell'onda: quanto corre, quanto vive, quanto è spesso il fronte. */
export const WAVE_SPEED = 1.15 // px per ms
export const WAVE_LIFE = 1200 // ms
const WAVE_BAND = 150 // px: spessore del fronte che "spinge"

/** Intensità dell'onda a una certa distanza dal centro, 0 se fuori dal fronte. */
function waveForce(wave: Wave, time: number, dist: number) {
  const age = time - wave.born
  if (age < 0 || age > WAVE_LIFE) return 0

  const radius = age * WAVE_SPEED
  const offset = Math.abs(dist - radius)
  if (offset > WAVE_BAND) return 0

  const front = 1 - offset / WAVE_BAND // 1 sul fronte, 0 ai bordi
  const fade = 1 - age / WAVE_LIFE // si spegne invecchiando
  return front * fade
}

/* ═══════════════════════════════════════════════════════════════════════════
   Lettere del titolo: prossimità, trascinamento con molla, onda
   ═══════════════════════════════════════════════════════════════════════════ */

const LETTER_RADIUS = 180
/** Molla di ritorno: la lettera rilasciata torna a casa oscillando appena. */
const SPRING = 0.12
const DAMPING = 0.75
/** Quante lettere intorno a quella afferrata si spostano per simpatia. */
const SYMPATHY_REACH = 4

interface CharState {
  el: HTMLElement
  /** Posizione di riposo, relativa al riquadro del titolo. */
  homeX: number
  homeY: number
  w: number
  h: number
  /** Scostamento corrente dalla posizione di riposo. */
  x: number
  y: number
  vx: number
  vy: number
  grabbed: boolean
}

export function createLettersDriver(root: HTMLElement): Driver {
  let chars: CharState[] = []
  let grabbedIndex = -1
  let grabOffsetX = 0
  let grabOffsetY = 0

  const collect = () => {
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.lm-char'))

    // Le lettere del segmento in gradiente vanno dipinte una per una: con
    // background-clip il gradiente resta ancorato al riquadro del testo, così
    // appena una lettera si sposta il colore le rimane indietro.
    const grad = nodes.filter((el) => el.dataset.grad === 'true')
    grad.forEach((el, i) => {
      const color = gradientAt(grad.length < 2 ? 0 : i / (grad.length - 1))
      el.style.color = color
      el.dataset.base = color
    })

    // Le posizioni di riposo si misurano a trasformazioni azzerate, una volta
    // sola: leggerle a ogni frame da un elemento già spostato significherebbe
    // inseguire la propria coda.
    nodes.forEach((el) => {
      el.style.transform = ''
    })
    const rootRect = root.getBoundingClientRect()

    chars = nodes.map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        el,
        homeX: rect.left - rootRect.left + rect.width / 2,
        homeY: rect.top - rootRect.top + rect.height / 2,
        w: rect.width,
        h: rect.height,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        grabbed: false,
      }
    })
    grabbedIndex = -1
  }

  /* ── Trascinamento ─────────────────────────────────────────────────────── */

  const onDown = (event: PointerEvent) => {
    const el = (event.target as Element | null)?.closest?.('.lm-char') as HTMLElement | null
    if (!el) return

    const i = chars.findIndex((c) => c.el === el)
    if (i < 0) return

    const rootRect = root.getBoundingClientRect()
    grabbedIndex = i
    chars[i].grabbed = true
    // Si afferra dal punto in cui si è cliccato, non dal centro: altrimenti la
    // lettera scatta sotto il dito appena la si tocca.
    grabOffsetX = event.clientX - rootRect.left - (chars[i].homeX + chars[i].x)
    grabOffsetY = event.clientY - rootRect.top - (chars[i].homeY + chars[i].y)

    root.setPointerCapture(event.pointerId)
    root.classList.add('is-grabbing')
    event.preventDefault()
  }

  const release = () => {
    if (grabbedIndex >= 0) chars[grabbedIndex].grabbed = false
    grabbedIndex = -1
    root.classList.remove('is-grabbing')
  }

  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointerup', release)
  root.addEventListener('pointercancel', release)

  collect()

  return {
    update({ pointerX, pointerY, time, waves }) {
      const rootRect = root.getBoundingClientRect()
      const px = pointerX - rootRect.left
      const py = pointerY - rootRect.top

      for (let i = 0; i < chars.length; i += 1) {
        const c = chars[i]

        if (c.grabbed) {
          // Segue il dito senza molla: la molla è per il ritorno.
          c.x = px - grabOffsetX - c.homeX
          c.y = py - grabOffsetY - c.homeY
          c.vx = 0
          c.vy = 0
        } else {
          // Simpatia: le vicine della lettera afferrata si spostano un po'.
          if (grabbedIndex >= 0) {
            const distance = Math.abs(i - grabbedIndex)
            if (distance <= SYMPATHY_REACH) {
              const share = (1 - distance / (SYMPATHY_REACH + 1)) * 0.35
              const g = chars[grabbedIndex]
              c.vx += (g.x * share - c.x) * 0.08
              c.vy += (g.y * share - c.y) * 0.08
            }
          }

          // Onda: una spinta radiale quando il fronte la attraversa.
          for (const wave of waves) {
            const dx = c.homeX + rootRect.left - wave.x
            const dy = c.homeY + rootRect.top - wave.y
            const dist = Math.hypot(dx, dy)
            const force = waveForce(wave, time, dist)
            if (force > 0 && dist > 0) {
              c.vx += (dx / dist) * force * 5.5
              c.vy += (dy / dist) * force * 5.5 - force * 3
            }
          }

          // Molla di ritorno.
          c.vx += (0 - c.x) * SPRING
          c.vy += (0 - c.y) * SPRING
          c.vx *= DAMPING
          c.vy *= DAMPING
          c.x += c.vx
          c.y += c.vy
        }

        // Prossimità del cursore: si somma allo scostamento, non lo sostituisce.
        let proxX = 0
        let proxY = 0
        let scale = 1
        let shadow = ''

        if (grabbedIndex < 0) {
          const dx = px - (c.homeX + c.x)
          const dy = py - (c.homeY + c.y)
          const distance = Math.hypot(dx, dy)

          if (distance < LETTER_RADIUS) {
            const f = 1 - distance / LETTER_RADIUS
            proxX = -dx * f * 0.16
            proxY = -dy * f * 0.3 - f * 10
            scale = 1 + f * 0.09
            shadow = `0 0 ${26 * f}px rgba(255, 205, 150, ${0.55 * f})`
            if (!c.el.dataset.base) {
              c.el.style.color = `rgb(244, ${238 - Math.round(20 * f)}, ${228 - Math.round(60 * f)})`
            }
          } else if (!c.el.dataset.base) {
            c.el.style.color = ''
          }
        }

        const tx = c.x + proxX
        const ty = c.y + proxY

        if (tx === 0 && ty === 0 && scale === 1) {
          c.el.style.transform = ''
          c.el.style.textShadow = ''
        } else {
          c.el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(3)})`
          c.el.style.textShadow = shadow
        }
      }
    },
    reset() {
      release()
      chars.forEach((c) => {
        c.x = 0
        c.y = 0
        c.vx = 0
        c.vy = 0
        c.el.style.transform = ''
        c.el.style.textShadow = ''
        if (!c.el.dataset.base) c.el.style.color = ''
      })
    },
    refresh: collect,
    destroy() {
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointerup', release)
      root.removeEventListener('pointercancel', release)
    },
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

export function createSparksDriver(canvas: HTMLCanvasElement): Driver {
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

  resize()
  spawn(SPARK_COUNT)
  window.addEventListener('resize', resize)

  return {
    update({ pointerX, pointerY, time, waves }) {
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

        // L'onda le spinge via davvero, non è un effetto grafico sopra.
        for (const wave of waves) {
          const wx = p.x - (wave.x - rect.left)
          const wy = p.y - (wave.y - rect.top)
          const wd = Math.hypot(wx, wy)
          const force = waveForce(wave, time, wd)
          if (force > 0 && wd > 0) {
            p.vx += (wx / wd) * force * 3.4
            p.vy += (wy / wd) * force * 3.4
          }
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
    burst(x: number, y: number) {
      const rect = canvas.getBoundingClientRect()
      spawn(18, x - rect.left, y - rect.top, true)
    },
    reset() {
      ctx?.clearRect(0, 0, width, height)
      sparks = []
    },
    destroy() {
      window.removeEventListener('resize', resize)
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Blob liquidi
   ═══════════════════════════════════════════════════════════════════════════ */

interface BlobConfig {
  x: number
  y: number
  size: number
  ampX: number
  ampY: number
  freqX: number
  freqY: number
  phase: number
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
    update({ pointerX, pointerY, scrollVel, time, waves }) {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0) return

      const energy = clamp(Math.abs(scrollVel) / 45, 0, 1)
      const t = time / 1000
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

        if (Number.isFinite(cx)) {
          x += clamp(cx - b.x, -30, 30) * 0.05 * b.pull
          y += clamp(cy - b.y, -30, 30) * 0.05 * b.pull
        }

        let sy = 1 + energy * 0.55
        let sx = 1 - energy * 0.16

        // L'onda deforma i blob che attraversa: li allarga sul fronte e li
        // spinge via dal punto del click.
        for (const wave of waves) {
          const bx = rect.left + (x / 100) * rect.width
          const by = rect.top + (y / 100) * rect.height
          const dx = bx - wave.x
          const dy = by - wave.y
          const dist = Math.hypot(dx, dy)
          const force = waveForce(wave, time, dist)
          if (force > 0 && dist > 0) {
            x += ((dx / dist) * force * 9 * 100) / rect.width
            y += ((dy / dist) * force * 9 * 100) / rect.height
            sx += force * 0.4
            sy -= force * 0.22
          }
        }

        el.style.transform = `translate3d(${x - b.x}%, ${y - b.y}%, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`
      })
    },
    reset() {
      nodes.forEach((el) => {
        el.style.transform = ''
      })
    },
  }
}
