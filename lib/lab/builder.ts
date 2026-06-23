/**
 * Step 3 — Builder. Genera il sito sezione per sezione con Claude Sonnet 4.6.
 * Markup = HTML + classi Tailwind (renderizzato via Tailwind Play CDN nella
 * preview) + palette. Output salvato in project_data.build.
 */

import { getClaude } from '@/lib/ai/claude'
import type { ResearchReport } from './research'
import type { LayoutProposal, SectionKey } from './layout'

const SONNET = 'claude-sonnet-4-6'

export interface BuildSection {
  name: SectionKey
  html: string
  css?: string
}

export interface SiteBuild {
  sections: BuildSection[]
  globalCSS: string
  palette: string[]
  generatedAt: string
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

export interface SectionGenInput {
  sectionKey: SectionKey
  businessName: string
  businessType: string
  research: ResearchReport
  layout: LayoutProposal
}

/** Genera l'HTML (Tailwind) + css opzionale per UNA sezione, con dati reali. */
export async function generateSection(input: SectionGenInput): Promise<{ html: string; css: string }> {
  const claude = getClaude()
  const { research, layout } = input
  const photos = (research.photos || []).slice(0, 6)
  const palette = layout.palette

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
    palette,
    heroStyle: layout.heroStyle,
  }, null, 2)

  const msg = await claude.messages.create({
    model: SONNET,
    max_tokens: 3200,
    system:
      'Sei uno sviluppatore front-end che genera una sezione di sito web per un\'attività locale italiana. ' +
      'Usa HTML semantico + classi utility Tailwind CSS. Copy reale in italiano nel tono richiesto (mai lorem ipsum). ' +
      'Usa SOLO i colori della palette fornita tramite valori arbitrari Tailwind (es. bg-[#hex], text-[#hex], border-[#hex]) o le CSS var --accent/--ink/--bg. ' +
      'Design responsive (usa prefissi sm: md: lg:), moderno e curato. ' +
      'Per le immagini usa gli URL forniti in <img> con alt sensato; se non ci sono foto, usa blocchi colore/gradient della palette (NIENTE servizi placeholder esterni).',
    messages: [
      {
        role: 'user',
        content:
          `Dati del business:\n${dataBlock}\n\n` +
          `Genera la sezione "${input.sectionKey}" della homepage.\n` +
          'Requisiti:\n' +
          '- Un singolo elemento radice <section> (o <header> per hero, <footer> per contatti finali) con padding generoso.\n' +
          '- NIENTE <html>/<head>/<body>, niente <script>.\n' +
          '- Classi Tailwind per tutto lo stile; coerenza con la palette e il tono.\n\n' +
          'Formato di risposta ESATTO (niente altro, niente JSON, niente markdown):\n' +
          '===HTML===\n' +
          '<section ...>…markup…</section>\n' +
          '===CSS===\n' +
          '/* eventuali keyframes o regole extra, altrimenti lascia vuoto */\n' +
          '===END===',
      },
    ],
  })

  const block = msg.content[0]
  const raw = block.type === 'text' ? block.text : ''

  // Parsing robusto via delimitatori (evita i problemi di escaping JSON con l'HTML).
  // Tollerante: ===CSS=== e ===END=== possono mancare.
  const afterHtml = raw.split(/===\s*HTML\s*===/i)[1] ?? raw
  let html = afterHtml.split(/===\s*CSS\s*===|===\s*END\s*===/i)[0].trim()
  const cssPart = afterHtml.match(/===\s*CSS\s*===\s*([\s\S]*?)\s*(?:===\s*END\s*===|$)/i)
  let css = cssPart ? cssPart[1].trim() : ''

  // Pulisci eventuali fence markdown residui.
  html = html.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim()
  css = css.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim()
  if (/^\/\*\s*(eventuali|optional|vuoto|extra)/i.test(css) || css === '/* */') css = ''

  // Fallback: se i delimitatori mancano, estrai la prima <section>/<header>/<footer>.
  if (!html || !/<\/(section|header|footer|div)>/i.test(html)) {
    const tagMatch = raw.match(/<(section|header|footer)[\s\S]*<\/\1>/i)
    if (tagMatch) html = tagMatch[0].trim()
  }

  if (!html) {
    const { accent } = paletteRoles(palette)
    return {
      html: `<section class="px-6 py-16 text-center"><h2 class="text-3xl mb-3">${input.businessName}</h2><p style="color:var(--accent)">Sezione ${input.sectionKey}</p></section>`,
      css: `/* fallback ${input.sectionKey} ${accent} */`,
    }
  }
  return { html, css }
}
