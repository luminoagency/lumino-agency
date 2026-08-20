import { lerp, pointer } from './useMotion'

/**
 * Il movimento dell'hero: uscita legata allo scroll + parallasse del puntatore.
 *
 * UN SOLO driver, chiamato da UN SOLO requestAnimationFrame (vedi Hero.tsx).
 * Le due cose stanno insieme perché agiscono sulle stesse quattro finestre nello
 * stesso istante: tenerle separate significherebbe due loop che si sovrascrivono
 * a vicenda lo spostamento, ed era esattamente il bug del riferimento.
 *
 * COME FANNO A CONVIVERE — le finestre usano le proprietà di trasformazione
 * SEPARATE (`translate`, `rotate`, `scale`) invece della singola `transform`:
 *   · `rotate`     → l'inclinazione fissa, decisa in hero.css
 *   · `translate`  → parallasse + fuga verso l'angolo, SOMMATE qui
 *   · `scale`      → il rimpicciolimento dell'uscita
 * Scrivendo tutto dentro `transform` ogni effetto cancellerebbe gli altri.
 *
 * Le lettere invece non hanno trasformazioni fisse a riposo, quindi per loro
 * `transform` va benissimo.
 *
 * L'uscita è funzione della POSIZIONE, non del tempo: nessun timer, nessuno
 * stato da ricordare. Scorrendo all'indietro l'animazione si riavvolge da sé
 * perché ogni fotogramma ricalcola tutto da `scrollY`.
 */

/** In quanta parte di schermata si consuma l'uscita. */
const EXIT_SPAN = 0.85

/* ─── Lettere ─── */
/** Ritardo di ogni lettera rispetto alla precedente, in unità di avanzamento. */
const LETTER_STAGGER = 0.055
/** Quanto dura la corsa della singola lettera. */
const LETTER_SPAN = 0.55
const LETTER_TILT = 7
const LETTER_SHRINK = 0.12

/* ─── Finestre ─── */
const WIN_FADE = 1.15
const WIN_SHRINK = 0.18

/* ─── Fondale e testi ─── */
const BLOOM_OPACITY = 0.95
const BLOOM_FADE = 1.1
const PAYOFF_FADE = 1.8
const TICKER_FADE = 1.6

/**
 * Due profili di uscita, non uno spento e uno acceso.
 *
 * Su telefono la stessa uscita del desktop costa troppo: la sfocatura è la voce
 * più cara di tutte — è l'unica cosa qui dentro che il compositore non sa fare
 * gratis — e le corse lunghe muovono molti pixel su uno schermo piccolo, dove
 * comunque non si leggono come "vola via", si leggono come "sbatte".
 *
 * Quindi su mobile: stessa coreografia, stesso ritardo progressivo, ma niente
 * sfocatura, corse più corte e il bagliore che si spegne senza rimpicciolire.
 * Restano solo transform e opacity, che il compositore gestisce senza toccare
 * il layout.
 */
interface ExitProfile {
  letterLift: number
  /** 0 = niente sfocatura. Su mobile è 0, e non per prudenza: è LA voce cara. */
  letterBlur: number
  winFlyX: number
  winFlyY: number
  /** Il bagliore rimpicciolisce mentre si spegne? Su mobile no. */
  bloomShrink: number
}

const PROFILES: Record<'full' | 'light', ExitProfile> = {
  full: { letterLift: 150, letterBlur: 7, winFlyX: 340, winFlyY: 220, bloomShrink: 0.25 },
  light: { letterLift: 92, letterBlur: 0, winFlyX: 150, winFlyY: 120, bloomShrink: 0 },
}

/** Quale uscita: piena (desktop), alleggerita (mobile), o nessuna. */
export type ExitMode = 'full' | 'light' | 'off'

/* ─── Parallasse ─── */
/** Quanto insegue il puntatore a ogni fotogramma: basso = pesante. */
const CHASE = 0.06
/** Profondità: la corsa in px della finestra i-esima. Alternata, così le
    quattro non si muovono come un blocco solo. */
const depthOf = (i: number) => (i % 2 ? 1 : -1) * (10 + i * 5)
/** In verticale ci si muove meno: sopra e sotto lo spazio è poco. */
const DEPTH_Y = 0.6

export interface HeroElements {
  letters: HTMLElement[]
  windows: HTMLElement[]
  bloom: HTMLElement | null
  payoff: HTMLElement | null
  ticker: HTMLElement | null
}

export interface HeroDriver {
  /** Un fotogramma. Chiamata dal loop unico dell'hero. */
  update(): void
  /** Riporta la scena com'era: toglie ogni stile scritto qui. */
  reset(): void
  /** Quale uscita allo scroll: piena, alleggerita o nessuna (vedi Hero.tsx). */
  setExit(mode: ExitMode): void
  /** Il parallasse è attivo? Serve un mouse: col dito non esiste il "sopra". */
  setParallax(on: boolean): void
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

export function createHeroDriver(el: HeroElements): HeroDriver {
  /* Posizione inseguita del puntatore, normalizzata −0.5…0.5. */
  let chaseX = 0
  let chaseY = 0

  let exitMode: ExitMode = 'full'
  let profile = PROFILES.full
  let parallaxOn = false

  /* L'ultimo avanzamento scritto: se non cambia, le lettere non si riscrivono.
     Le finestre sì, perché il parallasse le muove comunque. */
  let lastProgress = -1
  /* Vero finché resta qualcosa di scritto da pulire quando si torna in cima. */
  let dirty = false

  const flyX = (i: number) => (i === 0 || i === 2 ? -1 : 1)
  const flyY = (i: number) => (i < 2 ? -1 : 1)

  function paintLetters(progress: number) {
    el.letters.forEach((letter, i) => {
      const own = clamp01((progress - i * LETTER_STAGGER) / LETTER_SPAN)
      letter.style.transform =
        `translateY(${-own * profile.letterLift}px)` +
        ` rotate(${own * (i % 2 ? LETTER_TILT : -LETTER_TILT)}deg)` +
        ` scale(${1 - own * LETTER_SHRINK})`
      letter.style.opacity = String(1 - own)
      /* Sul profilo alleggerito la riga si scrive comunque, ma vuota: serve a
         cancellare la sfocatura rimasta se si arriva qui da una finestra
         larga rimpicciolita. */
      letter.style.filter = own && profile.letterBlur ? `blur(${own * profile.letterBlur}px)` : ''
    })
  }

  function paintWindows(progress: number) {
    el.windows.forEach((win, i) => {
      const depth = depthOf(i)
      const x = chaseX * depth + flyX(i) * progress * profile.winFlyX
      const y = chaseY * depth * DEPTH_Y + flyY(i) * progress * profile.winFlyY

      win.style.translate = `${x}px ${y}px`
      win.style.scale = String(1 - progress * WIN_SHRINK)
      win.style.opacity = String(Math.max(0, 1 - progress * WIN_FADE))
    })
  }

  function paintRest(progress: number) {
    if (el.bloom) {
      el.bloom.style.opacity = String(Math.max(0, BLOOM_OPACITY - progress * BLOOM_FADE))
      /* Su mobile il bagliore si spegne e basta: rimpicciolirlo mentre svanisce
         non si legge, e una scala su un elemento sfocato largo quanto lo
         schermo è la cosa più cara della scena. */
      if (profile.bloomShrink) el.bloom.style.scale = String(1 - progress * profile.bloomShrink)
      else el.bloom.style.scale = ''
    }
    /* Payoff e striscia escono a velocità diverse: se sparissero insieme
       sembrerebbe che si spenga la luce, non che la scena si sciolga. */
    if (el.payoff) el.payoff.style.opacity = String(Math.max(0, 1 - progress * PAYOFF_FADE))
    if (el.ticker) el.ticker.style.opacity = String(Math.max(0, 1 - progress * TICKER_FADE))
  }

  function clear() {
    el.letters.forEach((letter) => {
      letter.style.transform = ''
      letter.style.opacity = ''
      letter.style.filter = ''
    })
    el.windows.forEach((win) => {
      win.style.translate = ''
      win.style.scale = ''
      win.style.opacity = ''
    })
    if (el.bloom) {
      el.bloom.style.opacity = ''
      el.bloom.style.scale = ''
    }
    if (el.payoff) el.payoff.style.opacity = ''
    if (el.ticker) el.ticker.style.opacity = ''
  }

  return {
    update() {
      /* Nessun listener di scroll: la posizione si legge qui, una volta per
         fotogramma, dentro il rAF che gira già. Un listener in più
         significherebbe due sorgenti di verità sullo stesso numero, e su
         mobile un evento che arriva a raffica durante lo slancio. */
      const progress =
        exitMode === 'off' ? 0 : clamp01(window.scrollY / (window.innerHeight * EXIT_SPAN))

      if (parallaxOn) {
        /* Normalizzato sul viewport e non sul riquadro dell'hero: l'hero
           riempie la prima schermata, quindi è la stessa misura — e non
           costringe a leggere la geometria a ogni fotogramma. */
        chaseX = lerp(chaseX, pointer.x / window.innerWidth - 0.5, CHASE)
        chaseY = lerp(chaseY, pointer.y / window.innerHeight - 0.5, CHASE)
      } else {
        chaseX = lerp(chaseX, 0, CHASE)
        chaseY = lerp(chaseY, 0, CHASE)
      }

      /* In cima alla pagina e senza puntatore da inseguire non c'è niente da
         dire: si toglie di mezzo ciò che è rimasto e si smette di scrivere.
         Senza questo, il driver ridipingerebbe la scena identica sessanta
         volte al secondo per tutta la durata della prima schermata. */
      const still = Math.abs(chaseX) < 0.0005 && Math.abs(chaseY) < 0.0005
      if (progress === 0 && still) {
        if (dirty) {
          clear()
          dirty = false
          lastProgress = -1
        }
        return
      }

      dirty = true
      if (progress !== lastProgress) {
        paintLetters(progress)
        paintRest(progress)
        lastProgress = progress
      }
      /* Le finestre si ridipingono comunque: anche a scroll fermo il
         parallasse le sta ancora muovendo. */
      paintWindows(progress)
    },

    reset() {
      clear()
      chaseX = 0
      chaseY = 0
      lastProgress = -1
      dirty = false
    },

    setExit(mode: ExitMode) {
      if (exitMode === mode) return
      exitMode = mode
      profile = PROFILES[mode === 'off' ? 'light' : mode]
      /* Cambiare profilo a metà uscita lascerebbe addosso i valori del profilo
         precedente — una sfocatura che nessuno toglierà più, una scala del
         bagliore rimasta lì. Si ridipinge tutto da zero al prossimo
         fotogramma, e se siamo in cima si pulisce e basta. */
      lastProgress = -1
      clear()
      dirty = false
    },

    setParallax(on: boolean) {
      parallaxOn = on
    },
  }
}
