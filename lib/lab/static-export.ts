/**
 * Static export (Layer 4 + 4.5) — SERVER ONLY. Genera HTML statico multi-lingua dal build.
 *
 * NB MVP: i componenti libreria sono client-lazy → niente renderToString. Serializzatore
 * generico sui DATI del build (titoli, testi, immagini, collection) + Tailwind CDN.
 * Multi-lingua: una variante di sito per ogni build.locales, con props localizzate
 * (section.translations[locale] override sull'italiano base).
 */

import 'server-only'
import type { SiteBuild, SitePage, SiteSection, GlobalConfig, NavLink, Locale, LocalizedString } from './builder'

export type StaticFile = { path: string; content: string | Buffer; encoding?: 'utf-8' | 'base64' }

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function euro(n: number): string {
  try { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) } catch { return `€${n}` }
}
function resolveLocalized(v: LocalizedString | undefined, locale: Locale, def: Locale): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return v[locale] || v[def] || v.it || ''
}
function localesOf(b: SiteBuild): Locale[] {
  return b.locales && b.locales.length ? b.locales : ['it']
}

/* ── Path / URL per (slug, locale) ──────────────────────────────── */
function pagePath(slug: string, locale: Locale, def: Locale): string {
  const home = slug === 'home'
  if (locale === def) return home ? 'index.html' : `${slug}/index.html`
  return home ? `${locale}/index.html` : `${locale}/${slug}/index.html`
}
function pageUrl(slug: string, locale: Locale, def: Locale): string {
  const home = slug === 'home'
  if (locale === def) return home ? '/' : `/${slug}/`
  return home ? `/${locale}/` : `/${locale}/${slug}/`
}

/* ── Props localizzate ──────────────────────────────────────────── */
function localizedProps(section: SiteSection, locale: Locale, def: Locale): any {
  if (section.type !== 'library') return undefined
  if (locale === def) return section.props
  const tr = section.translations?.[locale as Exclude<Locale, 'it'>]?.props
  return tr || section.props
}

/* ── Serializzazione sezione → HTML ─────────────────────────────── */
function imagesHtml(arr: Array<Record<string, unknown>>): string {
  const imgs = arr.filter(i => i && typeof i === 'object' && 'src' in i)
  if (!imgs.length) return ''
  return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">${imgs.map(i =>
    `<img src="${esc((i as any).src)}" alt="${esc((i as any).alt || '')}" class="w-full h-56 object-cover rounded-xl" loading="lazy" />`).join('')}</div>`
}
function collectionHtml(items: Array<Record<string, unknown>>): string {
  return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">${items.map(it => {
    const o = it as Record<string, any>
    const img = o.image && o.image.src ? `<img src="${esc(o.image.src)}" alt="${esc(o.image.alt || o.name || '')}" class="w-full h-44 object-cover rounded-t-xl" loading="lazy" />` : ''
    const price = typeof o.price === 'number' ? `<span class="text-lg font-bold" style="color:var(--lumino-accent)">${euro(o.price)}</span>` : (typeof o.pricePerNight === 'number' ? `<span class="text-lg font-bold" style="color:var(--lumino-accent)">${euro(o.pricePerNight)}<span class="text-xs opacity-60">/notte</span></span>` : '')
    const name = o.name || o.title || ''
    const desc = o.description ? `<p class="text-sm opacity-70 mt-1">${esc(o.description)}</p>` : ''
    return `<article class="rounded-xl border overflow-hidden" style="border-color:var(--lumino-muted)">${img}<div class="p-4"><h3 class="font-semibold">${esc(name)}</h3>${desc}<div class="mt-3">${price}</div></div></article>`
  }).join('')}</div>`
}
const FORM_COMPONENTS = new Set(['form/contact', 'form/contact-2'])

function formSectionHtml(section: SiteSection, p: Record<string, any>): string {
  const title = esc(p?.title || 'Contattaci')
  const desc = p?.description ? `<p class="mt-2 opacity-75">${esc(p.description)}</p>` : ''
  const success = esc(p?.successMessage || 'Grazie! Ti contatteremo presto.')
  const fieldCls = 'w-full rounded-lg border px-3 py-2.5 text-sm'
  const style = 'style="background:var(--lumino-bg);color:var(--lumino-ink);border-color:var(--lumino-muted)"'
  return `<section id="${esc(section.sectionKey || 'contact')}" class="mx-auto max-w-2xl px-6 py-14" data-section="${esc(section.sectionKey)}">
    <h2 class="text-3xl md:text-4xl font-bold tracking-tight" style="font-family:var(--lumino-font-heading,inherit)">${title}</h2>${desc}
    <form class="lumino-form mt-6 space-y-3" data-message-type="contact" data-success-message="${success}">
      <input name="name" required placeholder="Nome *" class="${fieldCls}" ${style} />
      <input name="email" type="email" required placeholder="Email *" class="${fieldCls}" ${style} />
      <input name="phone" type="tel" placeholder="Telefono" class="${fieldCls}" ${style} />
      <input name="subject" placeholder="Oggetto" class="${fieldCls}" ${style} />
      <textarea name="message" required rows="4" placeholder="Messaggio *" class="${fieldCls}" ${style}></textarea>
      <label class="flex items-start gap-2 text-xs" style="opacity:.85"><input type="checkbox" name="gdpr" required /> Ho letto e accetto la Privacy Policy e acconsento al trattamento dei miei dati (GDPR Art. 6)</label>
      <button type="submit" class="rounded-xl px-6 py-3 text-sm font-semibold text-white" style="background:var(--lumino-accent)">Invia messaggio</button>
      <div class="form-status text-sm" aria-live="polite"></div>
    </form>
  </section>`
}

function sectionToHtml(section: SiteSection, locale: Locale, def: Locale): string {
  if (section.type === 'custom') {
    return `<section class="px-6 py-10" data-custom="${esc(section.categoryHint)}"><!-- custom: ${esc(section.reason)} --></section>`
  }
  const props = localizedProps(section, locale, def)
  // id = sectionKey → le àncore '#<sectionKey>' delle CTA funzionano anche nel sito statico.
  const wrap = (inner: string) => `<section id="${esc(section.sectionKey)}" class="mx-auto max-w-6xl px-6 py-14" data-section="${esc(section.sectionKey)}">${inner}</section>`
  if (FORM_COMPONENTS.has(section.component)) return formSectionHtml(section, (props || {}) as Record<string, any>)
  if (Array.isArray(props)) return wrap(collectionHtml(props))

  const p = props as Record<string, any>
  let html = ''
  if (p.title) html += `<h2 class="text-3xl md:text-4xl font-bold tracking-tight" style="font-family:var(--lumino-font-heading,inherit)">${esc(p.title)}</h2>`
  if (p.subtitle) html += `<p class="mt-1 text-sm uppercase tracking-wider" style="color:var(--lumino-accent)">${esc(p.subtitle)}</p>`
  if (p.description) html += `<p class="mt-3 max-w-2xl opacity-75">${esc(p.description)}</p>`
  if (Array.isArray(p.features) && p.features.every((x: unknown) => typeof x === 'string')) {
    html += `<ul class="mt-4 flex flex-wrap gap-2">${(p.features as string[]).map(f => `<li class="rounded-full px-3 py-1 text-sm" style="background:var(--lumino-muted)">${esc(f)}</li>`).join('')}</ul>`
  }
  for (const key of Object.keys(p)) {
    if (['title', 'subtitle', 'description', 'palette', 'images', 'logos', 'gallery', 'photos', 'features'].includes(key)) continue
    const v = p[key]
    if (Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object' && !Array.isArray(x))) html += collectionHtml(v as Array<Record<string, unknown>>)
  }
  for (const key of ['images', 'gallery', 'logos', 'photos']) {
    if (Array.isArray(p[key])) html += imagesHtml(p[key] as Array<Record<string, unknown>>)
  }
  if (p.image && typeof p.image === 'object' && p.image.src) {
    html += `<img src="${esc(p.image.src)}" alt="${esc(p.image.alt || '')}" class="mt-6 w-full max-h-[420px] object-cover rounded-2xl" loading="lazy" />`
  }
  return wrap(html || `<!-- ${esc(section.component)} -->`)
}

/* ── Header (con language switcher) / Footer ────────────────────── */
function langSwitcher(build: SiteBuild, slug: string, current: Locale, def: Locale): string {
  const locales = localesOf(build)
  if (locales.length <= 1) return ''
  return `<div class="language-switcher flex gap-1">${locales.map(loc =>
    `<a href="${esc(pageUrl(slug, loc, def))}" class="rounded-full px-2 py-0.5 text-xs ${loc === current ? 'font-bold' : 'opacity-60'}" style="${loc === current ? 'background:var(--lumino-accent);color:#fff' : ''}">${loc.toUpperCase()}</a>`).join('')}</div>`
}
function navHtml(build: SiteBuild, slug: string, locale: Locale, def: Locale, businessName: string): string {
  const links = build.navigation?.header || []
  if (!links.length && (build.locales || []).length <= 1) return ''
  return `<header class="sticky top-0 z-40 w-full" style="background:var(--lumino-bg);box-shadow:0 1px 0 var(--lumino-muted)"><div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><span class="text-lg font-bold">${esc(businessName)}</span><div class="flex items-center gap-6"><nav class="hidden gap-6 md:flex">${links.map(l => `<a href="${esc(pageUrl(l.slug, locale, def))}" class="text-sm font-medium opacity-80 hover:opacity-100">${esc(l.label)}</a>`).join('')}</nav>${langSwitcher(build, slug, locale, def)}</div></div></header>`
}
function footerHtml(links: NavLink[], locale: Locale, def: Locale, businessName: string): string {
  return `<footer class="w-full border-t mt-10" style="border-color:var(--lumino-muted)"><div class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center"><span class="font-semibold">${esc(businessName)}</span><nav class="flex flex-wrap justify-center gap-4">${(links || []).map(l => `<a href="${esc(pageUrl(l.slug, locale, def))}" class="text-sm opacity-70 hover:opacity-100">${esc(l.label)}</a>`).join('')}</nav><p class="text-xs opacity-50">© 2026 ${esc(businessName)}. Tutti i diritti riservati.</p></div></footer>`
}

/* ── Script globale gestione form (POST → /api/messages/{projectId}) ─ */
function formScript(projectId: string): string {
  const base = process.env.NEXT_PUBLIC_LUMINO_APP_URL || ''
  return `<script>window.LUMINO_PROJECT_ID=${JSON.stringify(projectId)};window.LUMINO_API_BASE=${JSON.stringify(base)};document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('form.lumino-form').forEach(function(form){form.addEventListener('submit',async function(e){e.preventDefault();var btn=form.querySelector('button[type="submit"]');var box=form.querySelector('.form-status');var gdpr=form.querySelector('input[name="gdpr"]');if(gdpr&&!gdpr.checked){if(box){box.textContent='Accetta la privacy policy';box.style.color='#dc2626';}return;}var fd=new FormData(form);var payload={message_type:form.dataset.messageType||'contact',from_name:fd.get('name')||fd.get('nome')||'',from_email:fd.get('email')||'',from_phone:fd.get('phone')||fd.get('telefono')||'',subject:fd.get('subject')||fd.get('oggetto')||'Contatto dal sito',message_body:fd.get('message')||fd.get('messaggio')||'',page_slug:window.location.pathname,extra_data:Object.fromEntries(fd.entries())};try{if(btn)btn.disabled=true;var res=await fetch((window.LUMINO_API_BASE||'')+'/api/messages/'+window.LUMINO_PROJECT_ID,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});var data=await res.json();if(data&&data.ok){if(box){box.textContent=form.dataset.successMessage||'Grazie! Ti contatteremo presto.';box.style.color='#16a34a';}form.reset();}else{if(box){box.textContent=(data&&data.error)||'Errore invio. Riprova.';box.style.color='#dc2626';}}}catch(err){if(box){box.textContent='Errore di rete. Riprova.';box.style.color='#dc2626';}}finally{if(btn)btn.disabled=false;}});});});</script>`
}

/* ── Pagina completa ────────────────────────────────────────────── */
function buildPageHtml(page: SitePage, build: SiteBuild, locale: Locale, projectId?: string): string {
  const def = build.defaultLocale || 'it'
  const cfg: GlobalConfig = build.globalConfig
  const businessName = cfg.businessName || 'Lumino'
  const pal = cfg.palette
  const fonts = [cfg.font?.heading, cfg.font?.body].filter(Boolean) as string[]
  const fontLink = fonts.length ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join('&')}&display=swap" />` : ''
  const rootVars = `:root{--lumino-bg:${pal.bg};--lumino-ink:${pal.ink};--lumino-accent:${pal.accent};--lumino-muted:${pal.muted};${cfg.font?.heading ? `--lumino-font-heading:'${cfg.font.heading}',Georgia,serif;` : ''}}`
  const bodyFont = cfg.font?.body ? `font-family:'${cfg.font.body}',system-ui,sans-serif;` : 'font-family:system-ui,sans-serif;'
  const title = esc(resolveLocalized(page.metaTitle, locale, def) || `${page.title} — ${businessName}`)
  const desc = esc(resolveLocalized(page.metaDescription, locale, def))
  const hreflang = localesOf(build).map(loc => `<link rel="alternate" hreflang="${loc}" href="${esc(pageUrl(page.slug, loc, def))}" />`).join('')
  const sections = page.sections.map(s => sectionToHtml(s, locale, def)).join('\n')
  // Se la pagina ha già un footer di libreria, non duplicare quello minimale.
  const hasFooterSection = page.sections.some(s => s.type === 'library' && s.component.startsWith('footer/'))

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${desc ? `<meta name="description" content="${desc}" />` : ''}
<meta property="og:title" content="${title}" />
${desc ? `<meta property="og:description" content="${desc}" />` : ''}
${hreflang}
<script src="https://cdn.tailwindcss.com"></script>
${fontLink}
<style>${rootVars} body{background:var(--lumino-bg);color:var(--lumino-ink);${bodyFont}margin:0} h1,h2,h3{font-family:var(--lumino-font-heading,inherit)}</style>
</head>
<body>
${navHtml(build, page.slug, locale, def, businessName)}
<main>${sections}</main>
${hasFooterSection ? '' : footerHtml(build.navigation?.footer || [], locale, def, businessName)}
${projectId ? formScript(projectId) : ''}
</body>
</html>`
}

function generateSitemap(build: SiteBuild): string {
  const def = build.defaultLocale || 'it'
  const locales = localesOf(build)
  const urls = build.pages.flatMap(p => locales.map(loc => `  <url><loc>${pageUrl(p.slug, loc, def)}</loc></url>`)).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
}

/** Genera i file statici del sito (HTML per pagina×lingua + sitemap + robots). */
export async function exportSiteToStatic(build: SiteBuild, projectId?: string): Promise<StaticFile[]> {
  const def = build.defaultLocale || 'it'
  const locales = localesOf(build)
  const files: StaticFile[] = []
  for (const locale of locales) {
    for (const page of build.pages) {
      files.push({ path: pagePath(page.slug, locale, def), content: buildPageHtml(page, build, locale, projectId), encoding: 'utf-8' })
    }
  }
  files.push({ path: 'sitemap.xml', content: generateSitemap(build), encoding: 'utf-8' })
  files.push({ path: 'robots.txt', content: 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml', encoding: 'utf-8' })
  return files
}
