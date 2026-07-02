/**
 * Step 3 — Builder. NON genera più HTML grezzo: sceglie componenti dalla
 * Libreria Lumino (LUMINO_LIBRARY) e li configura con props reali, oppure
 * genera una sezione custom on-the-fly. Output salvato in project_data.build.
 */

import { getClaude } from '@/lib/ai/claude'
import { LUMINO_LIBRARY } from '@/lib/lab-library'
import type { ResearchReport } from './research'
import type { LayoutProposal, SectionKey, LayoutPageSpec } from './layout'

const MODEL = 'claude-opus-4-7'

// Re-export dell'utility pura per editare le props di una sezione (Step 4 — Livello 2).
// La logica vive in section-utils.ts (importabile anche client-side senza SDK).
export { updateSectionProps } from './section-utils'

/** Lingue supportate (italiano = base). */
export type Locale = 'it' | 'en' | 'de'
/** Stringa eventualmente localizzata (la base resta sempre in italiano). */
export type LocalizedString = string | { it?: string; en?: string; de?: string }

/** Una sezione del sito: o un componente di libreria configurato, o codice custom. */
export type SiteSection =
  | {
      type: 'library'; sectionKey: string; component: string; props: Record<string, unknown> | Array<Record<string, unknown>>
      // Override props per le lingue non-base (EN/DE). L'italiano vive in `props`.
      translations?: Partial<Record<Exclude<Locale, 'it'>, { props?: Record<string, any> }>>
    }
  | {
      type: 'custom'; sectionKey: string; categoryHint: string; tsxCode: string; reason: string
      baseComponent?: string                     // componente libreria da cui parte il custom
      customizations?: Record<string, unknown>   // cosa modificare rispetto al base
    }

/** Tono di voce del brand (influenza i contenuti generati). */
export type Tone = 'modern' | 'classic' | 'editorial' | 'playful' | 'professional' | 'friendly'

/** Configurazione globale del sito (palette, font, tono, logo, contatti). */
export type GlobalConfig = {
  palette: { bg: string; ink: string; accent: string; muted: string }
  font?: {
    heading?: string  // nome Google Font per i titoli (es. "Cormorant Garamond")
    body?: string     // nome Google Font per il corpo (es. "Inter")
  }
  tone?: Tone
  logo?: {
    url?: string
    alt?: string
    width?: number
    height?: number
  }
  businessName?: string
  businessInfo?: {
    phone?: string
    email?: string
    address?: string
    hours?: string
    socials?: Array<{ platform: string; url: string }>
  }
}

/** Link di navigazione (header/footer). */
export type NavLink = { label: string; slug: string }

/** Una pagina del sito (modello multi-pagina). */
export type SitePage = {
  slug: string
  title: string
  metaTitle?: LocalizedString
  metaDescription?: LocalizedString
  sections: SiteSection[]
  isHomepage?: boolean
}

/** Stato dell'editor (Step 4): per-pagina override palette + visibilità/ordine/props sezioni. */
export type EditorState = {
  activePage?: string  // slug della pagina in editing
  pages: Record<string, {
    palette?: { bg: string; ink: string; accent: string; muted: string }
    sections: Array<{
      key: string
      visible: boolean
      order: number
      component?: string  // sostituzione componente
      props?: Record<string, unknown> | Array<Record<string, unknown>>  // edit props inline / collection
    }>
  }>
}

/** Un'immagine caricata dal cliente, riusabile in tutte le pagine del progetto. */
export type ProjectAsset = {
  id: string
  url: string
  alt: string
  // standard + hotel-specific (rooms/spa/restaurant/exterior/common-areas/amenities)
  category?: 'food' | 'interior' | 'people' | 'product' | 'logo' | 'other'
    | 'rooms' | 'spa' | 'restaurant' | 'exterior' | 'common-areas' | 'amenities'
  width?: number
  height?: number
  uploadedAt: string
  tags?: string[]
}

export interface SiteBuild {
  pages: SitePage[]
  globalConfig: GlobalConfig
  navigation: { header: NavLink[]; footer: NavLink[] }
  assets?: ProjectAsset[]      // galleria immagini del progetto (Layer 3)
  locales?: Locale[]           // lingue attive (default ['it']) — Layer 4.5
  defaultLocale?: Locale       // lingua base (default 'it')
  generatedAt?: string
  editorState?: EditorState
}

const DEFAULT_PALETTE = { bg: '#ffffff', ink: '#1a1a1a', accent: '#8b5cf6', muted: '#f5f5f5' }

/**
 * Normalizza una build (anche dal DB) al formato multi-pagina corrente.
 * Retro-compat: progetti vecchi con { sections, globalCSS, palette } al root vengono
 * wrappati in pages: [{ slug:'home', isHomepage:true, sections }].
 */
export function normalizeBuild(raw: any): SiteBuild {
  if (raw && Array.isArray(raw.pages)) {
    return {
      pages: raw.pages as SitePage[],
      globalConfig: raw.globalConfig || { palette: { ...DEFAULT_PALETTE } },
      navigation: raw.navigation || { header: [], footer: [] },
      assets: Array.isArray(raw.assets) ? raw.assets : [],
      locales: Array.isArray(raw.locales) && raw.locales.length ? raw.locales : ['it'],
      defaultLocale: raw.defaultLocale || 'it',
      generatedAt: raw.generatedAt,
      editorState: normalizeEditorState(raw.editorState, raw.pages as SitePage[]),
    }
  }
  const sections: SiteSection[] = Array.isArray(raw?.sections) ? raw.sections : []
  const palette: string[] = Array.isArray(raw?.palette) ? raw.palette : []
  const roles = paletteRoles(palette)
  const pages: SitePage[] = [{ slug: 'home', title: 'Home', isHomepage: true, sections }]
  return {
    pages,
    globalConfig: { palette: { bg: roles.bg, ink: roles.ink, accent: roles.accent, muted: palette[3] || (roles.isDark ? '#222222' : '#f5f5f5') } },
    navigation: { header: [], footer: [] },
    assets: Array.isArray(raw?.assets) ? raw.assets : [],
    locales: Array.isArray(raw?.locales) && raw.locales.length ? raw.locales : ['it'],
    defaultLocale: raw?.defaultLocale || 'it',
    generatedAt: raw?.generatedAt,
    editorState: normalizeEditorState(raw?.editorState, pages),
  }
}

/** Migra un EditorState (vecchio {palette,sections} o nuovo {activePage,pages}) al formato multi-pagina. */
export function normalizeEditorState(raw: any, pages: SitePage[]): EditorState | undefined {
  if (!raw) return undefined
  if (raw.pages && typeof raw.pages === 'object' && !Array.isArray(raw.pages)) {
    return raw as EditorState
  }
  const homeSlug = pages.find(p => p.isHomepage)?.slug || pages[0]?.slug || 'home'
  return {
    activePage: homeSlug,
    pages: { [homeSlug]: { palette: raw.palette, sections: Array.isArray(raw.sections) ? raw.sections : [] } },
  }
}

/** Stato editor iniziale derivato da una build multi-pagina: tutte le sezioni visibili. */
export function initialEditorState(build: SiteBuild): EditorState {
  const pagesState: EditorState['pages'] = {}
  for (const page of build.pages) {
    pagesState[page.slug] = {
      palette: { ...build.globalConfig.palette },
      sections: page.sections.map((s, i) => ({ key: s.sectionKey || `section-${i}`, visible: true, order: i })),
    }
  }
  const home = build.pages.find(p => p.isHomepage) || build.pages[0]
  return { activePage: home?.slug, pages: pagesState }
}

export const SECTION_LABELS_IT: Record<SectionKey, string> = {
  hero: 'hero', gallery: 'galleria', menu: 'menu', about: 'chi siamo',
  services: 'servizi', reviews: 'recensioni', events: 'eventi', booking: 'prenotazioni',
  contact: 'contatti', map: 'mappa', team: 'team', newsletter: 'newsletter',
}

function hexToRgb(h: string): [number, number, number] {
  const x = h.replace('#', '')
  const v = x.length === 3 ? x.split('').map(c => c + c).join('') : x
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function lum(h: string): number { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
function sat(h: string): number { const [r, g, b] = hexToRgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx }

export function paletteRoles(palette: string[]) {
  const pal = palette.length ? palette : ['#1a1a1a', '#e52d1d', '#f5f0e8']
  const byLum = [...pal].sort((a, b) => lum(a) - lum(b))
  const lightest = byLum[byLum.length - 1]
  const darkest = byLum[0]
  const isDark = lum(lightest) < 0.6
  const bg = isDark ? darkest : lightest
  const ink = isDark ? '#ffffff' : (lum(darkest) < 0.5 ? darkest : '#1a1a1a')
  const accent = [...pal].sort((a, b) => sat(b) - sat(a)).find(c => c !== bg && sat(c) > 0.22) || pal[1] || '#e52d1d'
  return { bg, ink, accent, isDark }
}

/** CSS globale deterministico: palette in CSS vars, font, reset, scope .lab-site. */
export function buildGlobalCss(palette: string[]): string {
  const { bg, ink, accent } = paletteRoles(palette)
  const vars = palette.map((c, i) => `  --c${i + 1}: ${c};`).join('\n')
  return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
:root {
${vars}
  --bg: ${bg};
  --ink: ${ink};
  --accent: ${accent};
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; }
.lab-site { background: var(--bg); color: var(--ink); font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; overflow-x: hidden; }
.lab-site h1, .lab-site h2, .lab-site h3 { font-family: 'Playfair Display', Georgia, serif; line-height: 1.1; margin: 0; }
.lab-site img { max-width: 100%; display: block; }
.lab-site a { color: inherit; }
.lab-site section, .lab-site header, .lab-site footer { width: 100%; }`
}

/** Summary compatto dei componenti libreria ready, passato all'AI nel messaggio user. */
export interface LibrarySummaryItem {
  key: string
  name: string
  description: string
  category: string
  businessTypes: string[]
  propsSchema: Record<string, string>
  hardcoded: boolean
}

// Temporaneo: filtro a "safe" finché le dipendenze libreria non sono installate.
// Quando installeremo i pacchetti mancanti, rimuovere il filtro safe e tornare a status==="ready".
export function librarySummary(): LibrarySummaryItem[] {
  return Object.entries(LUMINO_LIBRARY)
    .filter(([, meta]) => meta.status === 'ready' && meta.safe === true)
    .map(([key, meta]) => ({
      key,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      businessTypes: (meta.business as string[]) ?? [],
      propsSchema: meta.propsSchema ?? {},
      hardcoded: meta.hardcoded ?? false,
    }))
}

const ASSEMBLER_SYSTEM = `Sei l'assemblatore del Lumino Lab. Il tuo compito NON è scrivere HTML da zero, ma scegliere componenti dalla Libreria Lumino e configurarli.

LIBRERIA DISPONIBILE:
Ti viene fornito in input l'elenco completo dei componenti della Libreria Lumino con metadata (nome, descrizione, categoria, props attese, status).

REGOLE OPERATIVE:
1. Per ogni sezione del sito, scegli UN componente dalla libreria con status="ready" che meglio si adatta al tipo di business e al layout proposto.
2. Se NESSUN componente ready copre il caso (es. footer mancante, o sezione molto specifica richiesta), puoi generare un componente nuovo on-the-fly seguendo le regole Lumino sotto.
3. Per ogni scelta, restituisci JSON con: tipo (library | custom), riferimento al componente o codice TSX completo se custom, e le props/dati configurati.

REGOLE LUMINO INDEROGABILI:
- Lingua: italiano sempre
- Valuta: € sempre (mai $ o ₹)
- Animazioni: framer-motion (mai motion/react)
- Icone: lucide-react
- Ogni form DEVE avere checkbox GDPR obbligatoria con testo: "Ho letto e accetto la Privacy Policy e acconsento al trattamento dei miei dati personali (GDPR Art. 6)"
- Mai lorem ipsum, sempre copy reale italiano nel tono richiesto
- Palette: usa SOLO i colori della palette fornita

REGOLA PROPS:
Quando scegli un componente library, le props che configuri DEVONO usare ESATTAMENTE i nomi e i tipi indicati nel propsSchema del componente. Non inventare props nuove. Se il componente ha hardcoded: true, significa che il suo contenuto è fisso e le props non lo cambiano — non scegliere quel componente se ti serve personalizzare il contenuto.

REGOLA ASSETS PROGETTO (priorità sulle immagini):
Il progetto può avere immagini REALI caricate dal cliente, elencate nei dati in input nel campo "assetsDisponibili" come [{ url, alt, category, tags }].
Quando devi assegnare un'immagine a una sezione, USA PRIMA un asset del progetto se disponibile e categoricamente compatibile:
- sezione menu / piatti → asset con category 'food' (o tags coerenti)
- sezione hero / ambiente → category 'interior'
- sezione team → category 'people'
- sezione prodotti → category 'product'
Usa ESATTAMENTE l'url dell'asset e, se presente, il suo alt. Solo se NESSUN asset è adatto, ripiega su URL Unsplash reali (mai placeholder/locali).

REGOLA IMMAGINI (importantissima):
Per qualsiasi prop che richiede URL di immagini (src, image, photo, imageUrl, logo, ecc.):
- USA SEMPRE URL Unsplash reali nel formato: https://images.unsplash.com/photo-XXXXXXXX?w=800&q=80&auto=format
- Scegli immagini coerenti col business:
  - Ristorante italiano → cucina, pasta, pizza, vino, tavoli, chef italiano
  - Barbiere → forbici, sedia da barbiere, taglio uomo
  - Dentista → studio dentistico, sorriso, attrezzatura medica
  - Hotel → camera, hall, panorama
  - Palestra → attrezzi, persone allenamento
- USA esempi di photo-IDs reali Unsplash. Esempi di IDs validi che conosci:
  - photo-1551183053-bf91a1d81141 (pasta)
  - photo-1572715376701-98568319fd0b (pizza italiana)
  - photo-1414235077428-338989a2e8c0 (interno ristorante)
- MAI URL inventati o path locali (es. /images/X.jpg, /placeholder.svg)
- Se non sei sicuro di un photo-ID specifico, usa keywords coerenti nell'URL Unsplash search:
  https://source.unsplash.com/800x600/?italian-restaurant
  https://source.unsplash.com/800x600/?pasta
- Per LOGHI di brand partner/recensioni/premi (es. TripAdvisor): NON inventare URL. Passa array VUOTO [] per quelle props.

REGOLA TONO DI VOCE:
Il tono di voce del business ti viene indicato nei dati (campo "tonoBrand"). Adatta TUTTI i testi (titoli, descrizioni, CTA) a questo tono:
- modern: diretto, conciso, contemporaneo
- classic: elegante, formale, tradizione
- editorial: narrativo, raffinato, storytelling
- playful: divertente, informale, vibrante
- professional: autorevole, preciso, business
- friendly: caldo, accogliente, conversazionale

REGOLA CUSTOM GENERATION (importante):
Quando devi creare una sezione che NON ha nessun componente compatibile nella libreria, NON inventare TSX da zero. Segui questo processo:

1. Identifica nella libreria il componente PIÙ SIMILE per categoria/scopo (es. per 'eventi' usa testimonial-carousel come base; per 'team' usa about-3).

2. Restituisci type: 'custom' MA con campo extra 'baseComponent' che indica quale componente libreria estendere:

{
  "type": "custom",
  "baseComponent": "about/about-3",
  "categoryHint": "team",
  "customizations": {
    "purpose": "mostrare il team del business",
    "modifyProps": { },
    "addElements": "aggiungere foto profilo team + ruolo + bio breve"
  },
  "tsxCode": "...codice TSX completo che PARTE dal componente base...",
  "reason": "spiegazione"
}

3. Il TSX generato deve:
   - Usare SOLO classi Tailwind standard (no plugins)
   - Importare ESCLUSIVAMENTE da 'framer-motion' e 'lucide-react' (no librerie esoteriche)
   - Rispettare TUTTE le regole Lumino (italiano, €, palette CSS vars var(--lumino-*), GDPR nei form)
   - Essere semanticamente corretto (no errori React)

4. Se il custom è banale (es. una sezione testo+pulsante), usa un layout minimal Tailwind senza dipendenze.

OBIETTIVO: i custom devono essere il MENO frequenti possibile, e quando ci sono devono essere SOLIDI.

REGOLA MULTIPLICITY:
Ogni componente library ha un campo 'multiplicity':
- 'single' (default): scegli il componente e configura UN oggetto props.
- 'collection': il componente rappresenta UN item di una lista. Per sezioni con più items (es. menu con 10 piatti, shop con 12 prodotti), restituisci un ARRAY di oggetti props, uno per ogni item. Il formato della risposta diventa:
  {
    "type": "library",
    "component": "menu/menu-item-card",
    "props": [
      { "name": "Ossobuco alla milanese", "price": 22, "originalPrice": 26 },
      { "name": "Risotto allo zafferano" }
    ]
  }
- 'wrapper': il componente accoglie children. Configura le props del wrapper più una lista 'children' con le sezioni interne (gestione avanzata, evita per ora se possibile).

Per le sezioni 'menu', 'gallery di prodotti', 'lista servizi ripetuti' usa SEMPRE multiplicity collection se disponibile.

Genera sempre dati REALI italiani per ogni item del collection (es. nomi piatti reali della cucina del business, prezzi realistici in €).

FORMATO RISPOSTA:
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo prima o dopo, in questo formato esatto:

{
  "type": "library",
  "component": "categoria/nome-componente",
  "props": { ...props del componente con dati reali italiani... }
}

OPPURE (solo se nessun componente libreria è adatto — vedi REGOLA CUSTOM GENERATION):

{
  "type": "custom",
  "baseComponent": "categoria/componente-piu-simile",
  "categoryHint": "footer",
  "customizations": { "purpose": "...", "modifyProps": { }, "addElements": "..." },
  "tsxCode": "...codice TSX completo che parte dal baseComponent, solo Tailwind + framer-motion + lucide-react...",
  "reason": "spiegazione breve del perché nessun componente libreria era adatto"
}`

/** Warning (non bloccante) se una prop URL immagine sembra placeholder/locale invece di reale. */
function validateImageUrls(obj: any, sectionKey: string, path: string = ''): void {
  if (!obj || typeof obj !== 'object') return
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const isPlaceholder = value.startsWith('/') || value.includes('placeholder') || value.includes('your-domain')
      if (isPlaceholder && (key.toLowerCase().includes('image') || key.toLowerCase().includes('src') || key.toLowerCase().includes('photo') || key.toLowerCase().includes('logo'))) {
        console.warn(`⚠️ [${sectionKey}] URL immagine sospetto a ${path}.${key}: "${value}"`)
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => validateImageUrls(item, sectionKey, `${path}.${key}[${i}]`))
    } else if (value && typeof value === 'object') {
      validateImageUrls(value, sectionKey, `${path}.${key}`)
    }
  }
}

export interface SectionGenInput {
  sectionKey: string  // label sezione (può essere multi-pagina: 'hero-small', 'menu-full', ...)
  businessName: string
  businessType: string
  research: ResearchReport
  layout: LayoutProposal
  tone?: string  // tono di voce del brand (globalConfig.tone) — influenza i testi
  assets?: Array<{ url: string; alt: string; category?: string; tags?: string[] }>  // foto reali del cliente
}

/** Sceglie/configura un componente libreria (o genera custom) per UNA sezione. */
export async function generateSection(input: SectionGenInput, library?: LibrarySummaryItem[]): Promise<SiteSection> {
  const claude = getClaude()
  const { research, layout } = input
  const photos = (research.photos || []).slice(0, 6)
  const lib = library ?? librarySummary()

  const dataBlock = JSON.stringify({
    nome: input.businessName,
    tipo: research.info?.type || input.businessType,
    descrizione: research.info?.description,
    tonoDiVoce: research.toneOfVoice,
    indirizzo: research.info?.address,
    telefono: research.info?.phone,
    email: research.info?.email,
    orari: research.info?.hours,
    foto: photos,
    palette: layout.palette,
    heroStyle: layout.heroStyle,
    tonoBrand: input.tone || research.toneOfVoice || 'modern',
    assetsDisponibili: (input.assets || []).map(a => ({ url: a.url, alt: a.alt, category: a.category, tags: a.tags })),
  }, null, 2)

  const msg = await claude.messages.create({
    model: MODEL,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    max_tokens: 8000,
    system: ASSEMBLER_SYSTEM,
    messages: [
      {
        role: 'user',
        content:
          `Dati del business:\n${dataBlock}\n\n` +
          `LIBRERIA DISPONIBILE (componenti ready):\n${JSON.stringify(lib, null, 2)}\n\n` +
          `Genera la configurazione per la sezione "${input.sectionKey}". ` +
          `Scegli il componente libreria più adatto a questo business e a questo layout, oppure genera un componente custom solo se nessuno è adatto. ` +
          `Rispondi SOLO con l'oggetto JSON nel formato indicato.`,
      },
    ],
  })

  // Se la risposta è stata troncata, il JSON è incompleto: errore esplicito invece di parse fail oscuro.
  if (msg.stop_reason === 'max_tokens') {
    throw new Error(`Risposta troncata per sezione ${input.sectionKey}: max_tokens raggiunto. Alzare il limite o ridurre la complessità.`)
  }

  // Opus 4.7 adaptive può emettere un blocco "thinking" come content[0] e il JSON in content[1]:
  // cerco il blocco di testo invece di assumere l'indice 0.
  const block = msg.content.find(b => b.type === 'text')
  const raw = block?.type === 'text' ? block.text : ''

  // Parsing JSON robusto (con try/catch). Niente più delimitatori ===HTML===.
  let parsed: any
  try {
    let t = raw.trim()
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fence) t = fence[1].trim()
    const s = t.indexOf('{'); const e = t.lastIndexOf('}')
    if (s >= 0 && e > s) t = t.slice(s, e + 1)
    parsed = JSON.parse(t)
  } catch (err: any) {
    throw new Error(`generateSection: risposta non è JSON valido (sezione ${input.sectionKey}): ${err?.message || err}`)
  }

  if (parsed?.type === 'library') {
    const component = String(parsed.component || '')
    const meta = LUMINO_LIBRARY[component]
    // VALIDAZIONE: il componente deve esistere ed essere ready. Niente fallback silenzioso.
    if (!meta) {
      throw new Error(`generateSection: componente "${component}" non esiste in LUMINO_LIBRARY (sezione ${input.sectionKey}).`)
    }
    if (meta.status !== 'ready') {
      throw new Error(`generateSection: componente "${component}" non è "ready" (status="${meta.status}", sezione ${input.sectionKey}).`)
    }
    // Props "(required)" da validare. Le callback/Date sono marcate "(optional)" nei propsSchema
    // (le fornisce la UI render-layer), quindi non bloccano la generazione.
    const requiredKeys = meta.propsSchema
      ? Object.entries(meta.propsSchema).filter(([, d]) => /\(required\)/i.test(d)).map(([k]) => k)
      : []
    const checkMissing = (obj: Record<string, unknown>, label: string) => {
      const missing = requiredKeys.filter(k => obj[k] === undefined || obj[k] === null)
      if (missing.length) {
        throw new Error(`generateSection: props required mancanti per "${component}" (sezione ${input.sectionKey}${label}): ${missing.join(', ')}`)
      }
    }

    // Warning (non bloccante) sugli URL immagine placeholder/locali generati da Opus.
    validateImageUrls(parsed.props, input.sectionKey)

    const multiplicity = meta.multiplicity ?? 'single'
    if (multiplicity === 'collection') {
      // I componenti "collection" richiedono un ARRAY non vuoto di props (uno per item).
      if (!Array.isArray(parsed.props) || parsed.props.length === 0) {
        throw new Error(`generateSection: "${component}" è multiplicity="collection": "props" deve essere un ARRAY non vuoto di item (sezione ${input.sectionKey}).`)
      }
      parsed.props.forEach((item: unknown, i: number) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new Error(`generateSection: item ${i} di "${component}" non è un oggetto props valido (sezione ${input.sectionKey}).`)
        }
        checkMissing(item as Record<string, unknown>, ` item ${i}`)
      })
      return { type: 'library', sectionKey: input.sectionKey, component, props: parsed.props as Array<Record<string, unknown>> }
    }

    // single / wrapper: "props" è un singolo oggetto.
    const props = parsed.props && typeof parsed.props === 'object' && !Array.isArray(parsed.props)
      ? (parsed.props as Record<string, unknown>) : {}
    checkMissing(props, '')
    return { type: 'library', sectionKey: input.sectionKey, component, props }
  }

  if (parsed?.type === 'custom') {
    const tsxCode = String(parsed.tsxCode || '')
    if (!tsxCode) throw new Error(`generateSection: sezione custom senza tsxCode (sezione ${input.sectionKey}).`)
    // baseComponent: se indicato deve esistere in libreria (custom intelligente che estende un base).
    const baseComponent = parsed.baseComponent ? String(parsed.baseComponent) : undefined
    if (baseComponent && !LUMINO_LIBRARY[baseComponent]) {
      console.warn(`⚠️ [${input.sectionKey}] baseComponent "${baseComponent}" non esiste in libreria (custom comunque accettato).`)
    }
    const customizations = parsed.customizations && typeof parsed.customizations === 'object' && !Array.isArray(parsed.customizations)
      ? (parsed.customizations as Record<string, unknown>) : undefined
    return {
      type: 'custom',
      sectionKey: input.sectionKey,
      categoryHint: String(parsed.categoryHint || input.sectionKey),
      tsxCode,
      reason: String(parsed.reason || ''),
      baseComponent,
      customizations,
    }
  }

  throw new Error(`generateSection: campo "type" mancante o non valido nella risposta (sezione ${input.sectionKey}).`)
}

export interface PageGenInput {
  page: LayoutPageSpec
  businessName: string
  businessType: string
  research: ResearchReport
  layout: LayoutProposal
  tone?: string  // globalConfig.tone — propagato a tutte le sezioni della pagina
  assets?: Array<{ url: string; alt: string; category?: string; tags?: string[] }>  // foto reali del cliente
}

/** Genera una pagina completa: itera le sezioni della pagina e chiama generateSection per ognuna. */
export async function generatePage(input: PageGenInput, library?: LibrarySummaryItem[]): Promise<SitePage> {
  const lib = library ?? librarySummary()
  const sections: SiteSection[] = []
  for (const sectionKey of input.page.sections) {
    const section = await generateSection({
      sectionKey,
      businessName: input.businessName,
      businessType: input.businessType,
      research: input.research,
      layout: input.layout,
      tone: input.tone,
      assets: input.assets,
    }, lib)
    sections.push(section)
  }
  return {
    slug: input.page.slug,
    title: input.page.title,
    metaTitle: `${input.page.title} — ${input.businessName}`,
    metaDescription: input.research.info?.description?.slice(0, 155),
    sections,
    isHomepage: input.page.slug === 'home' || !!input.page.isHomepage,
  }
}
