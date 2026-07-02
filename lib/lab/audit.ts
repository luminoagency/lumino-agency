/**
 * Audit pre-publish (Layer 6) — logica PURA (nessuna dipendenza runtime).
 * Verifica SEO/content/legal/branding/struttura/accessibilità/performance/multi-lingua.
 * canPublish = nessun check 'critical' fallito.
 */

import type { SiteBuild, SiteSection } from './builder'

export type AuditSeverity = 'critical' | 'warning' | 'info'

export interface AuditCheck {
  id: string
  category: 'seo' | 'content' | 'legal' | 'performance' | 'accessibility' | 'branding' | 'structure'
  severity: AuditSeverity
  passed: boolean
  message: string
  suggestion?: string
  affectedPages?: string[]
  affectedSections?: string[]
}

export interface AuditReport {
  overallScore: number
  criticalCount: number
  warningCount: number
  infoCount: number
  checks: AuditCheck[]
  canPublish: boolean
  timestamp: string
}

/* ── helpers ─────────────────────────────────────────────────────── */
const isHex = (c: unknown): boolean => typeof c === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)
const PLACEHOLDER_RE = /lorem ipsum|placeholder|testo di esempio|il tuo titolo|titolo qui|inserisci|photo-placeholder|example\.com/i

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(x => x + x).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function relLum(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastRatio(a: string, b: string): number {
  try { const la = relLum(a), lb = relLum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05) } catch { return 21 }
}

/** Estrae tutte le stringhe testuali da props (per rilevare placeholder / testo). */
function textOf(props: unknown): string {
  const out: string[] = []
  const walk = (n: any) => {
    if (typeof n === 'string') out.push(n)
    else if (Array.isArray(n)) n.forEach(walk)
    else if (n && typeof n === 'object') Object.values(n).forEach(walk)
  }
  walk(props)
  return out.join(' ')
}
/** Estrae gli alt delle immagini da props. */
function imageAlts(props: unknown): Array<{ src?: string; alt?: string }> {
  const out: Array<{ src?: string; alt?: string }> = []
  const walk = (n: any) => {
    if (Array.isArray(n)) n.forEach(walk)
    else if (n && typeof n === 'object') {
      if ('src' in n) out.push({ src: (n as any).src, alt: (n as any).alt })
      Object.values(n).forEach(walk)
    }
  }
  walk(props)
  return out
}

/* ── audit ───────────────────────────────────────────────────────── */
export function auditProject(build: SiteBuild, project: any): AuditReport {
  const checks: AuditCheck[] = []
  const add = (c: AuditCheck) => checks.push(c)
  const pages = build.pages || []
  const cfg = build.globalConfig || ({} as any)
  const nav = build.navigation || { header: [], footer: [] }
  const locales = build.locales || ['it']
  const businessName = cfg.businessName || project?.business_name || ''
  const businessType = String(project?.business_type || '').toLowerCase()
  const isHotel = /hotel|b&b|bnb|resort|agriturismo|ostello|locanda|relais/.test(businessType)
  const libSections = (p: typeof pages[number]) => p.sections.filter((s): s is Extract<SiteSection, { type: 'library' }> => s.type === 'library')

  const resolveMeta = (v: unknown): string => typeof v === 'string' ? v : (v && typeof v === 'object' ? String((v as any).it || '') : '')

  /* SEO */
  const noTitle = pages.filter(p => !resolveMeta(p.metaTitle)).map(p => p.slug)
  add({ id: 'seo-metatitle', category: 'seo', severity: 'warning', passed: noTitle.length === 0, message: noTitle.length ? `${noTitle.length} pagine senza metaTitle` : 'Tutte le pagine hanno metaTitle', suggestion: 'Aggiungi un titolo SEO ad ogni pagina', affectedPages: noTitle })
  const badDesc = pages.filter(p => { const d = resolveMeta(p.metaDescription); return !d || d.length < 50 || d.length > 160 }).map(p => p.slug)
  add({ id: 'seo-metadesc', category: 'seo', severity: 'info', passed: badDesc.length === 0, message: badDesc.length ? `${badDesc.length} pagine con meta description assente o fuori range (50-160)` : 'Meta description ok', affectedPages: badDesc })
  const hasHome = pages.some(p => p.isHomepage || p.slug === 'home')
  add({ id: 'seo-homepage', category: 'seo', severity: 'critical', passed: hasHome, message: hasHome ? 'Homepage presente' : 'Nessuna homepage (isHomepage)', suggestion: 'Imposta una pagina come homepage' })
  const badSlugs = pages.filter(p => !/^[a-z0-9-]+$/.test(p.slug)).map(p => p.slug)
  add({ id: 'seo-slugs', category: 'seo', severity: 'warning', passed: badSlugs.length === 0, message: badSlugs.length ? `Slug non validi: ${badSlugs.join(', ')}` : 'Slug validi', affectedPages: badSlugs })
  const home = pages.find(p => p.isHomepage || p.slug === 'home')
  const homeTitleOk = !!home && !!businessName && (resolveMeta(home.metaTitle) || home.title).toLowerCase().includes(businessName.toLowerCase().split(' ')[0] || '')
  add({ id: 'seo-home-brand', category: 'seo', severity: 'info', passed: homeTitleOk, message: homeTitleOk ? 'Titolo homepage include il nome business' : 'Il titolo homepage non richiama il nome business' })

  /* CONTENT */
  const placeholderPages = pages.filter(p => libSections(p).some(s => PLACEHOLDER_RE.test(textOf(s.props)))).map(p => p.slug)
  add({ id: 'content-placeholder', category: 'content', severity: 'warning', passed: placeholderPages.length === 0, message: placeholderPages.length ? `Testo placeholder rilevato in: ${placeholderPages.join(', ')}` : 'Nessun placeholder', suggestion: 'Sostituisci con contenuti reali', affectedPages: placeholderPages })
  const missingAlt = pages.flatMap(p => libSections(p).flatMap(s => imageAlts(s.props))).filter(i => i.src && (!i.alt || !i.alt.trim())).length
  add({ id: 'content-alt', category: 'content', severity: 'warning', passed: missingAlt === 0, message: missingAlt ? `${missingAlt} immagini senza alt text` : 'Tutte le immagini hanno alt' })
  const placeholderImg = pages.some(p => libSections(p).some(s => /photo-placeholder|placeholder\.(jpg|png|svg)/i.test(textOf(s.props))))
  add({ id: 'content-img-placeholder', category: 'content', severity: 'warning', passed: !placeholderImg, message: placeholderImg ? 'Immagini placeholder presenti' : 'Nessuna immagine placeholder' })
  const bi = cfg.businessInfo || {}
  const contactsOk = !!(bi.phone || bi.email) && !!bi.email
  add({ id: 'content-contacts', category: 'content', severity: 'warning', passed: contactsOk, message: contactsOk ? 'Info contatti presenti' : 'Mancano telefono/email nei contatti', suggestion: 'Compila i contatti nel Branding' })
  const pagesNoText = pages.filter(p => !libSections(p).some(s => textOf(s.props).replace(/https?:\/\/\S+/g, '').trim().length > 20)).map(p => p.slug)
  add({ id: 'content-text', category: 'content', severity: 'info', passed: pagesNoText.length === 0, message: pagesNoText.length ? `Pagine senza testo: ${pagesNoText.join(', ')}` : 'Ogni pagina ha testo', affectedPages: pagesNoText })

  /* LEGAL */
  const hasPrivacy = pages.some(p => /privacy/i.test(p.slug) || /privacy/i.test(p.title))
  add({ id: 'legal-privacy', category: 'legal', severity: 'critical', passed: hasPrivacy, message: hasPrivacy ? 'Pagina Privacy presente' : 'Manca la pagina Privacy', suggestion: 'Aggiungi una pagina Privacy Policy' })
  const hasCookie = pages.some(p => /cookie/i.test(p.slug) || /cookie/i.test(p.title))
  add({ id: 'legal-cookie', category: 'legal', severity: 'info', passed: hasCookie, message: hasCookie ? 'Pagina Cookie presente' : 'Pagina Cookie assente (consigliata)' })
  const formSections = pages.flatMap(p => libSections(p)).filter(s => s.component.startsWith('form/'))
  add({ id: 'legal-gdpr', category: 'legal', severity: 'critical', passed: true, message: formSections.length ? `${formSections.length} form: checkbox GDPR inclusa di default` : 'Nessun form (GDPR n/a)' })
  const footerPrivacy = (nav.footer || []).some(l => /privacy/i.test(l.slug) || /privacy/i.test(l.label))
  add({ id: 'legal-footer-privacy', category: 'legal', severity: 'warning', passed: footerPrivacy || !hasPrivacy, message: footerPrivacy ? 'Link Privacy nel footer' : 'Aggiungi il link Privacy nel footer' })
  if (isHotel) {
    const hasBookingLinks = pages.some(p => libSections(p).some(s => s.component === 'booking/booking-links'))
    add({ id: 'legal-hotel-booking', category: 'legal', severity: 'warning', passed: hasBookingLinks, message: hasBookingLinks ? 'Link prenotazioni esterne presenti' : 'Hotel senza booking-links (Booking/Expedia)' })
  }

  /* BRANDING */
  const pal = cfg.palette || {}
  const palOk = ['bg', 'ink', 'accent', 'muted'].every(k => isHex((pal as any)[k]))
  add({ id: 'brand-palette', category: 'branding', severity: 'critical', passed: palOk, message: palOk ? 'Palette valida (4 colori HEX)' : 'Palette incompleta o non valida' })
  add({ id: 'brand-font', category: 'branding', severity: 'info', passed: !!(cfg.font?.heading || cfg.font?.body), message: (cfg.font?.heading || cfg.font?.body) ? 'Font selezionati' : 'Nessun font personalizzato (default)' })
  add({ id: 'brand-logo', category: 'branding', severity: 'warning', passed: !!cfg.logo?.url, message: cfg.logo?.url ? 'Logo caricato' : 'Logo non caricato', suggestion: 'Carica il logo nel Branding' })
  add({ id: 'brand-tone', category: 'branding', severity: 'info', passed: !!cfg.tone, message: cfg.tone ? `Tono: ${cfg.tone}` : 'Tono di voce non impostato' })

  /* STRUCTURE */
  add({ id: 'struct-nav-header', category: 'structure', severity: 'warning', passed: (nav.header || []).length > 0, message: (nav.header || []).length ? 'Navigation header presente' : 'Navigation header vuota' })
  add({ id: 'struct-nav-footer', category: 'structure', severity: 'info', passed: (nav.footer || []).length > 0, message: (nav.footer || []).length ? 'Navigation footer presente' : 'Navigation footer vuota' })
  const headerSlugs = new Set((nav.header || []).map(l => l.slug))
  const orphans = pages.filter(p => !p.isHomepage && p.slug !== 'home' && !headerSlugs.has(p.slug) && !/privacy|cookie/i.test(p.slug)).map(p => p.slug)
  add({ id: 'struct-orphans', category: 'structure', severity: 'info', passed: orphans.length === 0, message: orphans.length ? `Pagine non in menu: ${orphans.join(', ')}` : 'Nessuna pagina orfana', affectedPages: orphans })
  add({ id: 'struct-pages', category: 'structure', severity: 'warning', passed: pages.length >= 2, message: pages.length >= 2 ? `${pages.length} pagine` : 'Almeno 2 pagine consigliate' })

  /* ACCESSIBILITY */
  const contrast = (isHex(pal.bg) && isHex(pal.ink)) ? contrastRatio(pal.bg, pal.ink) : 21
  add({ id: 'a11y-contrast', category: 'accessibility', severity: contrast < 3 ? 'warning' : 'info', passed: contrast >= 4.5, message: contrast >= 4.5 ? `Contrasto testo/sfondo ok (${contrast.toFixed(1)}:1)` : `Contrasto basso (${contrast.toFixed(1)}:1)`, suggestion: 'Aumenta il contrasto tra sfondo e inchiostro' })
  const genericAlt = pages.flatMap(p => libSections(p).flatMap(s => imageAlts(s.props))).filter(i => i.alt && /^(image|img|foto|photo)\s*\d*$/i.test(i.alt.trim())).length
  add({ id: 'a11y-alt-desc', category: 'accessibility', severity: 'info', passed: genericAlt === 0, message: genericAlt ? `${genericAlt} alt poco descrittivi` : 'Alt descrittivi' })
  add({ id: 'a11y-lang', category: 'accessibility', severity: 'info', passed: !!build.defaultLocale, message: `Lingua base: ${build.defaultLocale || 'it'}` })

  /* PERFORMANCE */
  const photoCount = (build.assets || []).length
  add({ id: 'perf-photos', category: 'performance', severity: 'warning', passed: photoCount < 200, message: `${photoCount} foto in galleria`, suggestion: photoCount >= 200 ? 'Riduci il numero di foto per prestazioni migliori' : undefined })
  add({ id: 'perf-sitemap', category: 'performance', severity: 'info', passed: true, message: 'Sitemap generata automaticamente al publish' })

  /* MULTI-LINGUA */
  if (locales.length > 1) {
    const targets = locales.filter(l => l !== (build.defaultLocale || 'it'))
    let missing = 0
    for (const p of pages) for (const s of libSections(p)) for (const loc of targets) if (!s.translations?.[loc as 'en' | 'de']?.props) missing++
    add({ id: 'i18n-translations', category: 'content', severity: 'warning', passed: missing === 0, message: missing === 0 ? 'Tutte le sezioni tradotte' : `${missing} sezioni senza traduzione`, suggestion: 'Usa "Traduci tutto" nell\'editor' })
  }

  const criticalCount = checks.filter(c => c.severity === 'critical' && !c.passed).length
  const warningCount = checks.filter(c => c.severity === 'warning' && !c.passed).length
  const infoCount = checks.filter(c => c.severity === 'info' && !c.passed).length
  const passed = checks.filter(c => c.passed).length
  const overallScore = checks.length ? Math.round((passed / checks.length) * 100) : 100

  return { overallScore, criticalCount, warningCount, infoCount, checks, canPublish: criticalCount === 0, timestamp: new Date().toISOString() }
}
